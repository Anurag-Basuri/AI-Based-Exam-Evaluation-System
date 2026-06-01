from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

# Ingestion Schemas
class IngestResponse(BaseModel):
    message: str
    chunks_created: int
    document_id: str

# Query / Chat Schemas
class QueryRequest(BaseModel):
    query: str
    exam_id: Optional[str] = None
    teacher_id: Optional[str] = None

class SourceChunk(BaseModel):
    content: str
    metadata: Dict[str, Any]

class QueryResponse(BaseModel):
    answer: str
    sources: List[SourceChunk]

# Evaluation Schemas
class PolicySchema(BaseModel):
    strictness: str = "moderate"
    reviewTone: str = "concise"
    expectedLength: int = 20
    customInstructions: str = ""

class EvaluateRequest(BaseModel):
    question: str
    student_answer: str
    reference_answer: Optional[str] = None
    exam_id: Optional[str] = None
    policy: Optional[PolicySchema] = None

class EvaluateResponse(BaseModel):
    score: int = Field(ge=0, le=100)
    review: str
    meta: Dict[str, Any]

# Generation Schemas
class GenerateRequest(BaseModel):
    exam_id: str
    count: int = Field(default=5, ge=1, le=20)
    difficulty: str = "medium"
    question_type: str = "mixed" # "multiple-choice", "subjective", "mixed"

class GeneratedOption(BaseModel):
    text: str
    isCorrect: bool

class GeneratedQuestion(BaseModel):
    type: str
    text: str
    difficulty: str
    max_marks: int
    options: Optional[List[GeneratedOption]] = None
    answer: Optional[str] = None

class GenerateResponse(BaseModel):
    questions: List[GeneratedQuestion]
