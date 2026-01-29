/**
 * Complaint Creation Form
 * Mandatory photo upload for complaint creation
 */

import React, { useState } from 'react';
import { createComplaint } from '../../services/api/victimApi';
import './ComplaintForm.css';

const ComplaintForm = ({ onComplaintCreated, onCancel }) => {
    const [formData, setFormData] = useState({
        complaintText: '',
        location: '',
        latitude: '',
        longitude: '',
        urgencyLevel: 'medium'
    });
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

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

        // Validate form
        if (!formData.complaintText.trim()) {
            setError('Complaint description is required');
            setLoading(false);
            return;
        }

        if (!formData.location.trim()) {
            setError('Location is required');
            setLoading(false);
            return;
        }

        if (!photo) {
            setError('Photo is required for complaint creation');
            setLoading(false);
            return;
        }

        try {
            // Create FormData for multipart/form-data upload
            const formDataToSend = new FormData();
            formDataToSend.append('complaintText', formData.complaintText);
            formDataToSend.append('location', formData.location);
            
            if (formData.latitude) {
                formDataToSend.append('latitude', formData.latitude);
            }
            if (formData.longitude) {
                formDataToSend.append('longitude', formData.longitude);
            }
            
            formDataToSend.append('urgencyLevel', formData.urgencyLevel);
            formDataToSend.append('photo', photo);

            const complaint = await createComplaint(formDataToSend);

            // Reset form
            setFormData({
                complaintText: '',
                location: '',
                latitude: '',
                longitude: '',
                urgencyLevel: 'medium'
            });
            setPhoto(null);
            setPhotoPreview(null);

            // Call success callback
            if (onComplaintCreated) {
                onComplaintCreated(complaint);
            }
        } catch (err) {
            setError(err.message || 'Failed to create complaint. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Get current location (optional)
    const handleGetLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData(prev => ({
                        ...prev,
                        latitude: position.coords.latitude.toString(),
                        longitude: position.coords.longitude.toString()
                    }));
                },
                (err) => {
                    setError('Unable to get your location. Please enter manually.');
                }
            );
        } else {
            setError('Geolocation is not supported by your browser.');
        }
    };

    return (
        <div className="complaint-form-container">
            <div className="complaint-form-card">
                <h2 className="complaint-form-title">Create New Complaint</h2>
                <p className="complaint-form-subtitle">
                    Report an emergency. Photo upload is required.
                </p>

                {error && (
                    <div className="complaint-form-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="complaint-form">
                    {/* Complaint Text */}
                    <div className="form-group">
                        <label htmlFor="complaintText">
                            Describe the Emergency * 
                            <span className="field-help">(What help do you need?)</span>
                        </label>
                        <textarea
                            id="complaintText"
                            name="complaintText"
                            value={formData.complaintText}
                            onChange={handleInputChange}
                            placeholder="Describe your emergency situation in detail..."
                            required
                            rows={5}
                            className="form-textarea"
                            disabled={loading}
                        />
                    </div>

                    {/* Location */}
                    <div className="form-group">
                        <label htmlFor="location">
                            Location * 
                            <span className="field-help">(Where are you located?)</span>
                        </label>
                        <input
                            id="location"
                            name="location"
                            type="text"
                            value={formData.location}
                            onChange={handleInputChange}
                            placeholder="Enter your location (address, landmark, etc.)"
                            required
                            className="form-input"
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={handleGetLocation}
                            className="btn-location"
                            disabled={loading}
                        >
                            📍 Use Current Location
                        </button>
                    </div>

                    {/* GPS Coordinates (optional, auto-filled if location accessed) */}
                    {(formData.latitude || formData.longitude) && (
                        <div className="form-group">
                            <label>GPS Coordinates</label>
                            <div className="coordinates-display">
                                <span>Lat: {formData.latitude || 'N/A'}</span>
                                <span>Lng: {formData.longitude || 'N/A'}</span>
                            </div>
                        </div>
                    )}

                    {/* Urgency Level */}
                    <div className="form-group">
                        <label htmlFor="urgencyLevel">Urgency Level *</label>
                        <select
                            id="urgencyLevel"
                            name="urgencyLevel"
                            value={formData.urgencyLevel}
                            onChange={handleInputChange}
                            required
                            className="form-select"
                            disabled={loading}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>

                    {/* Photo Upload - REQUIRED */}
                    <div className="form-group">
                        <label htmlFor="photo">
                            Photo Evidence * 
                            <span className="field-required">(Required)</span>
                        </label>
                        <div className="photo-upload-area">
                            <input
                                id="photo"
                                name="photo"
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/heic,image/heif"
                                onChange={handlePhotoChange}
                                required
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
                                        <span className="photo-hint">JPEG, PNG, or HEIC (max 10MB)</span>
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
                    </div>

                    {/* Form Actions */}
                    <div className="form-actions">
                        <button
                            type="submit"
                            disabled={loading || !photo}
                            className="btn btn-primary btn-block"
                        >
                            {loading ? 'Submitting...' : 'Submit Complaint'}
                        </button>
                        
                        {onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                disabled={loading}
                                className="btn btn-secondary btn-block"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ComplaintForm;
