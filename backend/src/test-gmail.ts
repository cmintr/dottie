import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { authService } from './services/authService';
import { sendGmail, getRecentEmails } from './services/gmailService';

// Load environment variables
dotenv.config();

/**
 * Simple test script to verify Gmail service functionality
 * Note: You must have valid tokens stored in Firestore to run this test
 */
async function testGmailService() {
  try {
    console.log('Starting Gmail service test...');
    
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
    
    // Step 2: Send a test email
    console.log('Step 2: Sending a test email...');
    const emailResult = await sendGmail(
      tokens,
      {
        to: process.env.TEST_EMAIL_RECIPIENT || 'test@example.com',
        subject: `Dottie AI Test Email - ${new Date().toISOString()}`,
        body: `
          <h1>Dottie AI Test Email</h1>
          <p>This is a test email sent at ${new Date().toLocaleString()} to verify the Gmail service functionality.</p>
          <p>Test ID: ${uuidv4()}</p>
        `
      },
      handleTokenUpdate
    );
    
    if (!emailResult.success) {
      throw new Error(`Failed to send email: ${emailResult.error}`);
    }
    
    console.log('✅ Email sent successfully with message ID:', emailResult.messageId);
    
    // Step 3: Retrieve recent emails
    console.log('Step 3: Retrieving recent emails...');
    const emails = await getRecentEmails(
      tokens,
      { maxResults: 5, query: 'subject:Dottie AI Test' },
      handleTokenUpdate
    );
    
    console.log(`✅ Retrieved ${emails.length} recent emails`);
    
    // Log email subjects
    if (emails.length > 0) {
      console.log('Recent email subjects:');
      emails.forEach((email, index) => {
        const subject = (email as any).payload?.headers?.find((h: any) => h.name === 'Subject')?.value || 'No subject';
        console.log(`${index + 1}. ${subject}`);
      });
    }
    
    console.log('All tests passed! Gmail service is working correctly.');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testGmailService();
