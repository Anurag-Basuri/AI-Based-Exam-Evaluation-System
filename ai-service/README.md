# RAG AI Evaluation Service

This is the Python microservice that provides AI evaluation, document ingestion, and chat capabilities using LangChain, ChromaDB, and Google Gemini.

## Requirements

- Python 3.10+
- Google Gemini API Key

## Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate  # Windows
   # source venv/bin/activate # Mac/Linux
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure Environment Variables:
   Copy `.env.example` to `.env` and insert your Gemini API Key.
   ```
   PORT=8000
   GOOGLE_API_KEY=your_gemini_api_key_here
   CHROMA_DB_DIR=./app/vectorstore/chroma_db
   UPLOAD_DIR=./uploads
   ```

## Running the Server

```bash
uvicorn app.main:app --reload --port 8000
```
Or simply run the main file:
```bash
python -m app.main
```

## Endpoints

- `POST /api/v1/ai/ingest`: Upload PDF/TXT/DOCX files.
- `POST /api/v1/ai/query`: Chat with uploaded documents.
- `POST /api/v1/ai/evaluate`: Evaluate student answers based on course material.
- `POST /api/v1/ai/generate-questions`: Generate questions from course material.
- `GET /health`: Server health check.

Access the interactive API documentation at: http://localhost:8000/docs
