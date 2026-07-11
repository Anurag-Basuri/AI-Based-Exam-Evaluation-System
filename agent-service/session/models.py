"""
Session models.
"""

from typing import Optional
from pydantic import BaseModel, Field

class ChatMessage(BaseModel):
    role: str = Field(description="'teacher' or 'agent'")
    content: str
    timestamp: float

class SessionConfig(BaseModel):
    title: str = "AI Exam"
    totalQuestions: int = 5
    mcqCount: int = 3
    difficulty: str = "medium"
    marksPerMcq: int = 1
    marksPerSubjective: int = 5
    topicFocus: str = ""
    additionalInstructions: str = ""
    selectedMaterials: list[str] = Field(default_factory=list)

class CreateSessionRequest(BaseModel):
    classroom_id: str
    teacher_id: str
    config: SessionConfig

class SendMessageRequest(BaseModel):
    content: str
