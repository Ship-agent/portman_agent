import os

# Default PostgreSQL settings
DATABASE_CONFIG = {
    "dbname": os.getenv("DB_NAME", "portman"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "password"),
    "host": os.getenv("DB_HOST", "127.0.0.1"),
    "port": int(os.getenv("DB_PORT", 5432))
}

# Default Azure Storage settings
AZURE_STORAGE_CONFIG = {
    "connection_string": os.getenv("AzureWebJobsStorage"),
    "container_name": os.getenv("AZURE_STORAGE_CONTAINER_NAME", "emswe-xml-messages"),
}

XML_CONVERTER_CONFIG = {
    "function_url": os.getenv("XML_CONVERTER_FUNCTION_URL", "http://localhost:7071/api/emswe-xml-converter"),
    "function_key": os.getenv("XML_CONVERTER_FUNCTION_KEY", "")
}

CONFIDENTIAL_MIND_CONFIG = {
    "function_url": os.getenv("CONFIDENTIAL_MIND_BASE_URL", ""),
    "function_key": os.getenv("CONFIDENTIAL_MIND_API_KEY", "")
}

HUGGING_FACE_CONFIG = {
    "function_key": os.getenv("HUGGING_FACE_API_KEY", "")
}