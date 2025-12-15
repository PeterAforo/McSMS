import { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Users, DollarSign, Calendar, TrendingUp, Plus, FileText, 
  Clock, Award, Download, CheckCircle, XCircle, Edit, Eye,
  Briefcase, CreditCard, PieChart, UserPlus, Settings, Search,
  Filter, Printer, Mail, Building, AlertTriangle, Wallet, 
  Timer, BarChart3, RefreshCw, Trash2, X, Send, History,
  ClipboardList, UserCog, Banknote, FileSpreadsheet
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

export default function HRPayroll() {
  const [employees, setEmployees] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [formData, setFormData] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedTraining, setSelectedTraining] = useState(null);

  // Enhanced state for new features
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [attendanceReport, setAttendanceReport] = useState([]);
  const [overtimeRecords, setOvertimeRecords] = useState([]);
  const [loans, setLoans] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [taxSettings, setTaxSettings] = useState({ ssnit_rate: 5.5, paye_brackets: [] });
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchEmployees();
    fetchPendingLeave();
    fetchDepartments();
    fetchDesignations();
  }, []);

  useEffect(() => {
    if (activeTab === 'payroll') {
      fetchPayroll();
    } else if (activeTab === 'leave') {
      fetchLeaveApplications();
      fetchLeaveTypes();
      fetchLeaveBalances();
    } else if (activeTab === 'attendance') {
      fetchAttendance();
    } else if (activeTab === 'training') {
      fetchTrainings();
    } else if (activeTab === 'documents') {
      fetchExpiringDocuments();
      fetchContracts();
    } else if (activeTab === 'departments') {
      fetchDepartments();
      fetchDesignations();
    } else if (activeTab === 'history') {
      fetchPayrollHistory();
    } else if (activeTab === 'overtime') {
      fetchOvertimeRecords();
    } else if (activeTab === 'loans') {
      fetchLoans();
    } else if (activeTab === 'shifts') {
      fetchShifts();
    } else if (activeTab === 'attendance_report') {
      fetchAttendanceReport();
    }
  }, [activeTab, selectedMonth, dateFrom, dateTo]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/hr_payroll.php?resource=employees`);
      if (response.data.success) {
        setEmployees(response.data.employees);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayroll = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/hr_payroll.php?resource=payroll&action=by_month&month=${selectedMonth}`);
      if (response.data.success) {
        setPayroll(response.data.payroll);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchLeaveApplications = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/hr_payroll.php?resource=leave&action=pending`);
      if (response.data.success) {
        setLeaveApplications(response.data.applications);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchPendingLeave = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/hr_payroll.php?resource=leave&action=pending`);
      if (response.data.success) {
        setLeaveApplications(response.data.applications);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      const date = new Date().toISOString().slice(0, 10);
      const response = await axios.get(`${API_BASE_URL}/hr_payroll.php?resource=attendance&action=by_date&date=${date}`);
      if (response.data.success) {
        setAttendance(response.data.attendance);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchTrainings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/hr_payroll.php?resource=training`);
      if (response.data.success) {
        setTrainings(response.data.trainings);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchExpiringDocuments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/hr_payroll.php?resource=documents&action=expiring&days=30`);
      if (response.data.success) {
        setDocuments(response.data.documents);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/hr_payroll.php?resource=leave_types`);
      if (response.data.success) {
        setLeaveTypes(response.data.leave_types);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/hr_payroll.php?resource=departments`);
      if (response.data.success) {
        setDepartments(response.data.departments || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchDesignations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/hr_payroll.php?resource=designations`);
      if (response.data.success) {
        setDesignations(response.data.designations || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchPayrollHistory = async () => {
    try {
      let url = `${API_BASE_URL}/hr_payroll.php?resource=payroll&action=history`;
      if (dateFrom) url += `&date_from=${dateFrom}`;
      if (dateTo) url += `&date_to=${dateTo}`;
      const response = await axios.get(url);
      if (response.data.success) {
        setPayrollHistory(response.data.payroll || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchLeaveBalances = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/hr_payroll.php?resource=leave_balances`);
      if (response.data.success) {
        setLeaveBalances(response.data.balances || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchAttendanceReport = async () => {
    try {
      let url = `${API_BASE_URL}/hr_payroll.php?resource=attendance&action=report&month=${selectedMonth}`;
      const response = await axios.get(url);
      if (response.data.success) {
        setAttendanceReport(response.data.report || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchOvertimeRecords = async () => {
    try {
      let url = `${API_BASE_URL}/hr_payroll.php?resource=overtime`;
      if (selectedMonth) url += `&month=${selectedMonth}`;
      const response = await axios.get(url);
      if (response.data.success) {
        setOvertimeRecords(response.data.overtime || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchLoans = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/hr_payroll.php?resource=loans`);
      if (response.data.success) {
        setLoans(response.data.loans || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchShifts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/hr_payroll.php?resource=shifts`);
      if (response.data.success) {
        setShifts(response.data.shifts || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchContracts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/hr_payroll.php?resource=contracts&action=expiring`);
      if (response.data.success) {
        setContracts(response.data.contracts || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter(e => {
    const matchesSearch = !searchTerm || 
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.employee_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || e.status === statusFilter;
    const matchesDept = !departmentFilter || e.department_id == departmentFilter;
    return matchesSearch && matchesStatus && matchesDept;
  });

  // Calculate tax (SSNIT & PAYE)
  const calculateTax = (grossSalary) => {
    const ssnit = grossSalary * 0.055; // 5.5% SSNIT
    const taxableIncome = grossSalary - ssnit;
    let paye = 0;
    // Ghana PAYE brackets (simplified)
    if (taxableIncome > 4380) paye += (Math.min(taxableIncome, 5280) - 4380) * 0.05;
    if (taxableIncome > 5280) paye += (Math.min(taxableIncome, 6480) - 5280) * 0.10;
    if (taxableIncome > 6480) paye += (Math.min(taxableIncome, 38280) - 6480) * 0.175;
    if (taxableIncome > 38280) paye += (taxableIncome - 38280) * 0.25;
    return { ssnit, paye, total: ssnit + paye };
  };

  // Export functions
  const exportToPDF = (type) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`HR ${type.charAt(0).toUpperCase() + type.slice(1)} Report`, 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    
    if (type === 'employees') {
      autoTable(doc, {
        startY: 35,
        head: [['Name', 'Employee #', 'Department', 'Designation', 'Status']],
        body: filteredEmployees.map(e => [`${e.first_name} ${e.last_name}`, e.employee_number, e.department_name || '-', e.designation || '-', e.status])
      });
    } else if (type === 'payroll') {
      autoTable(doc, {
        startY: 35,
        head: [['Employee', 'Basic', 'Allowances', 'Deductions', 'Net Salary', 'Status']],
        body: payroll.map(p => [p.employee_name, `GHS ${p.basic_salary}`, `GHS ${p.total_allowances || 0}`, `GHS ${p.total_deductions || 0}`, `GHS ${p.net_salary}`, p.status])
      });
    } else if (type === 'attendance') {
      autoTable(doc, {
        startY: 35,
        head: [['Employee', 'Present', 'Absent', 'Late', 'Leave', 'Attendance %']],
        body: attendanceReport.map(a => [a.employee_name, a.present_days, a.absent_days, a.late_days, a.leave_days, `${a.attendance_percentage}%`])
      });
    }
    
    doc.save(`hr_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToExcel = (type) => {
    let csvContent = '';
    if (type === 'employees') {
      csvContent = 'Name,Employee Number,Department,Designation,Status,Phone,Email\n' +
        filteredEmployees.map(e => `${e.first_name} ${e.last_name},${e.employee_number},${e.department_name || ''},${e.designation || ''},${e.status},${e.phone || ''},${e.email || ''}`).join('\n');
    } else if (type === 'payroll') {
      csvContent = 'Employee,Basic Salary,Allowances,Deductions,SSNIT,PAYE,Net Salary,Status\n' +
        payroll.map(p => `${p.employee_name},${p.basic_salary},${p.total_allowances || 0},${p.total_deductions || 0},${p.ssnit || 0},${p.paye || 0},${p.net_salary},${p.status}`).join('\n');
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hr_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const emailPaySlip = async (employeeId, email) => {
    try {
      await axios.post(`${API_BASE_URL}/hr_payroll.php?resource=payroll&action=email_slip`, {
        employee_id: employeeId,
        email,
        month: selectedMonth
      });
      alert('Pay slip sent to ' + email);
    } catch (error) {
      alert('Failed to send email');
    }
  };

  // CRUD handlers for new features
  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await axios.put(`${API_BASE_URL}/hr_payroll.php?resource=departments&id=${formData.id}`, formData);
      } else {
        await axios.post(`${API_BASE_URL}/hr_payroll.php?resource=departments`, formData);
      }
      alert('Department saved!');
      fetchDepartments();
      setShowModal(false);
      setFormData({});
    } catch (error) {
      alert('Error saving department');
    }
  };

  const handleSaveDesignation = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await axios.put(`${API_BASE_URL}/hr_payroll.php?resource=designations&id=${formData.id}`, formData);
      } else {
        await axios.post(`${API_BASE_URL}/hr_payroll.php?resource=designations`, formData);
      }
      alert('Designation saved!');
      fetchDesignations();
      setShowModal(false);
      setFormData({});
    } catch (error) {
      alert('Error saving designation');
    }
  };

  const handleSaveLoan = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/hr_payroll.php?resource=loans`, formData);
      alert('Loan/Advance saved!');
      fetchLoans();
      setShowModal(false);
      setFormData({});
    } catch (error) {
      alert('Error saving loan');
    }
  };

  const handleSaveOvertime = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/hr_payroll.php?resource=overtime`, formData);
      alert('Overtime record saved!');
      fetchOvertimeRecords();
      setShowModal(false);
      setFormData({});
    } catch (error) {
      alert('Error saving overtime');
    }
  };

  const handleSaveShift = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await axios.put(`${API_BASE_URL}/hr_payroll.php?resource=shifts&id=${formData.id}`, formData);
      } else {
        await axios.post(`${API_BASE_URL}/hr_payroll.php?resource=shifts`, formData);
      }
      alert('Shift saved!');
      fetchShifts();
      setShowModal(false);
      setFormData({});
    } catch (error) {
      alert('Error saving shift');
    }
  };

  const handleSaveContract = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/hr_payroll.php?resource=contracts`, formData);
      alert('Contract saved!');
      fetchContracts();
      setShowModal(false);
      setFormData({});
    } catch (error) {
      alert('Error saving contract');
    }
  };

  const handleDeleteDepartment = async (id) => {
    if (!confirm('Delete this department?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/hr_payroll.php?resource=departments&id=${id}`);
      fetchDepartments();
    } catch (error) {
      alert('Error deleting department');
    }
  };

  const handleDeleteDesignation = async (id) => {
    if (!confirm('Delete this designation?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/hr_payroll.php?resource=designations&id=${id}`);
      fetchDesignations();
    } catch (error) {
      alert('Error deleting designation');
    }
  };

  const handleSaveTraining = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await axios.put(`${API_BASE_URL}/hr_payroll.php?resource=training&id=${formData.id}`, formData);
      } else {
        await axios.post(`${API_BASE_URL}/hr_payroll.php?resource=training`, formData);
      }
      alert('✅ Training program saved!');
      fetchTrainings();
      setShowModal(false);
      setFormData({});
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving training');
    }
  };

  const handleDeleteTraining = async (id) => {
    if (!confirm('Delete this training program?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/hr_payroll.php?resource=training&id=${id}`);
      fetchTrainings();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEnrollEmployee = async (trainingId, employeeId) => {
    try {
      await axios.post(`${API_BASE_URL}/hr_payroll.php?resource=training_participants`, {
        training_id: trainingId,
        employee_id: employeeId
      });
      alert('✅ Employee enrolled!');
      // Refresh training details
      const response = await axios.get(`${API_BASE_URL}/hr_payroll.php?resource=training&id=${trainingId}`);
      if (response.data.success) {
        setSelectedTraining(response.data.training);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error enrolling employee');
    }
  };

  const handleSaveDocument = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/hr_payroll.php?resource=documents`, formData);
      alert('✅ Document saved!');
      fetchExpiringDocuments();
      setShowModal(false);
      setFormData({});
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving document');
    }
  };

  const generatePayroll = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/hr_payroll.php?resource=payroll&action=generate&month=${selectedMonth}`);
      if (response.data.success) {
        alert('Payroll generated successfully!');
        fetchPayroll();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error generating payroll');
    }
  };

  const approveLeave = async (id) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/hr_payroll.php?resource=leave&id=${id}&action=approve`, {
        approved_by: 1
      });
      if (response.data.success) {
        alert('Leave approved successfully!');
        fetchLeaveApplications();
        fetchPendingLeave();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const rejectLeave = async (id) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    
    try {
      const response = await axios.put(`${API_BASE_URL}/hr_payroll.php?resource=leave&id=${id}&action=reject`, {
        approved_by: 1,
        rejection_reason: reason
      });
      if (response.data.success) {
        alert('Leave rejected');
        fetchLeaveApplications();
        fetchPendingLeave();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const calculateTotalPayroll = () => {
    return payroll.reduce((sum, p) => sum + parseFloat(p.net_salary || 0), 0).toFixed(2);
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/hr_payroll.php?resource=employees`, formData);
      if (response.data.success) {
        alert('Employee added successfully!');
        setShowModal(false);
        setFormData({});
        fetchEmployees();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error adding employee');
    }
  };

  const handleMarkAttendance = () => {
    setModalType('attendance');
    setShowModal(true);
  };

  const markAttendanceForAll = async () => {
    try {
      const attendanceData = employees.map(emp => ({
        employee_id: emp.id,
        attendance_date: selectedDate,
        status: 'present',
        check_in_time: '08:00:00',
        marked_by: 1
      }));

      for (const record of attendanceData) {
        await axios.post(`${API_BASE_URL}/hr_payroll.php?resource=attendance`, record);
      }

      alert('Attendance marked for all employees!');
      setShowModal(false);
      fetchAttendance();
    } catch (error) {
      console.error('Error:', error);
      alert('Error marking attendance');
    }
  };

  const handleGenerateReports = () => {
    setModalType('reports');
    setShowModal(true);
  };

  const downloadReport = async (reportType) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/hr_reports.php?type=${reportType}&month=${selectedMonth}`);
      if (response.data.success) {
        // For now, show the data in console and alert
        console.log('Report Data:', response.data.report);
        alert(`${reportType} report generated successfully!\nCheck console for data.\n\nIn production, this will download PDF/Excel.`);
        // TODO: Implement actual PDF/Excel download
        // window.open(`${API_BASE_URL}/hr_reports.php?type=${reportType}&month=${selectedMonth}&format=pdf`, '_blank');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error generating report: ' + error.message);
    }
  };

  const handleConfigureSalary = () => {
    setModalType('salary_components');
    setShowModal(true);
    fetchSalaryComponents();
  };

  const [salaryComponents, setSalaryComponents] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [viewEmployee, setViewEmployee] = useState(null);
  const [editEmployee, setEditEmployee] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [employeeSalaryComponents, setEmployeeSalaryComponents] = useState([]);
  const [assigningComponents, setAssigningComponents] = useState(false);

  const fetchSalaryComponents = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/salary_components.php`);
      if (response.data.success) {
        setSalaryComponents(response.data.components);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAddSalaryComponent = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/salary_components.php`, formData);
      if (response.data.success) {
        alert('Salary component added successfully!');
        fetchSalaryComponents();
        setFormData({});
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error adding component');
    }
  };

  const handleViewEmployee = (employee) => {
    setViewEmployee(employee);
    setModalType('view_employee');
    setShowModal(true);
  };

  const handleEditEmployee = async (employee) => {
    setEditEmployee(employee);
    setFormData(employee);
    setModalType('edit_employee');
    setShowModal(true);
    // Fetch employee's current salary components
    await fetchEmployeeSalaryComponents(employee.id);
  };

  const fetchEmployeeSalaryComponents = async (employeeId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/salary_components.php?action=by_employee&employee_id=${employeeId}`);
      if (response.data.success) {
        setEmployeeSalaryComponents(response.data.components);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleManageSalaryComponents = async () => {
    setAssigningComponents(true);
    await fetchSalaryComponents();
  };

  const handleAssignComponent = async (componentId, amount) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/salary_components.php?action=assign_to_employee`, {
        employee_id: editEmployee.id,
        component_id: componentId,
        amount: parseFloat(amount),
        effective_from: new Date().toISOString().slice(0, 10),
        status: 'active'
      });
      if (response.data.success) {
        alert('Component assigned successfully!');
        await fetchEmployeeSalaryComponents(editEmployee.id);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error assigning component');
    }
  };

  const handleRemoveComponent = async (assignmentId) => {
    if (!confirm('Remove this salary component?')) return;
    try {
      const response = await axios.delete(`${API_BASE_URL}/salary_components.php?action=remove_from_employee&id=${assignmentId}`);
      if (response.data.success) {
        alert('Component removed!');
        await fetchEmployeeSalaryComponents(editEmployee.id);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error removing component');
    }
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${API_BASE_URL}/hr_payroll.php?resource=employees&id=${editEmployee.id}`, formData);
      if (response.data.success) {
        alert('Employee updated successfully!');
        setShowModal(false);
        setFormData({});
        setEditEmployee(null);
        fetchEmployees();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating employee');
    }
  };

  const handleViewPaySlip = async (employeeId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/hr_reports.php?type=salary_slips&month=${selectedMonth}&employee_id=${employeeId}`);
      console.log('Pay slip response:', response.data);
      if (response.data.success) {
        setModalType('view_payslip');
        setFormData({ report: response.data.report });
        setShowModal(true);
      } else {
        alert('No pay slip found for this employee');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error fetching pay slip: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleMarkAsPaid = async (payrollId) => {
    if (!confirm('Mark this payroll as paid?')) return;
    
    try {
      const response = await axios.put(`${API_BASE_URL}/hr_payroll.php?resource=payroll&id=${payrollId}&action=pay`, {
        payment_date: new Date().toISOString().slice(0, 10),
        payment_method: 'bank_transfer',
        payment_reference: 'PAY-' + Date.now()
      });
      if (response.data.success) {
        alert('Payroll marked as paid!');
        fetchPayroll();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error marking as paid');
    }
  };

  const handleBulkPayment = async () => {
    const processedPayroll = payroll.filter(p => p.status === 'processed');
    if (processedPayroll.length === 0) {
      alert('No processed payroll to pay');
      return;
    }
    
    if (!confirm(`Mark ${processedPayroll.length} employees as paid?`)) return;
    
    try {
      let successCount = 0;
      for (const p of processedPayroll) {
        const response = await axios.put(`${API_BASE_URL}/hr_payroll.php?resource=payroll&id=${p.id}&action=pay`, {
          payment_date: new Date().toISOString().slice(0, 10),
          payment_method: 'bank_transfer',
          payment_reference: 'BULK-PAY-' + Date.now()
        });
        if (response.data.success) successCount++;
      }
      alert(`Successfully paid ${successCount} out of ${processedPayroll.length} employees!`);
      fetchPayroll();
    } catch (error) {
      console.error('Error:', error);
      alert('Error processing bulk payment');
    }
  };

  const handlePrintPaySlip = (slip) => {
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pay Slip - ${slip.employee_name}</title>
        <style>
          @media print {
            @page { margin: 0.5in; }
            body { margin: 0; }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            max-width: 150px;
            margin-bottom: 10px;
          }
          .school-name {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin: 10px 0;
          }
          .school-details {
            font-size: 12px;
            color: #666;
          }
          .pay-slip-title {
            font-size: 20px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
            color: #2563eb;
          }
          .employee-info {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
          }
          .label {
            font-weight: bold;
            color: #374151;
          }
          .value {
            color: #1f2937;
          }
          .salary-section {
            margin: 20px 0;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            margin: 15px 0 10px 0;
            padding-bottom: 5px;
            border-bottom: 2px solid #e5e7eb;
          }
          .earnings { color: #059669; }
          .deductions { color: #dc2626; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }
          td {
            padding: 8px;
            border-bottom: 1px solid #e5e7eb;
          }
          .total-row {
            font-weight: bold;
            background: #f9fafb;
            border-top: 2px solid #333;
          }
          .net-salary {
            background: #dbeafe;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
          }
          .net-salary-label {
            font-size: 14px;
            color: #1e40af;
            margin-bottom: 5px;
          }
          .net-salary-amount {
            font-size: 28px;
            font-weight: bold;
            color: #1e3a8a;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            font-size: 11px;
            color: #6b7280;
            text-align: center;
          }
          .print-button {
            background: #2563eb;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin: 20px auto;
            display: block;
          }
          @media print {
            .print-button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/McSMS/assets/logo.png" alt="School Logo" class="logo" onerror="this.style.display='none'">
          <div class="school-name">McSMS School Management System</div>
          <div class="school-details">
            Address: School Address Here | Phone: +233 XXX XXX XXX | Email: info@school.com
          </div>
        </div>

        <div class="pay-slip-title">SALARY SLIP</div>

        <div class="employee-info">
          <div class="info-row">
            <span class="label">Employee Name:</span>
            <span class="value">${slip.employee_name}</span>
          </div>
          <div class="info-row">
            <span class="label">Employee Number:</span>
            <span class="value">${slip.employee_number}</span>
          </div>
          <div class="info-row">
            <span class="label">Designation:</span>
            <span class="value">${slip.designation}</span>
          </div>
          <div class="info-row">
            <span class="label">Department:</span>
            <span class="value">${slip.department_name || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="label">Pay Period:</span>
            <span class="value">${slip.month}</span>
          </div>
        </div>

        <div class="salary-section">
          <div class="section-title">Basic Salary</div>
          <table>
            <tr>
              <td>Basic Salary</td>
              <td style="text-align: right;">GHS ${parseFloat(slip.basic_salary).toFixed(2)}</td>
            </tr>
          </table>

          <div class="section-title earnings">Earnings</div>
          <table>
            ${slip.earnings && slip.earnings.length > 0 ? 
              slip.earnings.map(e => `
                <tr>
                  <td>${e.component_name}</td>
                  <td style="text-align: right;">GHS ${parseFloat(e.amount).toFixed(2)}</td>
                </tr>
              `).join('') : 
              '<tr><td colspan="2" style="text-align: center; color: #9ca3af;">No additional earnings</td></tr>'
            }
            <tr class="total-row">
              <td>Total Earnings</td>
              <td style="text-align: right;">GHS ${parseFloat(slip.total_earnings).toFixed(2)}</td>
            </tr>
          </table>

          <div class="section-title deductions">Deductions</div>
          <table>
            ${slip.deductions && slip.deductions.length > 0 ? 
              slip.deductions.map(d => `
                <tr>
                  <td>${d.component_name}</td>
                  <td style="text-align: right;">GHS ${parseFloat(d.amount).toFixed(2)}</td>
                </tr>
              `).join('') : 
              '<tr><td colspan="2" style="text-align: center; color: #9ca3af;">No deductions</td></tr>'
            }
            <tr class="total-row">
              <td>Total Deductions</td>
              <td style="text-align: right;">GHS ${parseFloat(slip.total_deductions).toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <div class="net-salary">
          <div class="net-salary-label">NET SALARY</div>
          <div class="net-salary-amount">GHS ${parseFloat(slip.net_salary).toFixed(2)}</div>
        </div>

        <div class="footer">
          <p>This is a computer-generated pay slip and does not require a signature.</p>
          <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>

        <button class="print-button" onclick="window.print()">Print Pay Slip</button>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const initializeAttendanceRecords = () => {
    const records = employees.map(emp => ({
      employee_id: emp.id,
      employee_name: `${emp.first_name} ${emp.last_name}`,
      status: 'present',
      check_in_time: '08:00',
      check_out_time: '17:00'
    }));
    setAttendanceRecords(records);
  };

  const updateAttendanceRecord = (employeeId, field, value) => {
    setAttendanceRecords(prev => prev.map(record => 
      record.employee_id === employeeId 
        ? { ...record, [field]: value }
        : record
    ));
  };

  const submitAttendance = async () => {
    try {
      for (const record of attendanceRecords) {
        await axios.post(`${API_BASE_URL}/hr_payroll.php?resource=attendance`, {
          employee_id: record.employee_id,
          attendance_date: selectedDate,
          status: record.status,
          check_in_time: record.check_in_time + ':00',
          check_out_time: record.check_out_time + ':00',
          marked_by: 1
        });
      }
      alert('Attendance marked successfully!');
      setShowModal(false);
      fetchAttendance();
    } catch (error) {
      console.error('Error:', error);
      alert('Error marking attendance');
    }
  };

  const handleCreatePerformanceReview = () => {
    setModalType('performance_review');
    setShowModal(true);
  };

  const handleSubmitPerformanceReview = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/hr_payroll.php?resource=performance`, formData);
      if (response.data.success) {
        alert('Performance review created successfully!');
        setShowModal(false);
        setFormData({});
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating review');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="text-blue-600" size={32} />
            HR & Payroll Management
          </h1>
          <p className="text-gray-600 mt-1">Manage employees, payroll, attendance, and more</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => exportToPDF(activeTab)} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download size={16} /> PDF
          </button>
          <button onClick={() => exportToExcel(activeTab)} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button onClick={() => { setShowModal(true); setModalType('employee'); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <UserPlus size={20} /> Add Employee
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-gray-600 text-xs">Employees</p>
          <p className="text-2xl font-bold text-blue-600">{employees.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-gray-600 text-xs">Active</p>
          <p className="text-2xl font-bold text-green-600">{employees.filter(e => e.status === 'active').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <p className="text-gray-600 text-xs">Payroll</p>
          <p className="text-xl font-bold text-purple-600">GHS {calculateTotalPayroll()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <p className="text-gray-600 text-xs">Pending Leave</p>
          <p className="text-2xl font-bold text-orange-600">{leaveApplications.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-indigo-500">
          <p className="text-gray-600 text-xs">Present Today</p>
          <p className="text-2xl font-bold text-indigo-600">{attendance.filter(a => a.status === 'present').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-cyan-500">
          <p className="text-gray-600 text-xs">Departments</p>
          <p className="text-2xl font-bold text-cyan-600">{departments.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <p className="text-gray-600 text-xs">Active Loans</p>
          <p className="text-2xl font-bold text-yellow-600">{loans.filter(l => l.status === 'active').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <p className="text-gray-600 text-xs">Overtime (hrs)</p>
          <p className="text-2xl font-bold text-red-600">{overtimeRecords.reduce((sum, o) => sum + parseFloat(o.hours || 0), 0)}</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search employees..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option>
            <option value="terminated">Terminated</option>
          </select>
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="border rounded-lg px-3 py-2">
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="border rounded px-3 py-2" />
          <button onClick={() => { setSearchTerm(''); setStatusFilter(''); setDepartmentFilter(''); }} className="text-sm text-gray-500 hover:text-gray-700">Clear</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <div className="flex flex-wrap">
            {[
              { id: 'overview', label: 'Overview', icon: PieChart },
              { id: 'employees', label: 'Employees', icon: Users },
              { id: 'departments', label: 'Depts', icon: Building },
              { id: 'payroll', label: 'Payroll', icon: DollarSign },
              { id: 'history', label: 'History', icon: History },
              { id: 'salary', label: 'Salary', icon: CreditCard },
              { id: 'leave', label: 'Leave', icon: Calendar },
              { id: 'attendance', label: 'Attendance', icon: Clock },
              { id: 'attendance_report', label: 'Att. Report', icon: BarChart3 },
              { id: 'overtime', label: 'Overtime', icon: Timer },
              { id: 'loans', label: 'Loans', icon: Wallet },
              { id: 'shifts', label: 'Shifts', icon: Clock },
              { id: 'performance', label: 'Perf.', icon: Award },
              { id: 'training', label: 'Training', icon: Award },
              { id: 'documents', label: 'Docs', icon: FileText },
              { id: 'reports', label: 'Reports', icon: FileText }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-3 py-2 font-medium flex items-center gap-1 text-xs ${activeTab === tab.id ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}`}>
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Briefcase className="text-blue-600" />
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <button 
                      onClick={generatePayroll}
                      className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-lg text-left flex items-center gap-3"
                    >
                      <DollarSign size={20} />
                      <div>
                        <div className="font-medium">Generate Payroll</div>
                        <div className="text-sm text-gray-600">Process monthly salaries</div>
                      </div>
                    </button>
                    <button 
                      onClick={handleMarkAttendance}
                      className="w-full bg-green-50 hover:bg-green-100 text-green-700 px-4 py-3 rounded-lg text-left flex items-center gap-3"
                    >
                      <Clock size={20} />
                      <div>
                        <div className="font-medium">Mark Attendance</div>
                        <div className="text-sm text-gray-600">Record today's attendance</div>
                      </div>
                    </button>
                    <button 
                      onClick={handleGenerateReports}
                      className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-3 rounded-lg text-left flex items-center gap-3"
                    >
                      <FileText size={20} />
                      <div>
                        <div className="font-medium">Generate Reports</div>
                        <div className="text-sm text-gray-600">Download payroll reports</div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="border rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Calendar className="text-orange-600" />
                    Pending Leave Requests ({leaveApplications.length})
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {leaveApplications.slice(0, 5).map(leave => (
                      <div key={leave.id} className="border rounded p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium">{leave.employee_name}</div>
                            <div className="text-sm text-gray-600">{leave.leave_type_name}</div>
                            <div className="text-sm text-gray-500">{leave.start_date} to {leave.end_date}</div>
                          </div>
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            {leave.total_days} days
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => approveLeave(leave.id)}
                            className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => rejectLeave(leave.id)}
                            className="flex-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                    {leaveApplications.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No pending leave requests</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Employees Tab */}
          {activeTab === 'employees' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Employee Directory ({filteredEmployees.length})</h3>
              </div>
              {filteredEmployees.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><Users size={48} className="mx-auto mb-4 text-gray-300" /><p>No employees found</p></div>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employee</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Department</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Designation</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Basic Salary</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredEmployees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium">{employee.first_name} {employee.last_name}</div>
                            <div className="text-sm text-gray-600">{employee.email}</div>
                            <div className="text-xs text-gray-400">{employee.employee_number}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">{employee.department_name || 'N/A'}</td>
                        <td className="px-4 py-3">{employee.designation_name || 'N/A'}</td>
                        <td className="px-4 py-3 font-medium">GHS {employee.basic_salary}</td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-sm ${employee.status === 'active' ? 'bg-green-100 text-green-800' : employee.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{employee.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => handleViewEmployee(employee)} className="text-blue-600 hover:text-blue-800" title="View"><Eye size={18} /></button>
                            <button onClick={() => handleEditEmployee(employee)} className="text-green-600 hover:text-green-800" title="Edit"><Edit size={18} /></button>
                            <button onClick={() => emailPaySlip(employee.id, employee.email)} className="text-purple-600 hover:text-purple-800" title="Email Pay Slip"><Mail size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          )}

          {/* Departments Tab */}
          {activeTab === 'departments' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Departments & Designations</h3>
                <div className="flex gap-2">
                  <button onClick={() => { setModalType('department'); setFormData({}); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Plus size={18} /> Add Department</button>
                  <button onClick={() => { setModalType('designation'); setFormData({}); setShowModal(true); }} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"><Plus size={18} /> Add Designation</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-4 flex items-center gap-2"><Building size={20} className="text-blue-600" /> Departments ({departments.length})</h4>
                  {departments.length === 0 ? <p className="text-gray-500 text-center py-4">No departments</p> : (
                    <div className="space-y-2">
                      {departments.map(d => (
                        <div key={d.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div><p className="font-medium">{d.name}</p><p className="text-sm text-gray-500">{d.description || 'No description'}</p></div>
                          <div className="flex gap-2">
                            <button onClick={() => { setModalType('department'); setFormData(d); setShowModal(true); }} className="text-blue-600 hover:text-blue-800"><Edit size={16} /></button>
                            <button onClick={() => handleDeleteDepartment(d.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-4 flex items-center gap-2"><Briefcase size={20} className="text-green-600" /> Designations ({designations.length})</h4>
                  {designations.length === 0 ? <p className="text-gray-500 text-center py-4">No designations</p> : (
                    <div className="space-y-2">
                      {designations.map(d => (
                        <div key={d.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div><p className="font-medium">{d.title}</p><p className="text-sm text-gray-500">{d.department_name || 'No department'}</p></div>
                          <div className="flex gap-2">
                            <button onClick={() => { setModalType('designation'); setFormData(d); setShowModal(true); }} className="text-blue-600 hover:text-blue-800"><Edit size={16} /></button>
                            <button onClick={() => handleDeleteDesignation(d.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Payroll History Tab */}
          {activeTab === 'history' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Payroll History</h3>
                <div className="flex gap-2">
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border rounded px-3 py-2" placeholder="From" />
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border rounded px-3 py-2" placeholder="To" />
                </div>
              </div>
              {payrollHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><History size={48} className="mx-auto mb-4 text-gray-300" /><p>No payroll history found</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Month</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employee</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Basic</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Allowances</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Deductions</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Net Salary</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {payrollHistory.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">{p.payroll_month}</td>
                          <td className="px-4 py-3 font-medium">{p.employee_name}</td>
                          <td className="px-4 py-3">GHS {p.basic_salary}</td>
                          <td className="px-4 py-3 text-green-600">+GHS {p.total_allowances || 0}</td>
                          <td className="px-4 py-3 text-red-600">-GHS {p.total_deductions || 0}</td>
                          <td className="px-4 py-3 font-bold">GHS {p.net_salary}</td>
                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${p.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{p.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Attendance Report Tab */}
          {activeTab === 'attendance_report' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Attendance Report - {selectedMonth}</h3>
                <button onClick={() => exportToPDF('attendance')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Download size={18} /> Export</button>
              </div>
              {attendanceReport.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><BarChart3 size={48} className="mx-auto mb-4 text-gray-300" /><p>No attendance data for {selectedMonth}</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employee</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Present</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Absent</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Late</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Leave</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Attendance %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {attendanceReport.map(a => (
                        <tr key={a.employee_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{a.employee_name}</td>
                          <td className="px-4 py-3 text-green-600">{a.present_days}</td>
                          <td className="px-4 py-3 text-red-600">{a.absent_days}</td>
                          <td className="px-4 py-3 text-yellow-600">{a.late_days}</td>
                          <td className="px-4 py-3 text-blue-600">{a.leave_days}</td>
                          <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-24 bg-gray-200 rounded-full h-2"><div className="bg-green-600 h-2 rounded-full" style={{width: `${a.attendance_percentage}%`}}></div></div><span className="font-medium">{a.attendance_percentage}%</span></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Overtime Tab */}
          {activeTab === 'overtime' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Overtime Records</h3>
                <button onClick={() => { setModalType('overtime'); setFormData({ overtime_date: new Date().toISOString().split('T')[0] }); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Plus size={18} /> Add Overtime</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-blue-600 text-sm">Total Hours</p>
                  <p className="text-2xl font-bold text-blue-700">{overtimeRecords.reduce((sum, o) => sum + parseFloat(o.hours || 0), 0)} hrs</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-green-600 text-sm">Total Amount</p>
                  <p className="text-2xl font-bold text-green-700">GHS {overtimeRecords.reduce((sum, o) => sum + parseFloat(o.amount || 0), 0).toFixed(2)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <p className="text-purple-600 text-sm">Employees</p>
                  <p className="text-2xl font-bold text-purple-700">{new Set(overtimeRecords.map(o => o.employee_id)).size}</p>
                </div>
              </div>
              {overtimeRecords.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><Timer size={48} className="mx-auto mb-4 text-gray-300" /><p>No overtime records</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employee</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Hours</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Rate</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Reason</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {overtimeRecords.map(o => (
                        <tr key={o.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">{o.overtime_date}</td>
                          <td className="px-4 py-3 font-medium">{o.employee_name}</td>
                          <td className="px-4 py-3">{o.hours} hrs</td>
                          <td className="px-4 py-3">x{o.rate_multiplier || 1.5}</td>
                          <td className="px-4 py-3 font-semibold text-green-600">GHS {o.amount}</td>
                          <td className="px-4 py-3 text-sm">{o.reason || '-'}</td>
                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${o.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{o.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Loans Tab */}
          {activeTab === 'loans' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Loans & Advances</h3>
                <button onClick={() => { setModalType('loan'); setFormData({ loan_date: new Date().toISOString().split('T')[0], status: 'active' }); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Plus size={18} /> Add Loan/Advance</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-blue-600 text-sm">Total Loans</p>
                  <p className="text-2xl font-bold text-blue-700">GHS {loans.reduce((sum, l) => sum + parseFloat(l.amount || 0), 0).toLocaleString()}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-green-600 text-sm">Repaid</p>
                  <p className="text-2xl font-bold text-green-700">GHS {loans.reduce((sum, l) => sum + parseFloat(l.amount_repaid || 0), 0).toLocaleString()}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-yellow-600 text-sm">Outstanding</p>
                  <p className="text-2xl font-bold text-yellow-700">GHS {loans.reduce((sum, l) => sum + (parseFloat(l.amount || 0) - parseFloat(l.amount_repaid || 0)), 0).toLocaleString()}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <p className="text-purple-600 text-sm">Active Loans</p>
                  <p className="text-2xl font-bold text-purple-700">{loans.filter(l => l.status === 'active').length}</p>
                </div>
              </div>
              {loans.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><Wallet size={48} className="mx-auto mb-4 text-gray-300" /><p>No loans or advances</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employee</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Repaid</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Balance</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Monthly Deduction</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {loans.map(l => (
                        <tr key={l.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{l.employee_name}</td>
                          <td className="px-4 py-3 capitalize">{l.loan_type}</td>
                          <td className="px-4 py-3">GHS {l.amount}</td>
                          <td className="px-4 py-3 text-green-600">GHS {l.amount_repaid || 0}</td>
                          <td className="px-4 py-3 font-semibold text-red-600">GHS {(parseFloat(l.amount) - parseFloat(l.amount_repaid || 0)).toFixed(2)}</td>
                          <td className="px-4 py-3">GHS {l.monthly_deduction || 0}</td>
                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${l.status === 'paid' ? 'bg-green-100 text-green-800' : l.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{l.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Shifts Tab */}
          {activeTab === 'shifts' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Shift Management</h3>
                <button onClick={() => { setModalType('shift'); setFormData({}); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Plus size={18} /> Add Shift</button>
              </div>
              {shifts.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><Clock size={48} className="mx-auto mb-4 text-gray-300" /><p>No shifts defined</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {shifts.map(s => (
                    <div key={s.id} className="border rounded-lg p-4 hover:shadow-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div><h4 className="font-semibold">{s.shift_name}</h4><p className="text-sm text-gray-500">{s.description || 'No description'}</p></div>
                        <button onClick={() => { setModalType('shift'); setFormData(s); setShowModal(true); }} className="text-blue-600 hover:text-blue-800"><Edit size={16} /></button>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2"><Clock size={14} /> {s.start_time} - {s.end_time}</p>
                        <p className="flex items-center gap-2"><Users size={14} /> {s.employee_count || 0} employees</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Payroll Tab */}
          {activeTab === 'payroll' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Payroll Processing</h3>
                <div className="flex gap-3">
                  <input 
                    type="month" 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="border rounded-lg px-4 py-2"
                  />
                  <button 
                    onClick={generatePayroll}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Generate Payroll
                  </button>
                  {payroll.some(p => p.status === 'processed') && (
                    <button 
                      onClick={handleBulkPayment}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                      title="Pay all processed employees"
                    >
                      <CheckCircle size={18} />
                      Pay All
                    </button>
                  )}
                </div>
              </div>

              {payroll.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employee</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Basic Salary</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Earnings</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Deductions</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Net Salary</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {payroll.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium">{p.employee_name}</div>
                            <div className="text-sm text-gray-600">{p.employee_number}</div>
                          </td>
                          <td className="px-4 py-3">GHS {parseFloat(p.basic_salary).toFixed(2)}</td>
                          <td className="px-4 py-3 text-green-600">GHS {parseFloat(p.total_earnings).toFixed(2)}</td>
                          <td className="px-4 py-3 text-red-600">GHS {parseFloat(p.total_deductions).toFixed(2)}</td>
                          <td className="px-4 py-3 font-bold">GHS {parseFloat(p.net_salary).toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-full text-sm ${
                              p.status === 'paid' ? 'bg-green-100 text-green-800' :
                              p.status === 'processed' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleViewPaySlip(p.employee_id)}
                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                title="View Pay Slip"
                              >
                                <Download size={18} />
                                Slip
                              </button>
                              {p.status === 'processed' && (
                                <button 
                                  onClick={() => handleMarkAsPaid(p.id)}
                                  className="text-green-600 hover:text-green-800 flex items-center gap-1"
                                  title="Mark as Paid"
                                >
                                  <CheckCircle size={18} />
                                  Pay
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold">
                      <tr>
                        <td colSpan="4" className="px-4 py-3 text-right">Total:</td>
                        <td className="px-4 py-3">GHS {calculateTotalPayroll()}</td>
                        <td colSpan="2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-xl font-semibold mb-2">No Payroll Generated</h3>
                  <p className="text-gray-600 mb-4">Generate payroll for {selectedMonth} to view details</p>
                  <button 
                    onClick={generatePayroll}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Generate Payroll
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Salary Structure Tab */}
          {activeTab === 'salary' && (
            <div className="text-center py-12">
              <CreditCard className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-xl font-semibold mb-2">Salary Structure Management</h3>
              <p className="text-gray-600 mb-4">Configure salary components, allowances, and deductions</p>
              <button 
                onClick={handleConfigureSalary}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Configure Salary Components
              </button>
            </div>
          )}

          {/* Leave Management Tab */}
          {activeTab === 'leave' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Leave Applications</h3>
              <div className="space-y-4">
                {leaveApplications.map(leave => (
                  <div key={leave.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold">{leave.employee_name}</h4>
                          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {leave.leave_type_name}
                          </span>
                          <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            {leave.total_days} days
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>Period:</strong> {leave.start_date} to {leave.end_date}
                        </div>
                        <div className="text-sm text-gray-600">
                          <strong>Reason:</strong> {leave.reason}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => approveLeave(leave.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                          <CheckCircle size={18} />
                          Approve
                        </button>
                        <button 
                          onClick={() => rejectLeave(leave.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
                        >
                          <XCircle size={18} />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {leaveApplications.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-xl font-semibold mb-2">No Pending Leave Requests</h3>
                    <p className="text-gray-600">All leave applications have been processed</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="text-center py-12">
              <Clock className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-xl font-semibold mb-2">Employee Attendance</h3>
              <p className="text-gray-600 mb-4">Track daily attendance and working hours</p>
              <div className="text-sm text-gray-600">
                Present today: {attendance.filter(a => a.status === 'present').length} employees
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="text-center py-12">
              <Award className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-xl font-semibold mb-2">Performance Reviews</h3>
              <p className="text-gray-600 mb-4">Conduct and manage employee performance evaluations</p>
              <button 
                onClick={handleCreatePerformanceReview}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Create Performance Review
              </button>
            </div>
          )}

          {/* Training Tab */}
          {activeTab === 'training' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Training Programs</h3>
                <button onClick={() => { setModalType('training'); setFormData({}); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <Plus size={18} /> New Training
                </button>
              </div>
              
              {trainings.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Award size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No training programs found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trainings.map(t => (
                    <div key={t.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold">{t.program_name}</h4>
                        <span className={`px-2 py-1 rounded text-xs ${t.status === 'completed' ? 'bg-green-100 text-green-800' : t.status === 'ongoing' ? 'bg-blue-100 text-blue-800' : t.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {t.status}
                        </span>
                      </div>
                      {t.description && <p className="text-sm text-gray-600 mb-2">{t.description}</p>}
                      <div className="text-sm text-gray-500 space-y-1">
                        {t.trainer_name && <p>Trainer: {t.trainer_name}</p>}
                        <p>📅 {t.start_date} to {t.end_date}</p>
                        {t.location && <p>📍 {t.location}</p>}
                        {t.duration_hours && <p>⏱️ {t.duration_hours} hours</p>}
                        <p>👥 {t.participant_count || 0} participants</p>
                        {t.cost && <p>💰 GHS {t.cost}</p>}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={async () => { const res = await axios.get(`${API_BASE_URL}/hr_payroll.php?resource=training&id=${t.id}`); if (res.data.success) { setSelectedTraining(res.data.training); setModalType('view_training'); setShowModal(true); } }} className="flex-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200">
                          View
                        </button>
                        <button onClick={() => { setFormData(t); setModalType('training'); setShowModal(true); }} className="px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDeleteTraining(t.id)} className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200">
                          <XCircle size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Employee Documents</h3>
                <button onClick={() => { setModalType('document'); setFormData({}); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <Plus size={18} /> Upload Document
                </button>
              </div>

              {/* Expiring Documents Alert */}
              {documents.length > 0 && (
                <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                    <Clock size={18} />
                    Documents Expiring Soon (Next 30 Days)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-yellow-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-yellow-800">Employee</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-yellow-800">Document</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-yellow-800">Type</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-yellow-800">Expiry Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-yellow-200">
                        {documents.map(d => (
                          <tr key={d.id}>
                            <td className="px-4 py-2 font-medium">{d.employee_name}</td>
                            <td className="px-4 py-2">{d.document_name}</td>
                            <td className="px-4 py-2">{d.document_type || '-'}</td>
                            <td className="px-4 py-2 text-red-600 font-medium">{d.expiry_date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {documents.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No documents expiring in the next 30 days</p>
                </div>
              )}

              {/* Document Types Info */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                {['ID Card', 'Contract', 'Certificate', 'License'].map(type => (
                  <div key={type} className="border rounded-lg p-4 text-center">
                    <FileText className="mx-auto text-blue-600 mb-2" size={24} />
                    <p className="font-medium">{type}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="text-center py-12">
              <FileText className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-xl font-semibold mb-2">HR & Payroll Reports</h3>
              <p className="text-gray-600 mb-4">Generate comprehensive reports</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-6">
                <button className="border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50">
                  Payroll Summary
                </button>
                <button className="border-2 border-green-600 text-green-600 px-6 py-3 rounded-lg hover:bg-green-50">
                  Attendance Report
                </button>
                <button className="border-2 border-purple-600 text-purple-600 px-6 py-3 rounded-lg hover:bg-purple-50">
                  Leave Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Add Employee Modal */}
            {modalType === 'employee' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Add New Employee</h2>
                <form onSubmit={handleAddEmployee}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Employee Number</label>
                      <input
                        type="text"
                        required
                        className="w-full border rounded-lg px-3 py-2"
                        value={formData.employee_number || ''}
                        onChange={(e) => setFormData({...formData, employee_number: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        required
                        className="w-full border rounded-lg px-3 py-2"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">First Name</label>
                      <input
                        type="text"
                        required
                        className="w-full border rounded-lg px-3 py-2"
                        value={formData.first_name || ''}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Last Name</label>
                      <input
                        type="text"
                        required
                        className="w-full border rounded-lg px-3 py-2"
                        value={formData.last_name || ''}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone</label>
                      <input
                        type="tel"
                        className="w-full border rounded-lg px-3 py-2"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Date of Birth</label>
                      <input
                        type="date"
                        className="w-full border rounded-lg px-3 py-2"
                        value={formData.date_of_birth || ''}
                        onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Gender</label>
                      <select
                        className="w-full border rounded-lg px-3 py-2"
                        value={formData.gender || ''}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Join Date</label>
                      <input
                        type="date"
                        required
                        className="w-full border rounded-lg px-3 py-2"
                        value={formData.join_date || ''}
                        onChange={(e) => setFormData({...formData, join_date: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Basic Salary</label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        className="w-full border rounded-lg px-3 py-2"
                        value={formData.basic_salary || ''}
                        onChange={(e) => setFormData({...formData, basic_salary: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Employment Type</label>
                      <select
                        className="w-full border rounded-lg px-3 py-2"
                        value={formData.employment_type || 'full_time'}
                        onChange={(e) => setFormData({...formData, employment_type: e.target.value})}
                      >
                        <option value="full_time">Full Time</option>
                        <option value="part_time">Part Time</option>
                        <option value="contract">Contract</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Address</label>
                      <textarea
                        className="w-full border rounded-lg px-3 py-2"
                        rows="2"
                        value={formData.address || ''}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                      ></textarea>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Add Employee
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowModal(false); setFormData({}); }}
                      className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Mark Attendance Modal */}
            {modalType === 'attendance' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Mark Attendance</h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full border rounded-lg px-3 py-2"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      initializeAttendanceRecords();
                    }}
                  />
                </div>
                
                {attendanceRecords.length === 0 && (
                  <button
                    onClick={initializeAttendanceRecords}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mb-4"
                  >
                    Load Employees
                  </button>
                )}

                {attendanceRecords.length > 0 && (
                  <div className="max-h-96 overflow-y-auto mb-4">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-sm">Employee</th>
                          <th className="px-3 py-2 text-left text-sm">Status</th>
                          <th className="px-3 py-2 text-left text-sm">Check In</th>
                          <th className="px-3 py-2 text-left text-sm">Check Out</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {attendanceRecords.map((record) => (
                          <tr key={record.employee_id}>
                            <td className="px-3 py-2 text-sm">{record.employee_name}</td>
                            <td className="px-3 py-2">
                              <select
                                value={record.status}
                                onChange={(e) => updateAttendanceRecord(record.employee_id, 'status', e.target.value)}
                                className="border rounded px-2 py-1 text-sm"
                              >
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                                <option value="late">Late</option>
                                <option value="half_day">Half Day</option>
                                <option value="on_leave">On Leave</option>
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="time"
                                value={record.check_in_time}
                                onChange={(e) => updateAttendanceRecord(record.employee_id, 'check_in_time', e.target.value)}
                                className="border rounded px-2 py-1 text-sm"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="time"
                                value={record.check_out_time}
                                onChange={(e) => updateAttendanceRecord(record.employee_id, 'check_out_time', e.target.value)}
                                className="border rounded px-2 py-1 text-sm"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={submitAttendance}
                    disabled={attendanceRecords.length === 0}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                  >
                    Submit Attendance
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setAttendanceRecords([]);
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Generate Reports Modal */}
            {modalType === 'reports' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Generate Reports</h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Month</label>
                  <input
                    type="month"
                    className="w-full border rounded-lg px-3 py-2"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => downloadReport('payroll_summary')}
                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-lg text-left flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">Payroll Summary Report</div>
                      <div className="text-sm text-gray-600">Complete payroll breakdown for {selectedMonth}</div>
                    </div>
                    <Download size={20} />
                  </button>
                  <button
                    onClick={() => downloadReport('attendance_report')}
                    className="w-full bg-green-50 hover:bg-green-100 text-green-700 px-4 py-3 rounded-lg text-left flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">Attendance Report</div>
                      <div className="text-sm text-gray-600">Monthly attendance summary</div>
                    </div>
                    <Download size={20} />
                  </button>
                  <button
                    onClick={() => downloadReport('leave_report')}
                    className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-3 rounded-lg text-left flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">Leave Report</div>
                      <div className="text-sm text-gray-600">Leave applications and balances</div>
                    </div>
                    <Download size={20} />
                  </button>
                  <button
                    onClick={() => downloadReport('salary_slips')}
                    className="w-full bg-orange-50 hover:bg-orange-100 text-orange-700 px-4 py-3 rounded-lg text-left flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">Salary Slips (All)</div>
                      <div className="text-sm text-gray-600">Generate all salary slips for {selectedMonth}</div>
                    </div>
                    <Download size={20} />
                  </button>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full mt-4 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            )}

            {/* Salary Components Modal */}
            {modalType === 'salary_components' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Salary Components</h2>
                <div className="mb-4">
                  <button
                    onClick={() => setModalType('add_salary_component')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    + Add New Component
                  </button>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {salaryComponents.map(comp => (
                    <div key={comp.id} className="border rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <div className="font-medium">{comp.component_name}</div>
                        <div className="text-sm text-gray-600">{comp.description}</div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          comp.component_type === 'earning' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {comp.component_type}
                        </span>
                      </div>
                      <span className={`px-3 py-1 rounded ${
                        comp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {comp.status}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full mt-4 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            )}

            {/* Add Salary Component Modal */}
            {modalType === 'add_salary_component' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Add Salary Component</h2>
                <form onSubmit={handleAddSalaryComponent}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Component Name</label>
                      <input
                        type="text"
                        required
                        className="w-full border rounded-lg px-3 py-2"
                        value={formData.component_name || ''}
                        onChange={(e) => setFormData({...formData, component_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Type</label>
                      <select
                        required
                        className="w-full border rounded-lg px-3 py-2"
                        value={formData.component_type || ''}
                        onChange={(e) => setFormData({...formData, component_type: e.target.value})}
                      >
                        <option value="">Select Type</option>
                        <option value="earning">Earning</option>
                        <option value="deduction">Deduction</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        className="w-full border rounded-lg px-3 py-2"
                        rows="2"
                        value={formData.description || ''}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                      ></textarea>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Add Component
                    </button>
                    <button
                      type="button"
                      onClick={() => { setModalType('salary_components'); setFormData({}); }}
                      className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Back
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Performance Review Modal */}
            {modalType === 'performance_review' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Create Performance Review</h2>
                <form onSubmit={handleSubmitPerformanceReview}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Employee</label>
                      <select
                        required
                        className="w-full border rounded-lg px-3 py-2"
                        value={formData.employee_id || ''}
                        onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                      >
                        <option value="">Select Employee</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.first_name} {emp.last_name} - {emp.employee_number}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Period Start</label>
                      <input
                        type="date"
                        required
                        className="w-full border rounded-lg px-3 py-2"
                        value={formData.review_period_start || ''}
                        onChange={(e) => setFormData({...formData, review_period_start: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Period End</label>
                      <input
                        type="date"
                        required
                        className="w-full border rounded-lg px-3 py-2"
                        value={formData.review_period_end || ''}
                        onChange={(e) => setFormData({...formData, review_period_end: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Work Quality (1-5)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="5"
                        className="w-full border rounded-lg px-3 py-2"
                        value={formData.work_quality || ''}
                        onChange={(e) => setFormData({...formData, work_quality: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Productivity (1-5)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="5"
                        className="w-full border rounded-lg px-3 py-2"
                        value={formData.productivity || ''}
                        onChange={(e) => setFormData({...formData, productivity: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Communication (1-5)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="5"
                        className="w-full border rounded-lg px-3 py-2"
                        value={formData.communication || ''}
                        onChange={(e) => setFormData({...formData, communication: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Teamwork (1-5)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="5"
                        className="w-full border rounded-lg px-3 py-2"
                        value={formData.teamwork || ''}
                        onChange={(e) => setFormData({...formData, teamwork: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Punctuality (1-5)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="5"
                        className="w-full border rounded-lg px-3 py-2"
                        value={formData.punctuality || ''}
                        onChange={(e) => setFormData({...formData, punctuality: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Strengths</label>
                      <textarea
                        className="w-full border rounded-lg px-3 py-2"
                        rows="2"
                        value={formData.strengths || ''}
                        onChange={(e) => setFormData({...formData, strengths: e.target.value})}
                      ></textarea>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Areas for Improvement</label>
                      <textarea
                        className="w-full border rounded-lg px-3 py-2"
                        rows="2"
                        value={formData.areas_for_improvement || ''}
                        onChange={(e) => setFormData({...formData, areas_for_improvement: e.target.value})}
                      ></textarea>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Goals</label>
                      <textarea
                        className="w-full border rounded-lg px-3 py-2"
                        rows="2"
                        value={formData.goals || ''}
                        onChange={(e) => setFormData({...formData, goals: e.target.value})}
                      ></textarea>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Create Review
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowModal(false); setFormData({}); }}
                      className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* View Employee Modal */}
            {modalType === 'view_employee' && viewEmployee && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Employee Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Employee Number</label>
                    <p className="font-semibold">{viewEmployee.employee_number}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Full Name</label>
                    <p className="font-semibold">{viewEmployee.first_name} {viewEmployee.last_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Email</label>
                    <p className="font-semibold">{viewEmployee.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Phone</label>
                    <p className="font-semibold">{viewEmployee.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Department</label>
                    <p className="font-semibold">{viewEmployee.department_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Designation</label>
                    <p className="font-semibold">{viewEmployee.designation_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Basic Salary</label>
                    <p className="font-semibold">GHS {viewEmployee.basic_salary}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Status</label>
                    <p className="font-semibold capitalize">{viewEmployee.status}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Join Date</label>
                    <p className="font-semibold">{viewEmployee.join_date || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Employment Type</label>
                    <p className="font-semibold capitalize">{viewEmployee.employment_type || 'N/A'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full mt-6 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            )}

            {/* Edit Employee Modal */}
            {modalType === 'edit_employee' && editEmployee && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Edit Employee</h2>
                <form onSubmit={handleUpdateEmployee}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        className="w-full border rounded-lg px-3 py-2"
                        value={formData.first_name || ''}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Last Name *</label>
                      <input
                        type="text"
                        required
                        className="w-full border rounded-lg px-3 py-2"
                        value={formData.last_name || ''}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        className="w-full border rounded-lg px-3 py-2"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone</label>
                      <input
                        type="text"
                        className="w-full border rounded-lg px-3 py-2"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Basic Salary *</label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        className="w-full border rounded-lg px-3 py-2"
                        value={formData.basic_salary || ''}
                        onChange={(e) => setFormData({...formData, basic_salary: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <select
                        className="w-full border rounded-lg px-3 py-2"
                        value={formData.status || 'active'}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="on_leave">On Leave</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Salary Components Section */}
                  <div className="mt-6 border-t pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Salary Components</h3>
                      <button
                        type="button"
                        onClick={handleManageSalaryComponents}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 text-sm"
                      >
                        + Assign Component
                      </button>
                    </div>
                    
                    {/* Current Components */}
                    <div className="space-y-2 mb-4">
                      {employeeSalaryComponents.length > 0 ? (
                        employeeSalaryComponents.map((comp) => (
                          <div key={comp.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                            <div>
                              <div className="font-medium">{comp.component_name}</div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  comp.component_type === 'earning' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {comp.component_type}
                                </span>
                                {comp.calculation_type === 'percentage' && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                                    {parseFloat(comp.amount).toFixed(1)}% of basic
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold">
                                {comp.calculation_type === 'percentage' 
                                  ? `${parseFloat(comp.amount).toFixed(1)}%`
                                  : `GHS ${parseFloat(comp.amount).toFixed(2)}`
                                }
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveComponent(comp.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <XCircle size={18} />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm text-center py-4">No salary components assigned</p>
                      )}
                    </div>
                    
                    {/* Assign Component Form */}
                    {assigningComponents && (
                      <div className="border rounded-lg p-4 bg-blue-50">
                        <h4 className="font-semibold mb-3">Assign New Component</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Basic Salary: <strong>GHS {parseFloat(formData.basic_salary || 0).toFixed(2)}</strong>
                        </p>
                        <div className="space-y-3">
                          {salaryComponents.filter(sc => 
                            !employeeSalaryComponents.find(esc => esc.component_id === sc.id)
                          ).map((component) => (
                            <div key={component.id} className="flex items-center gap-3 bg-white p-2 rounded">
                              <div className="flex-1">
                                <div className="font-medium">{component.component_name}</div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    component.component_type === 'earning' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {component.component_type}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    component.calculation_type === 'percentage' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {component.calculation_type === 'percentage' ? '% of basic' : 'fixed amount'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder={component.calculation_type === 'percentage' ? 'e.g. 5.5' : 'Amount'}
                                  className="w-24 border rounded px-2 py-1 text-sm"
                                  id={`amount-${component.id}`}
                                />
                                <span className="text-sm text-gray-600">
                                  {component.calculation_type === 'percentage' ? '%' : 'GHS'}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const amount = document.getElementById(`amount-${component.id}`).value;
                                  if (amount && parseFloat(amount) > 0) {
                                    handleAssignComponent(component.id, amount);
                                    document.getElementById(`amount-${component.id}`).value = '';
                                  } else {
                                    alert('Please enter a valid value');
                                  }
                                }}
                                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                              >
                                Assign
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 p-3 bg-yellow-50 rounded text-sm">
                          <strong>💡 Tip:</strong> For percentage-based components (like SSNIT, Tax), enter the percentage value.
                          <br/>Example: Enter <strong>5.5</strong> for SSNIT Tier 1 (5.5% of basic salary)
                        </div>
                        <button
                          type="button"
                          onClick={() => setAssigningComponents(false)}
                          className="mt-3 text-sm text-gray-600 hover:text-gray-800"
                        >
                          Close
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Update Employee
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowModal(false); setFormData({}); setEditEmployee(null); setAssigningComponents(false); }}
                      className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* View Pay Slip Modal */}
            {modalType === 'view_payslip' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Salary Slip</h2>
                {formData.report && formData.report.length > 0 ? (
                  <div className="bg-white border rounded-lg p-6">
                    {formData.report.map((slip, index) => (
                    <div key={index} className="mb-6">
                      <div className="border-b pb-4 mb-4">
                        <h3 className="text-lg font-bold">{slip.employee_name}</h3>
                        <p className="text-gray-600">{slip.employee_number}</p>
                        <p className="text-gray-600">{slip.designation}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Month</p>
                          <p className="font-semibold">{slip.month}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Basic Salary</p>
                          <p className="font-semibold">GHS {parseFloat(slip.basic_salary).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="mb-4">
                        <p className="font-semibold text-green-600 mb-2">Earnings</p>
                        {slip.earnings && slip.earnings.map((earning, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span>{earning.component_name}</span>
                            <span>GHS {parseFloat(earning.amount).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-semibold mt-2 pt-2 border-t">
                          <span>Total Earnings</span>
                          <span>GHS {parseFloat(slip.total_earnings).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="mb-4">
                        <p className="font-semibold text-red-600 mb-2">Deductions</p>
                        {slip.deductions && slip.deductions.map((deduction, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span>{deduction.component_name}</span>
                            <span>GHS {parseFloat(deduction.amount).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-semibold mt-2 pt-2 border-t">
                          <span>Total Deductions</span>
                          <span>GHS {parseFloat(slip.total_deductions).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Net Salary</span>
                          <span>GHS {parseFloat(slip.net_salary).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No payroll data found for this employee in the selected month.</p>
                    <p className="text-sm text-gray-500 mt-2">Please generate payroll first.</p>
                  </div>
                )}
                <div className="flex gap-3 mt-6">
                  {formData.report && formData.report.length > 0 && (
                    <button
                      onClick={() => handlePrintPaySlip(formData.report[0])}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <FileText size={18} />
                      Print Pay Slip
                    </button>
                  )}
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Training Modal */}
            {modalType === 'training' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">{formData.id ? 'Edit Training' : 'New Training Program'}</h2>
                <form onSubmit={handleSaveTraining}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Program Name *</label>
                      <input type="text" required className="w-full border rounded-lg px-3 py-2" value={formData.program_name || ''} onChange={(e) => setFormData({...formData, program_name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea className="w-full border rounded-lg px-3 py-2" rows={2} value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Trainer Name</label>
                        <input type="text" className="w-full border rounded-lg px-3 py-2" value={formData.trainer_name || ''} onChange={(e) => setFormData({...formData, trainer_name: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Location</label>
                        <input type="text" className="w-full border rounded-lg px-3 py-2" value={formData.location || ''} onChange={(e) => setFormData({...formData, location: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Start Date *</label>
                        <input type="date" required className="w-full border rounded-lg px-3 py-2" value={formData.start_date || ''} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">End Date *</label>
                        <input type="date" required className="w-full border rounded-lg px-3 py-2" value={formData.end_date || ''} onChange={(e) => setFormData({...formData, end_date: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Duration (hours)</label>
                        <input type="number" className="w-full border rounded-lg px-3 py-2" value={formData.duration_hours || ''} onChange={(e) => setFormData({...formData, duration_hours: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Cost (GHS)</label>
                        <input type="number" step="0.01" className="w-full border rounded-lg px-3 py-2" value={formData.cost || ''} onChange={(e) => setFormData({...formData, cost: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Max Participants</label>
                        <input type="number" className="w-full border rounded-lg px-3 py-2" value={formData.max_participants || ''} onChange={(e) => setFormData({...formData, max_participants: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <select className="w-full border rounded-lg px-3 py-2" value={formData.status || 'scheduled'} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                        <option value="scheduled">Scheduled</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
                    <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Save</button>
                  </div>
                </form>
              </div>
            )}

            {/* View Training Modal */}
            {modalType === 'view_training' && selectedTraining && (
              <div>
                <h2 className="text-2xl font-bold mb-4">{selectedTraining.program_name}</h2>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">{selectedTraining.description || 'No description'}</p>
                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                      <p><strong>Trainer:</strong> {selectedTraining.trainer_name || '-'}</p>
                      <p><strong>Location:</strong> {selectedTraining.location || '-'}</p>
                      <p><strong>Dates:</strong> {selectedTraining.start_date} to {selectedTraining.end_date}</p>
                      <p><strong>Duration:</strong> {selectedTraining.duration_hours || '-'} hours</p>
                      <p><strong>Cost:</strong> GHS {selectedTraining.cost || '0'}</p>
                      <p><strong>Status:</strong> <span className={`px-2 py-1 rounded text-xs ${selectedTraining.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{selectedTraining.status}</span></p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Participants ({selectedTraining.participants?.length || 0})</h3>
                    {selectedTraining.participants?.length > 0 ? (
                      <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                        {selectedTraining.participants.map(p => (
                          <div key={p.id} className="p-2 flex justify-between items-center">
                            <span>{p.employee_name} ({p.employee_number})</span>
                            <span className={`px-2 py-1 rounded text-xs ${p.attendance_status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{p.attendance_status}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No participants enrolled yet</p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Enroll Employee</h3>
                    <div className="flex gap-2">
                      <select id="enrollEmployee" className="flex-1 border rounded-lg px-3 py-2">
                        <option value="">Select Employee</option>
                        {employees.filter(e => !selectedTraining.participants?.some(p => p.employee_id === e.id)).map(e => (
                          <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                        ))}
                      </select>
                      <button onClick={() => { const empId = document.getElementById('enrollEmployee').value; if (empId) handleEnrollEmployee(selectedTraining.id, empId); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Enroll</button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">Close</button>
                </div>
              </div>
            )}

            {/* Document Modal */}
            {modalType === 'document' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Upload Employee Document</h2>
                <form onSubmit={handleSaveDocument}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Employee *</label>
                      <select required className="w-full border rounded-lg px-3 py-2" value={formData.employee_id || ''} onChange={(e) => setFormData({...formData, employee_id: e.target.value})}>
                        <option value="">Select Employee</option>
                        {employees.map(e => (
                          <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_number})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Document Name *</label>
                      <input type="text" required className="w-full border rounded-lg px-3 py-2" value={formData.document_name || ''} onChange={(e) => setFormData({...formData, document_name: e.target.value})} placeholder="e.g., National ID Card" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Document Type</label>
                        <select className="w-full border rounded-lg px-3 py-2" value={formData.document_type || ''} onChange={(e) => setFormData({...formData, document_type: e.target.value})}>
                          <option value="">Select Type</option>
                          <option value="ID Card">ID Card</option>
                          <option value="Contract">Contract</option>
                          <option value="Certificate">Certificate</option>
                          <option value="License">License</option>
                          <option value="Resume">Resume</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Expiry Date</label>
                        <input type="date" className="w-full border rounded-lg px-3 py-2" value={formData.expiry_date || ''} onChange={(e) => setFormData({...formData, expiry_date: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">File Path *</label>
                      <input type="text" required className="w-full border rounded-lg px-3 py-2" value={formData.file_path || ''} onChange={(e) => setFormData({...formData, file_path: e.target.value})} placeholder="/uploads/documents/filename.pdf" />
                      <p className="text-xs text-gray-500 mt-1">Enter the file path where the document is stored</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Notes</label>
                      <textarea className="w-full border rounded-lg px-3 py-2" rows={2} value={formData.notes || ''} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
                    <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Save</button>
                  </div>
                </form>
              </div>
            )}

            {/* Department Modal */}
            {modalType === 'department' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">{formData.id ? 'Edit' : 'Add'} Department</h2>
                <form onSubmit={handleSaveDepartment}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Department Name *</label>
                      <input type="text" required className="w-full border rounded-lg px-3 py-2" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea className="w-full border rounded-lg px-3 py-2" rows={3} value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Head of Department</label>
                      <select className="w-full border rounded-lg px-3 py-2" value={formData.head_id || ''} onChange={(e) => setFormData({...formData, head_id: e.target.value})}>
                        <option value="">Select Employee</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
                    <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Save</button>
                  </div>
                </form>
              </div>
            )}

            {/* Designation Modal */}
            {modalType === 'designation' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">{formData.id ? 'Edit' : 'Add'} Designation</h2>
                <form onSubmit={handleSaveDesignation}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Title *</label>
                      <input type="text" required className="w-full border rounded-lg px-3 py-2" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Department</label>
                      <select className="w-full border rounded-lg px-3 py-2" value={formData.department_id || ''} onChange={(e) => setFormData({...formData, department_id: e.target.value})}>
                        <option value="">Select Department</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea className="w-full border rounded-lg px-3 py-2" rows={3} value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
                    <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Save</button>
                  </div>
                </form>
              </div>
            )}

            {/* Overtime Modal */}
            {modalType === 'overtime' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Add Overtime Record</h2>
                <form onSubmit={handleSaveOvertime}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Employee *</label>
                      <select required className="w-full border rounded-lg px-3 py-2" value={formData.employee_id || ''} onChange={(e) => setFormData({...formData, employee_id: e.target.value})}>
                        <option value="">Select Employee</option>
                        {employees.filter(e => e.status === 'active').map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Date *</label>
                        <input type="date" required className="w-full border rounded-lg px-3 py-2" value={formData.overtime_date || ''} onChange={(e) => setFormData({...formData, overtime_date: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Hours *</label>
                        <input type="number" step="0.5" required className="w-full border rounded-lg px-3 py-2" value={formData.hours || ''} onChange={(e) => setFormData({...formData, hours: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Rate Multiplier</label>
                        <select className="w-full border rounded-lg px-3 py-2" value={formData.rate_multiplier || '1.5'} onChange={(e) => setFormData({...formData, rate_multiplier: e.target.value})}>
                          <option value="1.5">1.5x (Regular)</option>
                          <option value="2">2x (Weekend)</option>
                          <option value="2.5">2.5x (Holiday)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select className="w-full border rounded-lg px-3 py-2" value={formData.status || 'pending'} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Reason</label>
                      <textarea className="w-full border rounded-lg px-3 py-2" rows={2} value={formData.reason || ''} onChange={(e) => setFormData({...formData, reason: e.target.value})} />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
                    <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Save</button>
                  </div>
                </form>
              </div>
            )}

            {/* Loan Modal */}
            {modalType === 'loan' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Add Loan/Advance</h2>
                <form onSubmit={handleSaveLoan}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Employee *</label>
                      <select required className="w-full border rounded-lg px-3 py-2" value={formData.employee_id || ''} onChange={(e) => setFormData({...formData, employee_id: e.target.value})}>
                        <option value="">Select Employee</option>
                        {employees.filter(e => e.status === 'active').map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Type *</label>
                        <select required className="w-full border rounded-lg px-3 py-2" value={formData.loan_type || ''} onChange={(e) => setFormData({...formData, loan_type: e.target.value})}>
                          <option value="">Select Type</option>
                          <option value="loan">Loan</option>
                          <option value="advance">Salary Advance</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Date *</label>
                        <input type="date" required className="w-full border rounded-lg px-3 py-2" value={formData.loan_date || ''} onChange={(e) => setFormData({...formData, loan_date: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Amount (GHS) *</label>
                        <input type="number" step="0.01" required className="w-full border rounded-lg px-3 py-2" value={formData.amount || ''} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Monthly Deduction</label>
                        <input type="number" step="0.01" className="w-full border rounded-lg px-3 py-2" value={formData.monthly_deduction || ''} onChange={(e) => setFormData({...formData, monthly_deduction: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Reason</label>
                      <textarea className="w-full border rounded-lg px-3 py-2" rows={2} value={formData.reason || ''} onChange={(e) => setFormData({...formData, reason: e.target.value})} />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
                    <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Save</button>
                  </div>
                </form>
              </div>
            )}

            {/* Shift Modal */}
            {modalType === 'shift' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">{formData.id ? 'Edit' : 'Add'} Shift</h2>
                <form onSubmit={handleSaveShift}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Shift Name *</label>
                      <input type="text" required className="w-full border rounded-lg px-3 py-2" value={formData.shift_name || ''} onChange={(e) => setFormData({...formData, shift_name: e.target.value})} placeholder="e.g., Morning Shift" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Start Time *</label>
                        <input type="time" required className="w-full border rounded-lg px-3 py-2" value={formData.start_time || ''} onChange={(e) => setFormData({...formData, start_time: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">End Time *</label>
                        <input type="time" required className="w-full border rounded-lg px-3 py-2" value={formData.end_time || ''} onChange={(e) => setFormData({...formData, end_time: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea className="w-full border rounded-lg px-3 py-2" rows={2} value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
                    <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Save</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
