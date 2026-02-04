/**
 * Empty State Component
 * Configurable empty state with icon, title, description, and optional action
 * Includes portal-specific presets for consistent UX
 */

import React from 'react';
import './EmptyState.css';

const EmptyState = ({
    icon,
    title,
    description,
    action,
    actionLabel,
    onAction,
    variant = 'default', // 'default', 'card', 'inline'
    size = 'medium', // 'small', 'medium', 'large'
    className = ''
}) => {
    const classes = [
        'empty-state',
        `empty-state--${variant}`,
        `empty-state--${size}`,
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={classes}>
            {icon && <div className="empty-state__icon">{icon}</div>}
            {title && <h3 className="empty-state__title">{title}</h3>}
            {description && <p className="empty-state__description">{description}</p>}
            {(action || (actionLabel && onAction)) && (
                <div className="empty-state__action">
                    {action || (
                        <button 
                            className="empty-state__button"
                            onClick={onAction}
                        >
                            {actionLabel}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

/**
 * Portal-specific preset empty states
 */

// Victim Portal
export const VictimNoComplaints = ({ onCreateClick }) => (
    <EmptyState
        icon="📝"
        title="No Complaints Yet"
        description="You haven't submitted any rescue requests. If you're in an emergency situation, create a complaint to get help."
        actionLabel="Create Complaint"
        onAction={onCreateClick}
        variant="card"
    />
);

export const VictimComplaintSubmitted = () => (
    <EmptyState
        icon="✅"
        title="Complaint Submitted"
        description="Your rescue request has been submitted. An NGO will be assigned to help you soon. You can track the status here."
        variant="inline"
        size="small"
    />
);

// NGO Portal
export const NGONoAssignments = () => (
    <EmptyState
        icon="📋"
        title="No Complaints Assigned"
        description="You don't have any complaints assigned yet. Check back later or contact the DDMA to be assigned to rescue operations."
        variant="card"
    />
);

export const NGONoUnassigned = () => (
    <EmptyState
        icon="✓"
        title="All Complaints Assigned"
        description="There are no unassigned complaints in your area at the moment. Great job staying on top of things!"
        variant="inline"
        size="small"
    />
);

export const NGOAllResolved = () => (
    <EmptyState
        icon="🎉"
        title="All Resolved"
        description="All your assigned complaints have been resolved. Thank you for your service!"
        variant="card"
    />
);

// DDMA Portal
export const DDMANoComplaints = () => (
    <EmptyState
        icon="📊"
        title="No Complaints in District"
        description="There are no active complaints in your district at the moment. The situation is under control."
        variant="card"
    />
);

export const DDMASelectArea = () => (
    <EmptyState
        icon="🗺️"
        title="Select an Area"
        description="Choose an area from the list on the left to view complaints and assign them to NGOs."
        variant="inline"
    />
);

export const DDMANoNGOs = () => (
    <EmptyState
        icon="🏢"
        title="No NGOs Available"
        description="There are no active NGOs registered in your district. Contact SDMA to register new organizations."
        variant="card"
    />
);

// SDMA Portal
export const SDMANoComplaints = () => (
    <EmptyState
        icon="📈"
        title="No Active Complaints"
        description="The system has no active complaints at the moment. All rescue operations are resolved."
        variant="card"
    />
);

export const SDMANoAuditLogs = () => (
    <EmptyState
        icon="📜"
        title="No Audit Logs"
        description="No blockchain audit logs found for the selected criteria. Try adjusting your filters."
        variant="inline"
        size="small"
    />
);

// Generic empty states
export const NoResults = ({ searchTerm }) => (
    <EmptyState
        icon="🔍"
        title="No Results Found"
        description={searchTerm 
            ? `No results found for "${searchTerm}". Try adjusting your search or filters.`
            : "No results match your current filters. Try adjusting them."}
        variant="inline"
    />
);

export const LoadingError = ({ onRetry }) => (
    <EmptyState
        icon="⚠️"
        title="Failed to Load"
        description="Something went wrong while loading the data. Please try again."
        actionLabel="Retry"
        onAction={onRetry}
        variant="card"
    />
);

export const ComingSoon = ({ feature }) => (
    <EmptyState
        icon="🚧"
        title="Coming Soon"
        description={feature 
            ? `The ${feature} feature is under development and will be available soon.`
            : "This feature is under development and will be available soon."}
        variant="inline"
        size="small"
    />
);

export default EmptyState;
