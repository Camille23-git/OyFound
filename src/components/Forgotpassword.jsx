import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import emailjs from '@emailjs/browser';
import { auth } from '../firebase';
// import '../css/Forgotpassword.css'; // Removed to fix missing file import error

// Replace these with your actual EmailJS credentials
const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";

function Forgotpassword() {
    const [email, setEmail] = useState('');
    const [inputCode, setInputCode] = useState('');
    const [generatedCode, setGeneratedCode] = useState(null);
    const [step, setStep] = useState(1); // 1: Enter Email, 2: Enter Code
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    
    const navigate = useNavigate();

    // Step 1: Generate 6-digit OTP code and send via EmailJS / Gmail
    const handleSendCode = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!email.trim()) {
            setError('Please enter your email address.');
            return;
        }

        try {
            setLoading(true);
            // Generate a random 6-digit code
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            setGeneratedCode(code);

            // Send Email using EmailJS
            const templateParams = {
                to_email: email,
                otp_code: code,
            };

            await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                templateParams,
                EMAILJS_PUBLIC_KEY
            );

            setMessage(`A 6-digit code has been sent to ${email}`);
            setStep(2);
        } catch (err) {
            console.error('Error sending email code:', err);
            // Fallback option: Use standard Firebase reset email if EmailJS is not configured yet
            try {
                await sendPasswordResetEmail(auth, email);
                setMessage(`A password reset link has been sent to ${email}. Please check your inbox.`);
            } catch (firebaseErr) {
                setError(firebaseErr.message || 'Failed to send verification code.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify the 6-digit code entered by user
    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setError('');

        if (inputCode.trim() !== generatedCode) {
            setError('Invalid code. Please check your Gmail inbox and try again.');
            return;
        }

        try {
            setLoading(true);
            // Trigger Firebase password reset link once code is verified
            await sendPasswordResetEmail(auth, email);
            setMessage('Verification successful! We have sent the final password update link to your Gmail.');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError('Error processing password reset. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-password-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="forgot-card" style={{ background: '#ffffff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%' }}>
                <h2 style={{ color: '#062438', textAlign: 'center', marginBottom: '10px' }}>Forgot Password</h2>
                <p style={{ color: '#666', textAlign: 'center', fontSize: '0.9rem', marginBottom: '20px' }}>
                    {step === 1 ? 'Enter your registered Gmail account to receive a verification code.' : 'Enter the 6-digit code sent to your Gmail account.'}
                </p>

                {message && <div style={{ color: '#22c55e', background: '#eefdf5', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.85rem' }}>{message}</div>}
                {error && <div style={{ color: '#ef4444', background: '#fef2f2', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.85rem' }}>{error}</div>}

                {step === 1 ? (
                    <form onSubmit={handleSendCode}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#062438' }}>Email Address</label>
                            <input 
                                type="email" 
                                placeholder="e.g. student@gmail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            style={{ width: '100%', padding: '12px', background: '#062438', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                        >
                            {loading ? 'Sending Code...' : 'Send Verification Code'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyCode}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#062438' }}>Verification Code</label>
                            <input 
                                type="text" 
                                maxLength="6"
                                placeholder="Enter 6-digit code"
                                value={inputCode}
                                onChange={(e) => setInputCode(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', letterSpacing: '4px', textAlign: 'center', fontSize: '1.2rem' }}
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            style={{ width: '100%', padding: '12px', background: '#062438', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', marginBottom: '10px' }}
                        >
                            {loading ? 'Verifying...' : 'Verify Code'}
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setStep(1)}
                            style={{ width: '100%', padding: '8px', background: 'transparent', color: '#0284c7', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                            Back to Email
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default Forgotpassword;