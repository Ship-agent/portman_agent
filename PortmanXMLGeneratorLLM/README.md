# PortmanXMLGeneratorLLM

PortmanXMLGeneratorLLM is an intelligent utility that leverages Large Language Models (LLMs) to generate Portman-compatible XML files from structured maritime data. It converts DigiTraffic JSON port call data into XML formats compatible with the European Maritime Single Window environment (EMSWe). The tool supports retrieval-augmented generation (RAG) for enhanced contextual XML creation and integrates easily with testing frameworks.



## Infrastructure

- **Language**: Python 3.8+

- **LLM Framework**:  
  Uses `PromptManager` abstraction over HuggingFace Hub (e.g., `llama‑2‑70b`) and ConfidentialMind API for LLM calls.

- **Prompt Definitions**:  
  - Prompt templates are defined in `llm_config/prompts.yaml` (e.g., `convert_json_to_xml`, `cga_xml`).  
  - Example XML structures are stored in `ATA_template.xml` and `CGA_template.xml`.

- **Packaging & Environment**:  
  - Environment variables managed via `.env` file using `python-dotenv`.  
  - Supports both `CONFIDENTIAL_MIND_CONFIG` and `HUGGING_FACE_CONFIG` for flexible backend configuration.

- **RAG Support**:  
  - Retrieval-Augmented Generation implemented using LangChain + Chroma.  
  - Relevant scripts: `chromadb_setup.py` (indexing), `query_rag.py` (retrieval).

- **Data Transport**:  
  - Fetches real-time JSON port call data from the DigiTraffic API using the `requests` library.

- **Serialization & Storage**:  
  - LLM responses are cleaned using `utils.clean_llm_response()`.  
  - Results (JSON + generated XML) are saved together in YAML format using `utils.save_json_and_llm_xml()`.


## Functionality

### ATA XML Generation

- **Scripts**: `ATAGenerator_cm.py`, `ATAGenerator_langchain.py`
- **Workflow**:
  - Fetches port calls via DigiTraffic REST API.
  - Formats each port call into XML using `PromptManager` with the `convert_json_to_xml` prompt.
  - Saves both the original JSON and the generated XML to YAML files under `results/ata_answers/`.

### CGA XML Generation (RAG-enabled)

- **Script**: `CGAGenerator_langchain.py`
- **Workflow**:
  - Prompts the user for a query.
  - Retrieves relevant context from indexed documents using Chroma (`query_rag`).
  - Uses LLM with the `cga_xml` prompt to generate CGA-format XML from the retrieved context.
  - Work in progress.

### RAG Utilities

- **`chromadb_setup.py`**:
  - Ingests `.txt` files from a data folder.
  - Splits documents into chunks.
  - Generates embeddings and stores them in a Chroma vector database.

- **`query_rag.py`**:
  - Performs a similarity search over the vector DB.
  - Returns top‑k segments, joined and used as LLM input context.

### Prompt Handling

- **`PromptManager` (in `prompt_engineering/prompt_manager.py`)**:
  - Loads prompts and XML examples.
  - Provides `optimize_prompt()` for ConfidentialMind API flows.
  - Provides `run_prompt()` for HuggingFace/LangChain execution.

### XML Cleaning & YAML Output

- **`utils.py`**:
  - `clean_llm_response()`: Strips formatting (e.g., triple backticks) and extracts valid XML.
  - `save_json_and_llm_xml()`: Saves the source JSON and corresponding LLM-generated XML into a YAML wrapper.

## Features
- Uses LLMs for intelligent XML generation (ConfidentialMind API or HuggingFace models)
- Converts structured input (e.g., JSON port call data) into Portman XML formats (ATA, CGA)
- Supports retrieval-augmented generation (RAG) using LangChain and Chroma
- Allows prompt customization through llm_config/prompts.yaml
- Cleans and serializes LLM output into valid XML using utility functions
- Stores paired JSON input and generated XML in YAML format
- Fetches live data from DigiTraffic API for real-time scenarios
- Ingests external documents and indexes them as embeddings for contextual response
- Supports both ConfidentialMind and HuggingFace-backed LLM calls via unified PromptManager
- Organized, extensible codebase with modular components for generation, RAG, and utilities
- Environment variables handled via .env for secure configuration

## Installation

Clone this repository and Install Dependencies:

```bash
git clone https://github.com/Ship-agent/portman_agent.git
cd PortmanXMLGeneratorLLM
pip install -r requirements.txt 
```

## Usage
Set Environment Variables
```bash
CONFIDENTIAL_MIND_CONFIG={"api_key": "your_key"}
HUGGING_FACE_CONFIG={"api_key": "your_key"}
```

ATA XML Generation (ConfidentialMind or LangChain):
```bash
python src/generators/ATAGenerator_cm.py
# or
python src/generators/ATAGenerator_langchain.py
```
CGA XML Generation with RAG:
```bash 
python src/generators/CGAGenerator_langchain.py
```
RAG Setup (Preprocess Knowledge Base):
```bash 
python src/rag/chromadb_setup.py
```

## CI/CD Integration
- Modular & Scriptable: Each generator script can be run standalone or invoked via shell/Python scripts for automation.
- Test-Friendly Output: Results saved in results/*.yaml for snapshot testing or schema validation.
- Config-Driven: Prompts, LLM providers, and template structure are externalized for easy updates.
- Pipeline Ready: Can be integrated into CI workflows (e.g., GitHub Actions) to auto-generate or validate XML outputs as part of deployment/testing steps.


