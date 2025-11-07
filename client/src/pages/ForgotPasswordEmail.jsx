import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOTP } from '../api/userApi';
import { toast } from 'react-toastify';
import logo from '../assets/logo.png'; // Add your logo

export default function ForgotPasswordEmail() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await sendOTP({ email });
      localStorage.setItem('resetEmail', email);
      toast.success('OTP sent to your email!');
      navigate('/verify-otp');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-yellow-200">
        
        {/* Logo + Title */}
        <div className="flex items-center justify-center mb-8 gap-3">
          <img 
            src={logo} 
            alt="Logo" 
            className="w-14 h-14 object-contain rounded-full border-2 border-yellow-600 p-1" 
          />
          <div>
            <h1 className="text-3xl font-bold text-yellow-600">RITHU ALERT EYE</h1>
            <p className="text-sm text-gray-600 -mt-1">Forgot Password?</p>
          </div>
        </div>

        <p className="text-center text-gray-600 mb-6">
          Enter your email to receive an OTP
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-600 focus:border-yellow-600 transition text-gray-800 placeholder-gray-400"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span>Sending...</span>
              </>
            ) : (
              'Send OTP'
            )}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-yellow-700 hover:text-yellow-800 font-medium transition text-sm"
          >
            Back to Login
          </button>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center text-xs text-gray-500">
          © 2025 RITHU ALERT EYE. All rights reserved.
        </div>
      </div>
    </div>
  );
}