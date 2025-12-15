import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSchoolSettings } from '../../hooks/useSchoolSettings';
import { GraduationCap, Mail, ArrowLeft, CheckCircle, Sparkles, Shield, Key, Lock } from 'lucide-react';
import axios from 'axios';

export default function ForgotPassword() {
  const { settings, loading: settingsLoading } = useSchoolSettings();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('https://eea.mcaforo.com/backend/api/auth.php?action=forgot_password', {
        email
      });

      if (response.data.success) {
        setSuccess(true);
      } else {
        setError(response.data.message || 'Failed to send reset link. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-600 to-red-700 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email!</h2>
            <p className="text-gray-600 mb-6">
              We've sent a password reset link to <strong>{email}</strong>. 
              Please check your inbox and follow the instructions to reset your password.
            </p>
            <Link
              to="/login"
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-200 inline-block"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Welcome Section (60%) */}
      <div className="hidden lg:flex lg:w-[60%] relative bg-gradient-to-br from-orange-600 via-red-600 to-pink-700 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        {/* Animated Background Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Welcome Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-white">
          <div className="text-center space-y-6 animate-fade-in">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-lg rounded-full mb-6 animate-bounce-slow">
              <Shield className="w-14 h-14 text-white" />
            </div>

            {/* Animated Welcome Text */}
            <div className="space-y-4">
              <h1 className="text-6xl font-bold animate-slide-up">
                {settings.school_name}
              </h1>
              <h2 className="text-5xl font-extrabold bg-gradient-to-r from-yellow-200 via-orange-200 to-pink-200 bg-clip-text text-transparent animate-slide-up" style={{ animationDelay: '0.2s' }}>
                Password Reset
              </h2>
              <div className="flex items-center justify-center gap-2 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
                <p className="text-2xl font-light text-orange-100">
                  {settings.school_tagline}
                </p>
                <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
              </div>
            </div>

            {/* Security Features */}
            <div className="mt-12 space-y-4 max-w-lg animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg">Email Verification</h3>
                    <p className="text-sm text-orange-100">Secure reset link sent to your inbox</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <Key className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg">One-Time Link</h3>
                    <p className="text-sm text-orange-100">Reset link expires after single use</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg">Encrypted Process</h3>
                    <p className="text-sm text-orange-100">Your data is protected end-to-end</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tagline */}
            <p className="text-xl text-orange-100 mt-8 animate-slide-up" style={{ animationDelay: '0.8s' }}>
              Your Security is Our Priority
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Forgot Password Form (40%) */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-full mb-4">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{settings.school_name}</h1>
          </div>

          {/* Forgot Password Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {/* School Logo */}
            <div className="flex justify-center mb-6">
              {settings.school_logo ? (
                <>
                  <img 
                    src={settings.school_logo} 
                    alt={settings.school_name}
                    className="h-20 w-auto object-contain"
                    onError={(e) => {
                      console.error('Logo failed to load:', settings.school_logo);
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                    onLoad={() => console.log('Logo loaded successfully:', settings.school_logo)}
                  />
                  <div 
                    className="hidden items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl"
                  >
                    <GraduationCap className="w-12 h-12 text-white" />
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl">
                  <GraduationCap className="w-12 h-12 text-white" />
                </div>
              )}
            </div>

            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
              <p className="text-gray-600">No worries! Enter your email and we'll send you reset instructions.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-lg font-semibold text-lg hover:from-orange-700 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending Reset Link...
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            <div className="mt-8">
              <Link 
                to="/login" 
                className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-gray-500 text-sm">
            <p>&copy; 2025 {settings.school_name}. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
          opacity: 0;
        }

        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
