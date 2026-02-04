/**
 * ImageEvidence MongoDB Model
 * Stores image evidence associated with complaints.
 *
 * Note: This model is stored only in MongoDB.
 * PostgreSQL remains the primary relational database.
 */

const { Schema, model } = require('mongoose');

const ALLOWED_UPLOADER_ROLES = ['victim', 'ngo', 'ddma'];

const ImageEvidenceSchema = new Schema(
    {
        // MongoDB automatically provides _id as an ObjectId

        // Complaint ID from PostgreSQL (UUID as string)
        complaintId: {
            type: String,
            required: true,
        },

        // Uploader ID from PostgreSQL (UUID as string)
        uploaderId: {
            type: String,
            required: true,
        },

        // Uploader role: victim | ngo | ddma
        uploaderRole: {
            type: String,
            enum: ALLOWED_UPLOADER_ROLES,
            required: true,
        },

        // Raw image data
        imageBuffer: {
            type: Buffer,
            required: true,
        },

        // MIME type of the image (e.g., image/jpeg, image/png)
        mimeType: {
            type: String,
            required: true,
        },

        // Optional geolocation metadata
        latitude: {
            type: String,
            required: false,
        },

        longitude: {
            type: String,
            required: false,
        },

        // Creation timestamp (defaults to now)
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        // Disable automatic updatedAt since it's not required by spec
        timestamps: false,
    }
);

module.exports = model('ImageEvidence', ImageEvidenceSchema);

