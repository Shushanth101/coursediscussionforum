import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setMessage(data.message || 'OTP sent to your email.');
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/users/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Invalid OTP');
      }

      setMessage('OTP verified successfully.');
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, password: newPassword })
      });
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setMessage('Password reset successfully! Redirecting...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-md w-full bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 p-8 rounded-2xl shadow-2xl shadow-black/50 animate-[slideUp_0.5s_ease-out]">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
            {step === 1 && "Forgot Password"}
            {step === 2 && "Verify OTP"}
            {step === 3 && "Reset Password"}
          </h2>
          <p className="text-slate-400">
            {step === 1 && "Enter your email to receive a reset code."}
            {step === 2 && `We sent a 4-digit code to ${email}`}
            {step === 3 && "Enter your new password."}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        {message && !error && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-500 text-sm p-3 rounded-lg mb-6 text-center">
            {message}
          </div>
        )}

        {step === 1 && (
          <form className="space-y-5" onSubmit={handleSendEmail}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-400">Email Address</label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:text-gray-400 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/30 hover:-translate-y-0.5 transition-all active:translate-y-0 flex justify-center items-center"
            >
              {isLoading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="space-y-5" onSubmit={handleVerifyOtp}>
            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-medium text-slate-400">4-Digit OTP</label>
              <input
                type="text"
                id="otp"
                maxLength="4"
                className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all tracking-[0.5em] text-center text-xl font-bold"
                placeholder="••••"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:text-gray-400 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/30 hover:-translate-y-0.5 transition-all active:translate-y-0 flex justify-center items-center"
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
        )}

        {step === 3 && (
          <form className="space-y-5" onSubmit={handleResetPassword}>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-400">New Password</label>
              <input
                type="password"
                id="password"
                className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading || message.includes('Redirecting')}
              className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:text-gray-400 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/30 hover:-translate-y-0.5 transition-all active:translate-y-0 flex justify-center items-center"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="text-center mt-6 text-sm text-slate-400">
          Remember your password?
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium ml-1 hover:underline transition-colors">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
