import { Request, Response } from 'express';
import { llmService } from '../services/llmService';
import { airtableService } from '../services/airtableService';
import { calendarService } from '../services/calendarService';
import { sendGmail, getRecentEmails } from '../services/gmailService';
import { researchService } from '../services/researchService';
import { getSheetData, updateSheetData, createSpreadsheet } from '../services/sheetsService';
import { voiceCallService } from '../services/voiceCallService';
import { Message, LlmResponse } from '../types';
import { TokenUpdateCallback } from '../services/authService';
import { authService, GoogleTokens } from '../services/authService';
import { userService } from '../services/userService';
import 'express-session';
import { Session } from 'express-session';
// Import the shared Express type definitions
import '../types/express';

/**
 * Controller for handling chat-related requests
 */
export const chatController = {
  /**
   * Handle incoming chat requests
   * @param req Express request object
   * @param res Express response object
   */
  async handleChatRequest(req: Express.Request, res: Express.Response): Promise<any> {
    try {
      // Extract the query from the request body
      const query = req.body?.query;
      const history = req.body?.history;

      if (!query) {
        return res.status(400).json({ error: 'No query provided' });
      }

      console.log('Received chat request:', { query, historyLength: history?.length });

      // Step 1: Initial call to LLM
      let llmResult = await llmService.getGeminiResponse(query, history);

      // Step 2: Check if the LLM wants to call a function
      if (llmResult.type === 'functionCall' && llmResult.call?.name) {
        const functionName = llmResult.call.name;
        const functionArgs = llmResult.call.args
          ? llmResult.call.args
          : {};

        console.log(`LLM requested function call: ${functionName}`, functionArgs);

        // Step 3: Execute the requested function
        let functionResultContent: any;
        let functionExecutionError: string | null = null;

        try {
          // Determine the user ID - prefer Firebase user if available
          const userId = req.user?.uid || req.sessionID;
          
          // Get tokens based on authentication method
          let tokens: GoogleTokens | undefined;
          
          // Check if the user is authenticated with Firebase
          if (req.user) {
            // Get tokens from Firestore using the Firebase user ID
            tokens = await userService.getUserTokens(req.user.uid);
            
            // If the user doesn't have Google tokens linked, we can't perform the function
            if (!tokens && [
              'get_calendar_events', 
              'send_email', 
              'get_recent_emails',
              'get_sheet_data',
              'update_sheet_data',
              'create_spreadsheet'
            ].includes(functionName)) {
              functionExecutionError = 'You need to link your Google account to use this feature. Go to Settings to link your account.';
              functionResultContent = { error: functionExecutionError };
              
              // Skip to step 4
              llmResult = await this.handleFunctionResult(llmResult, functionName, functionResultContent, functionExecutionError);
              return res.status(200).json(llmResult);
            }
          } else {
            // Legacy session-based authentication
            // Get tokens from session
            tokens = (req.session as any).googleTokens as GoogleTokens | undefined;
            
            // If not in session, try to get from Firestore
            if (!tokens && userId && [
              'get_calendar_events', 
              'send_email', 
              'get_recent_emails',
              'get_sheet_data',
              'update_sheet_data',
              'create_spreadsheet'
            ].includes(functionName)) {
              try {
                const firestoreTokens = await authService.getTokensFromFirestore(userId);
                
                // If found in Firestore, store in session for future use
                if (firestoreTokens) {
                  tokens = firestoreTokens;
                  if (req.session) {
                    (req.session as any).googleTokens = firestoreTokens;
                  }
                  console.log('Retrieved tokens from Firestore and stored in session');
                }
              } catch (error) {
                console.error('Error retrieving tokens from Firestore:', error);
                // Continue with undefined tokens, the function execution will handle the authentication error
              }
            }
          }

          // Create a token update callback function
          const handleTokenUpdate: TokenUpdateCallback = (newTokens) => {
            console.log('Tokens refreshed, updating storage');
            
            if (req.user) {
              // For Firebase users, update tokens in Firestore
              userService.storeUserTokens(req.user.uid, {
                ...tokens,
                access_token: newTokens.access_token || tokens?.access_token,
                refresh_token: newTokens.refresh_token || tokens?.refresh_token,
                expiry_date: newTokens.expiry_date || tokens?.expiry_date
              } as GoogleTokens);
            } else if (req.session) {
              const sessionGoogleTokens = (req.session as any).googleTokens;
              if (sessionGoogleTokens) {
                // For legacy session users, update tokens in session and Firestore
                (req.session as any).googleTokens = {
                  ...sessionGoogleTokens,
                  access_token: newTokens.access_token || sessionGoogleTokens.access_token,
                  refresh_token: newTokens.refresh_token || sessionGoogleTokens.refresh_token,
                  expiry_date: newTokens.expiry_date || sessionGoogleTokens.expiry_date
                };
                
                // Also update in Firestore for persistence
                authService.storeTokensInFirestore(userId, (req.session as any).googleTokens);
              }
            }
          };

          // Execute the function
          functionResultContent = await this.executeFunctionCall(
            functionName, 
            functionArgs, 
            req, 
            userId, 
            tokens, 
            handleTokenUpdate
          );
          
          console.log(`Function ${functionName} executed successfully`);
        } catch (error: any) {
          console.error(`Error executing function ${functionName}:`, error);
          functionExecutionError = error.message || 'An error occurred while executing the function';
          functionResultContent = { error: functionExecutionError };
        }

        // Step 4: Send the function result back to the LLM
        llmResult = await this.handleFunctionResult(llmResult, functionName, functionResultContent, functionExecutionError);
      }

      // Step 5: Return the final response to the client
      return res.status(200).json(llmResult);
    } catch (error: any) {
      console.error('Error handling chat request:', error);
      return res.status(500).json({ error: 'An error occurred while processing your request' });
    }
  },

  /**
   * Handle the result of a function execution
   * @param initialResult Initial LLM response
   * @param functionName Name of the executed function
   * @param functionResult Result of the function execution
   * @param functionError Error message if the function execution failed
   * @returns Updated LLM response
   */
  async handleFunctionResult(
    initialResult: LlmResponse,
    functionName: string,
    functionResult: any,
    functionError: string | null
  ): Promise<LlmResponse> {
    try {
      // Format the function result as a string
      let functionResultString: string;
      
      if (functionError) {
        functionResultString = `Error: ${functionError}`;
      } else if (typeof functionResult === 'string') {
        functionResultString = functionResult;
      } else {
        functionResultString = JSON.stringify(functionResult, null, 2);
      }
      
      console.log(`Sending function result to LLM for ${functionName}:`, functionResultString.substring(0, 200) + (functionResultString.length > 200 ? '...' : ''));
      
      // Call the LLM with the function result
      return await llmService.getFunctionResponseFromGemini(initialResult, functionName, functionResultString);
    } catch (error: any) {
      console.error('Error handling function result:', error);
      return {
        type: 'text',
        content: `I encountered an error while processing the function result: ${error.message || 'Unknown error'}`
      };
    }
  },

  /**
   * Execute a function call based on the function name and arguments
   * @param functionName Name of the function to execute
   * @param functionArgs Arguments for the function
   * @param req Express request object (for accessing session data)
   * @param userId User identifier for token storage
   * @param tokens OAuth tokens (from session or Firestore)
   * @param onTokensRefreshed Optional callback function to update tokens when refreshed
   * @returns Result of the function execution
   */
  async executeFunctionCall(
    functionName: string, 
    functionArgs: any, 
    req: Express.Request, 
    userId: string,
    tokens: GoogleTokens | undefined,
    onTokensRefreshed?: TokenUpdateCallback
  ): Promise<any> {
    // For functions that require authentication, check if tokens are available
    const functionsRequiringAuth = [
      'get_calendar_events', 
      'send_email', 
      'get_recent_emails',
      'get_sheet_data',
      'update_sheet_data',
      'create_spreadsheet'
    ];
    if (functionsRequiringAuth.includes(functionName) && !tokens) {
      throw new Error('Authentication required for this function. Please sign in with your Google account.');
    }
    
    // Execute the appropriate function based on the function name
    switch (functionName) {
      case 'search_web':
        return await researchService.searchWeb(functionArgs.query);
        
      case 'get_calendar_events':
        if (!tokens) throw new Error('Authentication required');
        return await calendarService.getCalendarEvents(tokens, functionArgs, onTokensRefreshed);
        
      case 'send_email':
        if (!tokens) throw new Error('Authentication required');
        return await sendGmail(tokens, functionArgs, onTokensRefreshed);
        
      case 'get_recent_emails':
        if (!tokens) throw new Error('Authentication required');
        return await getRecentEmails(tokens, functionArgs, onTokensRefreshed);
        
      case 'get_sheet_data':
        if (!tokens) throw new Error('Authentication required');
        return await getSheetData(tokens, functionArgs, onTokensRefreshed);
        
      case 'update_sheet_data':
        if (!tokens) throw new Error('Authentication required');
        return await updateSheetData(tokens, functionArgs, onTokensRefreshed);
        
      case 'create_spreadsheet':
        if (!tokens) throw new Error('Authentication required');
        return await createSpreadsheet(tokens, functionArgs, onTokensRefreshed);
        
      case 'get_airtable_records':
        return await airtableService.getRecords(functionArgs.baseId, functionArgs.tableId);
        
      case 'make_voice_call':
        return await voiceCallService.makeCall(functionArgs.phoneNumber, functionArgs.message);
        
      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
  }
};
