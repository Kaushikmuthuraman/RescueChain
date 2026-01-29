/**
 * DDMA Portal Main Page
 * Main portal for DDMA with area-wise complaints, NGO coordination, and fake information marking
 */

import React, { useState, useEffect } from 'react';
import OrganizationLogin from '../../components/auth/OrganizationLogin';
import AreaWiseComplaints from '../../components/ddma/AreaWiseComplaints';
import NGOCoordination from '../../components/ddma/NGOCoordination';
import DDMAComplaintDetail from '../../components/ddma/DDMAComplaintDetail';
import { getCurrentUser } from '../../services/api/ddmaApi';
import './DDMAPortal.css';

const DDMAPortal = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState('areas'); // 'areas', 'coordination', 'detail'
    const [selectedComplaintId, setSelectedComplaintId] = useState(null);

    useEffect(() => {
        // Check if user is already logged in
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');
            
            if (token && userData) {
                try {
                    // Verify token is still valid
                    const currentUser = await getCurrentUser();
                    setIsAuthenticated(true);
                    setUser(currentUser);
                    
                    // Check if user is DDMA
                    if (currentUser.userType !== 'ddma') {
                        // Not DDMA, logout
                        handleLogout();
                        return;
                    }
                } catch (err) {
                    // Invalid token or user
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

    const handleLoginSuccess = (userData) => {
        // Verify it's DDMA
        if (userData.userType !== 'ddma') {
            alert('This portal is for DDMA only. Please use the correct portal.');
            handleLogout();
            return;
        }
        
        setIsAuthenticated(true);
        setUser(userData);
        setCurrentView('areas');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
        setCurrentView('areas');
        setSelectedComplaintId(null);
    };

    const handleComplaintSelect = (complaintId) => {
        setSelectedComplaintId(complaintId);
        setCurrentView('detail');
    };

    const handleBackToAreas = () => {
        setCurrentView('areas');
        setSelectedComplaintId(null);
    };

    const handleBackToCoordination = () => {
        setCurrentView('coordination');
        setSelectedComplaintId(null);
    };

    const handleStatusUpdated = () => {
        // Refresh view after status update
        handleBackToAreas();
    };

    const handleAssignmentSuccess = () => {
        // Refresh after assignment
        if (currentView === 'detail') {
            handleBackToAreas();
        }
    };

    if (loading) {
        return (
            <div className="ddma-portal">
                <div className="ddma-portal-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="ddma-portal">
                <div className="ddma-portal-container">
                    <OrganizationLogin onLoginSuccess={handleLoginSuccess} />
                </div>
            </div>
        );
    }

    return (
        <div className="ddma-portal">
            <div className="ddma-portal-container">
                {/* Header */}
                <header className="ddma-portal-header">
                    <div className="header-content">
                        <div className="header-left">
                            <h1 className="portal-title">DDMA Portal</h1>
                            <p className="portal-subtitle">District Disaster Management Authority</p>
                        </div>
                        <div className="header-actions">
                            <div className="user-info">
                                <span className="user-name">🏛️ {user?.name || 'DDMA'}</span>
                                <span className="user-type">({user?.userType?.toUpperCase() || 'DDMA'})</span>
                            </div>
                            <button onClick={handleLogout} className="btn-logout">
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                {/* Navigation Tabs */}
                <nav className="ddma-portal-nav">
                    <button
                        onClick={() => {
                            setCurrentView('areas');
                            setSelectedComplaintId(null);
                        }}
                        className={`nav-tab ${currentView === 'areas' ? 'active' : ''}`}
                    >
                        📍 Area-wise Complaints
                    </button>
                    <button
                        onClick={() => {
                            setCurrentView('coordination');
                            setSelectedComplaintId(null);
                        }}
                        className={`nav-tab ${currentView === 'coordination' ? 'active' : ''}`}
                    >
                        🤝 NGO Coordination
                    </button>
                    {currentView === 'detail' && selectedComplaintId && (
                        <button
                            onClick={handleBackToAreas}
                            className="nav-tab active"
                        >
                            📋 Complaint Detail
                        </button>
                    )}
                </nav>

                {/* Main Content */}
                <main className="ddma-portal-main">
                    {currentView === 'areas' && (
                        <AreaWiseComplaints
                            onComplaintSelect={handleComplaintSelect}
                        />
                    )}

                    {currentView === 'coordination' && (
                        <NGOCoordination
                            selectedComplaintId={selectedComplaintId}
                            onAssignmentSuccess={handleAssignmentSuccess}
                        />
                    )}

                    {currentView === 'detail' && selectedComplaintId && (
                        <DDMAComplaintDetail
                            complaintId={selectedComplaintId}
                            onBack={handleBackToAreas}
                            onStatusUpdated={handleStatusUpdated}
                        />
                    )}
                </main>
            </div>
        </div>
    );
};

export default DDMAPortal;
