variable "project_id" {
  description = "Google Cloud project ID"
  type        = string
}

variable "region" {
  description = "Default region for resources"
  type        = string
  default     = "us-central1"
}

variable "firebase_location" {
  description = "Location for Firebase resources"
  type        = string
  default     = "us-central"
}

variable "min_instance_count" {
  description = "Minimum number of instances for Cloud Run"
  type        = number
  default     = 1
}

variable "max_instance_count" {
  description = "Maximum number of instances for Cloud Run"
  type        = number
  default     = 10
}

variable "container_concurrency" {
  description = "Maximum number of concurrent requests per container"
  type        = number
  default     = 80
}

variable "cpu_limit" {
  description = "CPU limit for Cloud Run containers"
  type        = string
  default     = "1000m"
}

variable "memory_limit" {
  description = "Memory limit for Cloud Run containers"
  type        = string
  default     = "512Mi"
}