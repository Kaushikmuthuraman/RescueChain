/**
 * Photo Upload Component
 * Upload geo-timestamped photos for complaint evidence
 */

import React, { useState } from 'react';
import { uploadPhoto } from '../../services/api/ngoApi';
import './PhotoUpload.css';

const PhotoUpload = ({ complaintId, complaintStatus, onPhotoUploaded, onCancel }) => {
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [exifInfo, setExIFInfo] = useState(null);

    // Handle photo selection
    const handlePhotoChange = async (e) => {
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
                
                // Try to extract EXIF data from preview (basic check)
                // Note: Full EXIF extraction happens on server side
                // This is just a visual indicator
                extractBasicEXIFInfo(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Basic EXIF info extraction (for display only)
    // Full extraction happens server-side
    const extractBasicEXIFInfo = (imageData) => {
        // This is a placeholder - actual EXIF extraction happens server-side
        // We show a note that EXIF will be extracted
        setExIFInfo({
            note: 'EXIF data (GPS location and timestamp) will be extracted automatically from the photo'
        });
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!photo) {
            setError('Please select a photo to upload');
            setLoading(false);
            return;
        }

        try {
            // Create FormData for multipart/form-data upload
            const formData = new FormData();
            formData.append('complaintId', complaintId);
            formData.append('complaintStatus', complaintStatus);
            formData.append('photo', photo);

            const result = await uploadPhoto(formData);

            // Show EXIF info from result
            if (result.exif) {
                setExIFInfo({
                    latitude: result.exif.latitude,
                    longitude: result.exif.longitude,
                    timestamp: result.exif.timestamp
                });
            }

            // Reset form
            setPhoto(null);
            setPhotoPreview(null);

            // Call success callback (EXIF info is shown before reset)
            setTimeout(() => {
                setExIFInfo(null);
                if (onPhotoUploaded) {
                    onPhotoUploaded(result);
                }
            }, 3000); // Show EXIF info for 3 seconds before resetting
        } catch (err) {
            setError(err.message || 'Failed to upload photo. Please ensure the photo has GPS location and timestamp in EXIF data.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="photo-upload-container">
            <div className="photo-upload-card">
                <h3 className="form-title">Upload Photo Evidence</h3>
                <p className="form-subtitle">
                    Upload a geo-timestamped photo for status: <strong>{complaintStatus}</strong>
                </p>

                {error && (
                    <div className="form-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="photo-upload-form">
                    {/* Photo Upload */}
                    <div className="form-group">
                        <label htmlFor="photo">
                            Photo * 
                            <span className="help-text"> (Must include GPS location and timestamp in EXIF data)</span>
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
                                        <span className="photo-hint">
                                            JPEG, PNG, or HEIC (max 10MB)
                                            <br />
                                            <strong>Must include GPS location and timestamp in EXIF</strong>
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
                                        setExIFInfo(null);
                                    }}
                                    className="btn-remove-photo"
                                    disabled={loading}
                                >
                                    Remove Photo
                                </button>
                            </div>
                        )}

                        {exifInfo && (
                            <div className="exif-info">
                                <div className="exif-icon">ℹ️</div>
                                <div className="exif-text">
                                    {exifInfo.latitude && exifInfo.longitude ? (
                                        <div>
                                            <strong>✅ EXIF Data Extracted:</strong>
                                            <br />
                                            <strong>GPS Location:</strong> {exifInfo.latitude}, {exifInfo.longitude}
                                            {exifInfo.timestamp && (
                                                <>
                                                    <br />
                                                    <strong>Timestamp:</strong> {new Date(exifInfo.timestamp).toLocaleString()}
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            <strong>EXIF Extraction:</strong> GPS location and timestamp will be automatically extracted from the photo metadata when uploaded.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="photo-requirements">
                            <h4>Photo Requirements:</h4>
                            <ul>
                                <li>Must be taken with location services enabled</li>
                                <li>Must include GPS coordinates in EXIF data</li>
                                <li>Must include timestamp in EXIF data</li>
                                <li>Location must match complaint location (within reasonable distance)</li>
                                <li>One photo cannot be reused across different statuses</li>
                            </ul>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="form-actions">
                        <button
                            type="submit"
                            disabled={loading || !photo}
                            className="btn btn-primary btn-block"
                        >
                            {loading ? 'Uploading...' : 'Upload Photo'}
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

export default PhotoUpload;
