"""
LangGraph StateGraph for initial Exam Generation.
"""

from langgraph.graph import StateGraph, END
from agent.state import AgentState
from agent.nodes.retrieve import retrieve_node
from agent.nodes.generate import generate_node
from agent.nodes.format_output import format_node

def should_retry(state: AgentState):
    """Conditional edge: Retry once if validation fails."""
    if state.get("validation_errors") and not state.get("retried"):
        state["retried"] = True
        return "retry"
    return "end"

def build_generate_graph():
    """Builds the GENERATE subgraph."""
    graph = StateGraph(AgentState)
    
    graph.add_node("retrieve_context", retrieve_node)
    graph.add_node("generate_exam", generate_node)
    graph.add_node("format_output", format_node)
    
    graph.set_entry_point("retrieve_context")
    graph.add_edge("retrieve_context", "generate_exam")
    graph.add_edge("generate_exam", "format_output")
    
    graph.add_conditional_edges(
        "format_output",
        should_retry,
        {"retry": "generate_exam", "end": END}
    )
    
    return graph.compile()
