# Create an Azure Storage Share for the DAB config
resource "azurerm_storage_share" "dab_config_share" {
  name                 = "dab-config-files"
  storage_account_name = var.storage_account_name
  quota                = 5 # 5 GB storage
}

# Upload the `dab-config.json` file to the Azure File Share
resource "azurerm_storage_share_file" "dab_config_json" {
  name             = "dab-config.json"
  storage_share_id = azurerm_storage_share.dab_config_share.id
  source           = "../../dab/dab-config.json" # Using dab-config.json from project root /dab folder
}

resource "azurerm_container_app_environment" "dab_env" {
  name                = "${var.naming_prefix}-dap-cont-env"
  resource_group_name = var.resource_group_name
  location            = var.location
}

# Register Storage Inside the Container Apps Environment
resource "azurerm_container_app_environment_storage" "dab_storage" {
  name                         = "dab-config-storage"
  container_app_environment_id = azurerm_container_app_environment.dab_env.id
  account_name                 = var.storage_account_name
  share_name                   = azurerm_storage_share.dab_config_share.name
  access_key                   = var.storage_account_access_key
  access_mode                  = "ReadOnly"
}

resource "azurerm_container_app" "dab_cont" {
  name                         = "${var.naming_prefix}-dab-cont"
  resource_group_name          = var.resource_group_name
  container_app_environment_id = azurerm_container_app_environment.dab_env.id

  revision_mode = "Single"

  ingress {
    external_enabled = true # Accept traffic from anywhere
    target_port      = 5000 # Ensure port 5000 is exposed
    #transport        = "http"
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    container {
      name   = "dab"
      image  = "mcr.microsoft.com/azure-databases/data-api-builder:0.11.132"
      cpu    = "0.5" # Minimum: 0.25, Recommended: 0.5 or 1.0
      memory = "1Gi" # Minimum: 0.5Gi, Recommended: 1Gi or more

      args = ["--ConfigFileName=./dab-config/dab-config.json"]

      env {
        name  = "DATABASE_CONNECTION_STRING"
        value = var.database_connection_string
      }

      env {
        name  = "DAB_ENVIRONMENT"
        value = "Development"
      }

      volume_mounts {
        name = "config-volume"
        path = "/App/dab-config"
      }
    }

    volume {
      name         = "config-volume"
      storage_name = azurerm_container_app_environment_storage.dab_storage.name
      storage_type = "AzureFile"
    }
  }
}
