import { useState, useEffect } from 'react';
import { 
  Briefcase, Calendar, DollarSign, FileText, Clock, CheckCircle,
  XCircle, AlertCircle, Plus, Download, Upload, Eye, Send,
  User, Building, Phone, Mail, MapPin, CreditCard, Loader2,
  ChevronRight, Filter, Search, RefreshCw, Bell, History,
  CalendarDays, Plane, Heart, Baby, GraduationCap, Umbrella
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function HRPortal() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [teacherData, setTeacherData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Data states
  const [hrProfile, setHrProfile] = useState(null);
  const [leaveBalance, setLeaveBalance] = useState({
    annual: { total: 21, used: 5, pending: 2 },
    sick: { total: 10, used: 2, pending: 0 },
    personal: { total: 3, used: 1, pending: 0 },
    maternity: { total: 90, used: 0, pending: 0 },
    study: { total: 5, used: 0, pending: 0 }
  });
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // Form states
  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: '',
    contact_during_leave: '',
    handover_to: ''
  });

  const [documentRequest, setDocumentRequest] = useState({
    document_type: '',
    purpose: '',
    copies: 1,
    urgent: false
  });

  useEffect(() => {
    fetchHRData();
  }, []);

  const fetchHRData = async () => {
    try {
      setLoading(true);
      
      // Fetch teacher data
      const teacherRes = await axios.get(`${API_BASE_URL}/teachers.php?user_id=${user?.id}`);
      const teachers = teacherRes.data.teachers || [];
      let teacherId = user?.id;
      
      if (teachers.length > 0) {
        setTeacherData(teachers[0]);
        teacherId = teachers[0].id;
      }

      // Fetch HR data from backend - always use real data
      const hrRes = await axios.get(`${API_BASE_URL}/hr.php?teacher_id=${teacherId}`);
      if (hrRes.data.success) {
        setHrProfile(hrRes.data.profile || null);
        setLeaveBalance(hrRes.data.leave_balance || {
          annual: { total: 21, used: 0, pending: 0 },
          sick: { total: 10, used: 0, pending: 0 },
          personal: { total: 3, used: 0, pending: 0 },
          maternity: { total: 90, used: 0, pending: 0 },
          study: { total: 5, used: 0, pending: 0 }
        });
        setLeaveRequests(hrRes.data.leave_requests || []);
        setPayslips(hrRes.data.payslips || []);
        setDocuments(hrRes.data.documents || []);
        setAnnouncements(hrRes.data.announcements || []);
      }
    } catch (error) {
      console.error('Error fetching HR data:', error);
      // Set empty data instead of mock data
      setHrProfile(null);
      setLeaveRequests([]);
      setPayslips([]);
      setDocuments([]);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/hr.php`, {
        action: 'submit_leave',
        teacher_id: teacherData?.id || user?.id,
        ...leaveForm
      });
      
      if (response.data.success) {
        // Refresh data from server
        await fetchHRData();
        setShowLeaveModal(false);
        setLeaveForm({
          leave_type: 'annual',
          start_date: '',
          end_date: '',
          reason: '',
          contact_during_leave: '',
          handover_to: ''
        });
      } else {
        alert(response.data.error || 'Failed to submit leave request');
      }
    } catch (error) {
      console.error('Error submitting leave:', error);
      alert('Failed to submit leave request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDocumentRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/hr.php`, {
        action: 'request_document',
        teacher_id: teacherData?.id || user?.id,
        ...documentRequest
      });
      
      if (response.data.success) {
        await fetchHRData();
        setShowDocumentModal(false);
        setDocumentRequest({
          document_type: '',
          purpose: '',
          copies: 1,
          urgent: false
        });
      } else {
        alert(response.data.error || 'Failed to submit document request');
      }
    } catch (error) {
      console.error('Error requesting document:', error);
      alert('Failed to submit document request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const getLeaveIcon = (type) => {
    switch (type) {
      case 'annual': return <Plane className="w-4 h-4" />;
      case 'sick': return <Heart className="w-4 h-4" />;
      case 'maternity': return <Baby className="w-4 h-4" />;
      case 'study': return <GraduationCap className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="flex items-center gap-1 text-green-700 bg-green-100 px-2 py-1 rounded-full text-xs"><CheckCircle className="w-3 h-3" /> Approved</span>;
      case 'pending':
        return <span className="flex items-center gap-1 text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full text-xs"><Clock className="w-3 h-3" /> Pending</span>;
      case 'rejected':
        return <span className="flex items-center gap-1 text-red-700 bg-red-100 px-2 py-1 rounded-full text-xs"><XCircle className="w-3 h-3" /> Rejected</span>;
      default:
        return <span className="text-gray-600 text-xs">{status}</span>;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Briefcase },
    { id: 'leave', label: 'Leave Management', icon: Calendar },
    { id: 'payroll', label: 'Payroll', icon: DollarSign },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'profile', label: 'HR Profile', icon: User }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Briefcase className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading HR Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="text-blue-600" />
            HR Portal
          </h1>
          <p className="text-gray-600 mt-1">Manage your leave, payroll, and HR documents</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowLeaveModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Request Leave
          </button>
          <button 
            onClick={() => setShowDocumentModal(true)}
            className="btn bg-gray-100 hover:bg-gray-200 flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Request Document
          </button>
        </div>
      </div>

      {/* HR Announcements */}
      {announcements.length > 0 && (
        <div className="space-y-2">
          {announcements.slice(0, 2).map(ann => (
            <div 
              key={ann.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                ann.priority === 'high' ? 'bg-red-50 border border-red-200' :
                ann.priority === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                'bg-blue-50 border border-blue-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className={`w-5 h-5 ${
                  ann.priority === 'high' ? 'text-red-600' :
                  ann.priority === 'medium' ? 'text-yellow-600' :
                  'text-blue-600'
                }`} />
                <div>
                  <p className="font-medium">{ann.title}</p>
                  <p className="text-sm text-gray-600">{ann.message}</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">{new Date(ann.date).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-2 border-b pb-4">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Annual Leave</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {leaveBalance.annual.total - leaveBalance.annual.used - leaveBalance.annual.pending}
                  </p>
                  <p className="text-xs text-gray-500">days remaining</p>
                </div>
                <Plane className="w-8 h-8 text-blue-200" />
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sick Leave</p>
                  <p className="text-2xl font-bold text-green-600">
                    {leaveBalance.sick.total - leaveBalance.sick.used}
                  </p>
                  <p className="text-xs text-gray-500">days remaining</p>
                </div>
                <Heart className="w-8 h-8 text-green-200" />
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Requests</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {leaveRequests.filter(r => r.status === 'pending').length}
                  </p>
                  <p className="text-xs text-gray-500">awaiting approval</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-200" />
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Next Payroll</p>
                  <p className="text-2xl font-bold text-purple-600">Dec 23</p>
                  <p className="text-xs text-gray-500">15 days away</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-200" />
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Leave Requests */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Recent Leave Requests
                </h3>
                <button 
                  onClick={() => setActiveTab('leave')}
                  className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                >
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {leaveRequests.slice(0, 3).map(request => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {getLeaveIcon(request.type)}
                      </div>
                      <div>
                        <p className="font-medium capitalize">{request.type} Leave</p>
                        <p className="text-sm text-gray-600">
                          {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Payslips */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Recent Payslips
                </h3>
                <button 
                  onClick={() => setActiveTab('payroll')}
                  className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                >
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {payslips.slice(0, 3).map(payslip => (
                  <div key={payslip.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{payslip.month}</p>
                      <p className="text-sm text-gray-600">Paid on {new Date(payslip.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">GH₵ {payslip.net.toLocaleString()}</p>
                      <button className="text-blue-600 text-xs hover:underline flex items-center gap-1">
                        <Download className="w-3 h-3" /> Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Management Tab */}
      {activeTab === 'leave' && (
        <div className="space-y-6">
          {/* Leave Balance Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(leaveBalance).map(([type, balance]) => (
              <div key={type} className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getLeaveIcon(type)}
                  <span className="font-medium capitalize">{type}</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-bold">{balance.total - balance.used - balance.pending}</span>
                    <span className="text-gray-500 text-sm">/{balance.total}</span>
                  </div>
                  {balance.pending > 0 && (
                    <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                      {balance.pending} pending
                    </span>
                  )}
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500"
                    style={{ width: `${((balance.total - balance.used - balance.pending) / balance.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Leave Requests Table */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Leave History</h3>
              <button 
                onClick={() => setShowLeaveModal(true)}
                className="btn btn-primary btn-sm flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> New Request
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Type</th>
                    <th className="text-left py-3 px-4">Period</th>
                    <th className="text-left py-3 px-4">Days</th>
                    <th className="text-left py-3 px-4">Reason</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Approved By</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.map(request => (
                    <tr key={request.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getLeaveIcon(request.type)}
                          <span className="capitalize">{request.type}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">{request.days}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">{request.reason}</td>
                      <td className="py-3 px-4">{getStatusBadge(request.status)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{request.approved_by || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Tab */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          {/* Salary Summary */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Current Month Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Gross Salary</p>
                <p className="text-2xl font-bold text-green-600">GH₵ 4,500.00</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Deductions</p>
                <p className="text-2xl font-bold text-red-600">GH₵ 675.00</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Net Salary</p>
                <p className="text-2xl font-bold text-blue-600">GH₵ 3,825.00</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">YTD Earnings</p>
                <p className="text-2xl font-bold text-purple-600">GH₵ 45,900.00</p>
              </div>
            </div>
          </div>

          {/* Deductions Breakdown */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Deductions Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">SSNIT (5.5%)</p>
                <p className="font-bold">GH₵ 247.50</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Income Tax</p>
                <p className="font-bold">GH₵ 337.50</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Health Insurance</p>
                <p className="font-bold">GH₵ 90.00</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Other</p>
                <p className="font-bold">GH₵ 0.00</p>
              </div>
            </div>
          </div>

          {/* Payslips History */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Payslip History</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Month</th>
                    <th className="text-left py-3 px-4">Gross</th>
                    <th className="text-left py-3 px-4">Deductions</th>
                    <th className="text-left py-3 px-4">Net</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payslips.map(payslip => (
                    <tr key={payslip.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{payslip.month}</td>
                      <td className="py-3 px-4">GH₵ {payslip.gross.toLocaleString()}</td>
                      <td className="py-3 px-4 text-red-600">-GH₵ {payslip.deductions.toLocaleString()}</td>
                      <td className="py-3 px-4 font-bold text-green-600">GH₵ {payslip.net.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className="text-green-700 bg-green-100 px-2 py-1 rounded-full text-xs">
                          {payslip.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button className="btn btn-sm bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center gap-1">
                          <Download className="w-3 h-3" /> Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">My Documents</h3>
            <button 
              onClick={() => setShowDocumentModal(true)}
              className="btn btn-primary btn-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Request Document
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map(doc => (
              <div key={doc.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(doc.date).toLocaleDateString()}
                      </p>
                      {doc.expires && (
                        <p className="text-xs text-orange-600">
                          Expires: {new Date(doc.expires).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {doc.status === 'available' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-500" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-4">
                  {doc.status === 'available' ? (
                    <>
                      <button className="btn btn-sm bg-gray-100 hover:bg-gray-200 flex-1 flex items-center justify-center gap-1">
                        <Eye className="w-3 h-3" /> View
                      </button>
                      <button className="btn btn-sm bg-blue-100 text-blue-700 hover:bg-blue-200 flex-1 flex items-center justify-center gap-1">
                        <Download className="w-3 h-3" /> Download
                      </button>
                    </>
                  ) : (
                    <span className="text-sm text-yellow-600 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Processing...
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HR Profile Tab */}
      {activeTab === 'profile' && hrProfile && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Employment Details */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              Employment Details
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Employee ID</span>
                <span className="font-medium">{hrProfile.employee_id}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Department</span>
                <span className="font-medium">{hrProfile.department}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Position</span>
                <span className="font-medium">{hrProfile.position}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Join Date</span>
                <span className="font-medium">{new Date(hrProfile.join_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Contract Type</span>
                <span className="font-medium">{hrProfile.contract_type}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Reporting To</span>
                <span className="font-medium">{hrProfile.reporting_to}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Work Location</span>
                <span className="font-medium">{hrProfile.work_location}</span>
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              Financial Details
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Bank Name</span>
                <span className="font-medium">{hrProfile.bank_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Account Number</span>
                <span className="font-medium">{hrProfile.bank_account}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">SSNIT Number</span>
                <span className="font-medium">{hrProfile.ssnit_number}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">TIN Number</span>
                <span className="font-medium">{hrProfile.tin_number}</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-700">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                To update financial details, please contact HR department.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Leave Request Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="text-blue-600" />
                Request Leave
              </h2>
            </div>
            <form onSubmit={handleLeaveSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Leave Type *</label>
                <select
                  value={leaveForm.leave_type}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}
                  className="input"
                  required
                >
                  <option value="annual">Annual Leave ({leaveBalance.annual.total - leaveBalance.annual.used} days available)</option>
                  <option value="sick">Sick Leave ({leaveBalance.sick.total - leaveBalance.sick.used} days available)</option>
                  <option value="personal">Personal Leave ({leaveBalance.personal.total - leaveBalance.personal.used} days available)</option>
                  <option value="study">Study Leave ({leaveBalance.study.total - leaveBalance.study.used} days available)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={leaveForm.start_date}
                    onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                    className="input"
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date *</label>
                  <input
                    type="date"
                    value={leaveForm.end_date}
                    onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                    className="input"
                    required
                    min={leaveForm.start_date || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              {leaveForm.start_date && leaveForm.end_date && (
                <div className="p-3 bg-blue-50 rounded-lg text-sm">
                  <strong>{calculateDays(leaveForm.start_date, leaveForm.end_date)}</strong> day(s) requested
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">Reason *</label>
                <textarea
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="input"
                  rows="3"
                  required
                  placeholder="Please provide a reason for your leave request"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Contact During Leave</label>
                <input
                  type="text"
                  value={leaveForm.contact_during_leave}
                  onChange={(e) => setLeaveForm({ ...leaveForm, contact_during_leave: e.target.value })}
                  className="input"
                  placeholder="Phone number or email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Handover To</label>
                <input
                  type="text"
                  value={leaveForm.handover_to}
                  onChange={(e) => setLeaveForm({ ...leaveForm, handover_to: e.target.value })}
                  className="input"
                  placeholder="Colleague who will cover your duties"
                />
              </div>
              <div className="flex items-center gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="btn bg-gray-200 hover:bg-gray-300 flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Request Modal */}
      {showDocumentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="text-blue-600" />
                Request Document
              </h2>
            </div>
            <form onSubmit={handleDocumentRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Document Type *</label>
                <select
                  value={documentRequest.document_type}
                  onChange={(e) => setDocumentRequest({ ...documentRequest, document_type: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Select document type</option>
                  <option value="employment_letter">Employment Confirmation Letter</option>
                  <option value="salary_letter">Salary Confirmation Letter</option>
                  <option value="introduction_letter">Introduction Letter</option>
                  <option value="experience_letter">Experience Certificate</option>
                  <option value="tax_certificate">Tax Certificate</option>
                  <option value="ssnit_statement">SSNIT Statement</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Purpose *</label>
                <textarea
                  value={documentRequest.purpose}
                  onChange={(e) => setDocumentRequest({ ...documentRequest, purpose: e.target.value })}
                  className="input"
                  rows="2"
                  required
                  placeholder="Why do you need this document?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Number of Copies</label>
                  <input
                    type="number"
                    value={documentRequest.copies}
                    onChange={(e) => setDocumentRequest({ ...documentRequest, copies: parseInt(e.target.value) })}
                    className="input"
                    min="1"
                    max="5"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer mt-6">
                    <input
                      type="checkbox"
                      checked={documentRequest.urgent}
                      onChange={(e) => setDocumentRequest({ ...documentRequest, urgent: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Urgent Request</span>
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowDocumentModal(false)}
                  className="btn bg-gray-200 hover:bg-gray-300 flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
