"""
State definition for the LangGraph agent.
"""

from typing import TypedDict, Optional
from pydantic import BaseModel, Field

class QuestionOption(BaseModel):
    text: str
    isCorrect: bool

class QuestionDraft(BaseModel):
    type: str = Field(description="'multiple-choice' or 'subjective'")
    text: str = Field(description="The question text")
    options: list[QuestionOption] = Field(default_factory=list, description="For multiple-choice only")
    answer: Optional[str] = Field(default=None, description="Model answer for subjective questions")
    max_marks: int = Field(description="Points awarded for this question")
    difficulty: str = Field(description="'easy', 'medium', or 'hard'")
    remarks: Optional[str] = Field(default=None, description="Any grading remarks or hints")
    tags: list[str] = Field(default_factory=list, description="Topic tags")

class AgentState(TypedDict):
    # Session identifiers
    session_id: str
    classroom_id: str
    teacher_id: str
    
    # Input config from the teacher
    config: dict
    
    # RAG state
    context_chunks: list[str]
    
    # Current draft
    questions: list[dict]
    
    # Validation state
    validation_errors: list[str]
    retried: bool
    
    # Chat / Intent state
    messages: list[dict]
    current_intent: Optional[dict]
    
    # Log stream
    steps_log: list[dict]
    
    # Token usage
    token_usage: dict
