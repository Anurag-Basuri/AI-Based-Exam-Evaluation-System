"""
LangGraph StateGraph for Exam Refinement.
"""

from langgraph.graph import StateGraph, END
from agent.state import AgentState
from agent.nodes.parse_intent import parse_intent_node
from agent.nodes.apply_changes import apply_changes_node
from agent.nodes.format_output import format_node

MAX_RETRIES = 3

def should_retry(state: AgentState):
    """Conditional edge: Retry if validation fails, up to MAX_RETRIES times."""
    retry_count = state.get("retry_count", 0)
    
    if state.get("validation_errors") and retry_count < MAX_RETRIES:
        return "retry"
    return "end"

def build_refine_graph():
    """Builds the REFINE subgraph."""
    graph = StateGraph(AgentState)
    
    graph.add_node("parse_intent", parse_intent_node)
    graph.add_node("apply_changes", apply_changes_node)
    graph.add_node("format_output", format_node)
    
    graph.set_entry_point("parse_intent")
    graph.add_edge("parse_intent", "apply_changes")
    graph.add_edge("apply_changes", "format_output")
    
    graph.add_conditional_edges(
        "format_output",
        should_retry,
        {"retry": "apply_changes", "end": END}
    )
    
    return graph.compile()
