/**
 * OTP Login Component
 * Demo OTP authentication for victims
 */

import React, { useState } from 'react';
import { generateOTP, verifyOTP } from '../../services/api/victimApi';
import './OTPLogin.css';

const OTPLogin = ({ onLoginSuccess }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('phone'); // 'phone' or 'otp'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [receivedOtp, setReceivedOtp] = useState(null);
    const [otpInfo, setOtpInfo] = useState(null);

    // Normalize phone number (remove spaces, dashes, etc.)
    const normalizePhone = (phone) => {
        return phone.replace(/[\s\-\(\)]/g, '');
    };

    // Handle phone number submission
    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const normalizedPhone = normalizePhone(phoneNumber);
            
            if (normalizedPhone.length < 10) {
                setError('Please enter a valid phone number');
                setLoading(false);
                return;
            }

            const data = await generateOTP(normalizedPhone);
            
            // In demo mode, OTP is returned directly
            setReceivedOtp(data.otp);
            setOtpInfo(data);
            setStep('otp');
        } catch (err) {
            setError(err.message || 'Failed to generate OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle OTP verification
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const normalizedPhone = normalizePhone(phoneNumber);
            const data = await verifyOTP(normalizedPhone, otp);
            
            // Store token
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Call success callback
            if (onLoginSuccess) {
                onLoginSuccess(data.user);
            }
        } catch (err) {
            setError(err.message || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle back to phone input
    const handleBack = () => {
        setStep('phone');
        setOtp('');
        setError('');
        setReceivedOtp(null);
        setOtpInfo(null);
    };

    return (
        <div className="otp-login">
            <div className="otp-login-card">
                <h2 className="otp-login-title">Victim Portal Login</h2>
                <p className="otp-login-subtitle">Enter your phone number to receive OTP</p>

                {error && (
                    <div className="otp-error">
                        {error}
                    </div>
                )}

                {step === 'phone' ? (
                    <form onSubmit={handleRequestOTP} className="otp-form">
                        <div className="form-group">
                            <label htmlFor="phone">Phone Number *</label>
                            <input
                                id="phone"
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="Enter your phone number"
                                required
                                disabled={loading}
                                className="form-input"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !phoneNumber}
                            className="btn btn-primary btn-block"
                        >
                            {loading ? 'Sending OTP...' : 'Send OTP'}
                        </button>

                        <div className="demo-note">
                            <strong>Demo Mode:</strong> OTP will be displayed after clicking "Send OTP"
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOTP} className="otp-form">
                        <div className="otp-sent-message">
                            <p>OTP sent to: <strong>{phoneNumber}</strong></p>
                            {receivedOtp && (
                                <div className="demo-otp-display">
                                    <p><strong>Demo OTP:</strong></p>
                                    <div className="demo-otp-code">{receivedOtp}</div>
                                    <p className="demo-otp-note">(This is shown only in demo mode)</p>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="otp">Enter OTP *</label>
                            <input
                                id="otp"
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="Enter 6-digit OTP"
                                required
                                maxLength="6"
                                disabled={loading}
                                className="form-input otp-input"
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6}
                            className="btn btn-primary btn-block"
                        >
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>

                        <button
                            type="button"
                            onClick={handleBack}
                            disabled={loading}
                            className="btn btn-secondary btn-block"
                        >
                            Back
                        </button>

                        {otpInfo?.rateLimit && (
                            <div className="rate-limit-info">
                                <p>Remaining attempts: {otpInfo.rateLimit.remainingAttempts}</p>
                            </div>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
};

export default OTPLogin;
