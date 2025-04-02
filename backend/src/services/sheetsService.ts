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
 * @param onTokensRefreshed Callback function to update tokens when refreshed
 * @returns 2D array of values from the sheet
 */
export async function getSheetData(
    tokens: GoogleTokens,
    params: GetSheetDataParams,
    onTokensRefreshed?: TokenUpdateCallback
): Promise<any[][]> {
    try {
        // Create authenticated client using the token refresh pattern
        const authClient = await authService.createAuthenticatedClient(tokens, undefined, onTokensRefreshed || undefined);
        
        // Initialize the Sheets API client
        const sheets = google.sheets({ version: 'v4', auth: authClient as any });
        
        // Get the sheet data
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: params.spreadsheetId,
            range: params.range,
            majorDimension: params.majorDimension || 'ROWS',
            valueRenderOption: params.valueRenderOption || 'FORMATTED_VALUE'
        });
        
        // Return the values or an empty array if no values
        return response.data.values || [];
    } catch (error: any) {
        console.error('Error getting sheet data:', error);
        throw new Error(`Failed to get sheet data: ${error.message}`);
    }
}

/**
 * Updates data in a Google Sheet
 * 
 * @param tokens OAuth tokens from the user's session or Firestore
 * @param params Sheet parameters (spreadsheetId, range, values, etc.)
 * @param onTokensRefreshed Callback function to update tokens when refreshed
 * @returns Object with update results
 */
export async function updateSheetData(
    tokens: GoogleTokens,
    params: UpdateSheetDataParams,
    onTokensRefreshed?: TokenUpdateCallback
): Promise<SheetUpdateResult> {
    try {
        // Create authenticated client using the token refresh pattern
        const authClient = await authService.createAuthenticatedClient(tokens, undefined, onTokensRefreshed || undefined);
        
        // Initialize the Sheets API client
        const sheets = google.sheets({ version: 'v4', auth: authClient as any });
        
        // Update the sheet data
        const response = await sheets.spreadsheets.values.update({
            spreadsheetId: params.spreadsheetId,
            range: params.range,
            valueInputOption: params.valueInputOption || 'USER_ENTERED',
            requestBody: {
                values: params.values,
                majorDimension: params.majorDimension || 'ROWS'
            }
        });
        
        return {
            success: true,
            updatedCells: response.data.updatedCells ?? undefined,
            updatedRange: response.data.updatedRange ?? undefined
        };
    } catch (error: any) {
        console.error('Error updating sheet data:', error);
        return {
            success: false,
            error: `Failed to update sheet data: ${error.message}`
        };
    }
}

/**
 * Creates a new Google Spreadsheet
 * 
 * @param tokens OAuth tokens from the user's session or Firestore
 * @param params Spreadsheet parameters (title, sheets, etc.)
 * @param onTokensRefreshed Callback function to update tokens when refreshed
 * @returns Object with creation results
 */
export async function createSpreadsheet(
    tokens: GoogleTokens,
    params: CreateSpreadsheetParams,
    onTokensRefreshed?: TokenUpdateCallback
): Promise<CreateSpreadsheetResult> {
    try {
        // Create authenticated client using the token refresh pattern
        const authClient = await authService.createAuthenticatedClient(tokens, undefined, onTokensRefreshed || undefined);
        
        // Initialize the Sheets API client
        const sheets = google.sheets({ version: 'v4', auth: authClient as any });
        
        // Prepare the request body
        const requestBody: any = {
            properties: {
                title: params.title
            }
        };
        
        // Add sheets if provided
        if (params.sheets && params.sheets.length > 0) {
            requestBody.sheets = params.sheets.map(sheet => ({
                properties: {
                    title: sheet.title,
                    gridProperties: sheet.gridProperties
                }
            }));
        }
        
        // Create the spreadsheet
        const response = await sheets.spreadsheets.create({
            requestBody
        });
        
        return {
            success: true,
            spreadsheetId: response.data.spreadsheetId ?? undefined,
            spreadsheetUrl: response.data.spreadsheetUrl ?? undefined
        };
    } catch (error: any) {
        console.error('Error creating spreadsheet:', error);
        return {
            success: false,
            error: `Failed to create spreadsheet: ${error.message}`
        };
    }
}
