/**
 * Main App Component
 * Handles routing and navigation for RescueChain application
 */

import React, { useState, useEffect } from 'react';
import Homepage from './pages/Homepage';
import VictimPortal from './pages/victim/VictimPortal';
import NGOPortal from './pages/ngo/NGOPortal';
import DDMAPortal from './pages/ddma/DDMAPortal';
import SDMAPortal from './pages/sdma/SDMAPortal';
import OTPLogin from './components/auth/OTPLogin';
import OrganizationLogin from './components/auth/OrganizationLogin';

const App = () => {
    const [currentPath, setCurrentPath] = useState(window.location.pathname);
    const [currentView, setCurrentView] = useState('homepage');

    const updateView = (path) => {
        if (path === '/' || path === '') {
            setCurrentView('homepage');
        } else if (path.startsWith('/auth/victim')) {
            setCurrentView('victim-auth');
        } else if (path.startsWith('/auth/organization')) {
            setCurrentView('org-auth');
        } else if (path.startsWith('/victim')) {
            setCurrentView('victim-portal');
        } else if (path.startsWith('/ngo')) {
            setCurrentView('ngo-portal');
        } else if (path.startsWith('/ddma')) {
            setCurrentView('ddma-portal');
        } else if (path.startsWith('/sdma')) {
            setCurrentView('sdma-portal');
        } else {
            setCurrentView('homepage');
        }
    };

    // Handle navigation
    const navigate = (path) => {
        window.history.pushState({}, '', path);
        setCurrentPath(path);
        updateView(path);
    };

    useEffect(() => {
        // Listen for browser back/forward navigation
        const handlePopState = () => {
            const path = window.location.pathname;
            setCurrentPath(path);
            updateView(path);
        };

        // Initial view update
        updateView(window.location.pathname);

        // Listen for popstate (back/forward buttons)
        window.addEventListener('popstate', handlePopState);

        // Override link clicks to use our navigation
        const handleClick = (e) => {
            const link = e.target.closest('a');
            if (link && link.href.startsWith(window.location.origin)) {
                e.preventDefault();
                navigate(link.pathname);
            }
        };

        document.addEventListener('click', handleClick);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            document.removeEventListener('click', handleClick);
        };
    }, []);

    // Render based on current view
    switch (currentView) {
        case 'homepage':
            return <Homepage />;

        case 'victim-auth':
            return (
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <OTPLogin 
                        onLoginSuccess={(user) => {
                            // Redirect to victim portal
                            navigate('/victim');
                        }}
                    />
                </div>
            );

        case 'org-auth':
            return (
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <OrganizationLogin 
                        onLoginSuccess={(user) => {
                            // Redirect based on user type
                            if (user.userType === 'ngo') {
                                navigate('/ngo');
                            } else if (user.userType === 'ddma') {
                                navigate('/ddma');
                            } else if (user.userType === 'sdma') {
                                navigate('/sdma');
                            }
                        }}
                    />
                </div>
            );

        case 'victim-portal':
            return <VictimPortal />;

        case 'ngo-portal':
            return <NGOPortal />;

        case 'ddma-portal':
            return <DDMAPortal />;

        case 'sdma-portal':
            return <SDMAPortal />;

        default:
            return <Homepage />;
    }
};

export default App;
