from azure.storage.blob import BlobServiceClient, BlobSasPermissions, generate_blob_sas
from datetime import datetime, timedelta, UTC
import os
import logging

def generate_blob_storage_link(blob_name, connection_string=None):
    """Generate a URL with SAS token to access the blob directly."""
    try:
        # Get storage account connection string if not provided
        if not connection_string:
            connection_string = os.environ.get("AzureWebJobsStorage")

        if not connection_string:
            logging.warning("Storage connection string not available, cannot generate direct link")
            return ""

        container_name = blob_name.split('/')[0]
        blob_path = '/'.join(blob_name.split('/')[1:])

        # Create the BlobServiceClient
        blob_service_client = BlobServiceClient.from_connection_string(connection_string)

        # Get account name from connection string
        account_name = blob_service_client.account_name

        # Get account key (needed for SAS token generation)
        account_key = connection_string.split('AccountKey=')[1].split(';')[0]

        # Generate SAS token with read permission that expires in 90 days
        sas_token = generate_blob_sas(
            account_name=account_name,
            container_name=container_name,
            blob_name=blob_path,
            account_key=account_key,
            permission=BlobSasPermissions(read=True),
            expiry=datetime.now(UTC) + timedelta(days=90),
            content_type="application/xml",
            content_disposition=f"attachment; filename={os.path.basename(blob_path)}"
        )

        # Create the URL with SAS token
        blob_url = f"https://{account_name}.blob.core.windows.net/{container_name}/{blob_path}?{sas_token}"

        return blob_url
    except Exception as e:
        logging.error(f"Error generating blob storage link: {e}")
        return "" 