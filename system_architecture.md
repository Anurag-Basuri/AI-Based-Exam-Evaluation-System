# Agentic AI System — Architecture & Workflow

This document explains the end-to-end flow of the Agentic System, how it integrates into the broader application, and the exact evaluation logic.

## 1. High-Level Architecture

The system consists of three main components working together:

1. **Frontend (React/Vite on Port 5173)**
   - Provides the UI for teachers to create exams, configure AI parameters, and chat with the AI Agent in real-time.
   - Streams the AI's step-by-step thinking (Server-Sent Events) so the teacher isn't left waiting blindly.

2. **Backend (Node.js/Express on Port 8000)**
   - Acts as the main API gateway and security layer.
   - Manages the MongoDB database (Users, Classrooms, Exams, Agent Sessions).
   - Proxies requests to the Python Agent service, ensuring that only authenticated teachers can trigger the AI.

3. **Agent Microservice (Python/FastAPI on Port 8001)**
   - The "Brain" of the operation.
   - Uses **LangGraph** to manage complex, multi-step AI reasoning and maintain a stateful chat session.
   - Uses **ChromaDB** to securely store and search classroom materials (PDFs, PPTs) locally without sending whole documents to the LLM.
   - Uses an **LLM Fallback Chain** (Groq → Gemini → OpenRouter → HuggingFace) to guarantee reliability even if one AI provider goes down.

## 2. Core Workflows

### A. Exam Generation (The Chat-Based Agent)
When a teacher wants the AI to generate an exam, they don't just get a "take it or leave it" result. We use a stateful LangGraph agent:

1. **Initiation**: Teacher fills out a form (e.g., 10 questions, medium difficulty) and hits "Generate".
2. **GENERATE Graph**: The Python service searches ChromaDB for the relevant classroom materials, packages them into a prompt, and generates a structured draft of the exam.
3. **Interactive Refinement (REFINE Graph)**: The draft appears in a chat window on the frontend. The teacher can tell the agent, *"Make question 3 easier"* or *"Add two more questions about mitochondria"*.
4. **Token Optimization**: If the teacher says *"Change the marks for question 1 to 5"*, the agent uses RegEx to parse the intent and updates the draft in memory **without** wasting API tokens on an LLM call. It only calls the LLM for complex structural changes.

### B. Student Evaluation (The Strict-RAG Evaluator)
When a student submits an exam, the AI evaluates the subjective answers. Per your latest requirements, the evaluation logic is strictly scoped to prevent hallucination.

**The Strict-RAG Logic:**
- **Manual Exams**: If the teacher manually created the exam and attached specific reference materials, the AI will **only** search those specific `doc_id`s in ChromaDB. 
- **AI-Generated Exams**: If the AI created the exam, the system saves the specific document chunks the AI used during generation. During evaluation, the AI uses those **exact same references**.
- **No External Knowledge**: The system prompt explicitly instructs the LLM: *"Do not use outside knowledge. Evaluate this answer strictly based on the provided reference material."*

---

## 3. How the Evaluation Logic is Implemented

To achieve this, the Python service exposes an `/evaluate` endpoint. When the Node.js backend calls this endpoint, it passes:
1. `student_answer`: What the student wrote.
2. `question`: The exam question.
3. `reference_answer`: (Optional) A model answer provided by the teacher.
4. `allowed_doc_ids`: A strict list of document IDs the AI is permitted to search in ChromaDB.

**The LangChain Flow for Evaluation:**
1. **Search**: ChromaDB performs a similarity search against the student's answer, filtered strictly by `allowed_doc_ids`.
2. **Contextualize**: The retrieved text chunks are injected into the LLM prompt.
3. **Score & Review**: The LLM outputs a strictly typed JSON object containing a `score` (0-100) and a brief `review` explaining why marks were awarded or deducted based *only* on the injected context.

---

## 4. Why This Architecture?
- **Cost-Efficient**: By utilizing the fallback chain (Hugging Face / Groq), we maximize free-tier tokens. The RegEx intent parser prevents unnecessary LLM calls during chat.
- **Reliable**: LangGraph ensures the agent doesn't lose context mid-conversation.
- **Private**: By using ChromaDB locally, we only send small, relevant chunks of text to external LLMs, not entire textbooks.
- **Explainable**: Because the AI is restricted to specific `doc_id`s during evaluation, teachers can trace exactly *why* the AI graded a student a certain way.
