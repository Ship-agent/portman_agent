from langchain.embeddings import SentenceTransformerEmbeddings
from langchain.vectorstores import Chroma

def query_rag(query: str, collection_name: str ):
    """Query the RAG system using Chroma vector store."""
    
    # Load Chroma vector store
    CHROMA_PATH = "chroma_db"

    embedding_function = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")

    vectorstore = Chroma(
        collection_name=collection_name,
        embedding_function=embedding_function,
        persist_directory=CHROMA_PATH,
    )


    results = vectorstore.similarity_search(query, k=3)

    context_chunks = []
    for i, doc in enumerate(results, 1):
        chunk_text = f"[Source {i}]\n{doc.page_content.strip()}"
        context_chunks.append(chunk_text)
       
    # Final context string for LLM prompt
    context = "\n\n".join(context_chunks)
    return context
