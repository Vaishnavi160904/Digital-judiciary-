import os
from typing import Dict
from dotenv import load_dotenv

from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_groq import ChatGroq

# Load environment variables
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# --------------------------------------------------
# EMBEDDINGS (LOCAL ONLY)
# --------------------------------------------------
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    model_kwargs={"local_files_only": True}
)

# --------------------------------------------------
# VECTOR STORE
# --------------------------------------------------
try:
    db = FAISS.load_local(
        "my_vector_store",
        embeddings,
        allow_dangerous_deserialization=True
    )
    retriever = db.as_retriever(search_kwargs={"k": 4})
    VECTOR_STORE_AVAILABLE = True
except Exception as e:
    print(f"Warning: Vector store not available: {e}")
    retriever = None
    VECTOR_STORE_AVAILABLE = False

# --------------------------------------------------
# LLM (GROQ)
# --------------------------------------------------
llm = ChatGroq(
    groq_api_key=GROQ_API_KEY,
    model_name="llama-3.1-8b-instant",
    temperature=0.2,
)

# --------------------------------------------------
# PROMPTS
# --------------------------------------------------

# Chat prompt with RAG
chat_prompt = PromptTemplate.from_template(
    """
You are LawGPT, an AI legal assistant specialized in Indian law.
Answer clearly, concisely, and professionally.

CONTEXT:
{context}

QUESTION:
{question}

ANSWER:
"""
)

# Case analysis prompts
classification_prompt = PromptTemplate(
    input_variables=["case_type", "case_title", "case_description"],
    template="""You are an expert legal AI assistant specializing in Indian law.

Case Type: {case_type}
Case Title: {case_title}
Case Description: {case_description}

Task: Classify this case into specific legal categories under Indian law. Consider:
- Relevant sections of IPC (Indian Penal Code) if criminal
- Relevant acts if civil (Contract Act, Consumer Protection Act, etc.)
- Jurisdiction and court level recommendation

Provide a detailed classification (2-3 sentences):"""
)

suggestions_prompt = PromptTemplate(
    input_variables=["case_type", "case_title", "case_description"],
    template="""You are an expert legal AI assistant specializing in Indian law.

Case Type: {case_type}
Case Title: {case_title}
Case Description: {case_description}

Task: Provide actionable legal suggestions for handling this case. Include:
- Key legal principles that apply
- Documentation needed
- Potential legal arguments
- Timeline considerations
- Precedents to research (if applicable)

Provide practical suggestions (3-4 sentences):"""
)

summary_prompt = PromptTemplate(
    input_variables=["case_type", "case_title", "case_description"],
    template="""You are an expert legal AI assistant specializing in Indian law.

Case Type: {case_type}
Case Title: {case_title}
Case Description: {case_description}

Task: Provide a concise legal summary of this case highlighting:
- Key facts
- Legal issues involved
- Parties' positions
- Potential outcomes

Provide a clear summary (2-3 sentences):"""
)

# --------------------------------------------------
# RAG PIPELINE (FOR CHAT)
# --------------------------------------------------
if VECTOR_STORE_AVAILABLE:
    rag_chain = (
        {
            "context": retriever,
            "question": RunnablePassthrough(),
        }
        | chat_prompt
        | llm
    )
else:
    # Fallback chain without RAG
    simple_prompt = PromptTemplate.from_template(
        """You are LawGPT, an AI legal assistant specialized in Indian law.
Answer the following question clearly and professionally:

QUESTION: {question}

ANSWER:"""
    )
    rag_chain = simple_prompt | llm


# --------------------------------------------------
# SERVICE FUNCTIONS
# --------------------------------------------------

def ask_lawgpt(question: str) -> str:
    """
    Main chat function using RAG pipeline
    """
    try:
        if VECTOR_STORE_AVAILABLE:
            response = rag_chain.invoke(question)
        else:
            response = rag_chain.invoke({"question": question})
        return response.content
    except Exception as e:
        return f"Error processing question: {str(e)}"


async def analyze_case(case_title: str, case_description: str, case_type: str) -> Dict[str, str]:
    """
    Analyze a case and provide classification, suggestions, and summary
    """
    try:
        # Generate classification
        classification_chain = classification_prompt | llm
        classification_result = await classification_chain.ainvoke({
            "case_type": case_type,
            "case_title": case_title,
            "case_description": case_description
        })
        classification = classification_result.content

        # Generate suggestions
        suggestions_chain = suggestions_prompt | llm
        suggestions_result = await suggestions_chain.ainvoke({
            "case_type": case_type,
            "case_title": case_title,
            "case_description": case_description
        })
        suggestions = suggestions_result.content

        # Generate summary
        summary_chain = summary_prompt | llm
        summary_result = await summary_chain.ainvoke({
            "case_type": case_type,
            "case_title": case_title,
            "case_description": case_description
        })
        summary = summary_result.content

        return {
            "classification": classification,
            "suggestions": suggestions,
            "summary": summary
        }

    except Exception as e:
        print(f"Error in case analysis: {str(e)}")
        # Fallback response
        return {
            "classification": f"This appears to be a {case_type} case requiring detailed legal review.",
            "suggestions": "Please consult with a legal professional to get specific advice tailored to your situation.",
            "summary": f"Case titled '{case_title}' requires legal evaluation and appropriate documentation."
        }


async def chat_query(question: str, context: str = "") -> str:
    """
    Answer legal questions using the LLM (async version for API)
    """
    try:
        if VECTOR_STORE_AVAILABLE:
            response = rag_chain.invoke(question)
        else:
            simple_prompt = PromptTemplate.from_template(
                """You are an expert legal AI assistant specialized in Indian law.

Context: {context}
Question: {question}

Provide a clear, accurate, and helpful answer based on Indian law. Include:
- Relevant legal provisions
- Practical advice
- Important considerations

Answer:"""
            )
            chain = simple_prompt | llm
            response = await chain.ainvoke({
                "question": question,
                "context": context or "General legal query"
            })

        return response.content

    except Exception as e:
        print(f"Error in chat query: {str(e)}")
        return "I apologize, but I'm having trouble processing your question right now. Please try again or consult with a legal professional."


def query_legal_documents(query: str) -> str:
    """
    Query legal documents using RAG
    """
    if not VECTOR_STORE_AVAILABLE:
        return "Vector store not available. Please ensure FAISS index is loaded."
    
    try:
        response = rag_chain.invoke(query)
        return response.content
    except Exception as e:
        return f"Error querying documents: {str(e)}"


# --------------------------------------------------
# SERVICE CLASS (For compatibility with routes)
# --------------------------------------------------
class LawGPTService:
    def __init__(self):
        """Initialize the LawGPT service"""
        self.llm = llm
        self.retriever = retriever
        self.vector_store_available = VECTOR_STORE_AVAILABLE

    async def analyze_case(self, case_title: str, case_description: str, case_type: str) -> Dict[str, str]:
        """Analyze case wrapper"""
        return await analyze_case(case_title, case_description, case_type)

    async def chat_query(self, question: str, context: str = "") -> str:
        """Chat query wrapper"""
        return await chat_query(question, context)

    def query_legal_documents(self, query: str) -> str:
        """Query documents wrapper"""
        return query_legal_documents(query)

    def ask(self, question: str) -> str:
        """Simple ask wrapper"""
        return ask_lawgpt(question)