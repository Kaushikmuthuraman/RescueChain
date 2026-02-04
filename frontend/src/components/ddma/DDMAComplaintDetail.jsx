/**
 * DDMA Complaint Detail Component
 * Shows complaint details with status update and mark fake information capability
 */

import React, { useState, useEffect } from 'react';
import { getComplaint, getComplaintTimeline, getComplaintPhotos, updateComplaintStatus } from '../../services/api/ddmaApi';
import StatusUpdateForm from '../ngo/StatusUpdateForm';
import SeededBadge from '../common/SeededBadge';
import BlockchainAudit from '../common/BlockchainAudit';
import ComplaintTimeline from '../common/ComplaintTimeline';
import SeverityIndicator from '../common/SeverityIndicator';
import './DDMAComplaintDetail.css';

const DDMAComplaintDetail = ({ complaintId, onBack, onStatusUpdated }) => {
    const [complaint, setComplaint] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showStatusUpdate, setShowStatusUpdate] = useState(false);

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
                getComplaintPhotos(complaintId).catch(() => [])
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

    const handleStatusUpdated = () => {
        setShowStatusUpdate(false);
        fetchComplaintDetails(); // Refresh data
        if (onStatusUpdated) {
            onStatusUpdated();
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

    const getNextValidStatuses = () => {
        if (!complaint) return [];
        
        const statusFlow = {
            'submitted': ['accepted', 'fake_information'],
            'accepted': ['arriving', 'fake_information'],
            'arriving': ['in_progress', 'fake_information'],
            'in_progress': ['resolved', 'fake_information'],
            'resolved': [],
            'fake_information': []
        };
        
        return statusFlow[complaint.status] || [];
    };

    if (loading) {
        return (
            <div className="ddma-complaint-detail-loading">
                <div className="loading-spinner"></div>
                <p>Loading complaint details...</p>
            </div>
        );
    }

    if (error || !complaint) {
        return (
            <div className="ddma-complaint-detail-error">
                <p>{error || 'Complaint not found'}</p>
                <button onClick={onBack} className="btn btn-primary">
                    Go Back
                </button>
            </div>
        );
    }

    const nextStatuses = getNextValidStatuses();
    const canUpdateStatus = nextStatuses.length > 0;
    const canMarkFake = nextStatuses.includes('fake_information');
    const isFake = complaint.status === 'fake_information';

    return (
        <div className="ddma-complaint-detail">
            <div className="complaint-detail-header">
                <button onClick={onBack} className="btn-back">
                    ← Back
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
                        <SeverityIndicator 
                            level={complaint.urgency_level} 
                            size="medium"
                            pulse={complaint.urgency_level === 'critical'}
                        />
                        <SeededBadge isSeeded={complaint.is_seeded || complaint.isSeeded} />
                        {complaint.assigned_to === null && (
                            <span className="unassigned-badge">
                                Unassigned
                            </span>
                        )}
                        {isFake && (
                            <span className="fake-badge">
                                Marked as Fake Information
                            </span>
                        )}
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

                    {/* Action Buttons */}
                    <div className="action-buttons">
                        {canUpdateStatus && (
                            <button
                                onClick={() => setShowStatusUpdate(true)}
                                className={`btn ${canMarkFake ? 'btn-warning' : 'btn-primary'}`}
                            >
                                {canMarkFake ? '⚠️ Mark as Fake / Update Status' : 'Update Status'}
                            </button>
                        )}
                        {isFake && (
                            <div className="fake-info-warning">
                                <p>⚠️ This complaint has been marked as containing fake information.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Update Form */}
                {showStatusUpdate && canUpdateStatus && (
                    <div className="status-update-section">
                        <StatusUpdateForm
                            complaint={complaint}
                            nextStatuses={nextStatuses}
                            onStatusUpdated={handleStatusUpdated}
                            onCancel={() => setShowStatusUpdate(false)}
                        />
                    </div>
                )}

                {/* Status Timeline */}
                <div className="timeline-card">
                    <h3>Status Timeline</h3>
                    <ComplaintTimeline
                        currentStatus={complaint.status}
                        createdAt={complaint.created_at}
                        timeline={timeline}
                        variant="vertical"
                        showActors={true}
                    />
                </div>

                {/* Photos */}
                {photos.length > 0 && (
                    <div className="photos-card">
                        <h3>Photo Evidence ({photos.length})</h3>
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
                                        {photo.exif_latitude && photo.exif_longitude && (
                                            <span className="photo-gps">
                                                📍 {photo.exif_latitude}, {photo.exif_longitude}
                                            </span>
                                        )}
                                        {photo.exif_timestamp && (
                                            <span className="photo-timestamp">
                                                🕐 {formatDate(photo.exif_timestamp)}
                                            </span>
                                        )}
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

                {/* Blockchain Audit Logs */}
                <BlockchainAudit complaintId={complaintId} />
            </div>
        </div>
    );
};

export default DDMAComplaintDetail;
