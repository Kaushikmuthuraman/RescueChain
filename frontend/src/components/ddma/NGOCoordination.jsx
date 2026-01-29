/**
 * DDMA NGO Coordination Component
 * Lists NGOs and allows assigning complaints to them
 */

import React, { useState, useEffect } from 'react';
import { getNGOs, assignComplaint } from '../../services/api/ddmaApi';
import './NGOCoordination.css';

const NGOCoordination = ({ selectedComplaintId, onAssignmentSuccess }) => {
    const [ngos, setNGOs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [assigning, setAssigning] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchNGOs();
    }, []);

    const fetchNGOs = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getNGOs();
            setNGOs(data);
        } catch (err) {
            setError(err.message || 'Failed to load NGOs');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignComplaint = async (ngoId, ngoName) => {
        if (!selectedComplaintId) {
            alert('Please select a complaint first');
            return;
        }

        if (!confirm(`Assign complaint to ${ngoName}?`)) {
            return;
        }

        try {
            setAssigning(ngoId);
            setError('');
            await assignComplaint(selectedComplaintId, ngoId);
            if (onAssignmentSuccess) {
                onAssignmentSuccess();
            }
            alert(`Complaint assigned to ${ngoName} successfully!`);
        } catch (err) {
            setError(err.message || 'Failed to assign complaint');
            alert(`Error: ${err.message || 'Failed to assign complaint'}`);
        } finally {
            setAssigning(null);
        }
    };

    const filteredNGOs = ngos.filter(ngo =>
        ngo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ngo.registrationNumber && ngo.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (ngo.address && ngo.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="ngo-coordination-loading">
                <div className="loading-spinner"></div>
                <p>Loading NGOs...</p>
            </div>
        );
    }

    if (error && ngos.length === 0) {
        return (
            <div className="ngo-coordination-error">
                <p>{error}</p>
                <button onClick={fetchNGOs} className="btn btn-primary">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="ngo-coordination">
            <div className="ngo-coordination-header">
                <h2>NGO Coordination</h2>
                <div className="header-actions">
                    <input
                        type="text"
                        placeholder="Search NGOs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <button onClick={fetchNGOs} className="btn-refresh">
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {!selectedComplaintId && (
                <div className="info-message">
                    <p>ℹ️ Select a complaint to assign it to an NGO</p>
                </div>
            )}

            {error && (
                <div className="error-message">
                    <p>{error}</p>
                </div>
            )}

            <div className="ngos-container">
                <div className="ngos-stats">
                    <div className="stat-item">
                        <span className="stat-label">Total NGOs:</span>
                        <span className="stat-value">{ngos.length}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Active NGOs:</span>
                        <span className="stat-value">
                            {ngos.filter(n => n.isActive).length}
                        </span>
                    </div>
                </div>

                {filteredNGOs.length === 0 ? (
                    <div className="no-ngos">
                        <p>No NGOs found matching your search</p>
                    </div>
                ) : (
                    <div className="ngos-grid">
                        {filteredNGOs.map((ngo) => (
                            <div
                                key={ngo.id}
                                className={`ngo-card ${!ngo.isActive ? 'inactive' : ''}`}
                            >
                                <div className="ngo-card-header">
                                    <h4 className="ngo-name">🏢 {ngo.name}</h4>
                                    {!ngo.isActive && (
                                        <span className="inactive-badge">Inactive</span>
                                    )}
                                </div>

                                <div className="ngo-card-body">
                                    {ngo.registrationNumber && (
                                        <div className="ngo-info-item">
                                            <span className="info-label">Registration:</span>
                                            <span className="info-value">{ngo.registrationNumber}</span>
                                        </div>
                                    )}
                                    {ngo.address && (
                                        <div className="ngo-info-item">
                                            <span className="info-label">Address:</span>
                                            <span className="info-value">{ngo.address}</span>
                                        </div>
                                    )}
                                    {ngo.contactPerson && (
                                        <div className="ngo-info-item">
                                            <span className="info-label">Contact:</span>
                                            <span className="info-value">{ngo.contactPerson}</span>
                                        </div>
                                    )}
                                    {ngo.email && (
                                        <div className="ngo-info-item">
                                            <span className="info-label">Email:</span>
                                            <span className="info-value">{ngo.email}</span>
                                        </div>
                                    )}
                                    {ngo.phoneNumber && (
                                        <div className="ngo-info-item">
                                            <span className="info-label">Phone:</span>
                                            <span className="info-value">{ngo.phoneNumber}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="ngo-card-footer">
                                    <div className="ngo-stats">
                                        <div className="ngo-stat-item">
                                            <span className="stat-label">Total Assigned:</span>
                                            <span className="stat-value">{ngo.assignedComplaintsCount}</span>
                                        </div>
                                        <div className="ngo-stat-item">
                                            <span className="stat-label">Active:</span>
                                            <span className="stat-value">{ngo.activeComplaintsCount}</span>
                                        </div>
                                    </div>

                                    {ngo.isActive && (
                                        <button
                                            onClick={() => handleAssignComplaint(ngo.id, ngo.name)}
                                            disabled={!selectedComplaintId || assigning === ngo.id}
                                            className={`btn-assign ${!selectedComplaintId ? 'disabled' : ''}`}
                                        >
                                            {assigning === ngo.id ? 'Assigning...' : 'Assign Complaint'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NGOCoordination;
