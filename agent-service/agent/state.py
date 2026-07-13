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
    session_id: str
    classroom_id: str
    teacher_id: str
    
    config: dict
    
    context_chunks: list[str]
    used_chunk_ids: list[str]
    
    questions: list[dict]
    
    validation_errors: list[str]
    retry_count: int
    
    messages: list[dict]
    current_intent: Optional[dict]
    
    steps_log: list[dict]
    
    token_usage: dict
