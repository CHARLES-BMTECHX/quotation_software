import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyOTP } from '../api/userApi';

export default function VerifyOTP() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const email = localStorage.getItem('resetEmail');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await verifyOTP({ email, otp });
      localStorage.setItem('resetToken', res.data.token);
      navigate('/reset-password');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gold text-center mb-2">Enter OTP</h1>
        <p className="text-gray-600 text-center mb-6">Check your email: <strong>{email}</strong></p>

        {error && <p className="text-red-600 text-sm text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest font-mono"
            maxLength="6"
            required
          />
          <button
            type="submit"
            disabled={loading}
              className='bg-yellow-600 text-white p-4 rounded-xl text-center w-full cursor-pointer hover:bg-opacity-90 transition'
            // className="w-full bg-gold text-white font-bold py-3 rounded-lg hover:bg-opacity-90 transition disabled:opacity-70"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
      </div>
    </div>
  );
}