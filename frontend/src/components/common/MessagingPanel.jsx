/**
 * MessagingPanel - NGO ↔ DDMA messaging with conversation list
 */

import React, { useState, useEffect } from 'react';
import { getConversations } from '../../services/api/messagesApi';
import MessageThread from './MessageThread';
import './MessagingPanel.css';

export default function MessagingPanel({ userType, initialOtherUserId = null, initialOtherUserName = '' }) {
    const [conversations, setConversations] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(initialOtherUserId);
    const [selectedUserName, setSelectedUserNameState] = useState(initialOtherUserName || '');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (initialOtherUserId) {
            setSelectedUserId(initialOtherUserId);
            setSelectedUserNameState(initialOtherUserName || '');
        }
    }, [initialOtherUserId, initialOtherUserName]);

    useEffect(() => {
        if (userType !== 'ngo' && userType !== 'ddma') return;
        setLoading(true);
        getConversations()
            .then((res) => {
                setConversations(res.data?.conversations || []);
            })
            .catch((err) => {
                console.error('Failed to load conversations:', err);
                setConversations([]);
            })
            .finally(() => setLoading(false));
    }, [userType]);

    const handleSelectConversation = (otherUserId, otherUserName) => {
        setSelectedUserId(otherUserId);
        setSelectedUserNameState(otherUserName || '');
    };

    if (userType !== 'ngo' && userType !== 'ddma') return null;

    return (
        <div className="messaging-panel">
            <div className="messaging-panel-sidebar">
                <div className="messaging-panel-title">Messages</div>
                {loading ? (
                    <div className="messaging-panel-loading">Loading...</div>
                ) : conversations.length === 0 ? (
                    <div className="messaging-panel-empty">No conversations yet</div>
                ) : (
                    <ul className="messaging-conversation-list">
                        {conversations.map((c) => (
                            <li
                                key={c.conversationId}
                                className={`messaging-conv-item ${selectedUserId === c.otherUserId ? 'active' : ''}`}
                                onClick={() => handleSelectConversation(c.otherUserId, c.otherUserName)}
                            >
                                <span className="messaging-conv-name">{c.otherUserName}</span>
                                <span className="messaging-conv-preview">{c.lastMessage}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="messaging-panel-main">
                {selectedUserId ? (
                    <MessageThread
                        otherUserId={selectedUserId}
                        otherUserName={selectedUserName}
                        onClose={() => {
                            setSelectedUserId(null);
                            setSelectedUserNameState('');
                        }}
                        userType={userType}
                    />
                ) : (
                    <div className="messaging-panel-placeholder">
                        Select a conversation or start a new one from NGO Coordination
                    </div>
                )}
            </div>
        </div>
    );
}
