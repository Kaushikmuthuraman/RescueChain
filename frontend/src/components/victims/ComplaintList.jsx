/**
 * Complaint List Component
 * Displays all complaints for the logged-in victim
 */

import React, { useState, useEffect } from 'react';
import { getComplaints } from '../../services/api/victimApi';
import SeededBadge from '../common/SeededBadge';
import './ComplaintList.css';

const ComplaintList = ({ onComplaintSelect }) => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const data = await getComplaints();
            setComplaints(data);
        } catch (err) {
            setError(err.message || 'Failed to load complaints');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadgeClass = (status) => {
        const statusMap = {
            'submitted': 'status-submitted',
            'accepted': 'status-accepted',
            'arriving': 'status-arriving',
            'in_progress': 'status-in-progress',
            'resolved': 'status-resolved',
            'fake_information': 'status-fake'
        };
        return statusMap[status] || 'status-default';
    };

    const getStatusLabel = (status) => {
        const labelMap = {
            'submitted': 'Submitted',
            'accepted': 'Accepted',
            'arriving': 'Arriving',
            'in_progress': 'In Progress',
            'resolved': 'Resolved',
            'fake_information': 'Fake Information'
        };
        return labelMap[status] || status;
    };

    const getUrgencyBadgeClass = (urgency) => {
        const urgencyMap = {
            'low': 'urgency-low',
            'medium': 'urgency-medium',
            'high': 'urgency-high',
            'critical': 'urgency-critical'
        };
        return urgencyMap[urgency] || 'urgency-medium';
    };

    if (loading) {
        return (
            <div className="complaint-list-loading">
                <div className="loading-spinner"></div>
                <p>Loading complaints...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="complaint-list-error">
                <p>{error}</p>
                <button onClick={fetchComplaints} className="btn btn-primary">
                    Retry
                </button>
            </div>
        );
    }

    if (complaints.length === 0) {
        return (
            <div className="complaint-list-empty">
                <div className="empty-icon">📝</div>
                <h3>No Complaints Yet</h3>
                <p>You haven't created any complaints. Create your first complaint to get help.</p>
            </div>
        );
    }

    return (
        <div className="complaint-list">
            <div className="complaint-list-header">
                <h2>My Complaints</h2>
                <button onClick={fetchComplaints} className="btn-refresh">
                    🔄 Refresh
                </button>
            </div>

            <div className="complaints-grid">
                {complaints.map((complaint) => (
                    <div
                        key={complaint.id}
                        className="complaint-card"
                        onClick={() => onComplaintSelect && onComplaintSelect(complaint.id)}
                    >
                        <div className="complaint-card-header">
                            <span className={`status-badge ${getStatusBadgeClass(complaint.status)}`}>
                                {getStatusLabel(complaint.status)}
                            </span>
                            <span className={`urgency-badge ${getUrgencyBadgeClass(complaint.urgency_level)}`}>
                                {complaint.urgency_level}
                            </span>
                            <SeededBadge isSeeded={complaint.is_seeded || complaint.isSeeded} />
                        </div>

                        <div className="complaint-card-body">
                            <p className="complaint-location">
                                📍 {complaint.location}
                            </p>
                            <p className="complaint-text">
                                {complaint.complaint_text.length > 150
                                    ? `${complaint.complaint_text.substring(0, 150)}...`
                                    : complaint.complaint_text}
                            </p>
                        </div>

                        <div className="complaint-card-footer">
                            <span className="complaint-date">
                                Created: {new Date(complaint.created_at).toLocaleDateString()}
                            </span>
                            {complaint.resolved_at && (
                                <span className="complaint-resolved">
                                    Resolved: {new Date(complaint.resolved_at).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ComplaintList;
