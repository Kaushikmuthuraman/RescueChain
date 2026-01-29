/**
 * Seeded Badge Component
 * Visual indicator for seeded (demo/test) data vs live (production) data
 * Used throughout the UI to distinguish between the two
 */

import React from 'react';
import './SeededBadge.css';

const SeededBadge = ({ isSeeded, className = '' }) => {
    if (!isSeeded) {
        return null;
    }
    
    return (
        <span className={`seeded-badge ${className}`} title="This is demo/test data (seeded)">
            🧪 Demo
        </span>
    );
};

export default SeededBadge;
