import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { 
  AlertTriangle, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Database,
  Users,
  FileText,
  DollarSign,
  Calendar,
  Upload,
  Shield,
  Loader2
} from 'lucide-react';

const SystemReset = () => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Reset options
  const [options, setOptions] = useState({
    keep_all_users: false,
    reset_terms: false,
    reset_academic_years: false,
    clear_uploads: true
  });

  useEffect(() => {
    fetchPreview();
  }, []);

  const fetchPreview = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/system_reset.php?action=preview`);
      setPreview(response.data);
    } catch (err) {
      setError('Failed to load reset preview: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (confirmationCode !== 'RESET-CONFIRM') {
      setError('Please enter the correct confirmation code: RESET-CONFIRM');
      return;
    }

    try {
      setResetting(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const response = await axios.post(
        `${API_BASE_URL}/system_reset.php`,
        {
          confirmation_code: confirmationCode,
          admin_user_id: user.id,
          ...options
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setResult(response.data);
      setShowConfirmModal(false);
      setConfirmationCode('');
      
      // Refresh preview after reset
      setTimeout(() => {
        fetchPreview();
      }, 1000);
      
    } catch (err) {
      setError('Reset failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setResetting(false);
    }
  };

  const getIconForTable = (table) => {
    if (table.includes('student') || table.includes('teacher') || table.includes('parent') || table.includes('user')) {
      return <Users className="w-4 h-4" />;
    }
    if (table.includes('invoice') || table.includes('payment') || table.includes('fee') || table.includes('payroll')) {
      return <DollarSign className="w-4 h-4" />;
    }
    if (table.includes('attendance') || table.includes('timetable') || table.includes('term')) {
      return <Calendar className="w-4 h-4" />;
    }
    return <Database className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading system data...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <RefreshCw className="w-8 h-8 text-red-600" />
          System Reset
        </h1>
        <p className="text-gray-600 mt-2">
          Reset the system for a new school setup. This will delete all demo/existing data.
        </p>
      </div>

      {/* Warning Banner */}
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
        <div className="flex items-start">
          <AlertTriangle className="w-6 h-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-semibold">Warning: Destructive Action</h3>
            <p className="text-red-700 mt-1">
              This action will permanently delete all data from the system. 
              This cannot be undone. Make sure you have a backup before proceeding.
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
          <XCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Success Result */}
      {result && result.success && (
        <div className="bg-green-50 border border-green-400 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
            <h3 className="text-green-800 font-semibold text-lg">System Reset Completed</h3>
          </div>
          <p className="text-green-700 mb-4">
            The system has been reset successfully at {result.timestamp}.
          </p>
          <div className="bg-white rounded-lg p-4 max-h-60 overflow-y-auto">
            <h4 className="font-medium text-gray-700 mb-2">Reset Summary:</h4>
            <ul className="space-y-1 text-sm">
              {result.reset_log?.map((item, index) => (
                <li key={index} className="flex items-center text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  {item.table}: {item.records_deleted} records deleted
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Preview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Database className="w-5 h-5 mr-2 text-blue-600" />
            Data to be Deleted
          </h2>
          
          {preview && (
            <>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl font-bold text-red-600">
                  {preview.total_records?.toLocaleString()}
                </span>
                <span className="text-gray-600 ml-2">total records will be deleted</span>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left py-2 px-3">Table</th>
                      <th className="text-right py-2 px-3">Records</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.preview?.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-3 flex items-center">
                          {getIconForTable(item.table)}
                          <span className="ml-2">{item.description}</span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {item.record_count > 0 ? (
                            <span className="text-red-600 font-semibold">
                              {item.record_count.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Reset Options & Preserved Data */}
        <div className="space-y-6">
          {/* Preserved Data */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-green-600" />
              Data Preserved
            </h2>
            <p className="text-gray-600 mb-3 text-sm">
              The following will NOT be deleted:
            </p>
            <ul className="space-y-2">
              {preview?.preserved?.map((item, index) => (
                <li key={index} className="flex items-center text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Reset Options */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-purple-600" />
              Reset Options
            </h2>
            
            <div className="space-y-4">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.clear_uploads}
                  onChange={(e) => setOptions({...options, clear_uploads: e.target.checked})}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <span className="text-gray-700 font-medium flex items-center">
                    <Upload className="w-4 h-4 mr-1" />
                    Clear uploaded files
                  </span>
                  <p className="text-gray-500 text-sm">Delete all uploaded images and documents</p>
                </div>
              </label>

              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.reset_terms}
                  onChange={(e) => setOptions({...options, reset_terms: e.target.checked})}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <span className="text-gray-700 font-medium flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Reset academic terms
                  </span>
                  <p className="text-gray-500 text-sm">Delete all term definitions</p>
                </div>
              </label>

              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.reset_academic_years}
                  onChange={(e) => setOptions({...options, reset_academic_years: e.target.checked})}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <span className="text-gray-700 font-medium">Reset academic years</span>
                  <p className="text-gray-500 text-sm">Delete all academic year definitions</p>
                </div>
              </label>

              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.keep_all_users}
                  onChange={(e) => setOptions({...options, keep_all_users: e.target.checked})}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <span className="text-gray-700 font-medium flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    Keep all user accounts
                  </span>
                  <p className="text-gray-500 text-sm">Preserve non-admin user accounts (teachers, students, parents)</p>
                </div>
              </label>
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={() => setShowConfirmModal(true)}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center transition-colors"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Reset System
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Confirm System Reset</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              You are about to permanently delete <strong className="text-red-600">
                {preview?.total_records?.toLocaleString()} records
              </strong> from the system.
            </p>
            
            <p className="text-gray-600 mb-4">
              To confirm, type <code className="bg-gray-100 px-2 py-1 rounded font-mono text-red-600">RESET-CONFIRM</code> below:
            </p>
            
            <input
              type="text"
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value.toUpperCase())}
              placeholder="Type RESET-CONFIRM"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 font-mono focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmationCode('');
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={confirmationCode !== 'RESET-CONFIRM' || resetting}
                className={`flex-1 font-semibold py-2 px-4 rounded-lg flex items-center justify-center transition-colors ${
                  confirmationCode === 'RESET-CONFIRM' && !resetting
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {resetting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Confirm Reset
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemReset;
