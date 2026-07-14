"""
Session models.
"""

from typing import Optional, Any
from pydantic import BaseModel, Field, model_validator

class ChatMessage(BaseModel):
    role: str = Field(description="'teacher' or 'agent'")
    content: str
    timestamp: float

class SessionConfig(BaseModel):
    title: str = "AI Exam"
    totalQuestions: int = Field(default=5, le=30, description="Max 30 questions")
    mcqCount: int = Field(default=3, le=30, description="Max 30 MCQs")
    difficulty: str = "medium"
    duration: int = Field(default=60, ge=5, le=240, description="Duration in minutes")
    marksPerMcq: int = 1
    marksPerSubjective: int = 5
    topicFocus: str = ""
    additionalInstructions: str = ""
    selectedMaterials: list[str] = Field(default_factory=list)

    @model_validator(mode='after')
    def validate_counts(self) -> 'SessionConfig':
        if self.mcqCount > self.totalQuestions:
            self.mcqCount = self.totalQuestions
        subjective = self.totalQuestions - self.mcqCount
        if subjective > 10:
            # Rebalance if subjective > 10
            self.totalQuestions = min(self.totalQuestions, self.mcqCount + 10)
        return self

class CreateSessionRequest(BaseModel):
    classroom_id: str
    teacher_id: str
    config: SessionConfig

class SendMessageRequest(BaseModel):
    content: str
