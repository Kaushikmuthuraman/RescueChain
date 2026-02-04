/**
 * DDMA Area-Wise Complaints Component
 * Displays complaints grouped by area/location
 */

import React, { useState, useEffect } from 'react';
import { getComplaintsByArea, getComplaintsForArea } from '../../services/api/ddmaApi';
import SeededBadge from '../common/SeededBadge';
import SeverityIndicator from '../common/SeverityIndicator';
import { DDMANoComplaints, DDMASelectArea } from '../common/EmptyState';
import './AreaWiseComplaints.css';

const AreaWiseComplaints = ({ onComplaintSelect }) => {
    const [areas, setAreas] = useState([]);
    const [selectedArea, setSelectedArea] = useState(null);
    const [areaComplaints, setAreaComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingComplaints, setLoadingComplaints] = useState(false);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchAreas();
    }, [statusFilter]);

    useEffect(() => {
        if (selectedArea) {
            fetchComplaintsForArea(selectedArea);
        }
    }, [selectedArea]);

    const fetchAreas = async () => {
        try {
            setLoading(true);
            setError('');
            const filters = statusFilter ? { status: statusFilter } : {};
            const data = await getComplaintsByArea(filters);
            setAreas(data);
        } catch (err) {
            setError(err.message || 'Failed to load area-wise complaints');
        } finally {
            setLoading(false);
        }
    };

    const fetchComplaintsForArea = async (location) => {
        try {
            setLoadingComplaints(true);
            setError('');
            const filters = statusFilter ? { status: statusFilter } : {};
            const data = await getComplaintsForArea(location, filters);
            setAreaComplaints(data.complaints || []);
        } catch (err) {
            setError(err.message || 'Failed to load complaints for area');
        } finally {
            setLoadingComplaints(false);
        }
    };

    const handleAreaSelect = (location) => {
        if (selectedArea === location) {
            setSelectedArea(null);
            setAreaComplaints([]);
        } else {
            setSelectedArea(location);
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

    const getTotalComplaints = (area) => {
        return Object.values(area.statusBreakdown || {}).reduce((sum, count) => sum + count, 0);
    };

    if (loading) {
        return (
            <div className="area-wise-complaints-loading">
                <div className="loading-spinner"></div>
                <p>Loading area-wise complaints...</p>
            </div>
        );
    }

    if (error && !selectedArea) {
        return (
            <div className="area-wise-complaints-error">
                <p>{error}</p>
                <button onClick={fetchAreas} className="btn btn-primary">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="area-wise-complaints">
            <div className="area-wise-header">
                <h2>Area-Wise Complaints</h2>
                <div className="header-actions">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">All Statuses</option>
                        <option value="submitted">Submitted</option>
                        <option value="accepted">Accepted</option>
                        <option value="arriving">Arriving</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="fake_information">Fake Information</option>
                    </select>
                    <button onClick={fetchAreas} className="btn-refresh">
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {error && selectedArea && (
                <div className="error-message">
                    <p>{error}</p>
                </div>
            )}

            {/* Areas List */}
            <div className="areas-container">
                <div className="areas-list">
                    <h3>Areas ({areas.length})</h3>
                    {areas.length === 0 ? (
                        <div className="no-areas">
                            <p>No areas found with complaints</p>
                        </div>
                    ) : (
                        <div className="areas-grid">
                            {areas.map((area, index) => (
                                <div
                                    key={index}
                                    className={`area-card ${selectedArea === area.location ? 'selected' : ''}`}
                                    onClick={() => handleAreaSelect(area.location)}
                                >
                                    <div className="area-card-header">
                                        <h4 className="area-name">📍 {area.location}</h4>
                                        <span className="area-count">{getTotalComplaints(area)} complaints</span>
                                    </div>
                                    <div className="area-status-breakdown">
                                        <div className="status-item">
                                            <span className="status-label">Submitted:</span>
                                            <span className="status-count">{area.statusBreakdown.submitted || 0}</span>
                                        </div>
                                        <div className="status-item">
                                            <span className="status-label">Active:</span>
                                            <span className="status-count">
                                                {(area.statusBreakdown.accepted || 0) + 
                                                 (area.statusBreakdown.arriving || 0) + 
                                                 (area.statusBreakdown.inProgress || 0)}
                                            </span>
                                        </div>
                                        <div className="status-item">
                                            <span className="status-label">Resolved:</span>
                                            <span className="status-count">{area.statusBreakdown.resolved || 0}</span>
                                        </div>
                                        {area.statusBreakdown.fakeInformation > 0 && (
                                            <div className="status-item">
                                                <span className="status-label fake">Fake:</span>
                                                <span className="status-count">{area.statusBreakdown.fakeInformation}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Complaints for Selected Area */}
                {selectedArea && (
                    <div className="area-complaints-list">
                        <div className="area-complaints-header">
                            <h3>Complaints for: {selectedArea}</h3>
                            <button
                                onClick={() => {
                                    setSelectedArea(null);
                                    setAreaComplaints([]);
                                }}
                                className="btn-close"
                            >
                                ✕ Close
                            </button>
                        </div>

                        {loadingComplaints ? (
                            <div className="loading-complaints">
                                <div className="loading-spinner"></div>
                                <p>Loading complaints...</p>
                            </div>
                        ) : areaComplaints.length === 0 ? (
                            <div className="no-complaints">
                                <p>No complaints found for this area</p>
                            </div>
                        ) : (
                            <div className="complaints-list">
                                {areaComplaints.map((complaint) => (
                                    <div
                                        key={complaint.id}
                                        className={`complaint-card ${complaint.assignedTo === null ? 'unassigned' : ''}`}
                                        onClick={() => onComplaintSelect && onComplaintSelect(complaint.id)}
                                    >
                                        <div className="complaint-card-header">
                                            <span className={`status-badge ${getStatusBadgeClass(complaint.status)}`}>
                                                {getStatusLabel(complaint.status)}
                                            </span>
                                            <SeededBadge isSeeded={complaint.isSeeded} />
                                            {complaint.assignedTo === null && (
                                                <span className="unassigned-badge">⚠️ Unassigned</span>
                                            )}
                                        </div>
                                        <div className="complaint-card-body">
                                            <p className="complaint-text">
                                                {complaint.complaintText.length > 200
                                                    ? `${complaint.complaintText.substring(0, 200)}...`
                                                    : complaint.complaintText}
                                            </p>
                                            {complaint.victim && (
                                                <p className="victim-info">
                                                    👤 {complaint.victim.name} ({complaint.victim.phoneNumber})
                                                </p>
                                            )}
                                            {complaint.assignedToName && (
                                                <p className="assigned-info">
                                                    🏢 Assigned to: {complaint.assignedToName}
                                                </p>
                                            )}
                                        </div>
                                        <div className="complaint-card-footer">
                                            <span className="complaint-date">
                                                {new Date(complaint.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AreaWiseComplaints;
