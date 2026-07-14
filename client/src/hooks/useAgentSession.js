import { useState, useCallback, useRef } from 'react';
import { apiClient as axiosInstance, API_BASE_URL } from '../services/api';
import { toast } from 'react-toastify';

export const useAgentSession = () => {
    const [sessionId, setSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [steps, setSteps] = useState([]);
    const [draft, setDraft] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Store EventSource so we can close it if needed
    const eventSourceRef = useRef(null);
    // Guard against double session creation (React StrictMode)
    const sessionStartedRef = useRef(false);

    const _getToken = () => {
        return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || '';
    };

    const _closeStream = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
    }, []);

    const _handleStream = useCallback((url) => {
        return new Promise((resolve, reject) => {
            _closeStream();
            setIsGenerating(true);
            
            // Using native EventSource with credentials
            const es = new EventSource(url, { withCredentials: true });
            eventSourceRef.current = es;

            es.addEventListener('start', (e) => {
                setSteps([{ type: 'info', message: e.data, id: Date.now() }]);
            });

            es.addEventListener('step', (e) => {
                try {
                    const stepData = JSON.parse(e.data);
                    setSteps(prev => [...prev, { ...stepData, id: Date.now() }]);
                } catch (err) {
                    setSteps(prev => [...prev, { type: 'info', message: e.data, id: Date.now() }]);
                }
            });

            es.addEventListener('node_complete', (e) => {
                // Internal graph node completed
            });

            es.addEventListener('complete', (e) => {
                try {
                    const newDraft = JSON.parse(e.data);
                    const questionsArray = Array.isArray(newDraft) ? newDraft : (newDraft.questions || []);
                    setDraft(questionsArray);
                    setIsGenerating(false);
                    _closeStream();
                    resolve(questionsArray);
                } catch (err) {
                    setIsGenerating(false);
                    _closeStream();
                    reject(err);
                }
            });

            es.addEventListener('error', (e) => {
                console.error("SSE Error:", e);
                setIsGenerating(false);
                _closeStream();
                reject(new Error("Stream connection failed"));
            });
        });
    }, [_closeStream]);

    const startSession = async (classroomId, config) => {
        // Guard against double invocation (React StrictMode)
        if (sessionStartedRef.current) return;
        sessionStartedRef.current = true;

        try {
            setSteps([]);
            setDraft(null);
            setMessages([]);
            
            const res = await axiosInstance.post('/api/v1/agent/sessions', {
                classroomId,
                config
            });
            
            const newSessionId = res.data.data.sessionId;
            setSessionId(newSessionId);
            
            // Start listening to the stream
            const token = _getToken();
            const streamUrl = `${API_BASE_URL}/api/v1/agent/sessions/${newSessionId}/generate/stream?token=${token}`;
            await _handleStream(streamUrl);
            
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to start agent session');
            setIsGenerating(false);
            sessionStartedRef.current = false; // Allow retry on error
        }
    };

    const sendMessage = async (content) => {
        if (!sessionId) return;
        
        try {
            // Optimistically add to UI
            setMessages(prev => [...prev, { role: 'teacher', content, timestamp: Date.now() }]);
            setIsGenerating(true);

            // Use EventSource for refinement stream (same approach as generate)
            const token = _getToken();
            
            // First, send the message via POST
            await axiosInstance.post(`/api/v1/agent/sessions/${sessionId}/message`, { content });

            // The POST response is itself an SSE stream proxied by the Node backend
            // But since we can't use EventSource with POST, we use fetch with ReadableStream
            const res = await fetch(`${API_BASE_URL}/api/v1/agent/sessions/${sessionId}/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ content }),
                credentials: 'include'
            });

            if (!res.ok) throw new Error('Failed to send message');

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let isComplete = false;
            
            while (!isComplete) {
                const { value, done } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                
                // Parse SSE format: "event: <type>\ndata: <json>\n\n"
                const events = buffer.split('\n\n');
                buffer = events.pop() || ''; // Keep incomplete event in buffer
                
                for (const eventBlock of events) {
                    if (!eventBlock.trim()) continue;
                    
                    const lines = eventBlock.split('\n');
                    let eventType = '';
                    let eventData = '';
                    
                    for (const line of lines) {
                        if (line.startsWith('event:')) {
                            eventType = line.slice(6).trim();
                        } else if (line.startsWith('data:')) {
                            eventData = line.slice(5).trim();
                        }
                    }
                    
                    if (!eventData) continue;
                    
                    try {
                        if (eventType === 'step') {
                            const stepData = JSON.parse(eventData);
                            setSteps(prev => [...prev, { ...stepData, id: Date.now() }]);
                        } else if (eventType === 'complete') {
                            const parsed = JSON.parse(eventData);
                            const questionsArray = Array.isArray(parsed) ? parsed : (parsed.questions || []);
                            setDraft(questionsArray);
                            isComplete = true;
                        } else if (eventType === 'error') {
                            console.error('Agent error:', eventData);
                            toast.error(`Agent error: ${eventData}`);
                            isComplete = true;
                        }
                    } catch (e) {
                        // Partial JSON parse, skip
                    }
                }
            }
            setIsGenerating(false);
            
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || 'Failed to send message');
            setIsGenerating(false);
        }
    };

    const fetchSessionState = async (id = sessionId) => {
        if (!id) return;
        try {
            const res = await axiosInstance.get(`/api/v1/agent/sessions/${id}`);
            const fetchedDraft = res.data.draft;
            if (Array.isArray(fetchedDraft)) {
                setDraft(fetchedDraft);
            }
            setMessages(res.data.messages || []);
        } catch (error) {
            console.error("Failed to fetch session state", error);
        }
    };

    const saveDraft = async () => {
        if (!sessionId) return null;
        try {
            const res = await axiosInstance.post(`/api/v1/agent/sessions/${sessionId}/save`);
            toast.success('Draft saved as a new Exam successfully!');
            return res.data.data;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save draft');
            return null;
        }
    };

    // Reset function for cleanup
    const resetSession = useCallback(() => {
        _closeStream();
        sessionStartedRef.current = false;
        setSessionId(null);
        setMessages([]);
        setSteps([]);
        setDraft(null);
        setIsGenerating(false);
    }, [_closeStream]);

    return {
        sessionId,
        messages,
        steps,
        draft,
        isGenerating,
        startSession,
        sendMessage,
        saveDraft,
        resetSession,
    };
};
