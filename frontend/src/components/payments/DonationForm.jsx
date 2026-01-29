/**
 * Donation Form Component
 * Displays common UPI QR code and allows users to log donation intent
 * 
 * Features:
 * - Display QR from /assets/common_upi_qr.png
 * - User selects NGO before scan
 * - Optional QR scanner
 * - Button: "I have completed payment"
 */

import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api/apiClient';

const DonationForm = ({ onDonationCreated }) => {
    const [ngos, setNGOs] = useState([]);
    const [selectedNGOId, setSelectedNGOId] = useState('');
    const [donorName, setDonorName] = useState('');
    const [donorPhone, setDonorPhone] = useState('');
    const [donorEmail, setDonorEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [donationId, setDonationId] = useState(null);
    const [showScanner, setShowScanner] = useState(false);

    // Fetch list of NGOs on component mount
    useEffect(() => {
        const fetchNGOs = async () => {
            try {
                // Try public endpoint first, fallback to authenticated
                try {
                    const response = await apiClient.get('/homepage/ngos');
                    setNGOs(response.data.ngos || []);
                } catch (publicError) {
                    // Fallback to authenticated endpoint
                    const response = await apiClient.get('/donations/ngos');
                    setNGOs(response.data.ngos || []);
                }
            } catch (err) {
                console.error('Error fetching NGOs:', err);
                setError('Failed to load NGOs');
            }
        };

        fetchNGOs();
    }, []);

    // Handle donation intent creation
    const handleCreateDonation = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!selectedNGOId) {
            setError('Please select an NGO');
            return;
        }

        setLoading(true);

        try {
            const data = await apiClient.post('/donations', {
                ngoId: selectedNGOId,
                donorName: donorName || null,
                donorPhone: donorPhone || null,
                donorEmail: donorEmail || null
            });

            setDonationId(data.data.donation.id);
            setSuccess('Donation intent logged successfully. Please scan the QR code and complete payment.');
            if (onDonationCreated) {
                onDonationCreated(data.data.donation);
            }
        } catch (err) {
            console.error('Error creating donation:', err);
            setError(err.message || 'Failed to create donation');
        } finally {
            setLoading(false);
        }
    };

    // Handle payment confirmation
    const handleConfirmPayment = async () => {
        if (!donationId) {
            setError('Please create donation intent first');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const data = await apiClient.patch(`/donations/${donationId}/confirm`, {
                // Optional: amount and upiTransactionId if user wants to provide them
            });

            setSuccess('Payment confirmed successfully. Thank you for your donation!');
            // Reset form
            setDonationId(null);
            setSelectedNGOId('');
            setDonorName('');
            setDonorPhone('');
            setDonorEmail('');
        } catch (err) {
            console.error('Error confirming payment:', err);
            setError(err.message || 'Failed to confirm payment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="donation-form" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <h2>Make a Donation</h2>

            {error && (
                <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>
                    {error}
                </div>
            )}

            {success && (
                <div className="success-message" style={{ color: 'green', marginBottom: '10px' }}>
                    {success}
                </div>
            )}

            {!donationId ? (
                <form onSubmit={handleCreateDonation}>
                    {/* NGO Selection */}
                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="ngo-select" style={{ display: 'block', marginBottom: '5px' }}>
                            Select NGO * <span style={{ fontSize: '12px', color: '#666' }}>(Required before scanning QR)</span>
                        </label>
                        <select
                            id="ngo-select"
                            value={selectedNGOId}
                            onChange={(e) => setSelectedNGOId(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '8px',
                                fontSize: '16px',
                                border: '1px solid #ccc',
                                borderRadius: '4px'
                            }}
                        >
                            <option value="">-- Select an NGO --</option>
                            {ngos.map((ngo) => (
                                <option key={ngo.id} value={ngo.id}>
                                    {ngo.name} {ngo.registrationNumber && `(${ngo.registrationNumber})`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Optional Donor Information */}
                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="donor-name" style={{ display: 'block', marginBottom: '5px' }}>
                            Your Name (Optional)
                        </label>
                        <input
                            id="donor-name"
                            type="text"
                            value={donorName}
                            onChange={(e) => setDonorName(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                fontSize: '16px',
                                border: '1px solid #ccc',
                                borderRadius: '4px'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="donor-phone" style={{ display: 'block', marginBottom: '5px' }}>
                            Phone Number (Optional)
                        </label>
                        <input
                            id="donor-phone"
                            type="tel"
                            value={donorPhone}
                            onChange={(e) => setDonorPhone(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                fontSize: '16px',
                                border: '1px solid #ccc',
                                borderRadius: '4px'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="donor-email" style={{ display: 'block', marginBottom: '5px' }}>
                            Email (Optional)
                        </label>
                        <input
                            id="donor-email"
                            type="email"
                            value={donorEmail}
                            onChange={(e) => setDonorEmail(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                fontSize: '16px',
                                border: '1px solid #ccc',
                                borderRadius: '4px'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !selectedNGOId}
                        style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '16px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.6 : 1
                        }}
                    >
                        {loading ? 'Processing...' : 'Continue to Payment'}
                    </button>
                </form>
            ) : (
                <div>
                    {/* QR Code Display */}
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <h3>Scan QR Code to Complete Payment</h3>
                        <img
                            src="/assets/common_upi_qr.png"
                            alt="UPI QR Code"
                            style={{
                                maxWidth: '300px',
                                width: '100%',
                                border: '2px solid #ccc',
                                borderRadius: '8px',
                                padding: '10px'
                            }}
                            onError={(e) => {
                                e.target.src = '/assets/images/common_upi_qr.png'; // Fallback path
                            }}
                        />
                        <p style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
                            Use any UPI app to scan and complete payment
                        </p>
                    </div>

                    {/* Optional QR Scanner (placeholder) */}
                    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                        <button
                            type="button"
                            onClick={() => setShowScanner(!showScanner)}
                            style={{
                                padding: '8px 16px',
                                fontSize: '14px',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            {showScanner ? 'Hide' : 'Show'} QR Scanner
                        </button>
                        {showScanner && (
                            <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
                                <p style={{ fontSize: '14px', color: '#666' }}>
                                    QR Scanner would be implemented here (using libraries like html5-qrcode or zxing)
                                </p>
                                {/* Placeholder for QR scanner component */}
                            </div>
                        )}
                    </div>

                    {/* Payment Confirmation Button */}
                    <button
                        onClick={handleConfirmPayment}
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '16px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.6 : 1,
                            marginTop: '10px'
                        }}
                    >
                        {loading ? 'Confirming...' : 'I have completed payment'}
                    </button>

                    <button
                        onClick={() => {
                            setDonationId(null);
                            setSuccess('');
                            setError('');
                        }}
                        style={{
                            width: '100%',
                            padding: '10px',
                            fontSize: '14px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginTop: '10px'
                        }}
                    >
                        Cancel / Start Over
                    </button>
                </div>
            )}
        </div>
    );
};

export default DonationForm;
