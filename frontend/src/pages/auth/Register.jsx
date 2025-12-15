import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSchoolSettings } from '../../hooks/useSchoolSettings';
import { GraduationCap, User, Mail, Phone, Lock, CheckCircle, Sparkles, Users, BookOpen, Award } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export default function Register() {
  const navigate = useNavigate();
  const { settings, loading: settingsLoading } = useSchoolSettings();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      
      console.log('Submitting registration...', formData);
      
      // Register user as parent with pending activation status
      const response = await axios.post(`${API_BASE_URL}/auth.php?action=register`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });

      console.log('Registration response:', response.data);

      if (response.data.success) {
        setSuccess(true);
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      console.error('Error response:', err.response?.data);
      
      // Parse the error response which might have multiple JSON objects
      let errorMessage = 'Registration failed. Please try again.';
      if (err.response?.data) {
        const responseText = typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data);
        
        // Try to extract the error message
        if (responseText.includes('Email already exists')) {
          errorMessage = 'This email is already registered. Please use a different email or try logging in.';
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-emerald-700 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your account has been created and is pending approval from an administrator. 
              You will receive an email once your account is approved.
            </p>
            <Link
              to="/login"
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 inline-block"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Welcome Section (60%) */}
      <div className="hidden lg:flex lg:w-[60%] relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        {/* Animated Background Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Welcome Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-white">
          <div className="text-center space-y-6 animate-fade-in">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-lg rounded-full mb-6 animate-bounce-slow">
              <Users className="w-14 h-14 text-white" />
            </div>

            {/* Animated Welcome Text */}
            <div className="space-y-4">
              <h1 className="text-6xl font-bold animate-slide-up">
                Join
              </h1>
              <h2 className="text-5xl font-extrabold bg-gradient-to-r from-yellow-200 via-green-200 to-cyan-200 bg-clip-text text-transparent animate-slide-up" style={{ animationDelay: '0.2s' }}>
                {settings.school_name}
              </h2>
              <div className="flex items-center justify-center gap-2 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
                <p className="text-2xl font-light text-emerald-100">
                  {settings.school_tagline}
                </p>
                <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
              </div>
            </div>

            {/* Benefits */}
            <div className="mt-12 space-y-4 max-w-lg animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg">Access Learning Resources</h3>
                    <p className="text-sm text-emerald-100">Complete course materials and assignments</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg">Track Your Progress</h3>
                    <p className="text-sm text-emerald-100">Monitor grades, attendance, and achievements</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg">Connect with Community</h3>
                    <p className="text-sm text-emerald-100">Engage with teachers, students, and parents</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tagline */}
            <p className="text-xl text-emerald-100 mt-8 animate-slide-up" style={{ animationDelay: '0.8s' }}>
              Empowering Education in Ghana
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form (40%) */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-full mb-4">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{settings.school_name}</h1>
          </div>

          {/* Register Card */}
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
                    className="hidden items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl"
                  >
                    <GraduationCap className="w-12 h-12 text-white" />
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl">
                  <GraduationCap className="w-12 h-12 text-white" />
                </div>
              )}
            </div>

            <div className="mb-6 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
              <p className="text-gray-600">Register to access the system</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <div className="text-red-600 text-sm">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                    placeholder="0244123456"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                    placeholder="Minimum 6 characters"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                    placeholder="Re-enter password"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-lg font-semibold text-lg hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">
                  Sign In
                </Link>
              </p>
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
