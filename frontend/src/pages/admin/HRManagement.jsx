import { useState, useEffect } from 'react';
import {
  Users, DollarSign, Calendar, Award, Clock, FileText, Plus,
  Check, X, AlertTriangle, TrendingUp, Download, RefreshCw,
  ChevronRight, Search, Filter, MoreVertical, Eye, Edit, Trash2
} from 'lucide-react';
import { API_BASE_URL } from '../../config';
import axios from 'axios';
import StatCard, { DataCard, EmptyState, Badge } from '../../components/shared/StatCard';

const API = `${API_BASE_URL}/hr_management.php`;

export default function HRManagement() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showModal, setShowModal] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchDashboard();
    fetchLeaveTypes();
  }, []);

  useEffect(() => {
    if (activeTab === 'employees') fetchEmployees();
    if (activeTab === 'payroll') fetchPayroll();
    if (activeTab === 'leave') fetchLeaveRequests();
    if (activeTab === 'reviews') fetchReviews();
    if (activeTab === 'salary') fetchSalaryStructures();
  }, [activeTab, selectedMonth]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}?action=hr_dashboard`);
      setDashboard(res.data.dashboard);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API}?action=employees`);
      setEmployees(res.data.employees || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayroll = async () => {
    try {
      const res = await axios.get(`${API}?action=payroll&month=${selectedMonth}`);
      setPayroll(res.data.payroll || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const res = await axios.get(`${API}?action=leave_requests`);
      setLeaveRequests(res.data.requests || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const res = await axios.get(`${API}?action=leave_types`);
      setLeaveTypes(res.data.leave_types || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${API}?action=performance_reviews`);
      setReviews(res.data.reviews || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSalaryStructures = async () => {
    try {
      const res = await axios.get(`${API}?action=salary_structure`);
      setSalaryStructures(res.data.structures || []);
    } catch (err) {
      console.error(err);
    }
  };

  const generatePayroll = async () => {
    try {
      setLoading(true);
      await axios.post(`${API}?action=generate_payroll`, { month: selectedMonth });
      fetchPayroll();
      alert('Payroll generated successfully!');
    } catch (err) {
      alert('Failed to generate payroll');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveAction = async (leaveId, status) => {
    try {
      await axios.post(`${API}?action=approve_leave`, { leave_id: leaveId, status });
      fetchLeaveRequests();
      fetchDashboard();
    } catch (err) {
      alert('Failed to update leave request');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount || 0);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'payroll', label: 'Payroll', icon: DollarSign },
    { id: 'leave', label: 'Leave Management', icon: Calendar },
    { id: 'reviews', label: 'Performance', icon: Award },
    { id: 'salary', label: 'Salary Structures', icon: FileText }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">HR Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Payroll, Leave & Performance Management</p>
        </div>
        <button onClick={fetchDashboard} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total Teachers" value={dashboard?.total_teachers || 0} color="blue" loading={loading} />
            <StatCard icon={Users} label="Total Staff" value={dashboard?.total_staff || 0} color="green" loading={loading} />
            <StatCard icon={Calendar} label="Pending Leaves" value={dashboard?.pending_leaves || 0} color="yellow" loading={loading} />
            <StatCard icon={Clock} label="On Leave Today" value={dashboard?.on_leave_today || 0} color="purple" loading={loading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Payroll Summary</h3>
              {dashboard.payroll && (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Employees</span>
                    <span className="font-semibold">{dashboard.payroll.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Paid</span>
                    <span className="font-semibold text-green-600">{dashboard.payroll.paid || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Amount</span>
                    <span className="font-semibold">{formatCurrency(dashboard.payroll.total_amount)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setActiveTab('payroll')} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 hover:bg-blue-100 text-sm font-medium">
                  Generate Payroll
                </button>
                <button onClick={() => setActiveTab('leave')} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-600 hover:bg-yellow-100 text-sm font-medium">
                  Review Leaves ({dashboard.pending_leaves})
                </button>
                <button onClick={() => setActiveTab('reviews')} className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 hover:bg-purple-100 text-sm font-medium">
                  Performance Reviews
                </button>
                <button onClick={() => setActiveTab('salary')} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 hover:bg-green-100 text-sm font-medium">
                  Salary Structures
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">All Employees</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search..." className="pl-9 pr-4 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600" />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {employees.map((emp, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {emp.first_name} {emp.last_name}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${emp.type === 'teacher' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {emp.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{emp.department || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{emp.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1 hover:bg-gray-100 rounded"><Eye className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payroll Tab */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={generatePayroll} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" /> Generate Payroll
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Basic</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Allowances</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {payroll.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.employee_name}</td>
                    <td className="px-4 py-3">{formatCurrency(p.basic_salary)}</td>
                    <td className="px-4 py-3 text-green-600">+{formatCurrency(p.total_allowances)}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(p.gross_salary)}</td>
                    <td className="px-4 py-3 text-red-600">-{formatCurrency(parseFloat(p.tax_deduction) + parseFloat(p.pension_deduction))}</td>
                    <td className="px-4 py-3 font-bold text-blue-600">{formatCurrency(p.net_salary)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        p.status === 'paid' ? 'bg-green-100 text-green-700' :
                        p.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
                {payroll.length === 0 && (
                  <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">No payroll records for this month</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leave Management Tab */}
      {activeTab === 'leave' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {['all', 'pending', 'approved', 'rejected'].map(status => (
                <button key={status} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm capitalize hover:bg-gray-200">
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {leaveRequests.map((req, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{req.employee_name}</td>
                    <td className="px-4 py-3">{req.leave_type_name}</td>
                    <td className="px-4 py-3">{req.start_date}</td>
                    <td className="px-4 py-3">{req.end_date}</td>
                    <td className="px-4 py-3">{req.days_requested}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        req.status === 'approved' ? 'bg-green-100 text-green-700' :
                        req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{req.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {req.status === 'pending' && (
                        <div className="flex gap-1">
                          <button onClick={() => handleLeaveAction(req.id, 'approved')} className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleLeaveAction(req.id, 'rejected')} className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {leaveRequests.length === 0 && (
                  <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">No leave requests</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Performance Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowModal('review')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" /> New Review
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((review, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{review.employee_name}</h4>
                    <p className="text-sm text-gray-500">{review.review_period}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    review.status === 'submitted' ? 'bg-green-100 text-green-700' :
                    review.status === 'acknowledged' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{review.status}</span>
                </div>
                {review.overall_rating && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl font-bold text-blue-600">{review.overall_rating}</span>
                    <span className="text-gray-500">/5</span>
                  </div>
                )}
                <button className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg">View Details</button>
              </div>
            ))}
            {reviews.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">No performance reviews yet</div>
            )}
          </div>
        </div>
      )}

      {/* Salary Structures Tab */}
      {activeTab === 'salary' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowModal('salary')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" /> New Structure
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {salaryStructures.map((structure, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">{structure.name}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Basic Salary</span>
                    <span className="font-medium">{formatCurrency(structure.basic_salary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Housing</span>
                    <span className="text-green-600">+{formatCurrency(structure.housing_allowance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Transport</span>
                    <span className="text-green-600">+{formatCurrency(structure.transport_allowance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Medical</span>
                    <span className="text-green-600">+{formatCurrency(structure.medical_allowance)}</span>
                  </div>
                  <hr className="my-2 dark:border-gray-700" />
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax Rate</span>
                    <span className="text-red-600">{structure.tax_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pension Rate</span>
                    <span className="text-red-600">{structure.pension_rate}%</span>
                  </div>
                </div>
              </div>
            ))}
            {salaryStructures.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">No salary structures defined</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
