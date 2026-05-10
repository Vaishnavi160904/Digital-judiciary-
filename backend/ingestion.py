import os
from dotenv import load_dotenv

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

# --------------------------------------------------
# ENV
# --------------------------------------------------
load_dotenv()

DATA_DIR = "LEGAL-DATA"
VECTOR_DIR = "my_vector_store"

def ingest():
    print("📂 Starting ingestion with LOCAL embeddings...")

    documents = []

    # --------------------------------------------------
    # Load PDFs safely
    # --------------------------------------------------
    for file in os.listdir(DATA_DIR):
        if not file.lower().endswith(".pdf"):
            continue

        file_path = os.path.join(DATA_DIR, file)
        print(f"📄 Loading: {file}")

        try:
            loader = PyPDFLoader(file_path)
            docs = loader.load()

            for doc in docs:
                doc.metadata["source"] = file

            documents.extend(docs)

        except Exception as e:
            print(f"❌ Skipped {file} | Reason: {e}")

    print(f"✅ Loaded {len(documents)} pages")

    # --------------------------------------------------
    # Split documents
    # --------------------------------------------------
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )

    chunks = splitter.split_documents(documents)
    print(f"✂️ Split into {len(chunks)} chunks")

    # --------------------------------------------------
    # LOCAL embeddings (NO INTERNET)
    # --------------------------------------------------
    print("🧠 Loading local embedding model...")
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    # --------------------------------------------------
    # FAISS vector store
    # --------------------------------------------------
    vectorstore = FAISS.from_documents(chunks, embeddings)

    vectorstore.save_local(VECTOR_DIR)
    print("💾 Vector store saved successfully!")

if __name__ == "__main__":
    ingest()
