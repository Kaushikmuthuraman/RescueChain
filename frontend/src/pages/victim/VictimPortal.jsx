/**
 * Victim Portal Main Page
 * Main portal for victims with login, complaint list, and detail views
 */

import React, { useState, useEffect } from 'react';
import OTPLogin from '../../components/auth/OTPLogin';
import ComplaintList from '../../components/victims/ComplaintList';
import ComplaintDetail from '../../components/victims/ComplaintDetail';
import ComplaintForm from '../../components/victims/ComplaintForm';
import './VictimPortal.css';

const VictimPortal = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [currentView, setCurrentView] = useState('list'); // 'list', 'detail', 'create'
    const [selectedComplaintId, setSelectedComplaintId] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);

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
                {currentView === 'list' && !showCreateForm && (
                    <div className="victim-portal-nav">
                        <button onClick={handleCreateClick} className="btn-create">
                            ➕ Create New Complaint
                        </button>
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
