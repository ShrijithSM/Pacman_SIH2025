from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uuid
import aiofiles
import os
from pathlib import Path
import asyncio
from pdf_processor import extract_pdf_info, verify_against_db, answer_question_from_pdf

app = FastAPI(title="Campus Document Verification API")

# CORS middleware for React frontend (allow localhost on any port for dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:4173",
        "http://localhost:8080",
        "http://localhost:8081",
        "http://localhost:8088",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:4173",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8081",
        "http://127.0.0.1:8088",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for processing status and PDF content
processing_status = {}
pdf_content_store = {}

# Fix working directory and temp directory
current_dir = Path(__file__).parent
temp_dir = current_dir / "temp"
temp_dir.mkdir(exist_ok=True)

@app.get("/")
async def root():
    return {"message": "Campus Document Verification API", "status": "running"}

@app.get("/api/health")
async def api_health():
    """Health check under /api so Vite proxy forwards it (no CORS in dev)."""
    return {"status": "ok"}

@app.post("/api/upload-pdf")
async def upload_pdf(
    pdf: UploadFile = File(...),
    documentType: str = Form(...),
    universityId: str = Form(...),
    question: str = Form(None)
):
    try:
        # Validate file type
        if pdf.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Only PDF files are accepted. Please upload a valid PDF document.")

        # Generate task ID
        task_id = str(uuid.uuid4())

        # Save file temporarily (and validate size <= 15MB)
        file_path = temp_dir / f"{task_id}_{pdf.filename}"
        try:
            content = await pdf.read()
            if len(content) > 15 * 1024 * 1024:
                raise HTTPException(status_code=400, detail="File size too large. Please upload a PDF smaller than 15MB.")
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(content)
        except HTTPException:
            # Re-raise validation errors
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {str(e)}")

        # Initialize processing status
        processing_status[task_id] = {
            "status": "processing",
            "progress": 0,
            "filename": pdf.filename
        }

        # Start background processing
        asyncio.create_task(process_pdf_background(str(file_path), task_id, documentType, universityId, question))

        return {
            "taskId": task_id,
            "message": "PDF uploaded successfully and processing started",
            "filename": pdf.filename
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.get("/api/processing-status/{task_id}")
async def get_processing_status(task_id: str):
    if task_id not in processing_status:
        raise HTTPException(status_code=404, detail="Task not found")

    return processing_status[task_id]

@app.post("/api/ask-question")
async def ask_question(task_id: str = Form(...), question: str = Form(...)):
    """Ask a question about an already processed PDF"""
    try:
        if task_id not in pdf_content_store:
            raise HTTPException(status_code=404, detail="PDF content not found. Please upload a PDF first.")

        if not question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")

        pdf_text = pdf_content_store[task_id]["text"]
        answer = await answer_question_from_pdf(pdf_text, question)

        return {
            "question": question,
            "answer": answer,
            "status": "success"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process question: {str(e)}")

async def process_pdf_background(file_path: str, task_id: str, doc_type: str, university_id: str, question: str = None):
    try:
        processing_status[task_id]["status"] = "processing"
        processing_status[task_id]["progress"] = 25

        # Extract PDF information
        extracted_data = await extract_pdf_info(file_path, doc_type)
        processing_status[task_id]["progress"] = 40

        # Store PDF text for Q&A functionality
        pdf_content_store[task_id] = {
            "text": extracted_data.get("raw_text", ""),
            "structured_data": extracted_data.get("structured_data", {})
        }
        processing_status[task_id]["progress"] = 60

        # Verify against database
        verification_result = await verify_against_db(extracted_data, university_id, doc_type)
        processing_status[task_id]["progress"] = 80

        # Process initial question if provided
        initial_answer = None
        if question and question.strip():
            try:
                initial_answer = await answer_question_from_pdf(extracted_data.get("raw_text", ""), question)
            except Exception as e:
                initial_answer = f"Error processing question: {str(e)}"

        processing_status[task_id]["progress"] = 90

        # Prepare final result
        result = {
            "university": f"University {university_id}",
            "documentType": doc_type,
            "extractedData": extracted_data,
            "matchStatus": verification_result["status"],
            "confidence": verification_result["confidence"],
            "verification_details": verification_result.get("details", []),
            "taskId": task_id,
            "filename": processing_status[task_id].get("filename", "unknown.pdf")
        }

        if initial_answer:
            result["initialQuestion"] = question
            result["initialAnswer"] = initial_answer

        processing_status[task_id] = {
            "status": "completed",
            "progress": 100,
            "result": result
        }

    except Exception as e:
        processing_status[task_id] = {
            "status": "error",
            "error": f"Processing failed: {str(e)}"
        }
    finally:
        # Clean up file but keep PDF content in memory for Q&A
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except:
            pass

# Server startup code
if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Campus Document Verification API with Gemini Pro...")
    print("📁 Working directory:", os.getcwd())
    print("🤖 LLM Provider: Gemini Pro")
    print("🌐 Server will be available at: http://localhost:8000")
    print("📄 Upload PDFs at: http://localhost:8000/docs")

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
