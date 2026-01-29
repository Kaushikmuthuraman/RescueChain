/**
 * Status Update Form Component
 * Allows NGO to accept complaints and update statuses
 */

import React, { useState } from 'react';
import { updateComplaintStatus } from '../../services/api/ngoApi';
import './StatusUpdateForm.css';

const StatusUpdateForm = ({ complaint, nextStatuses, onStatusUpdated, onCancel }) => {
    const [status, setStatus] = useState(nextStatuses[0] || '');
    const [notes, setNotes] = useState('');
    const [reason, setReason] = useState('');
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Statuses that require photo (all except 'accepted')
    const statusesRequiringPhoto = ['arriving', 'in_progress', 'resolved', 'fake_information'];
    const requiresPhoto = statusesRequiringPhoto.includes(status);

    // Handle photo selection
    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];
            if (!allowedTypes.includes(file.type)) {
                setError('Invalid file type. Only JPEG, PNG, or HEIC images are allowed.');
                return;
            }

            // Validate file size (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                setError('File size too large. Maximum size is 10MB.');
                return;
            }

            setPhoto(file);
            setError('');

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validate photo requirement
        if (requiresPhoto && !photo) {
            setError(`Photo is required for status: ${status}`);
            setLoading(false);
            return;
        }

        // Validate reason for fake_information
        if (status === 'fake_information' && !reason.trim()) {
            setError('Reason is required when marking complaint as fake information');
            setLoading(false);
            return;
        }

        try {
            // Create FormData for multipart/form-data upload
            const formData = new FormData();
            formData.append('status', status);
            
            if (notes.trim()) {
                formData.append('notes', notes.trim());
            }
            
            if (status === 'fake_information' && reason.trim()) {
                formData.append('reason', reason.trim());
            }
            
            if (photo) {
                formData.append('photo', photo);
            }

            await updateComplaintStatus(complaint.id, formData);

            // Reset form
            setStatus(nextStatuses[0] || '');
            setNotes('');
            setReason('');
            setPhoto(null);
            setPhotoPreview(null);

            // Call success callback
            if (onStatusUpdated) {
                onStatusUpdated();
            }
        } catch (err) {
            setError(err.message || 'Failed to update complaint status. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusLabel = (statusValue) => {
        const labelMap = {
            'submitted': 'Submitted',
            'accepted': 'Accepted',
            'arriving': 'Arriving',
            'in_progress': 'In Progress',
            'resolved': 'Resolved',
            'fake_information': 'Mark as Fake Information'
        };
        return labelMap[statusValue] || statusValue;
    };

    return (
        <div className="status-update-form-container">
            <div className="status-update-form-card">
                <h3 className="form-title">
                    {complaint.status === 'submitted' ? 'Accept Complaint' : 'Update Status'}
                </h3>

                {error && (
                    <div className="form-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="status-update-form">
                    {/* Current Status */}
                    <div className="form-group">
                        <label>Current Status</label>
                        <div className="current-status">
                            {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1).replace('_', ' ')}
                        </div>
                    </div>

                    {/* New Status */}
                    <div className="form-group">
                        <label htmlFor="status">
                            New Status *
                            {complaint.status === 'submitted' && (
                                <span className="help-text"> (Accept to take on this complaint)</span>
                            )}
                        </label>
                        <select
                            id="status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            required
                            className="form-select"
                            disabled={loading}
                        >
                            {nextStatuses.map((statusOption) => (
                                <option key={statusOption} value={statusOption}>
                                    {getStatusLabel(statusOption)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Reason (for fake_information) */}
                    {status === 'fake_information' && (
                        <div className="form-group">
                            <label htmlFor="reason">
                                Reason * 
                                <span className="help-text"> (Why is this fake information?)</span>
                            </label>
                            <textarea
                                id="reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Provide a reason for marking this as fake information..."
                                required
                                rows={4}
                                className="form-textarea"
                                disabled={loading}
                            />
                        </div>
                    )}

                    {/* Notes */}
                    <div className="form-group">
                        <label htmlFor="notes">
                            Notes 
                            <span className="help-text"> (Optional)</span>
                        </label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any additional notes..."
                            rows={3}
                            className="form-textarea"
                            disabled={loading}
                        />
                    </div>

                    {/* Photo Upload (required for most statuses) */}
                    {requiresPhoto && (
                        <div className="form-group">
                            <label htmlFor="photo">
                                Photo Evidence * 
                                <span className="help-text"> (Required - must include GPS location and timestamp in EXIF)</span>
                            </label>
                            <div className="photo-upload-area">
                                <input
                                    id="photo"
                                    name="photo"
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/heic,image/heif"
                                    onChange={handlePhotoChange}
                                    required={requiresPhoto}
                                    disabled={loading}
                                    className="photo-input"
                                />
                                <label htmlFor="photo" className="photo-upload-label">
                                    {photo ? (
                                        <div className="photo-selected">
                                            <span>✓ Photo Selected</span>
                                            <span className="photo-name">{photo.name}</span>
                                        </div>
                                    ) : (
                                        <div className="photo-upload-placeholder">
                                            <span className="photo-icon">📷</span>
                                            <span>Click to upload photo</span>
                                            <span className="photo-hint">
                                                JPEG, PNG, or HEIC (max 10MB)
                                                <br />
                                                Must include GPS location and timestamp
                                            </span>
                                        </div>
                                    )}
                                </label>
                            </div>
                            
                            {photoPreview && (
                                <div className="photo-preview">
                                    <img src={photoPreview} alt="Preview" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPhoto(null);
                                            setPhotoPreview(null);
                                        }}
                                        className="btn-remove-photo"
                                        disabled={loading}
                                    >
                                        Remove Photo
                                    </button>
                                </div>
                            )}

                            {status === 'accepted' && (
                                <div className="photo-note">
                                    <strong>Note:</strong> Photo is NOT required for 'Accepted' status.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Form Actions */}
                    <div className="form-actions">
                        <button
                            type="submit"
                            disabled={loading || (requiresPhoto && !photo)}
                            className="btn btn-primary btn-block"
                        >
                            {loading ? 'Updating...' : status === 'accepted' ? 'Accept Complaint' : 'Update Status'}
                        </button>
                        
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={loading}
                            className="btn btn-secondary btn-block"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StatusUpdateForm;
