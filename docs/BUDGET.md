# Dottie AI Assistant - GCP Budget Planning

This document outlines the expected costs for deploying the Dottie AI Assistant on Google Cloud Platform, based on the CTO's guidance and current GCP pricing models.

## Cost Overview for Staging and Production

The Dottie AI Assistant utilizes several Google Cloud services, each with different pricing models and free tiers. This document provides estimates for both staging/testing and production environments.

## Staging/Internal Testing Environment

During the initial staging and internal testing phase (1-2 months), costs are expected to be minimal due to Google Cloud's generous free tiers.

| Service | Expected Usage | Free Tier | Expected Cost | Notes |
|---------|---------------|-----------|---------------|-------|
| **Firebase Hosting** (Frontend) | < 10GB storage, < 360MB/day transfer | 10GB storage, 360MB/day transfer | $0 | Will remain within free tier during testing |
| **Cloud Run** (Backend) | < 2M requests/month, < 180,000 vCPU-seconds | 2M requests/month, 180,000 vCPU-seconds | $0 | Internal testing load well below limits |
| **API Gateway** | < 2M API calls/month | 2M API calls/month | $0 | Will remain within free tier |
| **Firestore** (Data Storage) | < 1GB storage, < 50K reads, < 20K writes | 1GB storage, 50K reads, 20K writes | $0 | Minimal usage during testing |
| **Secret Manager** | < 6 secrets, < 6K access ops | 6 secrets, 6K access ops | $0 | Well within free tier |
| **Cloud Logging/Monitoring** | < 50GB logs/month | 50GB logs/month | $0 | Basic monitoring included |
| **Vertex AI** (Gemini LLM) | Variable based on testing | Limited free credits | $10-50/month | Depends on testing volume |
| **Cloud Speech-to-Text** | < 60 minutes/month | 60 minutes/month | $0-20/month | May exceed free tier |
| **Cloud Text-to-Speech** | < 4M characters/month | 4M characters/month | $0-20/month | May exceed free tier |
| **Google Workspace APIs** | Within quota limits | Free within quotas | $0 | Subject to API quotas |
| **Artifact Registry / Cloud Build** | Minimal usage | Limited free tier | $0-5/month | Small storage costs |
| **Total Estimated Monthly Cost** | | | **$10-95/month** | For staging/testing |

## Production Environment

For production deployment with 100-500 active users, costs will increase but can be optimized.

| Service | Expected Usage | Pricing | Estimated Cost | Notes |
|---------|---------------|---------|----------------|-------|
| **Firebase Hosting** (Frontend) | 50-100GB storage/transfer | $0.026/GB over free tier | $1-3/month | Low cost even at scale |
| **Cloud Run** (Backend) | 5-10M requests/month | $0.40/million requests over free tier | $1-5/month | Auto-scaling keeps costs low |
| **API Gateway** | 5-10M API calls/month | $3/million calls over free tier | $9-30/month | Increases with user activity |
| **Firestore** (Data Storage) | 5-10GB storage, 1M+ ops | $0.18/GB, $0.06/100K reads | $20-50/month | Scales with user count |
| **Secret Manager** | 10 secrets, 100K access ops | $0.06/secret version/month | $1-2/month | Minimal cost |
| **Cloud Logging/Monitoring** | 100-200GB logs/month | $0.50/GB over free tier | $25-75/month | Important for production |
| **Vertex AI** (Gemini LLM) | Based on user activity | $0.0007/1K input tokens, $0.0014/1K output tokens | $200-800/month | Highest cost component |
| **Cloud Speech-to-Text** | 500-2000 minutes/month | $0.016/15 seconds | $30-150/month | Scales with voice usage |
| **Cloud Text-to-Speech** | 20-50M characters/month | $4/1M characters | $80-200/month | Scales with voice usage |
| **Google Workspace APIs** | Within quota limits | Free within quotas | $0 | May need higher quotas |
| **Artifact Registry / Cloud Build** | Regular deployments | $0.10/GB storage, $0.003/build-minute | $5-15/month | For CI/CD pipeline |
| **Total Estimated Monthly Cost** | | | **$372-1,330/month** | For production |

## Cost Optimization Strategies

1. **Implement Caching**
   - Cache frequently accessed data to reduce Firestore reads
   - Cache API responses to reduce backend calls
   - Use Firebase Hosting CDN capabilities

2. **Optimize AI Usage**
   - Limit token usage in Vertex AI requests
   - Implement context pruning for chat history
   - Use streaming responses to optimize token usage

3. **Control Voice Feature Costs**
   - Limit maximum recording duration
   - Optimize audio quality settings
   - Consider implementing usage quotas per user

4. **Monitoring and Alerts**
   - Set up budget alerts in GCP
   - Monitor service usage trends
   - Identify and optimize high-cost components

5. **Scaling Strategies**
   - Start with minimal instance sizes
   - Use auto-scaling based on demand
   - Implement graceful degradation for high-load scenarios

## Budget Approval Process

For the staging and internal testing phase:
1. Enable billing on the `dottie-staging` GCP project
2. Set a budget alert at $100/month
3. Monitor costs weekly via GCP Billing console
4. Provide monthly cost reports to stakeholders

For production deployment:
1. Present detailed cost projections based on staging metrics
2. Obtain budget approval for estimated monthly costs
3. Implement strict monitoring and alerting
4. Review and optimize costs monthly

## Conclusion

The Dottie AI Assistant can be deployed cost-effectively on Google Cloud Platform, with minimal costs during the staging/testing phase. Production costs will scale with usage, with AI and voice features representing the largest cost components. Regular monitoring and optimization will be essential to maintain cost efficiency as the user base grows.
