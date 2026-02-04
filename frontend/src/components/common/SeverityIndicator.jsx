/**
 * Severity Indicator Component
 * Visual badge showing urgency/severity level with color coding and optional animation
 */

import React from 'react';
import './SeverityIndicator.css';

const SeverityIndicator = ({ 
    level, // 'critical', 'high', 'medium', 'low'
    size = 'medium', // 'small', 'medium', 'large'
    showLabel = true,
    showIcon = true,
    pulse = true, // Enable pulse animation for critical
    className = ''
}) => {
    const normalizedLevel = (level || 'medium').toLowerCase();
    
    const config = {
        critical: {
            label: 'Critical',
            icon: '🔴',
            shortIcon: '!!'
        },
        high: {
            label: 'High',
            icon: '🟠',
            shortIcon: '!'
        },
        medium: {
            label: 'Medium',
            icon: '🟡',
            shortIcon: '•'
        },
        low: {
            label: 'Low',
            icon: '🟢',
            shortIcon: '○'
        }
    };
    
    const { label, icon, shortIcon } = config[normalizedLevel] || config.medium;
    
    const classes = [
        'severity-indicator',
        `severity-indicator--${normalizedLevel}`,
        `severity-indicator--${size}`,
        pulse && normalizedLevel === 'critical' && 'severity-indicator--pulse',
        className
    ].filter(Boolean).join(' ');
    
    return (
        <span className={classes} title={`Severity: ${label}`}>
            {showIcon && (
                <span className="severity-indicator__icon">
                    {size === 'small' ? shortIcon : icon}
                </span>
            )}
            {showLabel && (
                <span className="severity-indicator__label">{label}</span>
            )}
        </span>
    );
};

/**
 * Severity Badge for compact display in lists
 */
export const SeverityBadge = ({ level, className = '' }) => (
    <SeverityIndicator 
        level={level} 
        size="small" 
        showLabel={true} 
        showIcon={false}
        pulse={false}
        className={className}
    />
);

/**
 * Severity Dot for minimal display
 */
export const SeverityDot = ({ level, pulse = true, className = '' }) => (
    <SeverityIndicator 
        level={level} 
        size="small" 
        showLabel={false} 
        showIcon={true}
        pulse={pulse}
        className={className}
    />
);

export default SeverityIndicator;
