/**
 * MessageThread - In-app messaging between NGO and DDMA
 */

import React, { useState, useEffect, useRef } from 'react';
import { getConversation, sendMessage } from '../../services/api/messagesApi';
import './MessageThread.css';

export default function MessageThread({
    otherUserId,
    otherUserName,
    onClose,
    userType,
}) {
    const [messages, setMessages] = useState([]);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const listRef = useRef(null);

    useEffect(() => {
        if (!otherUserId) return;
        setLoading(true);
        getConversation(otherUserId)
            .then((res) => {
                setMessages(res.data?.messages || []);
            })
            .catch((err) => {
                console.error('Failed to load conversation:', err);
                setMessages([]);
            })
            .finally(() => setLoading(false));
    }, [otherUserId]);

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        const text = content.trim();
        if (!text || sending) return;

        setSending(true);
        try {
            const res = await sendMessage({ recipientId: otherUserId, content: text });
            const msg = res.data?.message;
            if (msg) {
                setMessages((prev) => [...prev, { ...msg, isOwn: true }]);
                setContent('');
            }
        } catch (err) {
            console.error('Send failed:', err);
            alert(err.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    if (!otherUserId) return null;

    return (
        <div className="message-thread">
            <div className="message-thread-header">
                <span className="message-thread-title">Chat with {otherUserName || 'User'}</span>
                {onClose && (
                    <button type="button" className="message-thread-close" onClick={onClose}>
                        ×
                    </button>
                )}
            </div>
            <div className="message-thread-list" ref={listRef}>
                {loading ? (
                    <div className="message-thread-loading">Loading...</div>
                ) : messages.length === 0 ? (
                    <div className="message-thread-empty">No messages yet. Start the conversation!</div>
                ) : (
                    messages.map((m) => (
                        <div
                            key={m.id}
                            className={`message-bubble ${m.isOwn ? 'own' : 'other'}`}
                        >
                            {!m.isOwn && m.senderName && (
                                <div className="message-sender">{m.senderName}</div>
                            )}
                            <div className="message-content">{m.content}</div>
                            <div className="message-time">
                                {m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : ''}
                            </div>
                        </div>
                    ))
                )}
            </div>
            <form className="message-thread-form" onSubmit={handleSend}>
                <input
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type a message..."
                    disabled={sending}
                    className="message-input"
                />
                <button type="submit" disabled={sending || !content.trim()} className="message-send-btn">
                    Send
                </button>
            </form>
        </div>
    );
}
