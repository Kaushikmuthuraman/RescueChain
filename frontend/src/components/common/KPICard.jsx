/**
 * KPI Card Component
 * Displays a single KPI metric with value, label, and optional trend indicator
 */

import React from 'react';
import './KPICard.css';

const KPICard = ({ 
    value, 
    label, 
    subtitle,
    icon,
    variant = 'default', // default, success, warning, critical
    loading = false,
    trend,
    onClick
}) => {
    const cardClasses = [
        'kpi-card',
        `kpi-card--${variant}`,
        loading && 'kpi-card--loading',
        onClick && 'kpi-card--clickable'
    ].filter(Boolean).join(' ');

    if (loading) {
        return (
            <div className={cardClasses}>
                <div className="kpi-card__skeleton">
                    <div className="kpi-card__skeleton-value" />
                    <div className="kpi-card__skeleton-label" />
                </div>
            </div>
        );
    }

    return (
        <div className={cardClasses} onClick={onClick}>
            {icon && <div className="kpi-card__icon">{icon}</div>}
            <div className="kpi-card__content">
                <div className="kpi-card__value-row">
                    <span className="kpi-card__value">{value}</span>
                    {trend && (
                        <span className={`kpi-card__trend kpi-card__trend--${trend.direction}`}>
                            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
                            {trend.value && <span className="kpi-card__trend-value">{trend.value}</span>}
                        </span>
                    )}
                </div>
                <div className="kpi-card__label">{label}</div>
                {subtitle && <div className="kpi-card__subtitle">{subtitle}</div>}
            </div>
        </div>
    );
};

export default KPICard;
