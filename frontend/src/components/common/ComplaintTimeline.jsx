/**
 * Complaint Timeline Component
 * Stepper-style visualization showing complaint status progression
 */

import React, { useState, useEffect } from 'react';
import './ComplaintTimeline.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Define the standard status flow
const STATUS_FLOW = [
    { key: 'submitted', label: 'Submitted', icon: '📝' },
    { key: 'accepted', label: 'Accepted', icon: '✓' },
    { key: 'arriving', label: 'Arriving', icon: '🚗' },
    { key: 'in_progress', label: 'In Progress', icon: '🔧' },
    { key: 'resolved', label: 'Resolved', icon: '✅' }
];

// Terminal/error states
const TERMINAL_STATES = {
    fake_information: { label: 'Marked as Fake', icon: '⚠️', variant: 'error' }
};

const ComplaintTimeline = ({ 
    complaintId, 
    token,
    currentStatus,
    createdAt,
    timeline: providedTimeline, // Optional: pass timeline data directly
    variant = 'vertical', // 'vertical', 'horizontal', 'compact'
    showActors = true,
    onStepClick
}) => {
    const [timeline, setTimeline] = useState(providedTimeline || []);
    const [loading, setLoading] = useState(!providedTimeline);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (providedTimeline) {
            setTimeline(providedTimeline);
            setLoading(false);
            return;
        }

        if (!complaintId || !token) return;

        const fetchTimeline = async () => {
            try {
                const response = await fetch(`${API_BASE}/complaints/${complaintId}/timeline`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                const data = await response.json();

                if (data.success) {
                    setTimeline(data.data.timeline || []);
                } else {
                    setError(data.message);
                }
            } catch (err) {
                setError('Failed to load timeline');
                console.error('Timeline fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTimeline();
    }, [complaintId, token, providedTimeline]);

    // Build status map from timeline
    const statusMap = {};
    timeline.forEach(entry => {
        if (entry.newStatus) {
            statusMap[entry.newStatus] = entry;
        }
    });

    // Check if complaint reached a terminal error state
    const isTerminalError = currentStatus === 'fake_information';
    const terminalInfo = TERMINAL_STATES[currentStatus];

    // Get current step index
    const currentStepIndex = STATUS_FLOW.findIndex(s => s.key === currentStatus);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStepStatus = (step, index) => {
        if (isTerminalError && index > 0) {
            // After terminal error, show the step where error happened
            const errorEntry = timeline.find(t => t.newStatus === 'fake_information');
            if (errorEntry && errorEntry.oldStatus === step.key) {
                return 'error-point';
            }
        }

        if (statusMap[step.key]) return 'completed';
        if (step.key === currentStatus) return 'current';
        if (index < currentStepIndex) return 'completed';
        return 'pending';
    };

    if (loading) {
        return (
            <div className={`complaint-timeline complaint-timeline--${variant} complaint-timeline--loading`}>
                <div className="complaint-timeline__skeleton">
                    {STATUS_FLOW.map((_, i) => (
                        <div key={i} className="complaint-timeline__skeleton-step" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="complaint-timeline complaint-timeline--error">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className={`complaint-timeline complaint-timeline--${variant}`}>
            <div className="complaint-timeline__steps">
                {STATUS_FLOW.map((step, index) => {
                    const stepStatus = getStepStatus(step, index);
                    const timelineEntry = statusMap[step.key];
                    const isClickable = onStepClick && timelineEntry;

                    return (
                        <div 
                            key={step.key}
                            className={`complaint-timeline__step complaint-timeline__step--${stepStatus}`}
                            onClick={() => isClickable && onStepClick(step.key, timelineEntry)}
                        >
                            {/* Connector line */}
                            {index > 0 && (
                                <div className={`complaint-timeline__connector complaint-timeline__connector--${stepStatus}`} />
                            )}
                            
                            {/* Step marker */}
                            <div className="complaint-timeline__marker">
                                <span className="complaint-timeline__icon">
                                    {stepStatus === 'completed' ? '✓' : step.icon}
                                </span>
                            </div>
                            
                            {/* Step content */}
                            <div className="complaint-timeline__content">
                                <div className="complaint-timeline__label">{step.label}</div>
                                
                                {timelineEntry && variant !== 'compact' && (
                                    <div className="complaint-timeline__details">
                                        <span className="complaint-timeline__time">
                                            {formatDate(timelineEntry.createdAt)}
                                        </span>
                                        {showActors && timelineEntry.changedByName && (
                                            <span className="complaint-timeline__actor">
                                                by {timelineEntry.changedByName}
                                                {timelineEntry.changedByType && (
                                                    <span className="complaint-timeline__actor-type">
                                                        ({timelineEntry.changedByType})
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                    </div>
                                )}
                                
                                {step.key === 'submitted' && !timelineEntry && createdAt && variant !== 'compact' && (
                                    <div className="complaint-timeline__details">
                                        <span className="complaint-timeline__time">
                                            {formatDate(createdAt)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Terminal error state */}
                {isTerminalError && terminalInfo && (
                    <div className="complaint-timeline__step complaint-timeline__step--error">
                        <div className="complaint-timeline__connector complaint-timeline__connector--error" />
                        <div className="complaint-timeline__marker complaint-timeline__marker--error">
                            <span className="complaint-timeline__icon">{terminalInfo.icon}</span>
                        </div>
                        <div className="complaint-timeline__content">
                            <div className="complaint-timeline__label">{terminalInfo.label}</div>
                            {statusMap['fake_information'] && variant !== 'compact' && (
                                <div className="complaint-timeline__details">
                                    <span className="complaint-timeline__time">
                                        {formatDate(statusMap['fake_information'].createdAt)}
                                    </span>
                                    {showActors && statusMap['fake_information'].changedByName && (
                                        <span className="complaint-timeline__actor">
                                            by {statusMap['fake_information'].changedByName}
                                        </span>
                                    )}
                                    {statusMap['fake_information'].notes && (
                                        <span className="complaint-timeline__notes">
                                            {statusMap['fake_information'].notes}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Compact inline timeline for list views
 */
export const CompactTimeline = ({ currentStatus, createdAt }) => (
    <ComplaintTimeline 
        currentStatus={currentStatus}
        createdAt={createdAt}
        variant="compact"
        showActors={false}
    />
);

export default ComplaintTimeline;
