import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { DollarSign, Download, Calendar, Users, TrendingUp, FileText } from 'lucide-react';

export default function PayrollManagement() {
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetchPayrollData();
  }, [selectedMonth]);

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/payroll.php?month=${selectedMonth}`);
      setPayrollData(response.data.payroll || []);
    } catch (error) {
      // Sample data
      setPayrollData([
        { id: 1, employee_name: 'John Mensah', role: 'Teacher', basic_salary: 3500, allowances: 500, deductions: 200, net_salary: 3800, status: 'paid' },
        { id: 2, employee_name: 'Grace Asante', role: 'Teacher', basic_salary: 3500, allowances: 600, deductions: 250, net_salary: 3850, status: 'paid' },
        { id: 3, employee_name: 'Kwame Boateng', role: 'Admin', basic_salary: 4000, allowances: 800, deductions: 300, net_salary: 4500, status: 'pending' },
        { id: 4, employee_name: 'Ama Serwaa', role: 'Teacher', basic_salary: 3200, allowances: 400, deductions: 180, net_salary: 3420, status: 'pending' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalEmployees: payrollData.length,
    totalPayroll: payrollData.reduce((sum, p) => sum + p.net_salary, 0),
    paid: payrollData.filter(p => p.status === 'paid').length,
    pending: payrollData.filter(p => p.status === 'pending').length
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount);
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
            <DollarSign className="text-purple-600" /> Payroll Management
          </h1>
          <p className="text-gray-600">Process and manage employee salaries</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border rounded-lg px-4 py-2"
          />
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Employees</p>
              <p className="text-2xl font-bold">{stats.totalEmployees}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Payroll</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPayroll)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-purple-600">{stats.paid}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FileText className="text-yellow-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Basic</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Allowances</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deductions</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Salary</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payrollData.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{item.employee_name}</td>
                <td className="px-6 py-4 text-gray-600">{item.role}</td>
                <td className="px-6 py-4 text-right">{formatCurrency(item.basic_salary)}</td>
                <td className="px-6 py-4 text-right text-green-600">+{formatCurrency(item.allowances)}</td>
                <td className="px-6 py-4 text-right text-red-600">-{formatCurrency(item.deductions)}</td>
                <td className="px-6 py-4 text-right font-bold">{formatCurrency(item.net_salary)}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button className="text-purple-600 hover:underline text-sm">View Slip</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
