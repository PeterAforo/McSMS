import { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Fingerprint, Camera, CreditCard, Shield, Plus, Edit2, Trash2, X, Eye, Clock, Users, UserCheck, AlertTriangle, Activity, MapPin, Wifi, WifiOff, CheckCircle, XCircle, RefreshCw, Thermometer, Search, Download, Printer, BarChart3, Calendar, FileText, Bell, Lock, Unlock, Building, History, TrendingUp, PieChart, Filter } from 'lucide-react';
import { API_BASE_URL } from '../../config';

const API = `${API_BASE_URL}/biometric.php`;

export default function Biometric() {
  const [devices, setDevices] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [accessLogs, setAccessLogs] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('devices');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Enhanced state for new features
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [attendanceReport, setAttendanceReport] = useState([]);
  const [zones, setZones] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [lateArrivals, setLateArrivals] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [deviceHealth, setDeviceHealth] = useState([]);
  const [bulkEnrollList, setBulkEnrollList] = useState([]);
  const [expectedCheckInTime, setExpectedCheckInTime] = useState('08:00');

  const [deviceForm, setDeviceForm] = useState({ device_name: '', device_type: 'fingerprint', device_model: '', serial_number: '', ip_address: '', port: '', location: '', api_endpoint: '', api_key: '', status: 'active' });
  const [enrollmentForm, setEnrollmentForm] = useState({ user_id: '', user_type: 'student', device_id: '', biometric_type: 'fingerprint', template_data: '', finger_position: '', rfid_card_number: '', quality_score: '' });
  const [visitorForm, setVisitorForm] = useState({ visitor_name: '', phone: '', email: '', id_type: '', id_number: '', purpose_of_visit: '', host_name: '', host_department: '', temperature: '', expected_date: '', badge_printed: false });
  const [zoneForm, setZoneForm] = useState({ zone_name: '', description: '', access_level: 'normal', devices: [] });
  const [scheduleForm, setScheduleForm] = useState({ schedule_name: '', user_type: 'student', start_time: '08:00', end_time: '17:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] });

  useEffect(() => {
    Promise.all([fetchDevices(), fetchStudents(), fetchTeachers(), fetchEmployees(), fetchZones(), fetchDeviceHealth()]).then(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'attendance') fetchAttendance();
    if (activeTab === 'access') fetchAccessLogs();
    if (activeTab === 'visitors') fetchVisitors();
    if (activeTab === 'reports') fetchAttendanceReport();
    if (activeTab === 'zones') fetchZones();
    if (activeTab === 'schedules') fetchSchedules();
    if (activeTab === 'audit') fetchAuditLogs();
    if (activeTab === 'alerts') { fetchLateArrivals(); fetchAbsences(); }
  }, [activeTab, selectedDate, dateFrom, dateTo]);

  const fetchDevices = async () => { try { const r = await axios.get(`${API}?resource=devices`); setDevices(r.data.devices || []); } catch (e) { console.error(e); } };
  const fetchAttendance = async () => { try { const r = await axios.get(`${API}?resource=attendance&action=by_date&date=${selectedDate}`); setAttendance(r.data.attendance || []); } catch (e) { console.error(e); } };
  const fetchAccessLogs = async () => { try { const r = await axios.get(`${API}?resource=access&action=recent&limit=100`); setAccessLogs(r.data.access_logs || []); } catch (e) { console.error(e); } };
  const fetchVisitors = async () => { try { const r = await axios.get(`${API}?resource=visitors`); setVisitors(r.data.visitors || []); } catch (e) { console.error(e); } };
  const fetchEnrollmentsByDevice = async (deviceId) => { try { const r = await axios.get(`${API}?resource=enrollments&action=by_device&device_id=${deviceId}`); setEnrollments(r.data.enrollments || []); } catch (e) { console.error(e); } };
  const fetchStudents = async () => { try { const r = await axios.get(`${API_BASE_URL}/students.php`); setStudents(r.data.students || []); } catch (e) { console.error(e); } };
  const fetchTeachers = async () => { try { const r = await axios.get(`${API_BASE_URL}/teachers.php`); setTeachers(r.data.teachers || []); } catch (e) { console.error(e); } };
  const fetchEmployees = async () => { try { const r = await axios.get(`${API_BASE_URL}/hr_payroll.php?resource=employees`); setEmployees(r.data.employees || []); } catch (e) { console.error(e); } };

  // New fetch functions
  const fetchAttendanceReport = async () => { try { const r = await axios.get(`${API}?resource=attendance&action=report&date_from=${dateFrom || selectedDate}&date_to=${dateTo || selectedDate}`); setAttendanceReport(r.data.report || []); } catch (e) { console.error(e); } };
  const fetchZones = async () => { try { const r = await axios.get(`${API}?resource=zones`); setZones(r.data.zones || []); } catch (e) { console.error(e); } };
  const fetchSchedules = async () => { try { const r = await axios.get(`${API}?resource=schedules`); setSchedules(r.data.schedules || []); } catch (e) { console.error(e); } };
  const fetchAuditLogs = async () => { try { const r = await axios.get(`${API}?resource=audit&limit=100`); setAuditLogs(r.data.logs || []); } catch (e) { console.error(e); } };
  const fetchLateArrivals = async () => { try { const r = await axios.get(`${API}?resource=attendance&action=late&date=${selectedDate}&expected_time=${expectedCheckInTime}`); setLateArrivals(r.data.late_arrivals || []); } catch (e) { console.error(e); } };
  const fetchAbsences = async () => { try { const r = await axios.get(`${API}?resource=attendance&action=absences&date=${selectedDate}`); setAbsences(r.data.absences || []); } catch (e) { console.error(e); } };
  const fetchDeviceHealth = async () => { try { const r = await axios.get(`${API}?resource=devices&action=health`); setDeviceHealth(r.data.health || []); } catch (e) { console.error(e); } };

  // Filter functions
  const filteredAttendance = attendance.filter(a => {
    const matchesSearch = !searchTerm || (a.user_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !userTypeFilter || a.user_type === userTypeFilter;
    return matchesSearch && matchesType;
  });

  const filteredVisitors = visitors.filter(v => {
    const matchesSearch = !searchTerm || v.visitor_name.toLowerCase().includes(searchTerm.toLowerCase()) || (v.host_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredAccessLogs = accessLogs.filter(l => {
    const matchesSearch = !searchTerm || (l.user_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !userTypeFilter || l.user_type === userTypeFilter;
    return matchesSearch && matchesType;
  });

  // Export functions
  const exportToPDF = (type) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Biometric ${type.charAt(0).toUpperCase() + type.slice(1)} Report`, 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    
    if (type === 'attendance') {
      autoTable(doc, { startY: 35, head: [['User', 'Type', 'Device', 'Check In', 'Check Out', 'Status']], body: filteredAttendance.map(a => [a.user_name || `User #${a.user_id}`, a.user_type, a.device_name, a.check_in_time?.substring(11, 16) || '-', a.check_out_time?.substring(11, 16) || '-', a.verification_status]) });
    } else if (type === 'visitors') {
      autoTable(doc, { startY: 35, head: [['Visitor', 'Phone', 'Host', 'Purpose', 'Check In', 'Status']], body: filteredVisitors.map(v => [v.visitor_name, v.phone, v.host_name, v.purpose_of_visit, v.check_in_time || '-', v.status]) });
    } else if (type === 'access') {
      autoTable(doc, { startY: 35, head: [['Time', 'User', 'Device', 'Type', 'Access']], body: filteredAccessLogs.map(l => [l.access_time, l.user_name || `${l.user_type} #${l.user_id}`, l.device_name, l.access_type, l.access_granted ? 'Granted' : 'Denied']) });
    }
    doc.save(`biometric_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = (type) => {
    let csv = '';
    if (type === 'attendance') {
      csv = 'User,Type,Device,Check In,Check Out,Status\n' + filteredAttendance.map(a => `${a.user_name || `User #${a.user_id}`},${a.user_type},${a.device_name},${a.check_in_time || '-'},${a.check_out_time || '-'},${a.verification_status}`).join('\n');
    } else if (type === 'visitors') {
      csv = 'Visitor,Phone,Host,Purpose,Check In,Status\n' + filteredVisitors.map(v => `${v.visitor_name},${v.phone},${v.host_name},${v.purpose_of_visit},${v.check_in_time || '-'},${v.status}`).join('\n');
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `biometric_${type}_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  const printVisitorBadge = (visitor) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Visitor Badge</title><style>body{font-family:Arial;text-align:center;padding:20px;}.badge{border:3px solid #333;padding:20px;max-width:300px;margin:auto;border-radius:10px;}.name{font-size:24px;font-weight:bold;margin:10px 0;}.info{font-size:14px;color:#666;}.host{background:#f0f0f0;padding:10px;margin:10px 0;border-radius:5px;}.date{font-size:12px;color:#999;}@media print{.no-print{display:none;}}</style></head><body><div class="badge"><h2>VISITOR</h2><div class="name">${visitor.visitor_name}</div><div class="info">${visitor.purpose_of_visit}</div><div class="host">Host: ${visitor.host_name}<br>${visitor.host_department || ''}</div><div class="date">${new Date().toLocaleDateString()}</div></div><button class="no-print" onclick="window.print()" style="margin-top:20px;padding:10px 20px;">Print Badge</button></body></html>`);
    printWindow.document.close();
  };

  // Bulk enrollment
  const handleBulkEnroll = async () => {
    if (bulkEnrollList.length === 0 || !selectedDevice) { alert('Select device and users'); return; }
    try {
      for (const userId of bulkEnrollList) {
        await axios.post(`${API}?resource=enrollments`, { user_id: userId, user_type: enrollmentForm.user_type, device_id: selectedDevice.id, biometric_type: enrollmentForm.biometric_type, template_data: 'BULK_SIMULATED_TEMPLATE' });
      }
      alert(`✅ ${bulkEnrollList.length} users enrolled!`);
      setBulkEnrollList([]);
      if (selectedDevice) fetchEnrollmentsByDevice(selectedDevice.id);
    } catch (e) { alert('Bulk enrollment failed'); }
  };

  // Zone and Schedule handlers
  const handleSaveZone = async (e) => {
    e.preventDefault();
    try {
      if (editingItem?.id) { await axios.put(`${API}?resource=zones&id=${editingItem.id}`, zoneForm); }
      else { await axios.post(`${API}?resource=zones`, zoneForm); }
      alert('✅ Zone saved!'); fetchZones(); closeModal();
    } catch (e) { alert('Failed'); }
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    try {
      if (editingItem?.id) { await axios.put(`${API}?resource=schedules&id=${editingItem.id}`, scheduleForm); }
      else { await axios.post(`${API}?resource=schedules`, scheduleForm); }
      alert('✅ Schedule saved!'); fetchSchedules(); closeModal();
    } catch (e) { alert('Failed'); }
  };

  const handleSaveDevice = async (e) => {
    e.preventDefault();
    try {
      if (editingItem?.id) {
        await axios.put(`${API}?resource=devices&id=${editingItem.id}`, deviceForm);
      } else {
        await axios.post(`${API}?resource=devices`, deviceForm);
      }
      alert('✅ Device saved!');
      fetchDevices();
      closeModal();
    } catch (e) { alert('Failed to save'); }
  };

  const handleSyncDevice = async (deviceId) => {
    try {
      await axios.put(`${API}?resource=devices&id=${deviceId}&action=sync`, {});
      alert('✅ Device synced!');
      fetchDevices();
    } catch (e) { alert('Sync failed'); }
  };

  const handleSaveEnrollment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}?resource=enrollments`, { ...enrollmentForm, template_data: enrollmentForm.template_data || 'SIMULATED_TEMPLATE_DATA' });
      alert('✅ Enrollment saved!');
      if (selectedDevice) fetchEnrollmentsByDevice(selectedDevice.id);
      closeModal();
    } catch (e) { alert('Failed to save'); }
  };

  const handleDeleteEnrollment = async (id) => {
    if (!confirm('Deactivate this enrollment?')) return;
    try {
      await axios.delete(`${API}?resource=enrollments&id=${id}`);
      if (selectedDevice) fetchEnrollmentsByDevice(selectedDevice.id);
    } catch (e) { alert('Failed'); }
  };

  const handleSaveVisitor = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}?resource=visitors`, visitorForm);
      alert('✅ Visitor registered!');
      fetchVisitors();
      closeModal();
    } catch (e) { alert('Failed to save'); }
  };

  const handleVisitorCheckIn = async (id) => {
    const temp = prompt('Enter temperature (optional):');
    try {
      await axios.put(`${API}?resource=visitors&id=${id}&action=checkin`, { temperature: temp || null });
      alert('✅ Visitor checked in!');
      fetchVisitors();
    } catch (e) { alert('Failed'); }
  };

  const handleVisitorCheckOut = async (id) => {
    try {
      await axios.put(`${API}?resource=visitors&id=${id}&action=checkout`, {});
      alert('✅ Visitor checked out!');
      fetchVisitors();
    } catch (e) { alert('Failed'); }
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    if (type === 'device') setDeviceForm(item || { device_name: '', device_type: 'fingerprint', device_model: '', serial_number: '', ip_address: '', port: '', location: '', api_endpoint: '', api_key: '', status: 'active' });
    else if (type === 'enrollment') setEnrollmentForm({ user_id: '', user_type: 'student', device_id: selectedDevice?.id || '', biometric_type: 'fingerprint', template_data: '', finger_position: '', rfid_card_number: '', quality_score: '' });
    else if (type === 'visitor') setVisitorForm({ visitor_name: '', phone: '', email: '', id_type: '', id_number: '', purpose_of_visit: '', host_name: '', host_department: '', temperature: '' });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingItem(null); };

  const getStatusBadge = (s) => ({ active: 'bg-green-100 text-green-800', inactive: 'bg-gray-100 text-gray-800', maintenance: 'bg-yellow-100 text-yellow-800', error: 'bg-red-100 text-red-800', online: 'bg-green-100 text-green-800', offline: 'bg-red-100 text-red-800', success: 'bg-green-100 text-green-800', failed: 'bg-red-100 text-red-800', scheduled: 'bg-blue-100 text-blue-800', checked_in: 'bg-green-100 text-green-800', checked_out: 'bg-gray-100 text-gray-800' }[s] || 'bg-gray-100 text-gray-800');
  const getDeviceIcon = (type) => ({ fingerprint: Fingerprint, face_recognition: Camera, rfid: CreditCard, iris: Eye, palm: Fingerprint }[type] || Fingerprint);

  const totalEnrollments = devices.reduce((sum, d) => sum + (parseInt(d.enrollment_count) || 0), 0);
  const activeDevices = devices.filter(d => d.status === 'active').length;
  const activeVisitors = visitors.filter(v => v.status === 'checked_in').length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2"><Fingerprint className="text-blue-600" size={32} />Biometric Integration</h1>
          <p className="text-gray-600 mt-1">Manage devices, enrollments, attendance, and access control</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => exportToPDF(activeTab)} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"><Download size={16} /> PDF</button>
          <button onClick={() => exportToCSV(activeTab)} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"><FileText size={16} /> CSV</button>
          <button onClick={fetchDeviceHealth} className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"><Activity size={16} /> Health Check</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white p-3 rounded-lg shadow border-l-4 border-blue-500"><p className="text-gray-600 text-xs">Devices</p><p className="text-xl font-bold text-blue-600">{devices.length}</p><p className="text-xs text-gray-500">{activeDevices} active</p></div>
        <div className="bg-white p-3 rounded-lg shadow border-l-4 border-green-500"><p className="text-gray-600 text-xs">Enrollments</p><p className="text-xl font-bold text-green-600">{totalEnrollments}</p></div>
        <div className="bg-white p-3 rounded-lg shadow border-l-4 border-purple-500"><p className="text-gray-600 text-xs">Attendance</p><p className="text-xl font-bold text-purple-600">{attendance.length}</p></div>
        <div className="bg-white p-3 rounded-lg shadow border-l-4 border-orange-500"><p className="text-gray-600 text-xs">Access Logs</p><p className="text-xl font-bold text-orange-600">{accessLogs.length}</p></div>
        <div className="bg-white p-3 rounded-lg shadow border-l-4 border-cyan-500"><p className="text-gray-600 text-xs">Visitors</p><p className="text-xl font-bold text-cyan-600">{activeVisitors}</p></div>
        <div className="bg-white p-3 rounded-lg shadow border-l-4 border-yellow-500"><p className="text-gray-600 text-xs">Late Today</p><p className="text-xl font-bold text-yellow-600">{lateArrivals.length}</p></div>
        <div className="bg-white p-3 rounded-lg shadow border-l-4 border-red-500"><p className="text-gray-600 text-xs">Absent</p><p className="text-xl font-bold text-red-600">{absences.length}</p></div>
        <div className="bg-white p-3 rounded-lg shadow border-l-4 border-indigo-500"><p className="text-gray-600 text-xs">Zones</p><p className="text-xl font-bold text-indigo-600">{zones.length}</p></div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
          </div>
          <select value={userTypeFilter} onChange={(e) => setUserTypeFilter(e.target.value)} className="border rounded-lg px-3 py-2">
            <option value="">All Types</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="employee">Employees</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2">
            <option value="">All Status</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
            <option value="scheduled">Scheduled</option>
          </select>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="border rounded px-3 py-2" />
          <button onClick={() => { setSearchTerm(''); setUserTypeFilter(''); setStatusFilter(''); }} className="text-sm text-gray-500 hover:text-gray-700">Clear</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <div className="flex flex-wrap">
            {[
              { id: 'devices', label: 'Devices', icon: Fingerprint },
              { id: 'enrollments', label: 'Enroll', icon: UserCheck },
              { id: 'attendance', label: 'Attendance', icon: Clock },
              { id: 'access', label: 'Access', icon: Shield },
              { id: 'visitors', label: 'Visitors', icon: Users },
              { id: 'reports', label: 'Reports', icon: BarChart3 },
              { id: 'zones', label: 'Zones', icon: Building },
              { id: 'schedules', label: 'Schedules', icon: Calendar },
              { id: 'alerts', label: 'Alerts', icon: Bell },
              { id: 'audit', label: 'Audit', icon: History }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-3 py-2 font-medium flex items-center gap-1 text-xs ${activeTab === tab.id ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}><tab.icon size={14} /> {tab.label}</button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* DEVICES TAB */}
          {activeTab === 'devices' && (
            <div>
              <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-semibold">Biometric Devices</h3><button onClick={() => openModal('device')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Plus size={18} /> Add Device</button></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {devices.map(d => {
                  const DeviceIcon = getDeviceIcon(d.device_type);
                  return (
                    <div key={d.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2"><div className={`p-2 rounded-lg ${d.status === 'active' ? 'bg-green-100' : 'bg-gray-100'}`}><DeviceIcon className={d.status === 'active' ? 'text-green-600' : 'text-gray-600'} size={24} /></div><div><h4 className="font-semibold">{d.device_name}</h4><p className="text-xs text-gray-500 capitalize">{d.device_type?.replace('_', ' ')}</p></div></div>
                        <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(d.status)}`}>{d.status}</span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        {d.location && <p className="flex items-center gap-1"><MapPin size={14} /> {d.location}</p>}
                        {d.ip_address && <p className="flex items-center gap-1"><Wifi size={14} /> {d.ip_address}{d.port ? `:${d.port}` : ''}</p>}
                        <p className="flex items-center gap-1"><Users size={14} /> {d.enrollment_count || 0} enrollments</p>
                        {d.last_sync && <p className="text-xs text-gray-400">Last sync: {d.last_sync}</p>}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => { setSelectedDevice(d); fetchEnrollmentsByDevice(d.id); setActiveTab('enrollments'); }} className="flex-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200">Enrollments</button>
                        <button onClick={() => handleSyncDevice(d.id)} className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"><RefreshCw size={14} /></button>
                        <button onClick={() => openModal('device', d)} className="px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200"><Edit2 size={14} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ENROLLMENTS TAB */}
          {activeTab === 'enrollments' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-semibold">Biometric Enrollments</h3>
                  {selectedDevice && <span className="text-sm text-gray-500">Device: {selectedDevice.device_name}</span>}
                </div>
                <div className="flex gap-2">
                  <select value={selectedDevice?.id || ''} onChange={(e) => { const dev = devices.find(d => d.id == e.target.value); setSelectedDevice(dev); if (dev) fetchEnrollmentsByDevice(dev.id); }} className="border rounded-lg px-3 py-2">
                    <option value="">Select Device</option>
                    {devices.map(d => <option key={d.id} value={d.id}>{d.device_name}</option>)}
                  </select>
                  {selectedDevice && <button onClick={() => openModal('enrollment')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Plus size={18} /> New Enrollment</button>}
                </div>
              </div>
              {!selectedDevice ? (
                <div className="text-center py-12 text-gray-500"><UserCheck size={48} className="mx-auto mb-4 text-gray-300" /><p>Select a device to view enrollments</p></div>
              ) : enrollments.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><UserCheck size={48} className="mx-auto mb-4 text-gray-300" /><p>No enrollments for this device</p></div>
              ) : (
                <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Biometric</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrolled</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
                  <tbody className="divide-y">{enrollments.map(e => (<tr key={e.id} className="hover:bg-gray-50"><td className="px-4 py-3">User #{e.user_id}</td><td className="px-4 py-3 capitalize">{e.user_type}</td><td className="px-4 py-3 capitalize">{e.biometric_type}{e.finger_position ? ` (${e.finger_position})` : ''}{e.rfid_card_number ? ` - ${e.rfid_card_number}` : ''}</td><td className="px-4 py-3 text-sm">{e.enrollment_date}</td><td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${getStatusBadge(e.status)}`}>{e.status}</span></td><td className="px-4 py-3"><button onClick={() => handleDeleteEnrollment(e.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button></td></tr>))}</tbody>
                </table></div>
              )}
            </div>
          )}

          {/* ATTENDANCE TAB */}
          {activeTab === 'attendance' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Biometric Attendance</h3>
                <div className="flex items-center gap-2"><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="border rounded-lg px-3 py-2" /><button onClick={fetchAttendance} className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"><RefreshCw size={18} /></button></div>
              </div>
              {attendance.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><Clock size={48} className="mx-auto mb-4 text-gray-300" /><p>No attendance records for {selectedDate}</p></div>
              ) : (
                <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th></tr></thead>
                  <tbody className="divide-y">{attendance.map(a => (<tr key={a.id} className="hover:bg-gray-50"><td className="px-4 py-3 font-medium">{a.user_name || `User #${a.user_id}`}</td><td className="px-4 py-3 capitalize">{a.user_type}</td><td className="px-4 py-3">{a.device_name}</td><td className="px-4 py-3">{a.check_in_time?.substring(11, 16) || '-'}</td><td className="px-4 py-3">{a.check_out_time?.substring(11, 16) || '-'}</td><td className="px-4 py-3 capitalize">{a.verification_method}</td><td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${getStatusBadge(a.verification_status)}`}>{a.verification_status}</span></td></tr>))}</tbody>
                </table></div>
              )}
            </div>
          )}

          {/* ACCESS LOGS TAB */}
          {activeTab === 'access' && (
            <div>
              <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-semibold">Access Logs</h3><button onClick={fetchAccessLogs} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2"><RefreshCw size={18} /> Refresh</button></div>
              {accessLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><Shield size={48} className="mx-auto mb-4 text-gray-300" /><p>No access logs found</p></div>
              ) : (
                <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Access</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Temp</th></tr></thead>
                  <tbody className="divide-y">{accessLogs.map(l => (<tr key={l.id} className={`hover:bg-gray-50 ${!l.access_granted ? 'bg-red-50' : ''}`}><td className="px-4 py-3 text-sm">{l.access_time}</td><td className="px-4 py-3 font-medium">{l.user_name || `${l.user_type} #${l.user_id}`}</td><td className="px-4 py-3">{l.device_name}</td><td className="px-4 py-3 capitalize">{l.access_type}</td><td className="px-4 py-3 capitalize">{l.verification_method}</td><td className="px-4 py-3">{l.access_granted ? <CheckCircle className="text-green-600" size={18} /> : <XCircle className="text-red-600" size={18} />}{l.denial_reason && <span className="text-xs text-red-600 ml-1">{l.denial_reason}</span>}</td><td className="px-4 py-3">{l.temperature ? `${l.temperature}°C` : '-'}</td></tr>))}</tbody>
                </table></div>
              )}
            </div>
          )}

          {/* VISITORS TAB */}
          {activeTab === 'visitors' && (
            <div>
              <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-semibold">Visitor Management</h3><button onClick={() => openModal('visitor')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Plus size={18} /> Register Visitor</button></div>
              {filteredVisitors.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><Users size={48} className="mx-auto mb-4 text-gray-300" /><p>No visitors registered</p></div>
              ) : (
                <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visitor</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Host</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
                  <tbody className="divide-y">{filteredVisitors.map(v => (<tr key={v.id} className="hover:bg-gray-50"><td className="px-4 py-3"><p className="font-medium">{v.visitor_name}</p>{v.id_number && <p className="text-xs text-gray-500">{v.id_type}: {v.id_number}</p>}</td><td className="px-4 py-3 text-sm">{v.phone || v.email || '-'}</td><td className="px-4 py-3 text-sm max-w-xs truncate">{v.purpose_of_visit}</td><td className="px-4 py-3 text-sm">{v.host_name || '-'}<br/><span className="text-xs text-gray-500">{v.host_department}</span></td><td className="px-4 py-3 text-sm">{v.check_in_time?.substring(11, 16) || '-'}</td><td className="px-4 py-3 text-sm">{v.check_out_time?.substring(11, 16) || '-'}</td><td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${getStatusBadge(v.status)}`}>{v.status?.replace('_', ' ')}</span></td><td className="px-4 py-3"><div className="flex gap-1">{v.status === 'scheduled' && <button onClick={() => handleVisitorCheckIn(v.id)} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">Check In</button>}{v.status === 'checked_in' && <button onClick={() => handleVisitorCheckOut(v.id)} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200">Check Out</button>}<button onClick={() => printVisitorBadge(v)} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"><Printer size={12} /></button></div></td></tr>))}</tbody>
                </table></div>
              )}
            </div>
          )}

          {/* REPORTS TAB */}
          {activeTab === 'reports' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Attendance Reports</h3>
                <div className="flex gap-2">
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border rounded px-3 py-2" />
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border rounded px-3 py-2" />
                  <button onClick={fetchAttendanceReport} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Generate</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200"><p className="text-green-600 text-sm">Total Present</p><p className="text-2xl font-bold text-green-700">{attendanceReport.reduce((sum, r) => sum + (r.present_count || 0), 0)}</p></div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200"><p className="text-red-600 text-sm">Total Absent</p><p className="text-2xl font-bold text-red-700">{attendanceReport.reduce((sum, r) => sum + (r.absent_count || 0), 0)}</p></div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200"><p className="text-yellow-600 text-sm">Late Arrivals</p><p className="text-2xl font-bold text-yellow-700">{attendanceReport.reduce((sum, r) => sum + (r.late_count || 0), 0)}</p></div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200"><p className="text-blue-600 text-sm">Avg Attendance %</p><p className="text-2xl font-bold text-blue-700">{attendanceReport.length > 0 ? Math.round(attendanceReport.reduce((sum, r) => sum + (r.attendance_percentage || 0), 0) / attendanceReport.length) : 0}%</p></div>
              </div>
              {attendanceReport.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><BarChart3 size={48} className="mx-auto mb-4 text-gray-300" /><p>Select date range and generate report</p></div>
              ) : (
                <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Absent</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Late</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance %</th></tr></thead>
                  <tbody className="divide-y">{attendanceReport.map((r, i) => (<tr key={i} className="hover:bg-gray-50"><td className="px-4 py-3">{r.date}</td><td className="px-4 py-3 text-green-600 font-medium">{r.present_count}</td><td className="px-4 py-3 text-red-600">{r.absent_count}</td><td className="px-4 py-3 text-yellow-600">{r.late_count}</td><td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-20 bg-gray-200 rounded-full h-2"><div className="bg-green-600 h-2 rounded-full" style={{width: `${r.attendance_percentage}%`}}></div></div><span>{r.attendance_percentage}%</span></div></td></tr>))}</tbody>
                </table></div>
              )}
            </div>
          )}

          {/* ZONES TAB */}
          {activeTab === 'zones' && (
            <div>
              <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-semibold">Access Zones</h3><button onClick={() => { setModalType('zone'); setZoneForm({ zone_name: '', description: '', access_level: 'normal', devices: [] }); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Plus size={18} /> Add Zone</button></div>
              {zones.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><Building size={48} className="mx-auto mb-4 text-gray-300" /><p>No access zones defined</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {zones.map(z => (
                    <div key={z.id} className="border rounded-lg p-4 hover:shadow-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div><h4 className="font-semibold flex items-center gap-2"><Building size={18} className="text-indigo-600" /> {z.zone_name}</h4><p className="text-sm text-gray-500">{z.description || 'No description'}</p></div>
                        <span className={`px-2 py-1 rounded text-xs ${z.access_level === 'restricted' ? 'bg-red-100 text-red-800' : z.access_level === 'high_security' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>{z.access_level}</span>
                      </div>
                      <p className="text-sm text-gray-600 flex items-center gap-1"><Fingerprint size={14} /> {z.device_count || 0} devices</p>
                      <button onClick={() => { setModalType('zone'); setZoneForm(z); setEditingItem(z); setShowModal(true); }} className="mt-3 text-blue-600 text-sm hover:underline">Edit Zone</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SCHEDULES TAB */}
          {activeTab === 'schedules' && (
            <div>
              <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-semibold">Access Schedules</h3><button onClick={() => { setModalType('schedule'); setScheduleForm({ schedule_name: '', user_type: 'student', start_time: '08:00', end_time: '17:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] }); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Plus size={18} /> Add Schedule</button></div>
              {schedules.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><Calendar size={48} className="mx-auto mb-4 text-gray-300" /><p>No schedules defined</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {schedules.map(s => (
                    <div key={s.id} className="border rounded-lg p-4 hover:shadow-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div><h4 className="font-semibold">{s.schedule_name}</h4><p className="text-sm text-gray-500 capitalize">{s.user_type}s</p></div>
                        <span className="text-sm font-medium text-blue-600">{s.start_time} - {s.end_time}</span>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
                          <span key={d} className={`px-2 py-1 rounded text-xs ${(s.days || []).includes(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][i]) ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-400'}`}>{d}</span>
                        ))}
                      </div>
                      <button onClick={() => { setModalType('schedule'); setScheduleForm(s); setEditingItem(s); setShowModal(true); }} className="mt-3 text-blue-600 text-sm hover:underline">Edit</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ALERTS TAB */}
          {activeTab === 'alerts' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Attendance Alerts</h3>
                <div className="flex items-center gap-2">
                  <label className="text-sm">Expected Check-in:</label>
                  <input type="time" value={expectedCheckInTime} onChange={(e) => setExpectedCheckInTime(e.target.value)} className="border rounded px-3 py-2" />
                  <button onClick={() => { fetchLateArrivals(); fetchAbsences(); }} className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"><RefreshCw size={18} /></button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-4 flex items-center gap-2 text-yellow-600"><Clock size={20} /> Late Arrivals ({lateArrivals.length})</h4>
                  {lateArrivals.length === 0 ? <p className="text-gray-500 text-center py-4">No late arrivals today</p> : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {lateArrivals.map(l => (
                        <div key={l.id} className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                          <div><p className="font-medium">{l.user_name}</p><p className="text-xs text-gray-500 capitalize">{l.user_type}</p></div>
                          <div className="text-right"><p className="text-yellow-600 font-medium">{l.check_in_time?.substring(11, 16)}</p><p className="text-xs text-gray-500">{l.late_minutes} min late</p></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-4 flex items-center gap-2 text-red-600"><XCircle size={20} /> Absences ({absences.length})</h4>
                  {absences.length === 0 ? <p className="text-gray-500 text-center py-4">No absences today</p> : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {absences.map(a => (
                        <div key={a.id} className="flex justify-between items-center p-2 bg-red-50 rounded">
                          <div><p className="font-medium">{a.user_name}</p><p className="text-xs text-gray-500 capitalize">{a.user_type}</p></div>
                          <span className="text-red-600 text-sm">Not checked in</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AUDIT TAB */}
          {activeTab === 'audit' && (
            <div>
              <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-semibold">Audit Trail</h3><button onClick={fetchAuditLogs} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2"><RefreshCw size={18} /> Refresh</button></div>
              {auditLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><History size={48} className="mx-auto mb-4 text-gray-300" /><p>No audit logs</p></div>
              ) : (
                <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th></tr></thead>
                  <tbody className="divide-y">{auditLogs.map(l => (<tr key={l.id} className="hover:bg-gray-50"><td className="px-4 py-3 text-sm">{l.created_at}</td><td className="px-4 py-3">{l.user_name || 'System'}</td><td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${l.action === 'create' ? 'bg-green-100 text-green-800' : l.action === 'delete' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{l.action}</span></td><td className="px-4 py-3 capitalize">{l.resource_type}</td><td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{l.details}</td></tr>))}</tbody>
                </table></div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white flex justify-between items-center"><h2 className="text-xl font-bold">{modalType === 'device' && (editingItem ? 'Edit Device' : 'Add Device')}{modalType === 'enrollment' && 'New Enrollment'}{modalType === 'visitor' && 'Register Visitor'}</h2><button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button></div>
            <div className="p-6">
              {/* Device Form */}
              {modalType === 'device' && (
                <form onSubmit={handleSaveDevice} className="space-y-4">
                  <div><label className="block text-sm font-medium mb-1">Device Name *</label><input type="text" value={deviceForm.device_name} onChange={(e) => setDeviceForm({...deviceForm, device_name: e.target.value})} className="w-full border rounded-lg px-3 py-2" required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Type</label><select value={deviceForm.device_type} onChange={(e) => setDeviceForm({...deviceForm, device_type: e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="fingerprint">Fingerprint</option><option value="face_recognition">Face Recognition</option><option value="rfid">RFID</option><option value="iris">Iris</option><option value="palm">Palm</option></select></div>
                    <div><label className="block text-sm font-medium mb-1">Status</label><select value={deviceForm.status} onChange={(e) => setDeviceForm({...deviceForm, status: e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="active">Active</option><option value="inactive">Inactive</option><option value="maintenance">Maintenance</option></select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Model</label><input type="text" value={deviceForm.device_model} onChange={(e) => setDeviceForm({...deviceForm, device_model: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm font-medium mb-1">Serial Number</label><input type="text" value={deviceForm.serial_number} onChange={(e) => setDeviceForm({...deviceForm, serial_number: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Location</label><input type="text" value={deviceForm.location} onChange={(e) => setDeviceForm({...deviceForm, location: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">IP Address</label><input type="text" value={deviceForm.ip_address} onChange={(e) => setDeviceForm({...deviceForm, ip_address: e.target.value})} className="w-full border rounded-lg px-3 py-2" placeholder="192.168.1.100" /></div>
                    <div><label className="block text-sm font-medium mb-1">Port</label><input type="number" value={deviceForm.port} onChange={(e) => setDeviceForm({...deviceForm, port: e.target.value})} className="w-full border rounded-lg px-3 py-2" placeholder="4370" /></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">API Endpoint</label><input type="text" value={deviceForm.api_endpoint} onChange={(e) => setDeviceForm({...deviceForm, api_endpoint: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                  <div className="flex gap-3 pt-4"><button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Save</button></div>
                </form>
              )}

              {/* Enrollment Form */}
              {modalType === 'enrollment' && (
                <form onSubmit={handleSaveEnrollment} className="space-y-4">
                  <div><label className="block text-sm font-medium mb-1">User Type *</label><select value={enrollmentForm.user_type} onChange={(e) => setEnrollmentForm({...enrollmentForm, user_type: e.target.value, user_id: ''})} className="w-full border rounded-lg px-3 py-2"><option value="student">Student</option><option value="teacher">Teacher</option><option value="employee">Employee</option></select></div>
                  <div><label className="block text-sm font-medium mb-1">Select User *</label><select value={enrollmentForm.user_id} onChange={(e) => setEnrollmentForm({...enrollmentForm, user_id: e.target.value})} className="w-full border rounded-lg px-3 py-2" required><option value="">Select...</option>{enrollmentForm.user_type === 'student' && students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.student_id})</option>)}{enrollmentForm.user_type === 'teacher' && teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}{enrollmentForm.user_type === 'employee' && employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_number})</option>)}</select></div>
                  <div><label className="block text-sm font-medium mb-1">Biometric Type *</label><select value={enrollmentForm.biometric_type} onChange={(e) => setEnrollmentForm({...enrollmentForm, biometric_type: e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="fingerprint">Fingerprint</option><option value="face">Face</option><option value="rfid">RFID</option><option value="iris">Iris</option></select></div>
                  {enrollmentForm.biometric_type === 'fingerprint' && (<div><label className="block text-sm font-medium mb-1">Finger Position</label><select value={enrollmentForm.finger_position} onChange={(e) => setEnrollmentForm({...enrollmentForm, finger_position: e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="">Select...</option><option value="right_thumb">Right Thumb</option><option value="right_index">Right Index</option><option value="left_thumb">Left Thumb</option><option value="left_index">Left Index</option></select></div>)}
                  {enrollmentForm.biometric_type === 'rfid' && (<div><label className="block text-sm font-medium mb-1">RFID Card Number *</label><input type="text" value={enrollmentForm.rfid_card_number} onChange={(e) => setEnrollmentForm({...enrollmentForm, rfid_card_number: e.target.value})} className="w-full border rounded-lg px-3 py-2" required /></div>)}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800"><AlertTriangle size={16} className="inline mr-2" />In production, biometric template data would be captured from the actual device. This form simulates enrollment.</div>
                  <div className="flex gap-3 pt-4"><button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Enroll</button></div>
                </form>
              )}

              {/* Visitor Form */}
              {modalType === 'visitor' && (
                <form onSubmit={handleSaveVisitor} className="space-y-4">
                  <div><label className="block text-sm font-medium mb-1">Visitor Name *</label><input type="text" value={visitorForm.visitor_name} onChange={(e) => setVisitorForm({...visitorForm, visitor_name: e.target.value})} className="w-full border rounded-lg px-3 py-2" required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Phone</label><input type="text" value={visitorForm.phone} onChange={(e) => setVisitorForm({...visitorForm, phone: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={visitorForm.email} onChange={(e) => setVisitorForm({...visitorForm, email: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">ID Type</label><select value={visitorForm.id_type} onChange={(e) => setVisitorForm({...visitorForm, id_type: e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="">Select...</option><option value="national_id">National ID</option><option value="passport">Passport</option><option value="drivers_license">Driver's License</option><option value="other">Other</option></select></div>
                    <div><label className="block text-sm font-medium mb-1">ID Number</label><input type="text" value={visitorForm.id_number} onChange={(e) => setVisitorForm({...visitorForm, id_number: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Purpose of Visit *</label><textarea value={visitorForm.purpose_of_visit} onChange={(e) => setVisitorForm({...visitorForm, purpose_of_visit: e.target.value})} className="w-full border rounded-lg px-3 py-2" rows={2} required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Host Name</label><input type="text" value={visitorForm.host_name} onChange={(e) => setVisitorForm({...visitorForm, host_name: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm font-medium mb-1">Host Department</label><input type="text" value={visitorForm.host_department} onChange={(e) => setVisitorForm({...visitorForm, host_department: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Expected Date</label><input type="date" value={visitorForm.expected_date} onChange={(e) => setVisitorForm({...visitorForm, expected_date: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm font-medium mb-1">Temperature (°C)</label><input type="number" step="0.1" value={visitorForm.temperature} onChange={(e) => setVisitorForm({...visitorForm, temperature: e.target.value})} className="w-full border rounded-lg px-3 py-2" placeholder="36.5" /></div>
                  </div>
                  <div className="flex gap-3 pt-4"><button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Register</button></div>
                </form>
              )}

              {/* Zone Form */}
              {modalType === 'zone' && (
                <form onSubmit={handleSaveZone} className="space-y-4">
                  <div><label className="block text-sm font-medium mb-1">Zone Name *</label><input type="text" value={zoneForm.zone_name} onChange={(e) => setZoneForm({...zoneForm, zone_name: e.target.value})} className="w-full border rounded-lg px-3 py-2" required /></div>
                  <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={zoneForm.description} onChange={(e) => setZoneForm({...zoneForm, description: e.target.value})} className="w-full border rounded-lg px-3 py-2" rows={2} /></div>
                  <div><label className="block text-sm font-medium mb-1">Access Level</label><select value={zoneForm.access_level} onChange={(e) => setZoneForm({...zoneForm, access_level: e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="normal">Normal</option><option value="restricted">Restricted</option><option value="high_security">High Security</option></select></div>
                  <div><label className="block text-sm font-medium mb-1">Assign Devices</label>
                    <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                      {devices.map(d => (
                        <label key={d.id} className="flex items-center gap-2"><input type="checkbox" checked={(zoneForm.devices || []).includes(d.id)} onChange={(e) => { const devs = zoneForm.devices || []; setZoneForm({...zoneForm, devices: e.target.checked ? [...devs, d.id] : devs.filter(id => id !== d.id)}); }} />{d.device_name}</label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4"><button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Save</button></div>
                </form>
              )}

              {/* Schedule Form */}
              {modalType === 'schedule' && (
                <form onSubmit={handleSaveSchedule} className="space-y-4">
                  <div><label className="block text-sm font-medium mb-1">Schedule Name *</label><input type="text" value={scheduleForm.schedule_name} onChange={(e) => setScheduleForm({...scheduleForm, schedule_name: e.target.value})} className="w-full border rounded-lg px-3 py-2" required /></div>
                  <div><label className="block text-sm font-medium mb-1">User Type</label><select value={scheduleForm.user_type} onChange={(e) => setScheduleForm({...scheduleForm, user_type: e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="student">Students</option><option value="teacher">Teachers</option><option value="employee">Employees</option><option value="all">All</option></select></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Start Time</label><input type="time" value={scheduleForm.start_time} onChange={(e) => setScheduleForm({...scheduleForm, start_time: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm font-medium mb-1">End Time</label><input type="time" value={scheduleForm.end_time} onChange={(e) => setScheduleForm({...scheduleForm, end_time: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Days</label>
                    <div className="flex flex-wrap gap-2">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                        <label key={day} className={`px-3 py-2 rounded-lg cursor-pointer ${(scheduleForm.days || []).includes(day) ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                          <input type="checkbox" className="hidden" checked={(scheduleForm.days || []).includes(day)} onChange={(e) => { const days = scheduleForm.days || []; setScheduleForm({...scheduleForm, days: e.target.checked ? [...days, day] : days.filter(d => d !== day)}); }} />
                          {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4"><button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Save</button></div>
                </form>
              )}

              {/* Bulk Enrollment */}
              {modalType === 'bulk_enrollment' && (
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium mb-1">User Type</label><select value={enrollmentForm.user_type} onChange={(e) => setEnrollmentForm({...enrollmentForm, user_type: e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="student">Students</option><option value="teacher">Teachers</option><option value="employee">Employees</option></select></div>
                  <div><label className="block text-sm font-medium mb-1">Biometric Type</label><select value={enrollmentForm.biometric_type} onChange={(e) => setEnrollmentForm({...enrollmentForm, biometric_type: e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="fingerprint">Fingerprint</option><option value="face">Face</option><option value="rfid">RFID</option></select></div>
                  <div><label className="block text-sm font-medium mb-1">Select Users ({bulkEnrollList.length} selected)</label>
                    <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
                      {(enrollmentForm.user_type === 'student' ? students : enrollmentForm.user_type === 'teacher' ? teachers : employees).map(u => (
                        <label key={u.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded"><input type="checkbox" checked={bulkEnrollList.includes(u.id)} onChange={(e) => setBulkEnrollList(e.target.checked ? [...bulkEnrollList, u.id] : bulkEnrollList.filter(id => id !== u.id))} />{u.first_name} {u.last_name}</label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4"><button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button onClick={handleBulkEnroll} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Enroll {bulkEnrollList.length} Users</button></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
