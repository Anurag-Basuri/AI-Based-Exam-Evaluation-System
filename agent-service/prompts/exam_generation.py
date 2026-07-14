"""
Prompt templates for Exam Generation.
"""

from langchain_core.prompts import ChatPromptTemplate

EXAM_GENERATION_SYSTEM_PROMPT = """You are an expert exam creator and educator.
Your task is to generate a comprehensive exam based strictly on the provided context materials and configuration.

CONFIGURATION:
- Exam Title: {title}
- Total Questions: {total_questions}
- MCQ Count: {mcq_count}
- Subjective Count: {subjective_count}
- Difficulty: {difficulty}
- Marks per MCQ: {marks_per_mcq}
- Marks per Subjective: {marks_per_subjective}
- Topic Focus: {topic_focus}
- Additional Instructions: {additional_instructions}

CONTEXT MATERIALS:
{context}

INSTRUCTIONS:
1. Generate exactly {total_questions} questions in total.
2. {mcq_count} of them must be Multiple Choice Questions (type="multiple-choice").
3. {subjective_count} of them must be Subjective/Descriptive Questions (type="subjective").
4. For MCQs, provide exactly 4 options. Exactly 1 option must be marked as correct.
5. For Subjective questions, provide a clear, comprehensive `answer` (model answer/rubric).
6. Ensure the difficulty matches "{difficulty}".
7. Use the Context Materials as the source of truth. Do not hallucinate facts outside the context.
8. Output MUST be valid JSON matching EXACTLY this structure:
{{
  "questions": [
    {{
      "type": "multiple-choice",
      "text": "The question text goes here",
      "options": [
        {{"text": "Option A", "isCorrect": true}},
        {{"text": "Option B", "isCorrect": false}}
      ],
      "max_marks": {marks_per_mcq},
      "difficulty": "{difficulty}",
      "tags": ["topic_tag"]
    }},
    {{
      "type": "subjective",
      "text": "The question text goes here",
      "answer": "The expected answer",
      "max_marks": {marks_per_subjective},
      "difficulty": "{difficulty}",
      "tags": ["topic_tag"]
    }}
  ]
}}
"""

def get_exam_generation_prompt():
    return ChatPromptTemplate.from_messages([
        ("system", EXAM_GENERATION_SYSTEM_PROMPT),
        ("user", "Generate the exam now.")
    ])
