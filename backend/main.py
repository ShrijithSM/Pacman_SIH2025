# backend/main.py
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging
from typing import List, Dict

from scraper import scrape_college_website
from text_processor import clean_text, chunk_text
from vector_store import vector_store
from llm_handler import llm_handler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Campus Chatbot Backend",
    description="API for scraping, embedding, and querying campus information."
)

origins = [
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScrapeRequest(BaseModel):
    url: str

class QueryRequest(BaseModel):
    query: str

class ScrapeResponse(BaseModel):
    message: str
    pages_scraped: int

def process_scraped_data(scraped_data: List[Dict]):
    """Process scraped data and add to vector store"""
    logger.info(f"Processing {len(scraped_data)} pages")

    all_chunks = []
    for page in scraped_data:
        # Combine title, headings, and paragraphs
        content_parts = []
        if page.get('title'):
            content_parts.append(f"Title: {page['title']}")

        if page.get('headings'):
            content_parts.append("Headings: " + " | ".join(page['headings']))

        if page.get('paragraphs'):
            content_parts.append("Content: " + " ".join(page['paragraphs']))

        full_content = "\n".join(content_parts)
        cleaned_content = clean_text(full_content)

        if cleaned_content.strip():
            chunks = chunk_text(cleaned_content)
            for chunk in chunks:
                chunk_with_metadata = {
                    'text': chunk,
                    'url': page['url'],
                    'title': page['title']
                }
                all_chunks.append(chunk_with_metadata)

    if all_chunks:
        vector_store.add_documents(all_chunks)
        logger.info(f"Added {len(all_chunks)} chunks to vector store")
    else:
        logger.warning("No chunks were created from scraped data")

    return len(all_chunks)

@app.post("/scrape", response_model=ScrapeResponse)
async def scrape_college_data(request: ScrapeRequest, background_tasks: BackgroundTasks):
    """Endpoint to scrape college website data"""
    if not request.url.startswith(('http://', 'https://')):
        raise HTTPException(status_code=400, detail="Invalid URL format")

    try:
        logger.info(f"Starting scraping for {request.url}")

        scraped_data = await scrape_college_website(request.url)
        logger.info(f"Scraped {len(scraped_data)} pages")

        if not scraped_data:
            raise HTTPException(status_code=400, detail="No data could be scraped from the URL")

        # Process data immediately for debugging
        chunks_count = process_scraped_data(scraped_data)
        logger.info(f"Processed {chunks_count} chunks")

        return ScrapeResponse(
            message="Scraping completed successfully",
            pages_scraped=len(scraped_data)
        )

    except Exception as e:
        logger.error(f"Scraping failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Scraping failed: {str(e)}")

@app.post("/query")
async def handle_query(request: QueryRequest):
    """API endpoint for user queries"""
    if not request.query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    try:
        retrieved_chunks = vector_store.search(request.query, k=3)

        if not retrieved_chunks:
            return {
                "answer": "Sorry, I could not find relevant information about your query. Please make sure you have scraped a college website first."
            }

        context = "\n".join([chunk['text'] for chunk in retrieved_chunks])
        answer = llm_handler.generate_response(query=request.query, context=context)

        return {
            "answer": answer,
            "source_context": retrieved_chunks
        }
    except Exception as e:
        logger.error(f"Query processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process query")

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/")
def root():
    return {"status": "Campus Chatbot API is running"}

# Debug endpoint to check stored data
@app.get("/debug/data")
async def debug_data():
    """Debug endpoint to check stored data"""
    try:
        doc_count = len(vector_store.documents)
        sample_docs = vector_store.documents[:3] if vector_store.documents else []
        return {
            "document_count": doc_count,
            "sample_documents": [{"text": doc["text"][:200] + "..." if len(doc["text"]) > 200 else doc["text"]} for doc in sample_docs]
        }
    except Exception as e:
        return {"error": str(e)}
