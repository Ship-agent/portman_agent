from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.embeddings import SentenceTransformerEmbeddings
from langchain.vectorstores import Chroma
import os

def setup_chroma(data_folder:str, collection_name:str):
    """Setup Chroma vector store with embeddings from raw text documents."""
    # Load raw text documents 

    docs_path = f"../../source_data/{data_folder}/"
    raw_documents = []

    for filename in os.listdir(docs_path):
        if filename.endswith(".txt"):
            loader = TextLoader(os.path.join(docs_path, filename))
            raw_documents.extend(loader.load())

    # Split documents into chunks

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=300,
        chunk_overlap=100,
        length_function=len,
        is_separator_regex=False,
    )

    chunks = text_splitter.split_documents(raw_documents)

    # Initialize SentenceTransformer embeddings

    embedding_function = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")

    # Setup Chroma vector store 
    CHROMA_PATH = "chroma_db"  # Path where the vector DB will be saved

    vectorstore = Chroma(
        collection_name=collection_name,
        embedding_function=embedding_function,
        persist_directory=CHROMA_PATH,
    )

    # Add documents to Chroma

    vectorstore.add_documents(chunks)
    vectorstore.persist()

    print(f"Successfully indexed {len(chunks)} chunks into Chroma with embeddings.")
