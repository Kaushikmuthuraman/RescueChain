/**
 * NGO Complaint List Component
 * Displays assigned and unassigned complaints for NGO
 */

import React, { useState, useEffect } from 'react';
import { getComplaints } from '../../services/api/ngoApi';
import SeededBadge from '../common/SeededBadge';
import SeverityIndicator from '../common/SeverityIndicator';
import { NGONoAssignments, NoResults } from '../common/EmptyState';
import './ComplaintList.css';

const ComplaintList = ({ onComplaintSelect }) => {
    const [complaints, setComplaints] = useState([]);
    const [filteredComplaints, setFilteredComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); // 'all', 'assigned', 'unassigned', 'submitted', 'accepted', etc.

    useEffect(() => {
        fetchComplaints();
    }, []);

    useEffect(() => {
        filterComplaints();
    }, [complaints, filter]);

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

    const filterComplaints = () => {
        let filtered = [...complaints];
        
        if (filter === 'assigned') {
            filtered = filtered.filter(c => c.assigned_to !== null);
        } else if (filter === 'unassigned') {
            filtered = filtered.filter(c => c.assigned_to === null);
        } else if (filter !== 'all') {
            filtered = filtered.filter(c => c.status === filter);
        }
        
        setFilteredComplaints(filtered);
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
            <div className="ngo-complaint-list-loading">
                <div className="loading-spinner"></div>
                <p>Loading complaints...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="ngo-complaint-list-error">
                <p>{error}</p>
                <button onClick={fetchComplaints} className="btn btn-primary">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="ngo-complaint-list">
            <div className="complaint-list-header">
                <h2>Complaints</h2>
                <button onClick={fetchComplaints} className="btn-refresh">
                    🔄 Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="complaint-filters">
                <button
                    onClick={() => setFilter('all')}
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                >
                    All ({complaints.length})
                </button>
                <button
                    onClick={() => setFilter('assigned')}
                    className={`filter-btn ${filter === 'assigned' ? 'active' : ''}`}
                >
                    Assigned ({complaints.filter(c => c.assigned_to !== null).length})
                </button>
                <button
                    onClick={() => setFilter('unassigned')}
                    className={`filter-btn ${filter === 'unassigned' ? 'active' : ''}`}
                >
                    Unassigned ({complaints.filter(c => c.assigned_to === null).length})
                </button>
                <button
                    onClick={() => setFilter('submitted')}
                    className={`filter-btn ${filter === 'submitted' ? 'active' : ''}`}
                >
                    Submitted ({complaints.filter(c => c.status === 'submitted').length})
                </button>
                <button
                    onClick={() => setFilter('accepted')}
                    className={`filter-btn ${filter === 'accepted' ? 'active' : ''}`}
                >
                    Accepted ({complaints.filter(c => c.status === 'accepted').length})
                </button>
                <button
                    onClick={() => setFilter('in_progress')}
                    className={`filter-btn ${filter === 'in_progress' ? 'active' : ''}`}
                >
                    In Progress ({complaints.filter(c => c.status === 'in_progress').length})
                </button>
            </div>

            {/* Complaints Grid */}
            {filteredComplaints.length === 0 ? (
                filter === 'all' && complaints.length === 0 ? (
                    <NGONoAssignments />
                ) : (
                    <NoResults />
                )
            ) : (
                <div className="complaints-grid">
                    {filteredComplaints.map((complaint) => (
                        <div
                            key={complaint.id}
                            className={`complaint-card ${complaint.assigned_to === null ? 'unassigned' : ''}`}
                            onClick={() => onComplaintSelect && onComplaintSelect(complaint.id)}
                        >
                            <div className="complaint-card-header">
                                <span className={`status-badge ${getStatusBadgeClass(complaint.status)}`}>
                                    {getStatusLabel(complaint.status)}
                                </span>
                                <SeverityIndicator 
                                    level={complaint.urgency_level} 
                                    size="small"
                                    pulse={complaint.urgency_level === 'critical'}
                                />
                                <SeededBadge isSeeded={complaint.is_seeded || complaint.isSeeded} />
                            </div>

                            {complaint.assigned_to === null && (
                                <div className="unassigned-badge">
                                    ⚠️ Unassigned
                                </div>
                            )}

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
            )}
        </div>
    );
};

export default ComplaintList;
