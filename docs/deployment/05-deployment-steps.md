# Deployment Steps for Dottie AI Assistant

This guide provides detailed step-by-step instructions for deploying the Dottie AI Assistant backend to various environments. Follow these instructions carefully to ensure a successful deployment.

## Deployment Options

The Dottie AI Assistant backend can be deployed to various environments:

1. **Local Development**: For development and testing
2. **Traditional VPS/Dedicated Server**: Using Node.js and PM2
3. **Docker Containers**: Using Docker and Docker Compose
4. **Cloud Platforms**: Such as Google Cloud Run, AWS Elastic Beanstalk, or Heroku

This guide covers all these deployment options in detail.

## Pre-Deployment Checklist

Before deploying, ensure you have completed the following steps:

- [ ] Set up Firebase (see [Firebase Configuration](./03-firebase-configuration.md))
- [ ] Configure Google APIs (see [Google API Setup](./04-google-api-setup.md))
- [ ] Create and configure environment variables
- [ ] Run tests to ensure everything is working correctly
- [ ] Build the application

## Local Development Deployment

### 1. Clone the Repository

```bash
git clone https://github.com/your-organization/dottie.git
cd dottie/backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the `backend` directory with your development configuration.

### 4. Build the Application

```bash
npm run build
```

### 5. Start the Development Server

```bash
npm run dev
```

The server will start on http://localhost:3000 (or the port you specified in the `.env` file).

## Traditional VPS/Dedicated Server Deployment

### 1. Prepare the Server

Ensure your server has the following installed:
- Node.js 16.x or higher
- npm 8.x or higher
- Git
- PM2 (for process management)
- Nginx (for reverse proxy)

```bash
# Update package lists
sudo apt update

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt-get install -y git

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt-get install -y nginx
```

### 2. Clone the Repository

```bash
git clone https://github.com/your-organization/dottie.git
cd dottie/backend
```

### 3. Install Dependencies

```bash
npm install --production
```

### 4. Set Up Environment Variables

Create a `.env` file with your production configuration.

### 5. Set Up Firebase Service Account

Create the `config` directory and add your Firebase service account JSON file:

```bash
mkdir -p config
# Copy your firebase-service-account.json to this directory
```

### 6. Build the Application

```bash
npm run build
```

### 7. Start the Application with PM2

```bash
pm2 start dist/server.js --name dottie-backend
```

### 8. Configure PM2 to Start on Boot

```bash
pm2 startup
pm2 save
```

### 9. Configure Nginx as a Reverse Proxy

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

### 10. Set Up SSL with Let's Encrypt

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Follow the prompts to complete the SSL setup.

## Docker Deployment

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

### 5. Set Up Nginx and SSL (Optional)

If you're running Docker on a server and want to use Nginx as a reverse proxy with SSL:

1. Follow steps 9 and 10 from the Traditional VPS/Dedicated Server Deployment section.
2. Update the Nginx configuration to point to your Docker container:

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

## Google Cloud Run Deployment

### 1. Install the Google Cloud SDK

Follow the instructions at https://cloud.google.com/sdk/docs/install to install the Google Cloud SDK.

### 2. Initialize the Google Cloud SDK

```bash
gcloud init
```

Follow the prompts to log in and select your project.

### 3. Create a Dockerfile

Create a `Dockerfile` in the `backend` directory (same as in the Docker Deployment section).

### 4. Build and Push the Docker Image

```bash
# Build the image
gcloud builds submit --tag gcr.io/your-project-id/dottie-backend

# Deploy to Cloud Run
gcloud run deploy dottie-backend \
  --image gcr.io/your-project-id/dottie-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,PORT=8080"
```

### 5. Set Up Environment Variables

```bash
# Set environment variables
gcloud run services update dottie-backend \
  --set-env-vars="FIREBASE_API_KEY=your-firebase-api-key,FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com,..."
```

### 6. Set Up Secret Manager for Sensitive Information

```bash
# Create a secret for the Firebase service account
gcloud secrets create firebase-service-account --data-file=./config/firebase-service-account.json

# Grant access to the Cloud Run service
gcloud secrets add-iam-policy-binding firebase-service-account \
  --member=serviceAccount:your-project-id@appspot.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

Update your application code to read the secret from Secret Manager.

## AWS Elastic Beanstalk Deployment

### 1. Install the AWS CLI and EB CLI

```bash
# Install AWS CLI
pip install awscli

# Install EB CLI
pip install awsebcli
```

### 2. Configure AWS CLI

```bash
aws configure
```

Enter your AWS Access Key ID, Secret Access Key, region, and output format.

### 3. Initialize Elastic Beanstalk

```bash
cd dottie/backend
eb init
```

Follow the prompts to configure your Elastic Beanstalk application.

### 4. Create an Elastic Beanstalk Environment

```bash
eb create dottie-backend-prod
```

### 5. Set Up Environment Variables

```bash
eb setenv FIREBASE_API_KEY=your-firebase-api-key FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com ...
```

### 6. Deploy the Application

```bash
eb deploy
```

### 7. Open the Application

```bash
eb open
```

## Heroku Deployment

### 1. Install the Heroku CLI

Follow the instructions at https://devcenter.heroku.com/articles/heroku-cli to install the Heroku CLI.

### 2. Log in to Heroku

```bash
heroku login
```

### 3. Create a Heroku Application

```bash
cd dottie/backend
heroku create dottie-backend
```

### 4. Add a Procfile

Create a file named `Procfile` in the `backend` directory:

```
web: node dist/server.js
```

### 5. Set Up Environment Variables

```bash
heroku config:set FIREBASE_API_KEY=your-firebase-api-key FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com ...
```

### 6. Deploy the Application

```bash
git push heroku main
```

### 7. Open the Application

```bash
heroku open
```

## Post-Deployment Verification

After deploying, verify that your application is working correctly:

1. **Test Authentication**: Navigate to `/auth/google` and complete the authentication flow
2. **Test API Integration**: Try sending a test email or creating a calendar event
3. **Check Logs**: Review the application logs for any errors
4. **Monitor Performance**: Set up monitoring to track application performance

## Scaling Considerations

As your application grows, consider the following scaling strategies:

1. **Horizontal Scaling**: Add more instances of your application
2. **Load Balancing**: Distribute traffic across multiple instances
3. **Caching**: Implement caching to reduce API calls
4. **Database Optimization**: Optimize your Firestore queries
5. **CDN**: Use a Content Delivery Network for static assets

## Next Steps

Once you have deployed your application, proceed to [Troubleshooting](./06-troubleshooting.md) for common issues and their solutions.
