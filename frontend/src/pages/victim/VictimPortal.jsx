/**
 * Victim Portal Main Page
 * Main portal for victims with login, complaint list, and detail views
 */

import React, { useState, useEffect, useCallback } from 'react';
import OTPLogin from '../../components/auth/OTPLogin';
import ComplaintList from '../../components/victims/ComplaintList';
import ComplaintDetail from '../../components/victims/ComplaintDetail';
import ComplaintForm from '../../components/victims/ComplaintForm';
import KPICard from '../../components/common/KPICard';
import RescueMap from '../../components/common/RescueMap';
import NotificationBell from '../../components/common/NotificationBell';
import { VictimNoComplaints } from '../../components/common/EmptyState';
import './VictimPortal.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const VictimPortal = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [currentView, setCurrentView] = useState('list'); // 'list', 'detail', 'create'
    const [selectedComplaintId, setSelectedComplaintId] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [kpis, setKpis] = useState(null);
    const [kpisLoading, setKpisLoading] = useState(true);

    const fetchKPIs = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE}/stats/kpi`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (data.success) {
                setKpis(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch KPIs:', err);
        } finally {
            setKpisLoading(false);
        }
    }, []);

    useEffect(() => {
        // Check if user is already logged in
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setIsAuthenticated(true);
                setUser(parsedUser);
            } catch (err) {
                // Invalid user data, clear and require login
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchKPIs();
        }
    }, [isAuthenticated, fetchKPIs]);

    const handleLoginSuccess = (userData) => {
        setIsAuthenticated(true);
        setUser(userData);
        setCurrentView('list');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
        setCurrentView('list');
        setSelectedComplaintId(null);
        setShowCreateForm(false);
    };

    const handleComplaintSelect = (complaintId) => {
        setSelectedComplaintId(complaintId);
        setCurrentView('detail');
        setShowCreateForm(false);
    };

    const handleBackToList = () => {
        setCurrentView('list');
        setSelectedComplaintId(null);
        setShowCreateForm(false);
    };

    const handleCreateClick = () => {
        setShowCreateForm(true);
        setCurrentView('create');
        setSelectedComplaintId(null);
    };

    const handleComplaintCreated = (complaint) => {
        setShowCreateForm(false);
        setCurrentView('list');
        // Optionally show the newly created complaint
        // setSelectedComplaintId(complaint.id);
        // setCurrentView('detail');
    };

    if (!isAuthenticated) {
        return (
            <div className="victim-portal">
                <div className="victim-portal-container">
                    <OTPLogin onLoginSuccess={handleLoginSuccess} />
                </div>
            </div>
        );
    }

    return (
        <div className="victim-portal">
            <div className="victim-portal-container">
                {/* Header */}
                <header className="victim-portal-header">
                    <div className="header-content">
                        <h1 className="portal-title">Victim Portal</h1>
                        <div className="header-actions">
                            <NotificationBell
                                onComplaintClick={(id) => {
                                    setSelectedComplaintId(id);
                                    setCurrentView('detail');
                                }}
                            />
                            <div className="user-info">
                                <span className="user-phone">📱 {user?.phoneNumber || 'N/A'}</span>
                            </div>
                            <button onClick={handleLogout} className="btn-logout">
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                {/* Navigation */}
                {(currentView === 'list' || currentView === 'map') && !showCreateForm && (
                    <div className="victim-portal-nav">
                        <button
                            onClick={() => { setCurrentView('list'); setSelectedComplaintId(null); }}
                            className={`victim-nav-btn ${currentView === 'list' ? 'active' : ''}`}
                        >
                            My Complaints
                        </button>
                        <button
                            onClick={() => { setCurrentView('map'); setSelectedComplaintId(null); }}
                            className={`victim-nav-btn ${currentView === 'map' ? 'active' : ''}`}
                        >
                            Map
                        </button>
                        <button onClick={handleCreateClick} className="btn-create">
                            + Create New Complaint
                        </button>
                    </div>
                )}

                {/* KPI Summary - show on list and map views */}
                {(currentView === 'list' || currentView === 'map') && !showCreateForm && (
                    <div className="victim-kpi-section">
                        <div className="victim-kpi-grid">
                            <KPICard
                                icon="🔄"
                                value={kpisLoading ? '-' : kpis?.activeRescues || 0}
                                label="Active Complaints"
                                subtitle="Being processed"
                                variant={kpis?.activeRescues > 0 ? 'warning' : 'default'}
                                loading={kpisLoading}
                            />
                            <KPICard
                                icon="⏳"
                                value={kpisLoading ? '-' : kpis?.pendingAssignments || 0}
                                label="Awaiting Assignment"
                                subtitle="Waiting for NGO"
                                variant="default"
                                loading={kpisLoading}
                            />
                            <KPICard
                                icon="✅"
                                value={kpisLoading ? '-' : kpis?.todayResolved || 0}
                                label="Resolved Today"
                                subtitle="Completed"
                                variant="success"
                                loading={kpisLoading}
                            />
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <main className="victim-portal-main">
                    {currentView === 'create' && showCreateForm && (
                        <ComplaintForm
                            onComplaintCreated={handleComplaintCreated}
                            onCancel={handleBackToList}
                        />
                    )}

                    {currentView === 'list' && !showCreateForm && (
                        <ComplaintList
                            onComplaintSelect={handleComplaintSelect}
                        />
                    )}

                    {currentView === 'map' && !showCreateForm && (
                        <section className="victim-map-section">
                            <RescueMap
                                userType="victim"
                                height="450px"
                                selectedComplaintId={selectedComplaintId}
                                onComplaintSelect={(id) => setSelectedComplaintId(id)}
                                onViewDetails={(id) => {
                                    setSelectedComplaintId(id);
                                    setCurrentView('detail');
                                }}
                                showLayerControl={true}
                            />
                        </section>
                    )}

                    {currentView === 'detail' && selectedComplaintId && (
                        <ComplaintDetail
                            complaintId={selectedComplaintId}
                            onBack={handleBackToList}
                        />
                    )}
                </main>
            </div>
        </div>
    );
};

export default VictimPortal;
