from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import os
import shutil
import uuid
from app.config import settings
from app.models.schemas import IngestResponse
from app.services.rag_service import ingest_document

router = APIRouter()

@router.post("/ingest", response_model=IngestResponse)
async def ingest_file(
    file: UploadFile = File(...),
    exam_id: str = Form(None),
    teacher_id: str = Form(None)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
        
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".pdf", ".txt", ".docx"]:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, TXT, or DOCX.")
        
    file_id = str(uuid.uuid4())
    save_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}{ext}")
    
    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        chunks_created = ingest_document(save_path, exam_id=exam_id, teacher_id=teacher_id)
        
        return IngestResponse(
            message=f"Successfully ingested {file.filename}",
            chunks_created=chunks_created,
            document_id=file_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error ingesting document: {str(e)}")
    finally:
        file.file.close()
