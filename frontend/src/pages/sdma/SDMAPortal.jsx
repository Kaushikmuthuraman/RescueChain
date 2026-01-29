/**
 * SDMA Portal – Dashboard
 * Summary cards (total / active / critical complaints), complaints table.
 * SDMA-only access (user_type === 'sdma').
 */

import React, { useState, useEffect } from 'react';
import OrganizationLogin from '../../components/auth/OrganizationLogin';
import { getCurrentUser, getComplaintsList } from '../../services/api/sdmaApi';
import { getHomepageStats } from '../../services/api/homepageApi';
import './SDMAPortal.css';

const SDMAPortal = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, active: 0, critical: 0 });
    const [complaints, setComplaints] = useState([]);
    const [dataLoading, setDataLoading] = useState(false);
    const [dataError, setDataError] = useState(null);

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
            const [statsData, complaintsList] = await Promise.all([
                getHomepageStats(),
                getComplaintsList({ limit: 200 })
            ]);
            const complaintsStats = statsData?.complaints || {};
            const total = complaintsStats.total ?? 0;
            const active = complaintsStats.active ?? 0;
            const list = complaintsList || [];
            const critical = list.filter((c) => (c.urgency_level || c.urgencyLevel) === 'critical').length;
            setStats({ total, active, critical });
            setComplaints(list);
        } catch (err) {
            setDataError(err.message || 'Failed to load dashboard data');
            setStats({ total: 0, active: 0, critical: 0 });
            setComplaints([]);
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

                <main className="sdma-portal-main">
                    {dataError && (
                        <div className="sdma-data-error">
                            {dataError}
                            <button type="button" onClick={fetchDashboardData}>Retry</button>
                        </div>
                    )}

                    {dataLoading && (
                        <div className="sdma-data-loading">
                            <div className="sdma-spinner" />
                            <p>Loading dashboard data...</p>
                        </div>
                    )}

                    {!dataLoading && !dataError && (
                        <>
                            <section className="sdma-cards">
                                <div className="sdma-card">
                                    <div className="sdma-card-label">Total complaints</div>
                                    <div className="sdma-card-value">{stats.total}</div>
                                </div>
                                <div className="sdma-card">
                                    <div className="sdma-card-label">Active complaints</div>
                                    <div className="sdma-card-value">{stats.active}</div>
                                </div>
                                <div className="sdma-card sdma-card-critical">
                                    <div className="sdma-card-label">Critical complaints</div>
                                    <div className="sdma-card-value">{stats.critical}</div>
                                </div>
                            </section>

                            <section className="sdma-table-section">
                                <h2 className="sdma-table-title">Complaints</h2>
                                <div className="sdma-table-wrap">
                                    <table className="sdma-table">
                                        <thead>
                                            <tr>
                                                <th>Complaint ID</th>
                                                <th>Location</th>
                                                <th>Urgency level</th>
                                                <th>Status</th>
                                                <th>Assigned organization</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {complaints.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="sdma-table-empty">
                                                        No complaints found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                complaints.map((c) => (
                                                    <tr key={c.id}>
                                                        <td>{String(c.id).slice(0, 8)}…</td>
                                                        <td>{c.location || '—'}</td>
                                                        <td>{c.urgency_level || c.urgencyLevel || '—'}</td>
                                                        <td>{c.status || '—'}</td>
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
                </main>
            </div>
        </div>
    );
};

export default SDMAPortal;
