/**
 * SDMA Portal – Dashboard
 * Summary cards (total / active / critical complaints), complaints table.
 * SDMA-only access (user_type === 'sdma').
 */

import React, { useState, useEffect, useCallback } from 'react';
import OrganizationLogin from '../../components/auth/OrganizationLogin';
import { getCurrentUser, getComplaintsList } from '../../services/api/sdmaApi';
import { getHomepageStats } from '../../services/api/homepageApi';
import KPIDashboard from '../../components/common/KPIDashboard';
import SeverityIndicator from '../../components/common/SeverityIndicator';
import RescueMap from '../../components/common/RescueMap';
import NotificationBell from '../../components/common/NotificationBell';
import { SDMANoComplaints } from '../../components/common/EmptyState';
import {
    getComplaintHeatmap,
    getNGOPerformanceTrends,
    getResponseTimeDistribution,
    getHighRiskZones
} from '../../services/api/statsApi';
import { getSystemHealth, getRecentIssues } from '../../services/api/systemApi';
import './SDMAPortal.css';

const SDMAPortal = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, active: 0, critical: 0 });
    const [complaints, setComplaints] = useState([]);
    const [dataLoading, setDataLoading] = useState(false);
    const [dataError, setDataError] = useState(null);
    const [analytics, setAnalytics] = useState({
        heatmap: [],
        ngoTrends: [],
        responseDistribution: [],
        highRiskZones: []
    });
    const [systemStatus, setSystemStatus] = useState({
        health: null,
        issues: []
    });
    const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'map' | 'system'
    const [selectedComplaintId, setSelectedComplaintId] = useState(null);

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (isAuthenticated && user?.userType === 'sdma') {
            fetchDashboardData();
        }
    }, [isAuthenticated, user?.userType]);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');
            if (token && userData) {
                try {
                    const currentUser = await getCurrentUser();
                    if (currentUser.userType !== 'sdma') {
                        handleLogout();
                        return;
                    }
                    setIsAuthenticated(true);
                    setUser(currentUser);
                } catch {
                    handleLogout();
                }
            }
        } catch (err) {
            console.error('Auth check error:', err);
            handleLogout();
        } finally {
            setLoading(false);
        }
    };

    const fetchDashboardData = async () => {
        setDataLoading(true);
        setDataError(null);
        try {
            const [
                statsData,
                complaintsList,
                heatmap,
                ngoTrends,
                responseDistribution,
                highRiskZones,
                systemHealth,
                systemIssues
            ] = await Promise.all([
                getHomepageStats(),
                getComplaintsList({ limit: 200 }),
                getComplaintHeatmap({ days: 30, limit: 50 }),
                getNGOPerformanceTrends({ groupBy: 'day' }),
                getResponseTimeDistribution({ days: 30 }),
                getHighRiskZones({ days: 30, limit: 10, minTotal: 3 }),
                getSystemHealth(),
                getRecentIssues({ limit: 25 })
            ]);

            const complaintsStats = statsData?.complaints || {};
            const total = complaintsStats.total ?? 0;
            const active = complaintsStats.active ?? 0;
            const list = complaintsList || [];
            const critical = list.filter((c) => (c.urgency_level || c.urgencyLevel) === 'critical').length;

            setStats({ total, active, critical });
            setComplaints(list);
            setAnalytics({
                heatmap: heatmap || [],
                ngoTrends: ngoTrends || [],
                responseDistribution: responseDistribution || [],
                highRiskZones: highRiskZones || []
            });
            setSystemStatus({
                health: systemHealth || null,
                issues: systemIssues?.issues || systemIssues?.data?.issues || []
            });
        } catch (err) {
            setDataError(err.message || 'Failed to load dashboard data');
            setStats({ total: 0, active: 0, critical: 0 });
            setComplaints([]);
            setAnalytics({
                heatmap: [],
                ngoTrends: [],
                responseDistribution: [],
                highRiskZones: []
            });
            setSystemStatus({
                health: null,
                issues: []
            });
        } finally {
            setDataLoading(false);
        }
    };

    const handleLoginSuccess = (userData) => {
        if (userData.userType !== 'sdma') {
            alert('This portal is for SDMA only. Please use the correct portal.');
            handleLogout();
            return;
        }
        setIsAuthenticated(true);
        setUser(userData);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
        setStats({ total: 0, active: 0, critical: 0 });
        setComplaints([]);
    };

    const getAssignedOrg = (c) => {
        const id = c.assigned_to ?? c.assignedTo;
        return id ? 'Assigned' : '—';
    };

    if (loading) {
        return (
            <div className="sdma-portal">
                <div className="sdma-portal-loading">
                    <div className="sdma-spinner" />
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="sdma-portal">
                <div className="sdma-portal-container">
                    <OrganizationLogin onLoginSuccess={handleLoginSuccess} />
                </div>
            </div>
        );
    }

    return (
        <div className="sdma-portal">
            <div className="sdma-portal-container">
                <header className="sdma-portal-header">
                    <div className="sdma-header-content">
                        <div className="sdma-header-left">
                            <h1 className="sdma-portal-title">SDMA Dashboard</h1>
                            <p className="sdma-portal-subtitle">State Disaster Management Authority</p>
                        </div>
                        <div className="sdma-header-actions">
                            <NotificationBell
                                onComplaintClick={(id) => {
                                    setSelectedComplaintId(id);
                                    setCurrentView('map');
                                }}
                            />
                            <a href="/" className="sdma-link-home">Home</a>
                            <span className="sdma-user-info">
                                {user?.name || 'SDMA'} ({user?.userType?.toUpperCase() || 'SDMA'})
                            </span>
                            <button type="button" onClick={handleLogout} className="sdma-btn-logout">
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                <nav className="sdma-portal-nav">
                    <button
                        type="button"
                        onClick={() => setCurrentView('dashboard')}
                        className={`sdma-nav-tab ${currentView === 'dashboard' ? 'active' : ''}`}
                    >
                        Dashboard
                    </button>
                    <button
                        type="button"
                        onClick={() => setCurrentView('map')}
                        className={`sdma-nav-tab ${currentView === 'map' ? 'active' : ''}`}
                    >
                        Map
                    </button>
                    <button
                        type="button"
                        onClick={() => setCurrentView('system')}
                        className={`sdma-nav-tab ${currentView === 'system' ? 'active' : ''}`}
                    >
                        System Status
                    </button>
                </nav>

                <main className="sdma-portal-main">
                    {dataError && (
                        <div className="sdma-data-error">
                            {dataError}
                            <button type="button" onClick={fetchDashboardData}>Retry</button>
                        </div>
                    )}

                    {dataLoading && currentView === 'dashboard' && (
                        <div className="sdma-data-loading">
                            <div className="sdma-spinner" />
                            <p>Loading dashboard data...</p>
                        </div>
                    )}

                    {currentView === 'map' && (
                        <section className="sdma-map-section">
                            <RescueMap
                                userType="sdma"
                                height="500px"
                                selectedComplaintId={selectedComplaintId}
                                onComplaintSelect={(id) => setSelectedComplaintId(id)}
                                showLayerControl={true}
                            />
                        </section>
                    )}

                    {!dataLoading && !dataError && currentView === 'dashboard' && (
                        <>
                            {/* KPI Dashboard */}
                            <section className="sdma-kpi-section">
                                <KPIDashboard
                                    token={localStorage.getItem('token')}
                                    variant="full"
                                    showSeverity={true}
                                    refreshInterval={30000}
                                />
                            </section>

                            {/* Advanced analytics for SDMA */}
                            <section className="sdma-analytics-grid">
                                {/* Complaint density heatmap by region */}
                                <div className="sdma-analytics-card">
                                    <h2 className="sdma-analytics-title">Complaint Density by Region</h2>
                                    {analytics.heatmap.length === 0 ? (
                                        <p className="sdma-analytics-empty">No complaint data available for the selected window.</p>
                                    ) : (
                                        <div className="sdma-heatmap-table-wrap">
                                            <table className="sdma-heatmap-table">
                                                <thead>
                                                    <tr>
                                                        <th>Region</th>
                                                        <th>Total</th>
                                                        <th>High / Critical</th>
                                                        <th>Active</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {analytics.heatmap.map((row) => {
                                                        const intensity =
                                                            row.totalComplaints > 50
                                                                ? 'high'
                                                                : row.totalComplaints > 20
                                                                    ? 'medium'
                                                                    : 'low';
                                                        return (
                                                            <tr
                                                                key={row.region}
                                                                className={`sdma-heatmap-row sdma-heatmap-row--${intensity}`}
                                                            >
                                                                <td>{row.region}</td>
                                                                <td>{row.totalComplaints}</td>
                                                                <td>{row.highUrgencyComplaints}</td>
                                                                <td>{row.activeComplaints}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* NGO performance trends */}
                                <div className="sdma-analytics-card">
                                    <h2 className="sdma-analytics-title">NGO Performance Trends (Resolved Cases)</h2>
                                    {analytics.ngoTrends.length === 0 ? (
                                        <p className="sdma-analytics-empty">No NGO resolution data in the selected window.</p>
                                    ) : (
                                        <div className="sdma-ngo-trends">
                                            {analytics.ngoTrends.slice(0, 5).map((item) => (
                                                <div key={`${item.ngoId}-${item.period}`} className="sdma-ngo-trend-row">
                                                    <div className="sdma-ngo-trend-header">
                                                        <span className="sdma-ngo-trend-name">{item.organizationName}</span>
                                                        <span className="sdma-ngo-trend-period">
                                                            {new Date(item.period).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="sdma-ngo-trend-metrics">
                                                        <div className="sdma-ngo-trend-bar-wrap">
                                                            <div
                                                                className="sdma-ngo-trend-bar"
                                                                style={{ width: `${Math.min(item.resolvedCount * 10, 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className="sdma-ngo-trend-value">
                                                            {item.resolvedCount} resolved, avg {item.avgResolutionHours?.toFixed(1) ?? 'N/A'}h
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Response-time distribution */}
                                <div className="sdma-analytics-card">
                                    <h2 className="sdma-analytics-title">Response-Time Distribution</h2>
                                    {analytics.responseDistribution.length === 0 ? (
                                        <p className="sdma-analytics-empty">No resolved complaints in the selected window.</p>
                                    ) : (
                                        <div className="sdma-response-distribution">
                                            {analytics.responseDistribution.map((bucket) => {
                                                const maxCount = Math.max(
                                                    ...analytics.responseDistribution.map((b) => b.count || 0),
                                                    1
                                                );
                                                const widthPercent = (bucket.count / maxCount) * 100;
                                                return (
                                                    <div key={bucket.bucket} className="sdma-response-row">
                                                        <span className="sdma-response-label">{bucket.bucket}</span>
                                                        <div className="sdma-response-bar-wrap">
                                                            <div
                                                                className="sdma-response-bar"
                                                                style={{ width: `${widthPercent}%` }}
                                                            />
                                                        </div>
                                                        <span className="sdma-response-count">{bucket.count}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* High-risk zones */}
                                <div className="sdma-analytics-card">
                                    <h2 className="sdma-analytics-title">High-Risk Zones (Last 30 Days)</h2>
                                    {analytics.highRiskZones.length === 0 ? (
                                        <p className="sdma-analytics-empty">No high-risk zones identified for the selected window.</p>
                                    ) : (
                                        <div className="sdma-high-risk-list">
                                            {analytics.highRiskZones.map((zone) => (
                                                <div key={zone.region} className="sdma-high-risk-item">
                                                    <div className="sdma-high-risk-header">
                                                        <span className="sdma-high-risk-region">{zone.region}</span>
                                                        <span className="sdma-high-risk-badge">
                                                            {zone.highUrgencyComplaints} high / critical
                                                        </span>
                                                    </div>
                                                    <div className="sdma-high-risk-meta">
                                                        <span>{zone.totalComplaints} total complaints</span>
                                                        <span>{zone.activeComplaints} active</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section className="sdma-table-section">
                                <div className="sdma-table-header">
                                    <h2 className="sdma-table-title">All Complaints</h2>
                                    <span className="sdma-table-count">{complaints.length} total</span>
                                </div>
                                <div className="sdma-table-wrap">
                                    <table className="sdma-table">
                                        <thead>
                                            <tr>
                                                <th>Complaint ID</th>
                                                <th>Location</th>
                                                <th>Severity</th>
                                                <th>Status</th>
                                                <th>Assigned</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {complaints.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="sdma-table-empty">
                                                        <SDMANoComplaints />
                                                    </td>
                                                </tr>
                                            ) : (
                                                complaints.map((c) => (
                                                    <tr key={c.id} className={`sdma-row-${c.urgency_level || c.urgencyLevel || 'medium'}`}>
                                                        <td className="sdma-cell-id">{String(c.id).slice(0, 8)}...</td>
                                                        <td>{c.location || '—'}</td>
                                                        <td>
                                                            <SeverityIndicator 
                                                                level={c.urgency_level || c.urgencyLevel} 
                                                                size="small"
                                                                pulse={(c.urgency_level || c.urgencyLevel) === 'critical'}
                                                            />
                                                        </td>
                                                        <td>
                                                            <span className={`sdma-status-badge sdma-status-${c.status}`}>
                                                                {c.status || '—'}
                                                            </span>
                                                        </td>
                                                        <td>{getAssignedOrg(c)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </>
                    )}

                    {/* System status panel (admin-only view for SDMA) */}
                    {!dataLoading && !dataError && currentView === 'system' && (
                        <section className="sdma-system-section">
                            <div className="sdma-system-grid">
                                <div className="sdma-system-card">
                                    <h2 className="sdma-system-title">Overall Health</h2>
                                    {!systemStatus.health ? (
                                        <p className="sdma-analytics-empty">
                                            Health information is not available. Try refreshing the dashboard.
                                        </p>
                                    ) : (
                                        <div className="sdma-system-health">
                                            <div
                                                className={`sdma-system-health-pill sdma-system-health-pill--${
                                                    systemStatus.health.status === 'healthy' ? 'ok' : 'warn'
                                                }`}
                                            >
                                                {systemStatus.health.status === 'healthy' ? 'Healthy' : 'Degraded'}
                                            </div>
                                            <ul className="sdma-system-checks">
                                                <li>
                                                    <span>PostgreSQL</span>
                                                    <span className={systemStatus.health.checks.postgres.healthy ? 'ok' : 'warn'}>
                                                        {systemStatus.health.checks.postgres.healthy ? 'OK' : 'Unavailable'}
                                                        {systemStatus.health.checks.postgres.latencyMs != null &&
                                                            ` (${systemStatus.health.checks.postgres.latencyMs} ms)`}
                                                    </span>
                                                </li>
                                                <li>
                                                    <span>MongoDB</span>
                                                    <span className={systemStatus.health.checks.mongo.healthy ? 'ok' : 'warn'}>
                                                        {systemStatus.health.checks.mongo.healthy ? 'OK' : 'Unavailable'}
                                                    </span>
                                                </li>
                                            </ul>
                                            <div className="sdma-system-meta">
                                                <span>Last check: {new Date(systemStatus.health.timestamp).toLocaleString()}</span>
                                                <span>Latency: {systemStatus.health.latencyMs} ms</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="sdma-system-card">
                                    <h2 className="sdma-system-title">Recent Blockchain / IPFS Issues</h2>
                                    {systemStatus.issues.length === 0 ? (
                                        <p className="sdma-analytics-empty">
                                            No recent blockchain or audit logging issues detected.
                                        </p>
                                    ) : (
                                        <div className="sdma-system-issues">
                                            {systemStatus.issues.map((issue) => (
                                                <div key={issue.id} className="sdma-system-issue-row">
                                                    <div className="sdma-system-issue-header">
                                                        <span className="sdma-system-issue-entity">
                                                            {issue.entityType} #{String(issue.entityId).slice(0, 8)}...
                                                        </span>
                                                        <span
                                                            className={`sdma-system-issue-badge sdma-system-issue-badge--${
                                                                issue.status === 'failed' ? 'error' : 'muted'
                                                            }`}
                                                        >
                                                            {issue.status}
                                                        </span>
                                                    </div>
                                                    <div className="sdma-system-issue-meta">
                                                        <span>Action: {issue.action}</span>
                                                        {issue.attempts != null && (
                                                            <span>Attempts: {issue.attempts}</span>
                                                        )}
                                                    </div>
                                                    {issue.error && (
                                                        <div className="sdma-system-issue-error">
                                                            {issue.error}
                                                        </div>
                                                    )}
                                                    <div className="sdma-system-issue-time">
                                                        {new Date(issue.createdAt).toLocaleString()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
};

export default SDMAPortal;
