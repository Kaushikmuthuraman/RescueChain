/**
 * Organization Login Component
 * Username/password authentication for NGO, DDMA, SDMA
 */

import React, { useState } from 'react';
import { loginOrganization } from '../../services/api/ngoApi';
import './OrganizationLogin.css';

const OrganizationLogin = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!username || !password) {
            setError('Please enter both username and password');
            setLoading(false);
            return;
        }

        try {
            const data = await loginOrganization(username, password);
            
            // Store token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Call success callback
            if (onLoginSuccess) {
                onLoginSuccess(data.user);
            }
        } catch (err) {
            setError(err.message || 'Invalid username or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="org-login">
            <div className="org-login-card">
                <h2 className="org-login-title">Organization Portal Login</h2>
                <p className="org-login-subtitle">
                    Login with your organization credentials
                </p>

                {error && (
                    <div className="org-login-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="org-login-form">
                    <div className="form-group">
                        <label htmlFor="username">Username *</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            required
                            disabled={loading}
                            className="form-input"
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password *</label>
                        <div className="password-input-wrapper">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                disabled={loading}
                                className="form-input"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="password-toggle"
                                tabIndex={-1}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !username || !password}
                        className="btn btn-primary btn-block"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>

                    <div className="login-info">
                        <p className="info-text">
                            <strong>Demo Mode:</strong> Use your organization username and password
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OrganizationLogin;
