/**
 * KPI Dashboard Component
 * Grid container that fetches and displays KPI metrics
 */

import React, { useState, useEffect, useCallback } from 'react';
import KPICard from './KPICard';
import './KPIDashboard.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const KPIDashboard = ({ 
    token,
    refreshInterval = 30000, // 30 seconds default
    variant = 'full', // full, compact, minimal
    showSeverity = true,
    onKPIClick
}) => {
    const [kpis, setKpis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchKPIs = useCallback(async () => {
        try {
            const headers = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE}/stats/kpi`, { headers });
            const data = await response.json();

            if (data.success) {
                setKpis(data.data);
                setError(null);
            } else {
                setError(data.message || 'Failed to fetch KPIs');
            }
        } catch (err) {
            setError('Unable to load metrics');
            console.error('KPI fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchKPIs();

        if (refreshInterval > 0) {
            const interval = setInterval(fetchKPIs, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [fetchKPIs, refreshInterval]);

    if (error && !kpis) {
        return (
            <div className="kpi-dashboard kpi-dashboard--error">
                <p>{error}</p>
                <button onClick={fetchKPIs} className="kpi-dashboard__retry">
                    Retry
                </button>
            </div>
        );
    }

    const getVariantForSeverity = (severity) => {
        const severityCount = severity?.critical || 0;
        const highCount = severity?.high || 0;
        if (severityCount > 0) return 'critical';
        if (highCount > 0) return 'warning';
        return 'default';
    };

    return (
        <div className={`kpi-dashboard kpi-dashboard--${variant}`}>
            <div className="kpi-dashboard__grid">
                <KPICard
                    icon="🚨"
                    value={loading ? '-' : kpis?.activeRescues || 0}
                    label="Active Rescues"
                    subtitle="In progress operations"
                    variant={kpis?.activeRescues > 0 ? 'warning' : 'default'}
                    loading={loading}
                    onClick={() => onKPIClick?.('activeRescues')}
                />
                
                <KPICard
                    icon="⏳"
                    value={loading ? '-' : kpis?.pendingAssignments || 0}
                    label="Pending Assignments"
                    subtitle="Awaiting NGO assignment"
                    variant={kpis?.pendingAssignments > 5 ? 'warning' : 'default'}
                    loading={loading}
                    onClick={() => onKPIClick?.('pendingAssignments')}
                />
                
                <KPICard
                    icon="⏱️"
                    value={loading ? '-' : kpis?.avgResolutionTime?.formatted || 'N/A'}
                    label="Avg Resolution Time"
                    subtitle={kpis?.avgResolutionTime?.sampleSize ? `Based on ${kpis.avgResolutionTime.sampleSize} cases` : 'Last 30 days'}
                    variant="success"
                    loading={loading}
                />
                
                <KPICard
                    icon="📊"
                    value={loading ? '-' : kpis?.ngoResponseSLA?.formatted || 'N/A'}
                    label="NGO Response SLA"
                    subtitle="Avg time to accept"
                    variant="default"
                    loading={loading}
                />

                {showSeverity && variant === 'full' && (
                    <KPICard
                        icon="🔴"
                        value={loading ? '-' : (kpis?.severityBreakdown?.critical || 0)}
                        label="Critical Alerts"
                        subtitle={`${kpis?.severityBreakdown?.high || 0} high priority`}
                        variant={getVariantForSeverity(kpis?.severityBreakdown)}
                        loading={loading}
                        onClick={() => onKPIClick?.('critical')}
                    />
                )}

                {variant === 'full' && (
                    <KPICard
                        icon="✅"
                        value={loading ? '-' : kpis?.todayResolved || 0}
                        label="Resolved Today"
                        subtitle="Completed rescues"
                        variant="success"
                        loading={loading}
                    />
                )}
            </div>

            {showSeverity && variant !== 'minimal' && kpis?.severityBreakdown && (
                <div className="kpi-dashboard__severity-bar">
                    <div className="severity-bar">
                        <div 
                            className="severity-bar__segment severity-bar__segment--critical"
                            style={{ flex: kpis.severityBreakdown.critical || 0 }}
                            title={`Critical: ${kpis.severityBreakdown.critical}`}
                        />
                        <div 
                            className="severity-bar__segment severity-bar__segment--high"
                            style={{ flex: kpis.severityBreakdown.high || 0 }}
                            title={`High: ${kpis.severityBreakdown.high}`}
                        />
                        <div 
                            className="severity-bar__segment severity-bar__segment--medium"
                            style={{ flex: kpis.severityBreakdown.medium || 0 }}
                            title={`Medium: ${kpis.severityBreakdown.medium}`}
                        />
                        <div 
                            className="severity-bar__segment severity-bar__segment--low"
                            style={{ flex: kpis.severityBreakdown.low || 0 }}
                            title={`Low: ${kpis.severityBreakdown.low}`}
                        />
                    </div>
                    <div className="severity-bar__legend">
                        <span className="severity-bar__legend-item severity-bar__legend-item--critical">
                            Critical ({kpis.severityBreakdown.critical})
                        </span>
                        <span className="severity-bar__legend-item severity-bar__legend-item--high">
                            High ({kpis.severityBreakdown.high})
                        </span>
                        <span className="severity-bar__legend-item severity-bar__legend-item--medium">
                            Medium ({kpis.severityBreakdown.medium})
                        </span>
                        <span className="severity-bar__legend-item severity-bar__legend-item--low">
                            Low ({kpis.severityBreakdown.low})
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KPIDashboard;
