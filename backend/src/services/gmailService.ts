import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { authService, GoogleTokens, TokenUpdateCallback } from './authService';

// Define interfaces for parameters and results
interface SendEmailParams {
    to: string;
    subject: string;
    body: string; // Assuming HTML body
    cc?: string;
    bcc?: string;
}

interface SendEmailResult {
    success: boolean;
    messageId?: string | null;
    error?: string;
}

interface GetRecentEmailsParams {
    maxResults?: number;
    query?: string;
}

interface EmailMessage {
    id: string;
    threadId: string;
    snippet: string;
    subject: string;
    from: string;
    date: string;
    hasAttachments: boolean;
}

/**
 * Sends an email via Gmail API using the user's OAuth credentials
 * 
 * @param tokens OAuth tokens from the user's session or Firestore
 * @param params Email parameters (to, subject, body, optional cc/bcc)
 * @param onTokensRefreshed Callback function to update tokens when refreshed
 * @returns Object containing success status and message ID or error
 */
export async function sendGmail(
    tokens: GoogleTokens,
    params: SendEmailParams,
    onTokensRefreshed?: TokenUpdateCallback
): Promise<SendEmailResult> {
    try {
        // 1. Create authenticated client using the token refresh pattern
        const authClient = await authService.createAuthenticatedClient(tokens, undefined, onTokensRefreshed || undefined);
        
        // 2. Initialize the Gmail API client
        const gmail = google.gmail({ version: 'v1', auth: authClient as any });
        
        // 3. Construct the raw email message (RFC 2822 format)
        // Create headers
        const headers = [
            `To: ${params.to}`,
            `Subject: ${params.subject}`,
            'Content-Type: text/html; charset=utf-8',
        ];
        
        // Add optional headers if provided
        if (params.cc) headers.push(`Cc: ${params.cc}`);
        if (params.bcc) headers.push(`Bcc: ${params.bcc}`);
        
        // Combine headers and body
        const message = headers.join('\r\n') + '\r\n\r\n' + params.body;
        
        // 4. Encode the message in base64url format (required by Gmail API)
        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        
        // 5. Send the email
        const response = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage
            }
        });
        
        // 6. Return success with message ID
        return {
            success: true,
            messageId: response.data.id
        };
    } catch (error: any) {
        console.error('Error sending email:', error);
        return {
            success: false,
            error: error.message || 'Unknown error occurred while sending email'
        };
    }
}

/**
 * Gets recent emails from the user's Gmail inbox
 * 
 * @param tokens OAuth tokens from the user's session or Firestore
 * @param params Query parameters (maxResults, query)
 * @param onTokensRefreshed Callback function to update tokens when refreshed
 * @returns Array of email messages
 */
export async function getRecentEmails(
    tokens: GoogleTokens,
    params: GetRecentEmailsParams,
    onTokensRefreshed?: TokenUpdateCallback
): Promise<EmailMessage[]> {
    try {
        // 1. Create authenticated client using the token refresh pattern
        const authClient = await authService.createAuthenticatedClient(tokens, undefined, onTokensRefreshed || undefined);
        
        // 2. Initialize the Gmail API client
        const gmail = google.gmail({ version: 'v1', auth: authClient as any });
        
        // 3. Set up parameters for the list request
        const maxResults = params.maxResults || 10; // Default to 10 emails
        const query = params.query || ''; // Default to empty query (all emails)
        
        // 4. Get the list of messages
        const response = await gmail.users.messages.list({
            userId: 'me',
            maxResults,
            q: query
        });
        
        const messages = response.data.messages || [];
        
        // 5. Get details for each message
        const emailDetails = await Promise.all(
            messages.map(async (message) => {
                const details = await gmail.users.messages.get({
                    userId: 'me',
                    id: message.id!
                });
                
                // Extract headers
                const headers = details.data.payload?.headers || [];
                const subject = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || 'No Subject';
                const from = headers.find(h => h.name?.toLowerCase() === 'from')?.value || 'Unknown Sender';
                const date = headers.find(h => h.name?.toLowerCase() === 'date')?.value || '';
                
                // Check for attachments
                const hasAttachments = Boolean(
                    details.data.payload?.parts?.some(part => part.filename && part.filename.length > 0)
                );
                
                return {
                    id: details.data.id!,
                    threadId: details.data.threadId!,
                    snippet: details.data.snippet || '',
                    subject,
                    from,
                    date,
                    hasAttachments
                };
            })
        );
        
        return emailDetails;
    } catch (error: any) {
        console.error('Error getting recent emails:', error);
        throw new Error(`Failed to retrieve emails: ${error.message}`);
    }
}
