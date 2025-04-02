# Environment Setup for Dottie AI Assistant

This guide provides detailed instructions for setting up your development and deployment environments for the Dottie AI Assistant backend.

## Local Development Environment

### 1. Clone the Repository

First, clone the repository to your local machine:

```bash
git clone https://github.com/your-organization/dottie.git
cd dottie
```

### 2. Install Dependencies

Install the required Node.js dependencies:

```bash
cd backend
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```
# Server Configuration
PORT=3000
NODE_ENV=development

# Firebase Configuration
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
FIREBASE_APP_ID=your-app-id

# Google OAuth Configuration
GOOGLE_OAUTH_CLIENT_ID=your-oauth-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-oauth-client-secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Session Configuration
SESSION_SECRET=your-session-secret

# LLM Service Configuration
LLM_API_KEY=your-llm-api-key
LLM_API_URL=https://api.openai.com/v1
```

Replace the placeholder values with your actual configuration values.

### 4. Set Up Firebase Service Account

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Save the JSON file as `firebase-service-account.json` in the `backend/config` directory

### 5. Build the Application

Build the TypeScript application:

```bash
npm run build
```

### 6. Start the Development Server

Start the local development server:

```bash
npm run dev
```

The server will start on http://localhost:3000 (or the port you specified in the `.env` file).

## Production Environment Setup

### 1. Server Requirements

For production deployment, you'll need a server with:

- Node.js 16.x or higher
- npm 8.x or higher
- At least 1GB of RAM
- At least 10GB of disk space
- A Linux-based operating system (Ubuntu 20.04 LTS recommended)

### 2. Server Setup

#### Install Node.js and npm

```bash
# Update package lists
sudo apt update

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### Install Git

```bash
sudo apt-get install git
```

#### Install PM2 (Process Manager)

PM2 is a process manager for Node.js applications that helps keep your application running.

```bash
sudo npm install -g pm2
```

### 3. Deploy the Application

#### Clone the Repository

```bash
git clone https://github.com/your-organization/dottie.git
cd dottie/backend
```

#### Install Dependencies

```bash
npm install --production
```

#### Set Up Environment Variables

Create a `.env` file with your production configuration:

```bash
# Create and edit the .env file
nano .env
```

Add the following variables (with your production values):

```
# Server Configuration
PORT=3000
NODE_ENV=production

# Firebase Configuration
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
FIREBASE_APP_ID=your-app-id

# Google OAuth Configuration
GOOGLE_OAUTH_CLIENT_ID=your-oauth-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-oauth-client-secret
GOOGLE_OAUTH_REDIRECT_URI=https://your-domain.com/auth/google/callback

# Session Configuration
SESSION_SECRET=your-production-session-secret

# LLM Service Configuration
LLM_API_KEY=your-llm-api-key
LLM_API_URL=https://api.openai.com/v1
```

#### Set Up Firebase Service Account

Upload your Firebase service account JSON file to the server:

```bash
# Create the config directory
mkdir -p config

# Create and edit the service account file
nano config/firebase-service-account.json
```

Paste the contents of your Firebase service account JSON file.

#### Build the Application

```bash
npm run build
```

#### Start the Application with PM2

```bash
pm2 start dist/server.js --name dottie-backend
```

#### Configure PM2 to Start on Boot

```bash
pm2 startup
pm2 save
```

### 4. Set Up Nginx as a Reverse Proxy

Nginx can be used as a reverse proxy to forward requests to your Node.js application.

#### Install Nginx

```bash
sudo apt-get install nginx
```

#### Configure Nginx

Create a new Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/dottie
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the configuration:

```bash
sudo ln -s /etc/nginx/sites-available/dottie /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. Set Up SSL with Let's Encrypt

Secure your application with an SSL certificate from Let's Encrypt:

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Follow the prompts to complete the SSL setup.

## Docker Deployment (Alternative)

If you prefer to use Docker for deployment, follow these steps:

### 1. Install Docker and Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Create a Dockerfile

Create a `Dockerfile` in the `backend` directory:

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

### 3. Create a Docker Compose File

Create a `docker-compose.yml` file in the root directory:

```yaml
version: '3'
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    env_file:
      - ./backend/.env
    volumes:
      - ./backend/config:/app/config
    restart: always
```

### 4. Build and Start the Docker Container

```bash
docker-compose up -d
```

## Next Steps

Once you have set up your environment, proceed to [Firebase Configuration](./03-firebase-configuration.md) to configure Firebase for authentication and data storage.
