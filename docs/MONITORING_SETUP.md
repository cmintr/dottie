# Dottie AI Assistant - Monitoring Setup Guide

This document provides instructions for setting up monitoring for the Dottie AI Assistant on Google Cloud Platform, including PowerShell scripts for Windows environments.

## Monitoring Components

The Dottie AI Assistant monitoring setup includes:

1. **Uptime Checks**: Verify that the API endpoints are accessible
2. **Error Rate Alerts**: Notify when error rates exceed thresholds
3. **Latency Monitoring**: Track and alert on high response times
4. **Resource Utilization**: Monitor CPU, memory, and network usage
5. **Custom Dashboard**: Visualize key metrics in a single view

## Prerequisites

Before setting up monitoring, ensure you have:

- Google Cloud SDK installed and configured
- Appropriate permissions on the GCP project
- PowerShell 5.1 or higher (for Windows)
- The Dottie backend deployed to Cloud Run

## PowerShell Setup Script

Save the following script as `Configure-Monitoring.ps1` in your scripts directory:

```powershell
# PowerShell script to set up Cloud Monitoring for Dottie AI Assistant

# Set variables
$PROJECT_ID = "YOUR_GCP_PROJECT_ID"  # Replace with your actual GCP project ID
$REGION = "us-central1"              # Replace with your preferred region
$SERVICE_NAME = "dottie-backend"     # Cloud Run service name
$NOTIFICATION_CHANNEL = "YOUR_NOTIFICATION_CHANNEL_ID"  # Replace with your notification channel ID

Write-Host "Setting up Cloud Monitoring for Dottie AI Assistant..." -ForegroundColor Yellow

# Check if gcloud is installed
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "Error: gcloud CLI is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Check if user is logged in
$ACCOUNT = gcloud config get-value account 2>$null
if ([string]::IsNullOrEmpty($ACCOUNT)) {
    Write-Host "Error: You are not logged in to gcloud. Please run 'gcloud auth login' first." -ForegroundColor Red
    exit 1
}

Write-Host "Using GCP project: $PROJECT_ID" -ForegroundColor Yellow
Write-Host "Using region: $REGION" -ForegroundColor Yellow

# Enable required APIs
Write-Host "Enabling required APIs..." -ForegroundColor Yellow
gcloud services enable monitoring.googleapis.com --project=$PROJECT_ID
gcloud services enable cloudmonitoring.googleapis.com --project=$PROJECT_ID
gcloud services enable logging.googleapis.com --project=$PROJECT_ID

# Create uptime check for the backend API
Write-Host "Creating uptime check for the backend API..." -ForegroundColor Yellow
gcloud beta monitoring uptime-checks create http `
    --display-name="Dottie Backend API Health Check" `
    --uri="https://$SERVICE_NAME-$PROJECT_ID.run.app/api/health" `
    --http-method=GET `
    --content-type=plain `
    --check-interval=60s `
    --timeout=10s `
    --project=$PROJECT_ID

# Create alert policy for uptime check
Write-Host "Creating alert policy for uptime check..." -ForegroundColor Yellow
gcloud alpha monitoring policies create `
    --display-name="Dottie Backend API Uptime Alert" `
    --condition-filter="metric.type=`"monitoring.googleapis.com/uptime_check/check_passed`" AND resource.type=`"uptime_url`" AND metric.label.check_id=`"$SERVICE_NAME-health-check`"" `
    --condition-threshold-value=1 `
    --condition-threshold-comparison=COMPARISON_LT `
    --condition-aggregations-alignment-period=300s `
    --condition-aggregations-per-series-aligner=ALIGN_FRACTION_TRUE `
    --condition-aggregations-cross-series-reducer=REDUCE_COUNT_FALSE `
    --condition-trigger-count=1 `
    --condition-trigger-percent=0 `
    --notification-channels="projects/$PROJECT_ID/notificationChannels/$NOTIFICATION_CHANNEL" `
    --documentation-content="The Dottie Backend API is down. Please check the service status in Cloud Run." `
    --project=$PROJECT_ID

