variable "naming_prefix" {
  description = "Prefix for naming resources"
  type        = string
}

variable "storage_account_name" {
  description = "Name of the storage account"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "ai_instrumentation_key" {
  description = "Instrumentation key of the Application Insights resource"
  type        = string
}

variable "postgresql_fqdn" {
  description = "PostgreSQL Fully Qualified Domain Name"
  type        = string
}

variable "admin_username" {
  description = "PostgreSQL Admin User"
  type        = string
}

variable "admin_password" {
  description = "The administrator password for the PostgreSQL server."
  type        = string
  sensitive   = true
}

variable "allowed_origins" {
  description = "List of origins allowed to make CORS requests to the storage account blob service."
  type        = list(string)
  default     = ["*"]
}