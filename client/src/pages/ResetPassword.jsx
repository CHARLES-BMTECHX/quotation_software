import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetPassword } from '../api/userApi';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await resetPassword({ newPassword: password });
      setSuccess('Password reset successfully! Redirecting...');
      localStorage.removeItem('resetToken');
      localStorage.removeItem('resetEmail');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gold text-center mb-2">Set New Password</h1>
        <p className="text-gray-600 text-center mb-6">Enter a strong password</p>

        {error && <p className="text-red-600 text-sm text-center mb-4">{error}</p>}
        {success && <p className="text-green-600 text-sm text-center mb-4">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold"
            minLength="6"
            required
          />
          <p className="text-xs text-gray-500">Minimum 6 characters</p>
          <button
            type="submit"
            disabled={loading}
              className='bg-yellow-600 text-white p-4 rounded-xl text-center w-full cursor-pointer hover:bg-opacity-90 transition'
            // className="w-full bg-gold text-white font-bold py-3 rounded-lg hover:bg-opacity-90 transition disabled:opacity-70"
          >
            {loading ? 'Saving...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}