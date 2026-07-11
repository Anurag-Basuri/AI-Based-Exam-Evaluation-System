"""
Session manager for Agentic Exam Generation.
Handles state persistence (in-memory for now, can be backed by Redis later) and graph invocation.
"""

import uuid
import time
import asyncio
import logging
from typing import Dict, AsyncGenerator

from agent.state import AgentState
from agent.generate_graph import build_generate_graph
from agent.refine_graph import build_refine_graph
from session.models import CreateSessionRequest

logger = logging.getLogger(__name__)

class SessionManager:
    def __init__(self):
        # session_id -> AgentState
        self.sessions: Dict[str, AgentState] = {}
        
        self.generate_graph = build_generate_graph()
        self.refine_graph = build_refine_graph()

    def create_session(self, req: CreateSessionRequest) -> str:
        """Initializes a new session state."""
        session_id = str(uuid.uuid4())
        
        self.sessions[session_id] = {
            "session_id": session_id,
            "classroom_id": req.classroom_id,
            "teacher_id": req.teacher_id,
            "config": req.config.model_dump(),
            "context_chunks": [],
            "questions": [],
            "validation_errors": [],
            "retried": False,
            "messages": [],
            "current_intent": None,
            "steps_log": [],
            "token_usage": {}
        }
        
        logger.info(f"[Session] Created session {session_id} for teacher {req.teacher_id}")
        return session_id

    def get_session(self, session_id: str) -> AgentState:
        return self.sessions.get(session_id)

    async def run_generate(self, session_id: str) -> AsyncGenerator[dict, None]:
        """Runs the GENERATE graph and yields Server-Sent Events (SSE)."""
        state = self.sessions.get(session_id)
        if not state:
            yield {"event": "error", "data": "Session not found"}
            return

        yield {"event": "start", "data": "Starting exam generation pipeline"}
        
        # Reset transient state
        state["steps_log"] = []
        state["validation_errors"] = []
        state["retried"] = False
        
        # We run the graph in an executor to avoid blocking the event loop
        # (Since LangChain/LangGraph nodes are currently synchronous)
        loop = asyncio.get_event_loop()
        try:
            # We can step through the graph to yield progress
            for output in self.generate_graph.stream(state):
                # The output is a dict with node name as key and state update as value
                for node_name, updated_state in output.items():
                    # Update our in-memory session with the new state
                    self.sessions[session_id] = updated_state
                    
                    # Yield any new step logs
                    for log in updated_state.get("steps_log", []):
                        yield {"event": "step", "data": log}
                    
                    # Clear logs so we don't re-yield them
                    updated_state["steps_log"] = []
                    
                    yield {"event": "node_complete", "data": node_name}
                    
            yield {"event": "complete", "data": self.sessions[session_id].get("questions", [])}
            
        except Exception as e:
            logger.error(f"[Session] Generate error: {e}")
            yield {"event": "error", "data": str(e)}

    async def run_refine(self, session_id: str, message: str) -> AsyncGenerator[dict, None]:
        """Runs the REFINE graph with the teacher's new message."""
        state = self.sessions.get(session_id)
        if not state:
            yield {"event": "error", "data": "Session not found"}
            return

        # Add teacher's message to chat history
        state["messages"].append({
            "role": "teacher",
            "content": message,
            "timestamp": time.time()
        })
        
        # Reset transient state
        state["steps_log"] = []
        state["validation_errors"] = []
        state["retried"] = False
        
        yield {"event": "start", "data": "Processing refinement request"}
        
        loop = asyncio.get_event_loop()
        try:
            for output in self.refine_graph.stream(state):
                for node_name, updated_state in output.items():
                    self.sessions[session_id] = updated_state
                    
                    for log in updated_state.get("steps_log", []):
                        yield {"event": "step", "data": log}
                    
                    updated_state["steps_log"] = []
                    yield {"event": "node_complete", "data": node_name}
                    
            # Add agent's response to chat history
            self.sessions[session_id]["messages"].append({
                "role": "agent",
                "content": "Draft updated.",
                "timestamp": time.time()
            })
                    
            yield {"event": "complete", "data": self.sessions[session_id].get("questions", [])}
            
        except Exception as e:
            logger.error(f"[Session] Refine error: {e}")
            yield {"event": "error", "data": str(e)}

# Singleton instance
session_manager = SessionManager()
