/**
 * Complaint Detail Component
 * Shows complaint details with status timeline
 */

import React, { useState, useEffect } from 'react';
import { getComplaint, getComplaintTimeline, getComplaintPhotos } from '../../services/api/victimApi';
import SeededBadge from '../common/SeededBadge';
import './ComplaintDetail.css';

const ComplaintDetail = ({ complaintId, onBack }) => {
    const [complaint, setComplaint] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (complaintId) {
            fetchComplaintDetails();
        }
    }, [complaintId]);

    const fetchComplaintDetails = async () => {
        try {
            setLoading(true);
            setError('');

            const [complaintData, timelineData, photosData] = await Promise.all([
                getComplaint(complaintId),
                getComplaintTimeline(complaintId),
                getComplaintPhotos(complaintId).catch(() => []) // Photos might not exist
            ]);

            setComplaint(complaintData);
            setTimeline(timelineData.timeline || []);
            setPhotos(photosData || []);
        } catch (err) {
            setError(err.message || 'Failed to load complaint details');
        } finally {
            setLoading(false);
        }
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

    const getStatusIcon = (status) => {
        const iconMap = {
            'submitted': '📝',
            'accepted': '✅',
            'arriving': '🚗',
            'in_progress': '🔄',
            'resolved': '✓',
            'fake_information': '⚠️'
        };
        return iconMap[status] || '•';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="complaint-detail-loading">
                <div className="loading-spinner"></div>
                <p>Loading complaint details...</p>
            </div>
        );
    }

    if (error || !complaint) {
        return (
            <div className="complaint-detail-error">
                <p>{error || 'Complaint not found'}</p>
                <button onClick={onBack} className="btn btn-primary">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="complaint-detail">
            <div className="complaint-detail-header">
                <button onClick={onBack} className="btn-back">
                    ← Back to List
                </button>
                <h2>Complaint Details</h2>
            </div>

            <div className="complaint-detail-content">
                {/* Complaint Info */}
                <div className="complaint-info-card">
                    <div className="complaint-info-header">
                        <span className={`status-badge status-${complaint.status}`}>
                            {getStatusLabel(complaint.status)}
                        </span>
                        <span className={`urgency-badge urgency-${complaint.urgency_level}`}>
                            {complaint.urgency_level}
                        </span>
                        <SeededBadge isSeeded={complaint.is_seeded || complaint.isSeeded} />
                    </div>

                    <div className="complaint-info-body">
                        <div className="info-section">
                            <label>Description</label>
                            <p>{complaint.complaint_text}</p>
                        </div>

                        <div className="info-section">
                            <label>Location</label>
                            <p>📍 {complaint.location}</p>
                            {complaint.latitude && complaint.longitude && (
                                <p className="coordinates">
                                    GPS: {complaint.latitude}, {complaint.longitude}
                                </p>
                            )}
                        </div>

                        <div className="info-grid">
                            <div className="info-item">
                                <label>Created</label>
                                <p>{formatDate(complaint.created_at)}</p>
                            </div>
                            {complaint.resolved_at && (
                                <div className="info-item">
                                    <label>Resolved</label>
                                    <p>{formatDate(complaint.resolved_at)}</p>
                                </div>
                            )}
                            <div className="info-item">
                                <label>Last Updated</label>
                                <p>{formatDate(complaint.updated_at)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Timeline */}
                <div className="timeline-card">
                    <h3>Status Timeline</h3>
                    {timeline.length > 0 ? (
                        <div className="timeline">
                            {timeline.map((item, index) => (
                                <div key={item.id} className="timeline-item">
                                    <div className="timeline-marker">
                                        <span className="timeline-icon">
                                            {getStatusIcon(item.newStatus)}
                                        </span>
                                    </div>
                                    <div className="timeline-content">
                                        <div className="timeline-header">
                                            <span className="timeline-status">
                                                {item.oldStatus
                                                    ? `${getStatusLabel(item.oldStatus)} → ${getStatusLabel(item.newStatus)}`
                                                    : `Status: ${getStatusLabel(item.newStatus)}`}
                                            </span>
                                            <span className="timeline-date">
                                                {formatDate(item.createdAt)}
                                            </span>
                                        </div>
                                        {item.changedByName && (
                                            <div className="timeline-user">
                                                Changed by: {item.changedByName}
                                                {item.changedByType && (
                                                    <span className="user-type"> ({item.changedByType})</span>
                                                )}
                                            </div>
                                        )}
                                        {item.notes && (
                                            <div className="timeline-notes">
                                                {item.notes}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="timeline-empty">
                            <p>No status history available</p>
                        </div>
                    )}
                </div>

                {/* Photos */}
                {photos.length > 0 && (
                    <div className="photos-card">
                        <h3>Photo Evidence</h3>
                        <div className="photos-grid">
                            {photos.map((photo) => (
                                <div key={photo.id} className="photo-item">
                                    <img
                                        src={photo.photo_url || photo.ipfs_cid}
                                        alt={`Photo evidence - ${photo.complaint_status}`}
                                        onError={(e) => {
                                            e.target.src = '/placeholder-image.png';
                                        }}
                                    />
                                    <div className="photo-info">
                                        <span className="photo-status">
                                            Status: {getStatusLabel(photo.complaint_status)}
                                        </span>
                                        <span className="photo-date">
                                            {formatDate(photo.uploaded_at)}
                                        </span>
                                        {photo.uploaded_by_name && (
                                            <span className="photo-uploader">
                                                By: {photo.uploaded_by_name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComplaintDetail;
