import dotenv from 'dotenv';
import { firestoreService } from './services/firestoreService';

// Load environment variables
dotenv.config();

/**
 * Simple test script to verify Firestore token storage functionality
 */
async function testFirestoreTokenStorage() {
  try {
    console.log('Starting Firestore token storage test...');
    
    // Test user ID
    const userId = 'test-user-' + Date.now();
    console.log(`Using test user ID: ${userId}`);
    
    // Sample tokens
    const sampleTokens = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expiry_date: Date.now() + 3600 * 1000, // 1 hour from now
      scope: 'https://www.googleapis.com/auth/calendar',
      token_type: 'Bearer'
    };
    
    // Step 1: Store tokens
    console.log('Step 1: Storing tokens in Firestore...');
    await firestoreService.storeUserTokens(userId, sampleTokens);
    console.log('✅ Tokens stored successfully');
    
    // Step 2: Retrieve tokens
    console.log('Step 2: Retrieving tokens from Firestore...');
    const retrievedTokens = await firestoreService.getUserTokens(userId);
    console.log('Retrieved tokens:', retrievedTokens);
    
    if (!retrievedTokens) {
      throw new Error('Failed to retrieve tokens');
    }
    
    // Step 3: Update tokens
    console.log('Step 3: Updating tokens in Firestore...');
    const updatedTokenData = {
      access_token: 'updated-access-token',
      expiry_date: Date.now() + 7200 * 1000 // 2 hours from now
    };
    
    await firestoreService.updateUserTokens(userId, updatedTokenData);
    console.log('✅ Tokens updated successfully');
    
    // Step 4: Retrieve updated tokens
    console.log('Step 4: Retrieving updated tokens from Firestore...');
    const updatedTokens = await firestoreService.getUserTokens(userId);
    console.log('Updated tokens:', updatedTokens);
    
    if (!updatedTokens || updatedTokens.access_token !== 'updated-access-token') {
      throw new Error('Token update failed');
    }
    
    // Step 5: Delete tokens
    console.log('Step 5: Deleting tokens from Firestore...');
    await firestoreService.deleteUserTokens(userId);
    console.log('✅ Tokens deleted successfully');
    
    // Step 6: Verify deletion
    console.log('Step 6: Verifying token deletion...');
    const deletedTokens = await firestoreService.getUserTokens(userId);
    
    if (deletedTokens) {
      throw new Error('Tokens were not properly deleted');
    }
    
    console.log('✅ Verified tokens were deleted');
    console.log('All tests passed! Firestore token storage is working correctly.');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testFirestoreTokenStorage();
