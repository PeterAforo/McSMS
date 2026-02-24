import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, User } from 'lucide-react';

export default function LeaveManagement() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/leave_requests.php`);
      setLeaveRequests(response.data.requests || []);
    } catch (error) {
      // Sample data
      setLeaveRequests([
        { id: 1, employee_name: 'John Mensah', type: 'Annual Leave', start_date: '2026-03-01', end_date: '2026-03-05', days: 5, status: 'pending', reason: 'Family vacation' },
        { id: 2, employee_name: 'Grace Asante', type: 'Sick Leave', start_date: '2026-02-28', end_date: '2026-02-28', days: 1, status: 'approved', reason: 'Medical appointment' },
        { id: 3, employee_name: 'Kwame Boateng', type: 'Personal Leave', start_date: '2026-03-10', end_date: '2026-03-11', days: 2, status: 'pending', reason: 'Personal matters' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
  };

  const handleReject = async (id) => {
    setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
  };

  const filteredRequests = leaveRequests.filter(r => filter === 'all' || r.status === filter);

  const stats = {
    pending: leaveRequests.filter(r => r.status === 'pending').length,
    approved: leaveRequests.filter(r => r.status === 'approved').length,
    rejected: leaveRequests.filter(r => r.status === 'rejected').length
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="text-purple-600" /> Leave Management
          </h1>
          <p className="text-gray-600">Review and manage leave requests</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div 
          onClick={() => setFilter('pending')}
          className={`bg-white rounded-xl p-4 shadow-sm border cursor-pointer ${filter === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="text-yellow-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div 
          onClick={() => setFilter('approved')}
          className={`bg-white rounded-xl p-4 shadow-sm border cursor-pointer ${filter === 'approved' ? 'ring-2 ring-green-500' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
          </div>
        </div>
        <div 
          onClick={() => setFilter('rejected')}
          className={`bg-white rounded-xl p-4 shadow-sm border cursor-pointer ${filter === 'rejected' ? 'ring-2 ring-red-500' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Requests */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">Leave Requests</h2>
          <button onClick={() => setFilter('all')} className="text-sm text-purple-600 hover:underline">
            View All
          </button>
        </div>
        <div className="divide-y">
          {filteredRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No leave requests found</div>
          ) : (
            filteredRequests.map(request => (
              <div key={request.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="text-purple-600" size={18} />
                    </div>
                    <div>
                      <p className="font-medium">{request.employee_name}</p>
                      <p className="text-sm text-gray-600">{request.type}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} /> {request.days} day(s)
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Reason: {request.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                    {request.status === 'pending' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
