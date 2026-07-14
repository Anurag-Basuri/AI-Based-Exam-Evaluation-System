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
                    const questionsArray = newDraft.questions || newDraft;
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
            const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
            const streamUrl = `${API_BASE_URL}/api/v1/agent/sessions/${newSessionId}/generate/stream?token=${token}`;
            await _handleStream(streamUrl);
            
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to start agent session');
            setIsGenerating(false);
        }
    };

    const sendMessage = async (content) => {
        if (!sessionId) return;
        
        try {
            // Optimistically add to UI
            setMessages(prev => [...prev, { role: 'teacher', content, timestamp: Date.now() }]);
            
            setIsGenerating(true);
            const res = await fetch(`${API_BASE_URL}/api/v1/agent/sessions/${sessionId}/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}` // assuming token is here, or handle credentials
                },
                body: JSON.stringify({ content }),
                credentials: 'include'
            });

            if (!res.ok) throw new Error('Failed to send message');

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let isComplete = false;
            
            while (!isComplete) {
                const { value, done } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data:')) {
                        const dataStr = line.replace('data:', '').trim();
                        if (!dataStr) continue;
                        
                        try {
                            const eventData = JSON.parse(dataStr);
                            if (eventData.event === 'step') {
                                setSteps(prev => [...prev, { ...eventData.data, id: Date.now() }]);
                            } else if (eventData.event === 'complete') {
                                setDraft(eventData.data.questions);
                                isComplete = true;
                            }
                        } catch (e) {
                            // ignore partial parses
                        }
                    }
                }
            }
            setIsGenerating(false);
            
            // Fetch updated messages (to get agent response)
            fetchSessionState(sessionId);
            
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send message');
            setIsGenerating(false);
        }
    };

    const fetchSessionState = async (id = sessionId) => {
        if (!id) return;
        try {
            const res = await axiosInstance.get(`/api/v1/agent/sessions/${id}`);
            setDraft(res.data.draft);
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

    return {
        sessionId,
        messages,
        steps,
        draft,
        isGenerating,
        startSession,
        sendMessage,
        saveDraft
    };
};
