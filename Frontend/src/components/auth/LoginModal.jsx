import React, { useState } from 'react';
import { X, Mail, Lock, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login(formData.email, formData.password);
      if (success) {
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      }
    } catch (error) {
      console.error('Login error:', error);
      const message = (error?.message || '').toLowerCase();
      let friendlyMessage = 'Email or password is incorrect. Please try again.';

      if (message.includes('session has expired')) {
        friendlyMessage = 'Email or password is incorrect. Please try again.';
      } else if (message.includes('pending admin approval')) {
        friendlyMessage = 'Your account is awaiting admin approval. Please wait for verification to complete.';
      } else if (message.includes('rejected by the administrator')) {
        friendlyMessage = 'Your account has been rejected. Please contact support for assistance.';
      } else if (message.includes('deactivated')) {
        friendlyMessage = 'Your account has been deactivated. Please contact support.';
      } else if (message.includes('invalid email or password')) {
        friendlyMessage = 'Invalid email or password. Please check your credentials.';
      }

      setError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-cyan-500 p-6 text-center">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-blue-100">Please log in to continue</p>
        </div>

        {/* Form */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Logging in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <button 
                onClick={() => {
                  onClose();
                  navigate('/register');
                }}
                className="text-blue-600 font-semibold hover:text-blue-700 hover:underline"
              >
                Register here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
