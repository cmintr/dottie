import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { authService } from './services/authService';
import { getSheetData, updateSheetData, createSpreadsheet } from './services/sheetsService';

// Load environment variables
dotenv.config();

/**
 * Simple test script to verify Google Sheets service functionality
 * Note: You must have valid tokens stored in Firestore to run this test
 */
async function testSheetsService() {
  try {
    console.log('Starting Google Sheets service test...');
    
    // Test user ID - this should match an existing user with tokens in Firestore
    // For testing, you can use a session ID that was previously stored
    const userId = process.env.TEST_USER_ID || 'test-user-id';
    console.log(`Using test user ID: ${userId}`);
    
    // Step 1: Retrieve tokens from Firestore
    console.log('Step 1: Retrieving tokens from Firestore...');
    const tokens = await authService.getTokensFromFirestore(userId);
    
    if (!tokens) {
      throw new Error(`No tokens found for user ID: ${userId}. Please authenticate first.`);
    }
    
    console.log('✅ Retrieved tokens successfully');
    
    // Token update callback for refreshed tokens
    const handleTokenUpdate = (newTokens: any) => {
      console.log('Tokens refreshed during test:', newTokens);
    };
    
    // Step 2: Create a new spreadsheet
    console.log('Step 2: Creating a new test spreadsheet...');
    const createResult = await createSpreadsheet(
      tokens,
      {
        title: `Dottie AI Test Spreadsheet - ${new Date().toISOString()}`,
        sheets: [
          {
            title: 'Test Data',
            gridProperties: {
              rowCount: 100,
              columnCount: 20
            }
          }
        ]
      },
      handleTokenUpdate
    );
    
    if (!createResult.success || !createResult.spreadsheetId) {
      throw new Error(`Failed to create spreadsheet: ${createResult.error}`);
    }
    
    const spreadsheetId = createResult.spreadsheetId;
    console.log('✅ Spreadsheet created successfully with ID:', spreadsheetId);
    console.log('Spreadsheet URL:', createResult.spreadsheetUrl);
    
    // Step 3: Update data in the spreadsheet
    console.log('Step 3: Updating data in the spreadsheet...');
    const testData = [
      ['Timestamp', 'Test ID', 'Value 1', 'Value 2'],
      [new Date().toISOString(), uuidv4(), Math.random() * 100, Math.random() * 100],
      [new Date().toISOString(), uuidv4(), Math.random() * 100, Math.random() * 100]
    ];
    
    const updateResult = await updateSheetData(
      tokens,
      {
        spreadsheetId,
        range: 'Test Data!A1:D3',
        values: testData
      },
      handleTokenUpdate
    );
    
    if (!updateResult.success) {
      throw new Error(`Failed to update spreadsheet: ${updateResult.error}`);
    }
    
    console.log('✅ Spreadsheet data updated successfully');
    console.log(`Updated ${updateResult.updatedCells} cells in range: ${updateResult.updatedRange}`);
    
    // Step 4: Read data from the spreadsheet
    console.log('Step 4: Reading data from the spreadsheet...');
    const sheetData = await getSheetData(
      tokens,
      {
        spreadsheetId,
        range: 'Test Data!A1:D3'
      },
      handleTokenUpdate
    );
    
    console.log('✅ Retrieved sheet data successfully:');
    console.table(sheetData);
    
    console.log('All tests passed! Google Sheets service is working correctly.');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testSheetsService();
