# Dottie AI Assistant - Testing Guide for Novices

This guide provides simple, step-by-step instructions for testing the Dottie AI Assistant application locally, without requiring any technical expertise.

## Prerequisites

Before you begin, make sure you have:

- Windows 10 or 11 operating system
- Node.js installed (version 18 or later)
- Git installed
- A code editor (like Visual Studio Code) for viewing files (optional)

## Step 1: Clone the Repository

1. Open PowerShell or Command Prompt
2. Navigate to where you want to store the project
3. Run the following commands:

```
git clone https://github.com/cmintr/dottie.git
cd dottie
```

## Step 2: Set Up the Test Environment

Run the following command to set up the test environment:

```
powershell -File .\dottie-test-temp\run-frontend-test.ps1
```

This script will:
- Create necessary configuration files
- Install dependencies
- Start the development server

Wait until you see a message indicating the server is running (usually at http://localhost:5173).

## Step 3: Open the Application

1. Open your web browser (Chrome, Firefox, or Edge recommended)
2. Navigate to: http://localhost:5173
3. You should see the Dottie AI Assistant login page

## Step 4: Sign In and Test Features

### Authentication Testing

1. Click the "Sign in with Google" button
2. Since this is a test environment, you'll be automatically signed in with a mock user account
3. Verify that you can see the chat interface after signing in

### Chat Interface Testing

Try sending the following test messages to Dottie:

1. **Email Testing**:
   - Type: "Show me my recent emails"
   - You should see a list of mock emails displayed

2. **Calendar Testing**:
   - Type: "What's on my calendar today?"
   - You should see a list of mock calendar events

3. **Spreadsheet Testing**:
   - Type: "Create a spreadsheet for Q1 sales data"
   - You should see a mock spreadsheet creation result

4. **Email Draft Testing**:
   - Type: "Draft an email to John about the project status"
   - You should see a mock email draft created

### UI Testing

Verify these UI elements are working correctly:

1. **Header**: Should show your profile picture and name
2. **Chat Messages**: Should alternate between user (right side) and assistant (left side)
3. **Function Results**: Should be displayed in formatted cards below assistant messages
4. **Input Box**: Should allow you to type and send messages

## Step 5: Testing Error Handling

Try these scenarios to test error handling:

1. Refresh the page and verify that your authentication state is maintained
2. Try sending an empty message (should be prevented)
3. Try sending a very long message to test UI handling

## Step 6: Shut Down the Test Environment

When you're finished testing:

1. Return to the PowerShell window
2. Press `Ctrl+C` to stop the server
3. Confirm by typing `Y` if prompted

## Reporting Issues

If you encounter any issues during testing, please document:

1. What action you were trying to perform
2. What you expected to happen
3. What actually happened
4. Any error messages you saw
5. Screenshots (if possible)

Send this information to the development team via email or the project's issue tracker.

## Test Scenarios Checklist

Use this checklist to ensure you've tested all key features:

- [ ] Sign in with Google
- [ ] View chat interface
- [ ] Send and receive messages
- [ ] View email list
- [ ] View calendar events
- [ ] Create spreadsheet
- [ ] Draft email
- [ ] Sign out
- [ ] Sign back in
- [ ] Test responsive design (resize browser window)

Happy testing!
