import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { authService, GoogleTokens, TokenUpdateCallback } from './authService';

// Define interfaces for parameters and results
interface GetSheetDataParams {
    spreadsheetId: string;
    range: string;
    majorDimension?: 'ROWS' | 'COLUMNS';
    valueRenderOption?: string;
}

interface UpdateSheetDataParams {
    spreadsheetId: string;
    range: string;
    values: any[][];
    majorDimension?: 'ROWS' | 'COLUMNS';
    valueInputOption?: string;
}

interface CreateSpreadsheetParams {
    title: string;
    sheets?: {
        title: string;
        gridProperties?: {
            rowCount?: number;
            columnCount?: number;
        }
    }[];
}

interface CreateSpreadsheetResult {
    success: boolean;
    spreadsheetId?: string;
    spreadsheetUrl?: string;
    error?: string;
}

interface SheetUpdateResult {
    success: boolean;
    updatedCells?: number;
    updatedRange?: string;
    error?: string;
}

/**
 * Gets data from a Google Sheet
 * 
 * @param tokens OAuth tokens from the user's session or Firestore
 * @param params Sheet parameters (spreadsheetId, range, etc.)
 * @param userId User identifier for token storage
 * @param onTokensRefreshed Callback function to update tokens when refreshed
 * @returns Array of data from the sheet
 */
export async function getSheetData(
    tokens: GoogleTokens,
    params: GetSheetDataParams,
    userId: string,
    onTokensRefreshed?: TokenUpdateCallback
): Promise<any[][]> {
    try {
        // 1. Create authenticated client using the token refresh pattern
        const authClient = await authService.createAuthenticatedClient(tokens, userId, onTokensRefreshed);
        
        // 2. Initialize the Sheets API client
        const sheets = google.sheets({ version: 'v4', auth: authClient });
        
        // 3. Set up parameters for the get request
        const spreadsheetId = params.spreadsheetId;
        const range = params.range;
        const majorDimension = params.majorDimension || 'ROWS';
        const valueRenderOption = params.valueRenderOption || 'FORMATTED_VALUE';
        
        // 4. Get the sheet data
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
            majorDimension,
            valueRenderOption
        });
        
        // 5. Return the values or an empty array if no values
        return response.data.values || [];
    } catch (error: any) {
        console.error('Error getting sheet data:', {
            userId,
            error: error.message,
            stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
        });
        throw new Error(`Failed to get sheet data: ${error.message}`);
    }
}

/**
 * Updates data in a Google Sheet
 * 
 * @param tokens OAuth tokens from the user's session or Firestore
 * @param params Sheet parameters (spreadsheetId, range, values, etc.)
 * @param userId User identifier for token storage
 * @param onTokensRefreshed Callback function to update tokens when refreshed
 * @returns Object with update results
 */
export async function updateSheetData(
    tokens: GoogleTokens,
    params: UpdateSheetDataParams,
    userId: string,
    onTokensRefreshed?: TokenUpdateCallback
): Promise<SheetUpdateResult> {
    try {
        // 1. Create authenticated client using the token refresh pattern
        const authClient = await authService.createAuthenticatedClient(tokens, userId, onTokensRefreshed);
        
        // 2. Initialize the Sheets API client
        const sheets = google.sheets({ version: 'v4', auth: authClient });
        
        // 3. Set up parameters for the update request
        const spreadsheetId = params.spreadsheetId;
        const range = params.range;
        const values = params.values;
        const majorDimension = params.majorDimension || 'ROWS';
        const valueInputOption = params.valueInputOption || 'USER_ENTERED';
        
        // 4. Update the sheet data
        const response = await sheets.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption,
            requestBody: {
                range,
                majorDimension,
                values
            }
        });
        
        // 5. Return the update results
        return {
            success: true,
            updatedCells: response.data.updatedCells || undefined,
            updatedRange: response.data.updatedRange || undefined
        };
    } catch (error: any) {
        console.error('Error updating sheet data:', {
            userId,
            error: error.message,
            stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
        });
        return {
            success: false,
            error: error.message || 'Unknown error occurred while updating sheet data'
        };
    }
}

/**
 * Creates a new Google Spreadsheet
 * 
 * @param tokens OAuth tokens from the user's session or Firestore
 * @param params Spreadsheet parameters (title, sheets, etc.)
 * @param userId User identifier for token storage
 * @param onTokensRefreshed Callback function to update tokens when refreshed
 * @returns Object with creation results
 */
export async function createSpreadsheet(
    tokens: GoogleTokens,
    params: CreateSpreadsheetParams,
    userId: string,
    onTokensRefreshed?: TokenUpdateCallback
): Promise<CreateSpreadsheetResult> {
    try {
        // 1. Create authenticated client using the token refresh pattern
        const authClient = await authService.createAuthenticatedClient(tokens, userId, onTokensRefreshed);
        
        // 2. Initialize the Sheets API client
        const sheets = google.sheets({ version: 'v4', auth: authClient });
        
        // 3. Prepare the request body
        const requestBody: any = {
            properties: {
                title: params.title
            }
        };
        
        // 4. Add sheets if provided
        if (params.sheets && params.sheets.length > 0) {
            requestBody.sheets = params.sheets.map(sheet => ({
                properties: {
                    title: sheet.title,
                    gridProperties: sheet.gridProperties
                }
            }));
        }
        
        // 5. Create the spreadsheet
        const response = await sheets.spreadsheets.create({
            requestBody
        });
        
        return {
            success: true,
            spreadsheetId: response.data.spreadsheetId || undefined,
            spreadsheetUrl: response.data.spreadsheetUrl || undefined
        };
    } catch (error: any) {
        console.error('Error creating spreadsheet:', {
            userId,
            error: error.message,
            stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
        });
        return {
            success: false,
            error: `Failed to create spreadsheet: ${error.message}`
        };
    }
}
