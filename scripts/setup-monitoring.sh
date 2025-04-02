#!/bin/bash
# Script to set up Cloud Monitoring for Dottie AI Assistant

# Set variables
PROJECT_ID="YOUR_GCP_PROJECT_ID"  # Replace with your actual GCP project ID
REGION="us-central1"              # Replace with your preferred region
SERVICE_NAME="dottie-backend"     # Cloud Run service name

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up Cloud Monitoring for Dottie AI Assistant...${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if user is logged in
ACCOUNT=$(gcloud config get-value account 2>/dev/null)
if [ -z "$ACCOUNT" ]; then
    echo -e "${RED}Error: You are not logged in to gcloud. Please run 'gcloud auth login' first.${NC}"
    exit 1
fi

echo -e "${YELLOW}Using GCP project: ${PROJECT_ID}${NC}"
echo -e "${YELLOW}Using region: ${REGION}${NC}"

# Enable required APIs
echo -e "${YELLOW}Enabling required APIs...${NC}"
gcloud services enable monitoring.googleapis.com --project=${PROJECT_ID}
gcloud services enable cloudmonitoring.googleapis.com --project=${PROJECT_ID}
gcloud services enable logging.googleapis.com --project=${PROJECT_ID}

# Create uptime check for the backend API
echo -e "${YELLOW}Creating uptime check for the backend API...${NC}"
gcloud beta monitoring uptime-checks create http \
    --display-name="Dottie Backend API Health Check" \
    --uri="https://${SERVICE_NAME}-${PROJECT_ID}.run.app/api/health" \
    --http-method=GET \
    --content-type=plain \
    --check-interval=60s \
    --timeout=10s \
    --project=${PROJECT_ID}

# Create alert policy for uptime check
echo -e "${YELLOW}Creating alert policy for uptime check...${NC}"
gcloud alpha monitoring policies create \
    --display-name="Dottie Backend API Uptime Alert" \
    --condition-filter="metric.type=\"monitoring.googleapis.com/uptime_check/check_passed\" AND resource.type=\"uptime_url\" AND metric.label.check_id=\"${SERVICE_NAME}-health-check\"" \
    --condition-threshold-value=1 \
    --condition-threshold-comparison=COMPARISON_LT \
    --condition-aggregations-alignment-period=300s \
    --condition-aggregations-per-series-aligner=ALIGN_FRACTION_TRUE \
    --condition-aggregations-cross-series-reducer=REDUCE_COUNT_FALSE \
    --condition-trigger-count=1 \
    --condition-trigger-percent=0 \
    --notification-channels="projects/${PROJECT_ID}/notificationChannels/YOUR_NOTIFICATION_CHANNEL_ID" \
    --documentation-content="The Dottie Backend API is down. Please check the service status in Cloud Run." \
    --project=${PROJECT_ID}

# Create alert policy for high error rate
echo -e "${YELLOW}Creating alert policy for high error rate...${NC}"
gcloud alpha monitoring policies create \
    --display-name="Dottie Backend API Error Rate Alert" \
    --condition-filter="metric.type=\"run.googleapis.com/request_count\" AND resource.type=\"cloud_run_revision\" AND metric.label.response_code_class=\"4xx\" OR metric.label.response_code_class=\"5xx\"" \
    --condition-threshold-value=5 \
    --condition-threshold-comparison=COMPARISON_GT \
    --condition-aggregations-alignment-period=60s \
    --condition-aggregations-per-series-aligner=ALIGN_RATE \
    --condition-aggregations-cross-series-reducer=REDUCE_SUM \
    --condition-trigger-count=1 \
    --condition-trigger-percent=0 \
    --notification-channels="projects/${PROJECT_ID}/notificationChannels/YOUR_NOTIFICATION_CHANNEL_ID" \
    --documentation-content="The Dottie Backend API has a high error rate. Please check the logs for more details." \
    --project=${PROJECT_ID}

# Create alert policy for high latency
echo -e "${YELLOW}Creating alert policy for high latency...${NC}"
gcloud alpha monitoring policies create \
    --display-name="Dottie Backend API Latency Alert" \
    --condition-filter="metric.type=\"run.googleapis.com/request_latencies\" AND resource.type=\"cloud_run_revision\"" \
    --condition-threshold-value=2000 \
    --condition-threshold-comparison=COMPARISON_GT \
    --condition-aggregations-alignment-period=60s \
    --condition-aggregations-per-series-aligner=ALIGN_PERCENTILE_99 \
    --condition-aggregations-cross-series-reducer=REDUCE_MEAN \
    --condition-trigger-count=1 \
    --condition-trigger-percent=0 \
    --notification-channels="projects/${PROJECT_ID}/notificationChannels/YOUR_NOTIFICATION_CHANNEL_ID" \
    --documentation-content="The Dottie Backend API has high latency. Please check the service performance." \
    --project=${PROJECT_ID}

# Create dashboard for the backend API
echo -e "${YELLOW}Creating dashboard for the backend API...${NC}"
cat > dashboard.json << EOF
{
  "displayName": "Dottie Backend API Dashboard",
  "gridLayout": {
    "columns": "2",
    "widgets": [
      {
        "title": "Request Count",
        "xyChart": {
          "dataSets": [
            {
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"run.googleapis.com/request_count\" AND resource.type=\"cloud_run_revision\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_RATE",
                    "crossSeriesReducer": "REDUCE_SUM"
                  }
                }
              }
            }
          ]
        }
      },
      {
        "title": "Error Rate",
        "xyChart": {
          "dataSets": [
            {
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"run.googleapis.com/request_count\" AND resource.type=\"cloud_run_revision\" AND metric.label.response_code_class=\"4xx\" OR metric.label.response_code_class=\"5xx\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_RATE",
                    "crossSeriesReducer": "REDUCE_SUM"
                  }
                }
              }
            }
          ]
        }
      },
      {
        "title": "Latency (99th Percentile)",
        "xyChart": {
          "dataSets": [
            {
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"run.googleapis.com/request_latencies\" AND resource.type=\"cloud_run_revision\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_PERCENTILE_99",
                    "crossSeriesReducer": "REDUCE_MEAN"
                  }
                }
              }
            }
          ]
        }
      },
      {
        "title": "Memory Usage",
        "xyChart": {
          "dataSets": [
            {
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"run.googleapis.com/container/memory/utilizations\" AND resource.type=\"cloud_run_revision\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_MEAN",
                    "crossSeriesReducer": "REDUCE_MEAN"
                  }
                }
              }
            }
          ]
        }
      }
    ]
  }
}
EOF

gcloud monitoring dashboards create --config-from-file=dashboard.json --project=${PROJECT_ID}
rm dashboard.json

echo -e "${GREEN}Cloud Monitoring setup completed successfully!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Set up notification channels in Cloud Monitoring console"
echo -e "2. Update the alert policies with your notification channel IDs"
echo -e "3. Customize the dashboard as needed"
echo -e "4. Consider setting up additional metrics for specific API endpoints"

exit 0
