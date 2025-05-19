resource "azurerm_service_plan" "function_plan" {
  name                = "${var.naming_prefix}-asp"
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Linux"
  sku_name            = "Y1"
}

resource "azurerm_storage_account" "storage" {
  name                     = var.storage_account_name
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  blob_properties {
    cors_rule {
      allowed_headers    = ["*"]
      allowed_methods    = ["GET", "HEAD", "OPTIONS"]
      allowed_origins    = var.allowed_origins
      exposed_headers    = ["*"]
      max_age_in_seconds = 86400
    }
  }
}

resource "azurerm_linux_function_app" "function_app" {
  name                        = "${var.naming_prefix}-func"
  resource_group_name         = var.resource_group_name
  location                    = var.location
  storage_account_name        = azurerm_storage_account.storage.name
  storage_account_access_key  = azurerm_storage_account.storage.primary_access_key
  service_plan_id             = azurerm_service_plan.function_plan.id
  functions_extension_version = "~4"

  site_config {
    http2_enabled            = false
    application_insights_key = var.ai_instrumentation_key

    application_stack {
      python_version = "3.12"
    }

    cors {
      allowed_origins = ["*"]
    }
  }

  app_settings = {
    DB_HOST     = var.postgresql_fqdn
    DB_USER     = var.admin_username
    DB_PASSWORD = var.admin_password
    DB_NAME     = "portman"
  }
}
