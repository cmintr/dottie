import { ApiService } from './api';

/**
 * Interface for spreadsheet data
 */
export interface SpreadsheetData {
  spreadsheetId: string;
  spreadsheetTitle: string;
  sheets: Array<{
    sheetId: number;
    title: string;
    data: any[][];
  }>;
}

/**
 * Interface for spreadsheet update request
 */
interface SpreadsheetUpdateRequest {
  spreadsheetId: string;
  range: string;
  values: any[][];
}

/**
 * Interface for spreadsheet update response
 */
interface SpreadsheetUpdateResponse {
  spreadsheetId: string;
  updatedRange: string;
  updatedRows: number;
  updatedColumns: number;
  updatedCells: number;
}

/**
 * Interface for spreadsheet creation request
 */
interface SpreadsheetCreateRequest {
  title: string;
  sheets?: Array<{
    title: string;
    data?: any[][];
  }>;
}

/**
 * Service for Google Sheets-related API calls
 */
export class SheetsService {
  /**
   * Get data from a spreadsheet
   * @param spreadsheetId ID of the spreadsheet
   * @param ranges Optional array of ranges to retrieve (e.g., 'Sheet1!A1:D10')
   * @returns Promise with spreadsheet data
   */
  static async getSpreadsheetData(
    spreadsheetId: string,
    ranges?: string[]
  ): Promise<SpreadsheetData> {
    try {
      let endpoint = `/sheets/data?spreadsheetId=${spreadsheetId}`;
      
      if (ranges && ranges.length > 0) {
        const rangesParam = ranges.map(range => `ranges=${encodeURIComponent(range)}`).join('&');
        endpoint += `&${rangesParam}`;
      }
      
      return await ApiService.get<SpreadsheetData>(endpoint);
    } catch (error) {
      console.error(`Error fetching spreadsheet data for ${spreadsheetId}:`, error);
      throw error;
    }
  }

  /**
   * Update data in a spreadsheet
   * @param updateData Data to update including spreadsheet ID, range, and values
   * @returns Promise with update results
   */
  static async updateSpreadsheetData(
    updateData: SpreadsheetUpdateRequest
  ): Promise<SpreadsheetUpdateResponse> {
    try {
      return await ApiService.post<SpreadsheetUpdateResponse>('/sheets/data', updateData);
    } catch (error) {
      console.error('Error updating spreadsheet data:', error);
      throw error;
    }
  }

  /**
   * Create a new spreadsheet
   * @param createData Data for the new spreadsheet including title and optional sheets
   * @returns Promise with the created spreadsheet data
   */
  static async createSpreadsheet(
    createData: SpreadsheetCreateRequest
  ): Promise<SpreadsheetData> {
    try {
      return await ApiService.post<SpreadsheetData>('/sheets/create', createData);
    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      throw error;
    }
  }

  /**
   * Get a list of recent spreadsheets
   * @param maxResults Maximum number of spreadsheets to retrieve
   * @returns Promise with list of spreadsheets
   */
  static async getSpreadsheets(
    maxResults: number = 10
  ): Promise<Array<{ id: string; name: string; lastModified: string }>> {
    try {
      return await ApiService.get<Array<{ id: string; name: string; lastModified: string }>>(
        `/sheets/list?maxResults=${maxResults}`
      );
    } catch (error) {
      console.error('Error fetching spreadsheets list:', error);
      throw error;
    }
  }
}
