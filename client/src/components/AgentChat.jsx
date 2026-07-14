import React, { useState, useEffect, useRef } from 'react';
import { useAgentSession } from '../hooks/useAgentSession';
import './AgentChat.css';
import { 
    FiSend, 
    FiCpu, 
    FiCheckCircle, 
    FiAlertCircle, 
    FiInfo,
    FiSearch,
    FiEdit3,
    FiSave,
    FiFileText
} from 'react-icons/fi';

const AgentChat = ({ classroomId, config, onExamCreated }) => {
    const { 
        sessionId, 
        messages, 
        steps, 
        draft, 
        isGenerating, 
        startSession, 
        sendMessage, 
        saveDraft 
    } = useAgentSession();

    const [inputMsg, setInputMsg] = useState('');
    const stepsEndRef = useRef(null);
    const hasStartedRef = useRef(false);

    // Auto-start session on mount (guarded against double-invoke)
    useEffect(() => {
        if (!hasStartedRef.current && !sessionId && classroomId && config) {
            hasStartedRef.current = true;
            startSession(classroomId, config);
        }
    }, [classroomId, config]);

    // Auto-scroll steps
    useEffect(() => {
        stepsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [steps, messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (inputMsg.trim() && !isGenerating) {
            sendMessage(inputMsg);
            setInputMsg('');
        }
    };

    const handleSave = async () => {
        const newExam = await saveDraft();
        if (newExam && onExamCreated) {
            onExamCreated(newExam);
        }
    };

    const renderStepIcon = (type) => {
        switch(type) {
            case 'retrieval': return <FiSearch className="agent-step-icon text-purple-500" />;
            case 'generation': return <FiCpu className="agent-step-icon text-blue-500" />;
            case 'error': return <FiAlertCircle className="agent-step-icon text-red-500" />;
            default: return <FiInfo className="agent-step-icon text-green-500" />;
        }
    };

    return (
        <div className="agent-chat-container">
            {/* Header */}
            <div className="agent-chat-header">
                <h3>
                    <FiCpu /> AI Agent Assistant
                </h3>
                <span className={`agent-status-badge ${isGenerating ? 'generating' : ''}`}>
                    {isGenerating ? 'Agent is thinking...' : 'Idle'}
                </span>
            </div>

            <div className="agent-main-content">
                {/* Left Sidebar: Agent Steps & Chat History */}
                <div className="agent-sidebar">
                    <div className="agent-steps-container">
                        {messages.map((msg, idx) => (
                            <div key={`msg-${idx}`} className={`agent-step ${msg.role === 'teacher' ? 'info' : 'generation'}`}>
                                <strong>{msg.role === 'teacher' ? 'You' : 'Agent'}:</strong> {msg.content}
                            </div>
                        ))}
                        
                        {steps.map(step => (
                            <div key={step.id} className={`agent-step ${step.type}`}>
                                {renderStepIcon(step.type)}
                                {step.message}
                            </div>
                        ))}
                        <div ref={stepsEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="agent-chat-footer">
                        <form onSubmit={handleSend} className="agent-chat-input-wrapper">
                            <input
                                type="text"
                                className="agent-chat-input"
                                placeholder="E.g., 'Make question 3 harder' or 'Add 2 more MCQs'"
                                value={inputMsg}
                                onChange={(e) => setInputMsg(e.target.value)}
                                disabled={isGenerating || !draft}
                            />
                            <button 
                                type="submit" 
                                className="agent-chat-send-btn"
                                disabled={isGenerating || !draft || !inputMsg.trim()}
                            >
                                <FiSend />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Area: Draft Preview */}
                <div className="agent-draft-container">
                    <div className="agent-draft-header">
                        <h4>Draft Exam Preview</h4>
                        <button 
                            className="agent-btn-save flex items-center gap-2"
                            onClick={handleSave}
                            disabled={!draft || isGenerating}
                        >
                            <FiSave /> Save as Exam
                        </button>
                    </div>
                    
                    <div className="agent-draft-content">
                        {!draft || !Array.isArray(draft) || draft.length === 0 ? (
                            <div className="draft-empty-state">
                                <FiFileText />
                                <p>{isGenerating ? 'Agent is generating the initial draft...' : 'No questions generated yet.'}</p>
                                <p className="text-sm mt-2">{isGenerating ? 'This may take 10-30 seconds depending on the context size.' : ''}</p>
                            </div>
                        ) : (
                            draft.map((q, idx) => (
                                <div key={idx} className="draft-question">
                                    <div className="draft-question-header">
                                        <span className="font-semibold text-gray-600">Question {idx + 1}</span>
                                        <div className="flex gap-2">
                                            <span className="draft-question-badge">{q.type}</span>
                                            <span className="draft-question-badge">{q.max_marks || q.marks || '?'} Marks</span>
                                            <span className="draft-question-badge">{q.difficulty || 'medium'}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="draft-question-text">
                                        {q.text || q.question || 'No text'}
                                    </div>
                                    
                                    {q.type === 'multiple-choice' && Array.isArray(q.options) && (
                                        <ul className="draft-options-list">
                                            {q.options.map((opt, oIdx) => (
                                                <li key={oIdx} className={`draft-option ${(opt.isCorrect || opt.correct) ? 'correct' : ''}`}>
                                                    {(opt.isCorrect || opt.correct) && <FiCheckCircle className="inline mr-2" />}
                                                    {opt.text || opt.option || String(opt)}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    
                                    {q.type === 'subjective' && q.answer && (
                                        <div className="draft-subjective-answer">
                                            <strong>Model Answer: </strong>
                                            {q.answer}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentChat;
