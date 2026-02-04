/**
 * Blockchain Audit Component
 * Displays blockchain transaction details with location information
 */

import React, { useState, useEffect } from 'react';
import { getComplaintAuditLogs } from '../../services/api/blockchainApi';
import './BlockchainAudit.css';

const BlockchainAudit = ({ complaintId }) => {
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (complaintId) {
            fetchAuditLogs();
        }
    }, [complaintId]);

    const fetchAuditLogs = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getComplaintAuditLogs(complaintId);
            setAuditLogs(data.auditLogs || []);
        } catch (err) {
            console.error('Failed to load audit logs:', err);
            setError('Failed to load blockchain audit logs');
            // Don't show error to user - just log it
        } finally {
            setLoading(false);
        }
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

    const getActorRoleLabel = (role) => {
        const roleMap = {
            'victim': 'Victim',
            'ngo': 'NGO',
            'ddma': 'DDMA',
            'sdma': 'SDMA'
        };
        return roleMap[role] || role;
    };

    const getPolygonscanUrl = (txHash) => {
        if (!txHash) return null;
        // Polygon Mumbai testnet: https://mumbai.polygonscan.com
        // Polygon Mainnet: https://polygonscan.com
        const network = import.meta.env.VITE_POLYGON_NETWORK || 'mumbai';
        const baseUrl = network === 'mainnet' 
            ? 'https://polygonscan.com/tx'
            : 'https://mumbai.polygonscan.com/tx';
        return `${baseUrl}/${txHash}`;
    };

    const hasLocation = (log) => {
        return log.latitude && log.longitude;
    };

    const getMapUrl = (latitude, longitude) => {
        // Using OpenStreetMap (no API key required)
        // Alternative: Google Maps embed requires API key
        return `https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(longitude) - 0.01},${parseFloat(latitude) - 0.01},${parseFloat(longitude) + 0.01},${parseFloat(latitude) + 0.01}&layer=mapnik&marker=${latitude},${longitude}`;
    };

    if (loading) {
        return (
            <div className="blockchain-audit-loading">
                <p>Loading blockchain audit logs...</p>
            </div>
        );
    }

    if (auditLogs.length === 0) {
        return (
            <div className="blockchain-audit-empty">
                <p>No blockchain audit logs available</p>
            </div>
        );
    }

    return (
        <div className="blockchain-audit">
            <h3>Blockchain Transaction History</h3>
            <div className="audit-logs-list">
                {auditLogs.map((log, index) => (
                    <div key={index} className="audit-log-item">
                        <div className="audit-log-header">
                            <span className="audit-log-title">
                                Transaction #{auditLogs.length - index}
                            </span>
                            <span className="audit-log-date">
                                {formatDate(log.createdAt)}
                            </span>
                        </div>

                        {log.txHash && (
                            <div className="audit-log-field">
                                <span className="field-icon">🔗</span>
                                <span className="field-label">Transaction Hash:</span>
                                <a
                                    href={getPolygonscanUrl(log.txHash)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="tx-hash-link"
                                >
                                    {log.txHash.slice(0, 10)}...{log.txHash.slice(-8)}
                                </a>
                            </div>
                        )}

                        {log.blockNumber && (
                            <div className="audit-log-field">
                                <span className="field-icon">📦</span>
                                <span className="field-label">Block Number:</span>
                                <span className="field-value">{log.blockNumber}</span>
                            </div>
                        )}

                        {log.actorRole && (
                            <div className="audit-log-field">
                                <span className="field-icon">🧑</span>
                                <span className="field-label">Actor Role:</span>
                                <span className="field-value">{getActorRoleLabel(log.actorRole)}</span>
                            </div>
                        )}

                        {hasLocation(log) && (
                            <div className="audit-log-location">
                                <div className="location-header">
                                    <span className="field-icon">📍</span>
                                    <span className="location-title">Transaction recorded from:</span>
                                </div>
                                
                                {log.locationText && (
                                    <div className="location-text">
                                        {log.locationText}
                                    </div>
                                )}

                                <div className="location-coordinates">
                                    <span className="field-icon">🌐</span>
                                    <span className="coordinates-text">
                                        {log.latitude}, {log.longitude}
                                    </span>
                                </div>

                                {/* Map Preview */}
                                <div className="location-map">
                                    <iframe
                                        width="100%"
                                        height="200"
                                        frameBorder="0"
                                        scrolling="no"
                                        marginHeight="0"
                                        marginWidth="0"
                                        src={getMapUrl(log.latitude, log.longitude)}
                                        title={`Map for ${log.latitude}, ${log.longitude}`}
                                    />
                                    <div className="map-footer">
                                        <a
                                            href={`https://www.openstreetmap.org/?mlat=${log.latitude}&mlon=${log.longitude}&zoom=15`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="map-link"
                                        >
                                            View larger map
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!hasLocation(log) && (
                            <div className="audit-log-no-location">
                                <span className="field-icon">📍</span>
                                <span className="no-location-text">Location not available</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BlockchainAudit;
