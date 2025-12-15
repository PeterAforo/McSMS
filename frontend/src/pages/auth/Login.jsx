import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../services/api';
import { useSchoolSettings } from '../../hooks/useSchoolSettings';
import { GraduationCap, Mail, Lock, AlertCircle, Sparkles } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { settings, loading: settingsLoading } = useSchoolSettings();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      const { user, token } = response.data;
      
      login(user, token);
      
      // Redirect based on user type
      switch (user.user_type) {
        case 'super_admin':
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'parent':
          navigate('/parent/dashboard');
          break;
        case 'teacher':
          navigate('/teacher/dashboard');
          break;
        case 'finance':
          navigate('/finance/dashboard');
          break;
        default:
          navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Welcome Section (60%) */}
      <div className="hidden lg:flex lg:w-[60%] relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        {/* Animated Background Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Welcome Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-white">
          <div className="text-center space-y-6 animate-fade-in">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-lg rounded-full mb-6 animate-bounce-slow">
              <GraduationCap className="w-14 h-14 text-white" />
            </div>

            {/* Animated Welcome Text */}
            <div className="space-y-4">
              <h1 className="text-6xl font-bold animate-slide-up">
                Welcome to
              </h1>
              <h2 className="text-5xl font-extrabold bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200 bg-clip-text text-transparent animate-slide-up" style={{ animationDelay: '0.2s' }}>
                {settings.school_name}
              </h2>
              <div className="flex items-center justify-center gap-2 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
                <p className="text-2xl font-light text-blue-100">
                  {settings.school_tagline}
                </p>
                <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
              </div>
            </div>

            {/* Features */}
            <div className="mt-12 grid grid-cols-2 gap-6 max-w-2xl animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <div className="text-3xl mb-2">📚</div>
                <h3 className="font-semibold text-lg mb-1">Smart Learning</h3>
                <p className="text-sm text-blue-100">AI-powered education platform</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <div className="text-3xl mb-2">📊</div>
                <h3 className="font-semibold text-lg mb-1">Analytics</h3>
                <p className="text-sm text-blue-100">Real-time insights & reports</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <div className="text-3xl mb-2">🚌</div>
                <h3 className="font-semibold text-lg mb-1">Transport</h3>
                <p className="text-sm text-blue-100">GPS tracking & management</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <div className="text-3xl mb-2">🤖</div>
                <h3 className="font-semibold text-lg mb-1">AI Features</h3>
                <p className="text-sm text-blue-100">Intelligent automation</p>
              </div>
            </div>

            {/* Tagline */}
            <p className="text-xl text-blue-100 mt-8 animate-slide-up" style={{ animationDelay: '0.8s' }}>
              Ghana Schools - GES & Cambridge Curriculum
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form (40%) */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full mb-4">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{settings.school_name}</h1>
          </div>

          {/* Login Card */}
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
                    className="hidden items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl"
                  >
                    <GraduationCap className="w-12 h-12 text-white" />
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
                  <GraduationCap className="w-12 h-12 text-white" />
                </div>
              )}
            </div>

            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-600">Sign in to continue to your dashboard</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="admin@school.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Register here
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
