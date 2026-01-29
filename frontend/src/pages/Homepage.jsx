/**
 * Homepage Component
 * Public homepage with NGO list, activity snapshot, donation section, and portal buttons
 */

import React, { useState, useEffect } from 'react';
import { getHomepageStats, getPublicNGOs } from '../services/api/homepageApi';
import DonationForm from '../components/payments/DonationForm';
import './Homepage.css';

// Helper for navigation (works with or without react-router)
const navigateTo = (path) => {
    if (window.location.pathname !== path) {
        window.location.href = path;
    }
};

// Link component that works without react-router
const Link = ({ to, children, className, ...props }) => {
    return (
        <a
            href={to}
            className={className}
            onClick={(e) => {
                e.preventDefault();
                navigateTo(to);
            }}
            {...props}
        >
            {children}
        </a>
    );
};

const Homepage = () => {
    const [stats, setStats] = useState(null);
    const [ngos, setNGOs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDonationForm, setShowDonationForm] = useState(false);

    useEffect(() => {
        const fetchHomepageData = async () => {
            try {
                setLoading(true);
                const [statsData, ngosData] = await Promise.all([
                    getHomepageStats(),
                    getPublicNGOs()
                ]);
                setStats(statsData);
                setNGOs(ngosData);
            } catch (err) {
                console.error('Error fetching homepage data:', err);
                setError('Failed to load homepage data');
            } finally {
                setLoading(false);
            }
        };

        fetchHomepageData();
    }, []);

    if (loading) {
        return (
            <div className="homepage">
                <div className="loading">Loading...</div>
            </div>
        );
    }

    if (error && !stats) {
        return (
            <div className="homepage">
                <div className="error">{error}</div>
            </div>
        );
    }

    return (
        <div className="homepage">
            {/* Demo Mode Banner */}
            <div className="demo-banner">
                <div className="demo-banner-content">
                    <span className="demo-banner-icon">⚠️</span>
                    <span className="demo-banner-text">Demo Mode – Seeded + Live Data</span>
                </div>
            </div>

            {/* Hero Section */}
            <header className="homepage-header">
                <div className="header-content">
                    <h1 className="homepage-title">RescueChain</h1>
                    <p className="homepage-subtitle">
                        Disaster Rescue Coordination Platform
                    </p>
                    <p className="homepage-description">
                        A comprehensive platform connecting victims, NGOs, and disaster management authorities
                        for efficient rescue coordination and transparent aid distribution.
                    </p>
                </div>
            </header>

            {/* Activity Snapshot Section */}
            {stats && (
                <section className="activity-snapshot">
                    <h2 className="section-title">Activity Snapshot</h2>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">📊</div>
                            <div className="stat-value">{stats.complaints.total || 0}</div>
                            <div className="stat-label">Total Complaints</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">✅</div>
                            <div className="stat-value">{stats.complaints.resolved || 0}</div>
                            <div className="stat-label">Resolved</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">🔄</div>
                            <div className="stat-value">{stats.complaints.active || 0}</div>
                            <div className="stat-label">Active</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">❤️</div>
                            <div className="stat-value">{stats.donations.completed || 0}</div>
                            <div className="stat-label">Donations Completed</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">👥</div>
                            <div className="stat-value">{stats.users.ngo || 0}</div>
                            <div className="stat-label">Active NGOs</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">👨‍👩‍👧‍👦</div>
                            <div className="stat-value">{stats.users.victim || 0}</div>
                            <div className="stat-label">Victims Helped</div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    {stats.recentActivity && stats.recentActivity.length > 0 && (
                        <div className="recent-activity">
                            <h3 className="subsection-title">Recent Resolutions</h3>
                            <div className="activity-list">
                                {stats.recentActivity.slice(0, 5).map((activity) => (
                                    <div key={activity.id} className="activity-item">
                                        <div className="activity-location">
                                            <span className="activity-icon">📍</span>
                                            {activity.location}
                                        </div>
                                        <div className="activity-meta">
                                            <span className={`urgency-badge urgency-${activity.urgencyLevel}`}>
                                                {activity.urgencyLevel}
                                            </span>
                                            <span className="activity-date">
                                                Resolved: {new Date(activity.resolvedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* NGO List Section */}
            <section className="ngo-list-section">
                <h2 className="section-title">Our Partner NGOs</h2>
                {ngos.length > 0 ? (
                    <div className="ngo-grid">
                        {ngos.map((ngo) => (
                            <div key={ngo.id} className="ngo-card">
                                <div className="ngo-icon">🏢</div>
                                <div className="ngo-name">{ngo.name}</div>
                                {ngo.registrationNumber && (
                                    <div className="ngo-registration">
                                        Reg: {ngo.registrationNumber}
                                    </div>
                                )}
                                {ngo.address && (
                                    <div className="ngo-address">
                                        📍 {ngo.address}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-data">No NGOs registered yet</div>
                )}
            </section>

            {/* Donation Section */}
            <section className="donation-section">
                <h2 className="section-title">Support Relief Efforts</h2>
                <div className="donation-content">
                    <div className="donation-info">
                        <p className="donation-description">
                            Your donations help provide immediate relief and support to disaster victims.
                            Choose an NGO partner and contribute to their relief efforts through our
                            secure donation system.
                        </p>
                        {!showDonationForm && (
                            <button
                                className="donate-button"
                                onClick={() => setShowDonationForm(true)}
                            >
                                Make a Donation
                            </button>
                        )}
                    </div>
                    {showDonationForm && (
                        <div className="donation-form-container">
                            <DonationForm 
                                onDonationCreated={() => {
                                    // Refresh stats after donation
                                    getHomepageStats().then(setStats);
                                }}
                            />
                            <button
                                className="cancel-donation-button"
                                onClick={() => setShowDonationForm(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* Portal Buttons Section */}
            <section className="portal-buttons-section">
                <h2 className="section-title">Access Portals</h2>
                <div className="portal-grid">
                    <Link to="/auth/victim" className="portal-card portal-victim">
                        <div className="portal-icon">👤</div>
                        <div className="portal-title">Victim Portal</div>
                        <div className="portal-description">
                            Report emergencies and track rescue operations
                        </div>
                        <div className="portal-action">Login with OTP →</div>
                    </Link>
                    
                    <Link to="/auth/organization" className="portal-card portal-ngo">
                        <div className="portal-icon">🏢</div>
                        <div className="portal-title">NGO Portal</div>
                        <div className="portal-description">
                            Manage rescue operations and track assignments
                        </div>
                        <div className="portal-action">Login →</div>
                    </Link>
                    
                    <Link to="/auth/organization" className="portal-card portal-ddma">
                        <div className="portal-icon">🏛️</div>
                        <div className="portal-title">DDMA Portal</div>
                        <div className="portal-description">
                            District-level disaster management and coordination
                        </div>
                        <div className="portal-action">Login →</div>
                    </Link>
                    
                    <Link to="/auth/organization" className="portal-card portal-sdma">
                        <div className="portal-icon">🏛️</div>
                        <div className="portal-title">SDMA Portal</div>
                        <div className="portal-description">
                            State-level administration and oversight
                        </div>
                        <div className="portal-action">Login →</div>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="homepage-footer">
                <div className="footer-content">
                    <p>RescueChain © 2024 | Disaster Rescue Coordination Platform</p>
                    <p className="footer-note">
                        Built for transparent, accountable, and efficient disaster response
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Homepage;
