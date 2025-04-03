terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "services" {
  for_each = toset([
    "cloudbuild.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "firestore.googleapis.com",
    "apigateway.googleapis.com"
  ])
  service = each.key
  disable_on_destroy = false
}

# Create Cloud Run service
resource "google_cloud_run_service" "backend" {
  name     = "dottie-backend"
  location = var.region
  depends_on = [google_project_service.services]

  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/dottie-backend"
        env {
          name  = "NODE_ENV"
          value = "production"
        }
        # Add resource limits
        resources {
          limits = {
            cpu    = var.cpu_limit
            memory = var.memory_limit
          }
        }
      }
    }
    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = var.min_instance_count
        "autoscaling.knative.dev/maxScale" = var.max_instance_count
      }
    }
  }

  # Add error handling for deployment
  lifecycle {
    ignore_changes = [
      template[0].metadata[0].annotations["client.knative.dev/user-image"],
      template[0].metadata[0].annotations["run.googleapis.com/client-name"],
      template[0].metadata[0].annotations["run.googleapis.com/client-version"],
    ]
  }
}

# Create Firestore database
resource "google_firestore_database" "database" {
  name = "(default)"
  location_id = var.region
  type = "FIRESTORE_NATIVE"
}

# Create secrets
resource "google_secret_manager_secret" "secrets" {
  for_each = toset([
    "firebase-service-account",
    "google-client-id",
    "google-client-secret",
    "session-secret"
  ])

  secret_id = each.key
  replication {
    automatic = true
  }
}

# Set up Firebase configuration
resource "google_firebase_project" "default" {
  provider = google-beta
  project  = var.project_id
}

resource "google_firebase_hosting_site" "default" {
  provider = google-beta
  project  = var.project_id
  site_id  = var.project_id
  depends_on = [google_firebase_project.default]
}

# Set up API Gateway
resource "google_api_gateway_api" "api" {
  provider = google-beta
  api_id   = "dottie-api"
  project  = var.project_id
  depends_on = [google_project_service.services]
}

# Create a local variable for the backend URL
locals {
  backend_url = google_cloud_run_service.backend.status[0].url
  api_yaml_content = templatefile("${path.module}/api.yaml", {
    BACKEND_URL = local.backend_url
    PROJECT_ID = var.project_id
  })
}

# Create a temporary file with the processed API YAML
resource "local_file" "api_yaml" {
  content  = local.api_yaml_content
  filename = "${path.module}/processed-api.yaml"
}

resource "google_api_gateway_api_config" "api_config" {
  provider      = google-beta
  api           = google_api_gateway_api.api.api_id
  api_config_id = "dottie-api-config-${formatdate("YYYYMMDDhhmmss", timestamp())}"

  openapi_documents {
    document {
      path = "processed-api.yaml"
      contents = filebase64(local_file.api_yaml.filename)
    }
  }
  
  lifecycle {
    create_before_destroy = true
  }
  
  depends_on = [
    google_cloud_run_service.backend,
    local_file.api_yaml
  ]
}

resource "google_api_gateway_gateway" "gateway" {
  provider   = google-beta
  api_config = google_api_gateway_api_config.api_config.id
  gateway_id = "dottie-gateway"
  region     = var.region
  
  depends_on = [
    google_api_gateway_api_config.api_config
  ]
}