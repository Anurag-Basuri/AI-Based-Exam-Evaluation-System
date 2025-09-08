import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const rawMessages = [
    {
        from: 'Amit',
        avatar: 'https://i.pravatar.cc/40?img=10',
        text: 'The AI evaluation system is mind-blowing!',
        emoji: '🚀',
        side: 'left',
    },
    {
        from: 'You',
        avatar: 'https://i.pravatar.cc/40?img=2',
        text: 'We worked really hard on it',
        emoji: '😊',
        side: 'right',
    },
    {
        from: 'Priya',
        avatar: 'https://i.pravatar.cc/40?img=12',
        text: 'Loved the clean UI and smooth animations',
        emoji: '💖',
        side: 'left',
    },
    {
        from: 'Ravi',
        avatar: 'https://i.pravatar.cc/40?img=3',
        text: 'My whole class is using AiEXAM now!',
        emoji: '✅',
        side: 'left',
    },
    {
        from: 'You',
        avatar: 'https://i.pravatar.cc/40?img=2',
        text: 'That makes me so happy to hear!',
        emoji: '🥹',
        side: 'right',
    },
    {
        from: 'Zoya',
        avatar: 'https://i.pravatar.cc/40?img=7',
        text: 'It feels like real-time teacher feedback. Genius idea!',
        emoji: '🧠✨',
        side: 'left',
    },
    {
        from: 'Rahul',
        avatar: 'https://i.pravatar.cc/40?img=5',
        text: 'I even got my parents excited about it!',
        emoji: '🤩',
        side: 'left',
    },
    {
        from: 'You',
        avatar: 'https://i.pravatar.cc/40?img=2',
        text: 'Wow! Can’t thank you all enough',
        emoji: '🙏',
        side: 'right',
    },
];

export default function TestimonialChat() {
    const [messages, setMessages] = useState([]);
    const [typingIndex, setTypingIndex] = useState(0);
    const containerRef = useRef(null);

    useEffect(() => {
        if (typingIndex < rawMessages.length) {
            const timer = setTimeout(() => {
                setMessages((prev) => [...prev, rawMessages[typingIndex]]);
                setTypingIndex((prev) => prev + 1);
            }, 1300);
            return () => clearTimeout(timer);
        } else {
            // After last message, reset smoothly
            const resetTimer = setTimeout(() => {
                setMessages([]);
                setTypingIndex(0);
            }, 3500);
            return () => clearTimeout(resetTimer);
        }
    }, [typingIndex]);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="bg-gray-100 rounded-xl p-6 shadow-md max-w-5xl mx-auto my-10 flex flex-col justify-end">

            <h3 className="text-center text-xl font-semibold text-gray-700 mb-4">
                What people are saying 💬
            </h3>

            <div
                ref={containerRef}
                className="h-96 overflow-hidden pr-1 space-y-3 relative transition-all duration-700"
            >
                <AnimatePresence>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`flex items-end space-x-2 ${msg.side === 'right' ? 'justify-end' : ''
                                }`}
                        >
                            {msg.side === 'left' && (
                                <img src={msg.avatar} alt={msg.from} className="w-8 h-8 rounded-full" />
                            )}

                            <div
                                className={`rounded-xl px-4 py-2 max-w-[70%] text-sm shadow ${msg.side === 'right'
                                        ? 'bg-green-200 text-right'
                                        : 'bg-white text-left'
                                    }`}
                            >
                                <p>
                                    {msg.text} <span>{msg.emoji}</span>
                                </p>
                                <div className="text-xs text-gray-500 mt-1">{msg.from}</div>
                            </div>

                            {msg.side === 'right' && (
                                <img src={msg.avatar} alt={msg.from} className="w-8 h-8 rounded-full" />
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {typingIndex < rawMessages.length && (
                    <div className="flex items-center space-x-1 mt-3">
                        {[0, 1, 2].map((dot) => (
                            <motion.div
                                key={dot}
                                className="w-2 h-2 bg-gray-500 rounded-full"
                                animate={{
                                    y: [0, -5, 0],
                                    opacity: [0.5, 1, 0.5],
                                }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    repeatDelay: 0.1,
                                    delay: dot * 0.2,
                                }}
                            />
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}
