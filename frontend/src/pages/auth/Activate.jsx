import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export default function Activate() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState('loading'); // loading, success, error, expired, already_activated
  const [message, setMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      activateAccount();
    } else {
      setStatus('error');
      setMessage('No activation token provided.');
    }
  }, [token]);

  const activateAccount = async () => {
    try {
      // First verify the token
      const verifyResponse = await axios.get(`${API_BASE_URL}/email_activation.php?action=verify&token=${token}`);
      
      if (!verifyResponse.data.valid) {
        if (verifyResponse.data.already_activated) {
          setStatus('already_activated');
          setMessage('This account has already been activated.');
        } else if (verifyResponse.data.expired) {
          setStatus('expired');
          setMessage('This activation link has expired.');
        } else {
          setStatus('error');
          setMessage(verifyResponse.data.error || 'Invalid activation token.');
        }
        return;
      }

      setUserName(verifyResponse.data.user_name);

      // Now activate the account
      const activateResponse = await axios.post(`${API_BASE_URL}/email_activation.php?action=activate`, { token });
      
      if (activateResponse.data.success) {
        setStatus('success');
        setMessage(activateResponse.data.message);
      } else {
        setStatus('error');
        setMessage(activateResponse.data.error || 'Failed to activate account.');
      }
    } catch (error) {
      console.error('Activation error:', error);
      setStatus('error');
      setMessage(error.response?.data?.error || 'An error occurred during activation.');
    }
  };

  const handleResendActivation = async (e) => {
    e.preventDefault();
    if (!resendEmail) return;

    setResending(true);
    try {
      await axios.get(`${API_BASE_URL}/email_activation.php?action=resend&email=${encodeURIComponent(resendEmail)}`);
      setResendSuccess(true);
    } catch (error) {
      // Still show success to not reveal if email exists
      setResendSuccess(true);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Activating Your Account</h1>
              <p className="text-gray-600">Please wait while we verify your activation link...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Activated!</h1>
              {userName && <p className="text-gray-600 mb-4">Welcome, {userName}!</p>}
              <p className="text-gray-600 mb-6">{message}</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Go to Login <ArrowRight className="w-5 h-5" />
              </Link>
            </>
          )}

          {status === 'already_activated' && (
            <>
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Already Activated</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Go to Login <ArrowRight className="w-5 h-5" />
              </Link>
            </>
          )}

          {status === 'expired' && (
            <>
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-orange-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Expired</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              
              {!resendSuccess ? (
                <form onSubmit={handleResendActivation} className="space-y-4">
                  <p className="text-sm text-gray-500">Enter your email to receive a new activation link:</p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="Your email address"
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <button
                      type="submit"
                      disabled={resending}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                    >
                      {resending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-green-50 text-green-700 p-4 rounded-lg">
                  <p>If this email is registered, a new activation link has been sent.</p>
                </div>
              )}
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Activation Failed</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              
              {!resendSuccess ? (
                <form onSubmit={handleResendActivation} className="space-y-4">
                  <p className="text-sm text-gray-500">Need a new activation link?</p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="Your email address"
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <button
                      type="submit"
                      disabled={resending}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                    >
                      {resending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Resend'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-4">
                  <p>If this email is registered, a new activation link has been sent.</p>
                </div>
              )}
              
              <div className="mt-6 pt-6 border-t">
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
