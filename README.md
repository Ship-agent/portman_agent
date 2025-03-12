# **Portman Agent - Azure Deployment and Usage Guide** 🚀

### Portman Agent is an Azure-based project that tracks vessel port calls. It consists of the following main components:

#### 1. Infrastructure (Terraform):
- Azure Function App with an HTTP trigger
- PostgreSQL database (Azure Database for PostgreSQL flexible server)
- Network and security rules
- Application Insights monitoring

#### 2. Functionality:
- Fetches data from the Digitraffic port call API (https://meri.digitraffic.fi/api/port-call/v1/port-calls)
- Stores information in two PostgreSQL tables:
    - `voyages`: Contains all port calls (e.g., vessel details, schedules, passengers)
    - `arrivals`: Tracks changes in arrival times

#### 3. Features:
- Can track specific vessels based on IMO number
- Stores information such as:
    - Vessel name and IMO number
    - Estimated and actual arrival and departure times
    - Number of passengers and crew
    - Port and berth details
    - Previous and next port

#### 4. Usage:
- Via HTTP trigger (Function App URL)
- Parameters:
    - `code`: Function App authentication
    - `imo`: Vessels to track (comma-separated IMO numbers)

#### 5. Environments:
- Development
- Testing
- Production
- Separate configurations for each environment

#### 6. CI/CD:
- GitHub Actions workflows for automatic deployment
- Terraform state management in Azure Storage Account
- Automated testing and deployment

#### 7. Security:
- Azure Function App authentication
- PostgreSQL server firewall
- Environment variables for sensitive data

---

## **📌 Local Deployment Instructions**  

### **📌 Prerequisites**
Before deploying **locally**, ensure you have:

✅ **Terraform Installed**: [Download Terraform](https://developer.hashicorp.com/terraform/downloads)  
✅ **Azure CLI Installed**: [Download Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)  
✅ **Logged into Azure**:
```bash
az login
```
✅ **Backend Storage for Terraform State** (Azure Storage Account with blob container)

### **1️⃣ Select Environment**  
#### **🔹 Choose Environment (`development`, `testing`, `production`)**  
```bash
cd environments/<environment>
```

### **2️⃣ Define Azure storage for storing Terraform state and Set Up Terraform**  
There are defaults defined (`storage_account_name`, `resource_group_name`, `container_name`) for saving Terraform state in Azure in `backend.tf`. Set these according to your Azure account. Resource group and storage account used for Terraform state better BE DIFFERENT than used in `terraform plan` step.

Then initialize Terraform.
```bash
terraform init -upgrade
```

Or backend variables can also be defined as command-line options:
```bash
terraform init -upgrade \
  -backend-config="resource_group_name=<your_resource_group_name>" \
  -backend-config="storage_account_name=<your_storage_account_name>" \
  -backend-config="container_name=<your_container_name>"
```

🚨 **If you are using Windows, you should also add subscription-id as a command-line variable:**  
```bash
terraform init -upgrade \
  -backend-config="subscription_id=<your_azure_subscription_id>" \
  -backend-config="resource_group_name=<your_resource_group_name>" \
  -backend-config="storage_account_name=<your_storage_account_name>" \
  -backend-config="container_name=<your_container_name>"
```

### **3️⃣ Create Terraform Deployment Plan for Infrastructure**  
The name of the storage account must to be defined separately because of the different Azure naming validations (no dashes allowed in storage account names). 

```bash
terraform plan -var-file=terraform.tfvars \
  -var="naming_prefix=<your_naming_prefix>" \
  -var="storage_account_name=<your_storage_account_name>" \
  -var="resource_group_owner_tag_value=<your_azure_account_email>" \
  -var="admin_password=<your_postgres_admin_password>" -out=main.tfplan
```
🚨 **Use DIFFERENT storage account name than in `terraform init` in previous step**  

### **4️⃣ Deploy Infrastructure**  
```bash
terraform apply main.tfplan
```
✅ **Terraform provisions resources for the selected environment.**  

---

### **📌 Destroy Infrastructure Locally**  
**To safely destroy all resources:**  
```bash
terraform destroy -var-file=terraform.tfvars \
  -var="naming_prefix=<your_naming_prefix>" \
  -var="storage_account_name=<your_storage_account_name>" \
  -var="resource_group_owner_tag_value=<your_azure_account_email>" \
  -var="admin_password=<your_postgres_admin_password>" -auto-approve
```
✅ **Destroys all resources for the selected environment.**  

---

## **📌 Deploy via GitHub Actions**  

### **📌 Prerequisites**
Before deploying via **GitHub Actions**, ensure you have:  
✅ **Azure User-assigned Managed Identity with Federated GitHub Credentials**  
- Defined in the same Azure resource group than your infrastructure is deployed 
- Instructions in [SiiliHub](https://siilihub.atlassian.net/wiki/spaces/SW/pages/4166254596/Azure+CI+CD+authentication#Usage-with-Github-environment)

✅ **GitHub Actions Secrets/Variables Configured** (For automated deployment)  
✅ **Backend Storage for Terraform State** (Azure Storage Account with blob container)  
- 🚨 **USE DIFFERENT resource group and storage account for storing Terraform state and for deploying your infrastructure!**

### **1️⃣ Set Up GitHub Environment Secrets**  
Go to **GitHub Repository → Settings → Secrets & Variables → Actions** and add/set these for desired environment (`development`, `testing`, `production`):  

| Secret Name | Description |
|------------|-------------|
| **`AZURE_CLIENT_ID`** | Azure Client ID from your User-assigned Managed Identity |
| **`AZURE_TENANT_ID`** | Azure Tenant ID from your User-assigned Managed Identity |
| **`AZURE_SUBSCRIPTION_ID`** | Azure Subscription ID of your Azure account |
| **`BACKEND_RESOURCE_GROUP`** | Resource Group for Terraform Backend |
| **`BACKEND_STORAGE_ACCOUNT`** | Azure Storage Account for Terraform State |
| **`BACKEND_CONTAINER_NAME`** | Azure Blob Container for Terraform State |
| **`DB_HOST`** | PostgreSQL Server Host |
| **`DB_PASSWORD`** | PostgreSQL Admin Password |

| Variable Name | Description |
|------------|-------------|
| **`AZURE_FUNCTIONAPP_NAME`** | Name of the Azure Function App service |
| **`AZURE_RESOURCE_GROUP`** | Resource Group for Azure resources (needed for deploying the Portman agent function to Azure Function App) |
| **`NAMING_PREFIX`** | Naming prefix for Azure resources |
| **`OWNER_TAG`** | The value of the mandatory 'Owner' tag for created Azure resource group |

✅ **GitHub Actions will securely use these secrets/vars during deployment.**  

---

### **2️⃣ Deploy Infrastructure via GitHub Actions**  
#### **🔹 Automatic Deployment (Pull Request to `main`)**
- **Terraform Deployment workflow is launched**
- **Changes made in Azure infrastructure can be verified from `Terraform Plan` job**
- **Once the Pull Request is merged, the `Terraform Apply` job is automatically launched and changes deployed to Azure**

✅ **GitHub Actions automatically deploys the infrastructure.**  

---

### **3️⃣ Manually Deploy Specific Environments**
#### **🔹 Run Workflow from GitHub Actions UI**  
- **Go to GitHub Actions → Terraform Deployment**  
- **Click "Run Workflow"**  
- **Select Branch (`develop`, `test`, `main`)**  
- **Select Deployment Environment (`development`, `testing`, `production`)**  
- **Click "Run workflow"**  

✅ **Terraform will now deploy the selected environment.**  

---
### **📌 Destroy Infrastructure via GitHub Actions**  
Destroying infrastructure needs manual approval on created GitHub Issue.  

**To destroy resources manually from GitHub Actions:**  
- **Go to GitHub Actions → Terraform Destroy**  
- **Click "Run Workflow"**  
- **Select Branch (`develop`, `test`, `main`)**  
- **Select Deployment Environment (`development`, `testing`, `production`)**  
- **Click "Run workflow"**  
- **Review the plan in GitHub Actions logs** 
- **Go to GitHub issues and select the issue regarding this destroy deployment**  
- **Follow the instructions on issue and either approve or decline the destroyment**  
- **If approved, the "Terraform Apply Destroy" job will be launched automatically**  

✅ **Prevents accidental resource deletion.**  

---

## **📌 Usage**
**The Portman Agent function URL can be found from:**  
- Azure Portal -> Function App -> Functions -> PortmanHttpTrigger  
- GitHub Actions Deployment log  

**Invoke the Portman Agent function:**  
- Use the function URL with `code` parameter
- Define trackable vessels (IMO-numbers separated with comma) with `imo` parameter (optional)  

**Query `voayges` and `arrivals` from Postgres DB:**  
- Use the GitHub Environment secret value `DB_HOST` as a Postgres DB host  
- Use the GitHub Environment secret value `DB_USER` as a Postgres DB user  
- Use the GitHub Environment secret value `DB_PASSWORD` or the admin password defined in local deployment process as a Postgres DB password  

---
### **Running Azure functions locally**  
Azure functions can be runned in local environment using Azure Functions Core Tools.  

- Install [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local?tabs=macos%2Cisolated-process%2Cnode-v4%2Cpython-v2%2Chttp-trigger%2Ccontainer-apps&pivots=programming-language-python)  
- Add `local.settings.json` to the project root directory with following content:  
```bash
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "<YOUR_AZURE_STORAGE_ACCOUNT_CONNECTION_STRING>",
    "FUNCTIONS_WORKER_RUNTIME": "python"
  }
}
```
- Run `func start` at the project root directory  

---

## **📌 Troubleshooting**
| Issue | Solution |
|------|---------|
| **Terraform state locked** | Run `terraform force-unlock <LOCK_ID>` |
| **CORS settings not applied** | Check with `az functionapp cors show` |
| **Deployment failed in GitHub Actions** | Go to **Actions → Terraform Deployment → Logs** |
| **Database connection refused** | Ensure firewall rules allow your IP (`az postgres flexible-server firewall-rule create`) |