# Create alert policy for high error rate
Write-Host "Creating alert policy for high error rate..." -ForegroundColor Yellow
gcloud alpha monitoring policies create `
    --display-name="Dottie Backend API Error Rate Alert" `
    --condition-filter="metric.type=`"run.googleapis.com/request_count`" AND resource.type=`"cloud_run_revision`" AND metric.label.response_code_class=`"4xx`" OR metric.label.response_code_class=`"5xx`"" `
    --condition-threshold-value=5 `
    --condition-threshold-comparison=COMPARISON_GT `
    --condition-aggregations-alignment-period=60s `
    --condition-aggregations-per-series-aligner=ALIGN_RATE `
    --condition-aggregations-cross-series-reducer=REDUCE_SUM `
    --condition-trigger-count=1 `
    --condition-trigger-percent=0 `
    --notification-channels="projects/$PROJECT_ID/notificationChannels/$NOTIFICATION_CHANNEL" `
    --documentation-content="The Dottie Backend API has a high error rate. Please check the logs for more details." `
    --project=$PROJECT_ID

# Create alert policy for high latency
Write-Host "Creating alert policy for high latency..." -ForegroundColor Yellow
gcloud alpha monitoring policies create `
    --display-name="Dottie Backend API Latency Alert" `
    --condition-filter="metric.type=`"run.googleapis.com/request_latencies`" AND resource.type=`"cloud_run_revision`"" `
    --condition-threshold-value=2000 `
    --condition-threshold-comparison=COMPARISON_GT `
    --condition-aggregations-alignment-period=60s `
    --condition-aggregations-per-series-aligner=ALIGN_PERCENTILE_99 `
    --condition-aggregations-cross-series-reducer=REDUCE_MEAN `
    --condition-trigger-count=1 `
    --condition-trigger-percent=0 `
    --notification-channels="projects/$PROJECT_ID/notificationChannels/$NOTIFICATION_CHANNEL" `
    --documentation-content="The Dottie Backend API has high latency. Please check the service performance." `
    --project=$PROJECT_ID

# Create dashboard for the backend API
Write-Host "Creating dashboard for the backend API..." -ForegroundColor Yellow
$dashboardJson = @"
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
"@

$dashboardJson | Out-File -FilePath "dashboard.json" -Encoding utf8
gcloud monitoring dashboards create --config-from-file=dashboard.json --project=$PROJECT_ID
Remove-Item -Path "dashboard.json"

Write-Host "Cloud Monitoring setup completed successfully!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Set up notification channels in Cloud Monitoring console"
Write-Host "2. Update the alert policies with your notification channel IDs"
Write-Host "3. Customize the dashboard as needed"
Write-Host "4. Consider setting up additional metrics for specific API endpoints"
```

## Setting Up Notification Channels

Before running the script, you should set up notification channels in the Google Cloud Console:

1. Go to **Monitoring** > **Alerting** > **Notification channels**
2. Create channels for email, SMS, Slack, or other preferred methods
3. Copy the notification channel ID to use in the script

## Running the Script

1. Update the script variables with your specific values:
   - `$PROJECT_ID`: Your GCP project ID
   - `$REGION`: Your preferred GCP region
   - `$SERVICE_NAME`: Your Cloud Run service name
   - `$NOTIFICATION_CHANNEL`: Your notification channel ID

2. Run the script in PowerShell:
   ```powershell
   .\Configure-Monitoring.ps1
   ```

3. Verify the setup in the Google Cloud Console:
   - Go to **Monitoring** > **Dashboards** to see your new dashboard
   - Go to **Monitoring** > **Alerting** to see your alert policies
   - Go to **Monitoring** > **Uptime checks** to see your uptime check

## Custom Metrics

In addition to the standard metrics, you may want to set up custom metrics for specific aspects of your application:

### Backend Custom Metrics

```javascript
// Example of sending a custom metric from the backend
const { Logging } = require('@google-cloud/logging');
const logging = new Logging();

async function logCustomMetric(metricType, value, labels = {}) {
  const log = logging.log('dottie-custom-metrics');
  const metadata = {
    resource: {
      type: 'cloud_run_revision',
      labels: {
        service_name: 'dottie-backend',
        revision_name: process.env.K_REVISION || 'local'
      }
    },
    severity: 'INFO'
  };
  
  const entry = log.entry(
    metadata,
    {
      message: `Custom metric: ${metricType}`,
      metricType,
      metricValue: value,
      metricLabels: labels
    }
  );
  
  await log.write(entry);
}

// Example usage
logCustomMetric('dottie/api/request_processing_time', 150, { endpoint: '/api/calendar' });
```

### Creating Custom Metrics in GCP

To create a custom metric in GCP:

1. Go to **Monitoring** > **Metrics Explorer**
2. Click **Select a metric**
3. Choose **Custom** > **Your metric name**
4. Configure the visualization and add to your dashboard

## Monitoring Best Practices

1. **Start with Critical Metrics**: Focus on uptime, error rates, and latency first
2. **Set Appropriate Thresholds**: Avoid alert fatigue by setting realistic thresholds
3. **Use Aggregation**: Aggregate metrics over appropriate time periods
4. **Document Alerts**: Include clear documentation with each alert
5. **Test Alert Policies**: Verify that alerts trigger correctly
6. **Regular Reviews**: Review and adjust thresholds based on real-world data

## Troubleshooting

### Common Issues

1. **Permission Errors**
   - Ensure your account has the `Monitoring Admin` role
   - Run `gcloud auth login` to refresh credentials

2. **API Not Enabled**
   - Verify that all required APIs are enabled
   - Check for errors in the Cloud Console

3. **Missing Metrics**
   - Ensure your service is deployed and receiving traffic
   - Check that the metric names and resource types are correct

### Getting Help

If you encounter issues:
- Check the [Cloud Monitoring documentation](https://cloud.google.com/monitoring/docs)
- Review the [Cloud Run metrics documentation](https://cloud.google.com/run/docs/monitoring)
- Contact GCP support if issues persist
