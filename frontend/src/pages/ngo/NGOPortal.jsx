/**
 * NGO Portal Main Page
 * Main portal for NGOs with login, complaint management, and status updates
 */

import React, { useState, useEffect } from 'react';
import OrganizationLogin from '../../components/auth/OrganizationLogin';
import ComplaintList from '../../components/ngo/ComplaintList';
import ComplaintDetail from '../../components/ngo/ComplaintDetail';
import { getCurrentUser } from '../../services/api/ngoApi';
import './NGOPortal.css';

const NGOPortal = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState('list'); // 'list' or 'detail'
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
                    
                    // Check if user is NGO
                    if (currentUser.userType !== 'ngo') {
                        // Not an NGO, logout
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
        // Verify it's an NGO
        if (userData.userType !== 'ngo') {
            alert('This portal is for NGOs only. Please use the correct portal.');
            handleLogout();
            return;
        }
        
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
    };

    const handleComplaintSelect = (complaintId) => {
        setSelectedComplaintId(complaintId);
        setCurrentView('detail');
    };

    const handleBackToList = () => {
        setCurrentView('list');
        setSelectedComplaintId(null);
    };

    const handleStatusUpdated = () => {
        // Refresh view after status update
        handleBackToList();
    };

    if (loading) {
        return (
            <div className="ngo-portal">
                <div className="ngo-portal-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="ngo-portal">
                <div className="ngo-portal-container">
                    <OrganizationLogin onLoginSuccess={handleLoginSuccess} />
                </div>
            </div>
        );
    }

    return (
        <div className="ngo-portal">
            <div className="ngo-portal-container">
                {/* Header */}
                <header className="ngo-portal-header">
                    <div className="header-content">
                        <div className="header-left">
                            <h1 className="portal-title">NGO Portal</h1>
                            <p className="portal-subtitle">Rescue Operations Management</p>
                        </div>
                        <div className="header-actions">
                            <div className="user-info">
                                <span className="user-name">🏢 {user?.name || 'NGO'}</span>
                                <span className="user-type">({user?.userType?.toUpperCase() || 'NGO'})</span>
                            </div>
                            <button onClick={handleLogout} className="btn-logout">
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="ngo-portal-main">
                    {currentView === 'list' && (
                        <ComplaintList
                            onComplaintSelect={handleComplaintSelect}
                        />
                    )}

                    {currentView === 'detail' && selectedComplaintId && (
                        <ComplaintDetail
                            complaintId={selectedComplaintId}
                            onBack={handleBackToList}
                            onStatusUpdated={handleStatusUpdated}
                        />
                    )}
                </main>
            </div>
        </div>
    );
};

export default NGOPortal;
