# Dottie AI Assistant - GCP Deployment Guide (Non-Technical)

## **IMPORTANT: READ THIS FIRST**

This guide is designed to help a non-technical person deploy the Dottie AI Assistant application to the Google Cloud Platform (GCP) for testing purposes. 

**Security is critical:**
*   **NEVER** share passwords, secret keys, or any sensitive information provided to you.
*   **ONLY** use the specific values provided by your technical team for configuration. Do not guess or use examples from the internet.
*   If you are unsure about any step, **STOP** and ask your technical lead for clarification. Making a mistake could compromise security or cause the application to fail.

## Prerequisites

Before you begin, ensure you have the following:

1.  **GCP Project Access:** You must have been granted access to the specific Google Cloud Project where Dottie will be deployed. Your technical lead will provide the **Project ID**.
2.  **Appropriate Permissions:** A GCP administrator (likely your technical lead) must have given your user account the necessary permissions (e.g., Cloud Build Editor, Cloud Run Admin, Service Account User).
3.  **Configuration Values:** Your technical lead must provide you with a **secure** list of the necessary configuration values (Environment Variables and potentially Secret names). **Do not store these insecurely.**
4.  **Branch Name:** The specific branch of the code to deploy (for this testing phase, it should be `architecture-security-overhaul`).

## Deployment Steps

We will use Google Cloud Console (the web interface) for these steps.

### Step 1: Access Google Cloud Console

1.  Open your web browser (Chrome is recommended).
2.  Go to: [https://console.cloud.google.com/](https://console.cloud.google.com/)
3.  Log in using the Google account that has been granted access to the project.
4.  **Select the Correct Project:** At the top of the page, you'll see a project name. Click on it and select the **Project ID** provided by your technical lead. Ensure the correct project is selected before proceeding.

### Step 2: Build the Application using Cloud Build

Cloud Build will automatically take the code, build it into a runnable package (a container image), and store it.

1.  **Navigate to Cloud Build:** In the search bar at the top of the Google Cloud Console, type "Cloud Build" and select it from the results.
2.  **Go to Triggers (If set up):** If your technical team has set up an automatic "Trigger", deploying might be as simple as ensuring the latest code is in the `architecture-security-overhaul` branch. Ask your technical lead if a trigger exists for this branch. If so, you might be able to skip to Step 3 after confirming the code is up-to-date.
3.  **Manual Build (If no Trigger or for specific commit):**
    *   Click on the "**History**" section in the left-hand menu.
    *   Click the "**Submit Build**" button near the top.
    *   **Region:** Select the region specified by your technical lead (e.g., `us-central1`).
    *   **Source Repository:** Choose "**Cloud Source Repositories**" and select the repository for the Dottie project.
    *   **Branch:** Enter the branch name: `architecture-security-overhaul`
    *   **Configuration:** Choose "**Cloud Build configuration file (yaml or json)**". The location should likely be `backend/cloudbuild.yaml` (confirm with your technical lead if different).
    *   Click "**Submit**".
4.  **Monitor Build:** You will be taken to the Build History page. The new build will appear at the top, showing its progress (e.g., "Running", "Success", "Failed"). Wait for the build to show "**Success**". This might take 5-15 minutes. If it fails, take a screenshot of the error and contact your technical lead.

### Step 3: Deploy to Cloud Run

Cloud Run is the service that will run the Dottie application.

1.  **Navigate to Cloud Run:** In the search bar at the top, type "Cloud Run" and select it.
2.  **Find the Dottie Service:** You should see a list of services. Find the service name for the Dottie backend (e.g., `dottie-backend-service`). If it doesn't exist, contact your technical lead – they may need to create it first. Click on the service name.
3.  **Deploy New Revision:** Click the "**Edit & Deploy New Revision**" button near the top.
4.  **Container Image:**
    *   You need to specify the container image that Cloud Build just created.
    *   Click "**Select**" next to the "Container image URL" field.
    *   Navigate to the "**Artifact Registry**" tab.
    *   Find the repository named similar to `dottie-backend` (confirm the exact name with your technical lead).
    *   Select the image tagged with `latest` or a specific identifier from the build you just ran (your tech lead can clarify which tag to use, often it relates to the branch name or commit ID). Click "**Select**".
5.  **Revision Name (Optional):** You can leave this blank or give it a descriptive name (e.g., `security-overhaul-test-1`).
6.  **Configure Settings:** Scroll down to the different configuration sections:
    *   **CPU allocation and pricing:** Leave as default unless instructed otherwise by your technical lead.
    *   **Autoscaling:** Leave `Min instances` as 0 and `Max instances` as recommended (e.g., 2 or 4 for testing) by your technical lead.
    *   **Ingress control:** Set to "**All**".
    *   **Authentication:** Select "**Allow unauthenticated invocations**". (User authentication is handled *inside* the app by Firebase, this setting allows web browsers to reach the service).
7.  **Configure Container Settings:**
    *   **Container port:** Ensure this is set to `8080`.
    *   **Capacity:** Leave as default (e.g., 1 CPU, 512MiB Memory) unless instructed otherwise.
    *   **Execution environment:** Select "**First generation**" unless advised otherwise.
8.  **Configure Variables & Secrets (CRITICAL STEP):**
    *   Click on the "**Variables & Secrets**" tab.
    *   **Environment Variables:**
        *   You will need to add several environment variables. Click "**Add Variable**" for each one.
        *   Enter the **Name** and **Value** exactly as provided in the secure list from your technical lead. Common variables needed are:
            *   `GOOGLE_OAUTH_CLIENT_ID`
            *   `GOOGLE_OAUTH_REDIRECT_URI`
            *   `ALLOWED_ORIGINS` (e.g., the URL of the frontend test site)
            *   `PROJECT_ID` (Your GCP Project ID)
            *   `NODE_ENV` (Set to `production` for testing environments usually, confirm with lead)
            *   *(Potentially others - use the list provided)*
    *   **Secrets:**
        *   Your technical team should have already stored sensitive values (like `SESSION_SECRET`, `GOOGLE_OAUTH_CLIENT_SECRET`) in **Secret Manager**. You need to link them here.
        *   Click "**Reference Secret**".
        *   For **Secret Name**, select the secret name provided by your technical lead (e.g., `dottie-session-secret`).
        *   For **Version**, select "**latest**".
        *   Under "**Exposed as**", choose "**Environment Variable**".
        *   For **Variable Name**, enter the name the application expects (e.g., `SESSION_SECRET`).
        *   Repeat this process for all required secrets (like `GOOGLE_OAUTH_CLIENT_SECRET`).
9.  **Service Account:** Ensure the correct Service Account is selected (your technical lead will provide the name, e.g., `dottie-cloud-run-sa@...`). This service account needs permission to access Secret Manager secrets.
10. **Deploy:** Once all settings are configured and variables/secrets are added, click the "**Deploy**" button at the bottom.

### Step 4: Verify Deployment

1.  The deployment process might take a few minutes. Cloud Run will show the status. Wait until it shows a green checkmark indicating the new revision is serving traffic.
2.  **Get the URL:** At the top of the Cloud Run service page, you will see a **URL**. This is the web address for the deployed Dottie backend.
3.  **Basic Check:** Click the URL. You might see a simple "Not Found" message or similar (if you access the base URL directly). A more specific check is to add `/health` to the end of the URL (e.g., `https://your-service-url-xyz.a.run.app/health`). You should see a response like `{"status":"ok", ...}`.
4.  **Inform Team:** Copy the main service URL and provide it to your technical team and testers. They will use this URL to access the application frontend (which should be configured to talk to this backend URL).

## Troubleshooting

*   **Build Failed (Step 2):** Take a screenshot of the error message in Cloud Build history and contact your technical lead.
*   **Deployment Failed (Step 3):** Check the "**Logs**" tab on the Cloud Run service page for error messages. Copy any red error lines and provide them to your technical lead. Common issues are incorrect environment variables, missing secrets, or permission problems.
*   **Application Not Working (Step 4):** If the health check fails or the application doesn't respond correctly, check the "**Logs**" tab in Cloud Run. Provide any errors to your technical lead.

**If you encounter any issues you don't understand, please contact your technical lead immediately.**
