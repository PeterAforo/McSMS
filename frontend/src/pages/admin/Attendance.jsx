import { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Users, CheckCircle, XCircle, Clock, AlertCircle, Search,
  Download, Printer, ChevronLeft, ChevronRight, BarChart3, FileText,
  UserCheck, UserX, MessageSquare, Filter, RefreshCw, TrendingUp,
  CalendarDays, History, PieChart, Settings, Bell
} from 'lucide-react';
import { classesAPI, studentsAPI, termsAPI } from '../../services/api';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export default function Attendance() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [terms, setTerms] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Enhanced state
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('mark'); // mark, history, calendar, reports, teacher
  const [historyData, setHistoryData] = useState([]);
  const [calendarData, setCalendarData] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [studentStats, setStudentStats] = useState({});
  const [lateThreshold, setLateThreshold] = useState('08:00');
  const [showSettings, setShowSettings] = useState(false);
  const [teacherAttendance, setTeacherAttendance] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const printRef = useRef();

  useEffect(() => {
    fetchClasses();
    fetchTerms();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
      fetchAttendance();
      if (viewMode === 'history') fetchHistory();
      if (viewMode === 'calendar') fetchCalendarData();
      if (viewMode === 'reports') fetchStudentStats();
    }
  }, [selectedClass, selectedDate, selectedTerm, viewMode]);

  useEffect(() => {
    if (viewMode === 'teacher') fetchTeachers();
  }, [viewMode]);

  const fetchClasses = async () => {
    try {
      const response = await classesAPI.getAll();
      setClasses(response.data.classes || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchTerms = async () => {
    try {
      const response = await termsAPI.getAll();
      const allTerms = response.data.terms || [];
      setTerms(allTerms);
      const active = allTerms.find(t => t.is_active == 1);
      if (active) setSelectedTerm(active.id);
    } catch (error) {
      console.error('Error fetching terms:', error);
    }
  };

  const fetchHistory = async () => {
    if (!selectedClass) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/attendance.php?action=history&class_id=${selectedClass}&term_id=${selectedTerm}`);
      setHistoryData(response.data.history || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      setHistoryData([]);
    }
  };

  const fetchCalendarData = async () => {
    if (!selectedClass) return;
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    try {
      const response = await axios.get(`${API_BASE_URL}/attendance.php?action=calendar&class_id=${selectedClass}&year=${year}&month=${month}`);
      setCalendarData(response.data.calendar || {});
    } catch (error) {
      console.error('Error fetching calendar:', error);
      setCalendarData({});
    }
  };

  const fetchStudentStats = async () => {
    if (!selectedClass) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/attendance.php?action=student_stats&class_id=${selectedClass}&term_id=${selectedTerm}`);
      setStudentStats(response.data.stats || {});
    } catch (error) {
      console.error('Error fetching student stats:', error);
      setStudentStats({});
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/teachers.php`);
      setTeachers(response.data.teachers || []);
      // Initialize teacher attendance
      const initial = {};
      (response.data.teachers || []).forEach(t => {
        initial[t.id] = { status: 'present', time_in: '07:30' };
      });
      setTeacherAttendance(initial);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await studentsAPI.getAll({ class_id: selectedClass });
      setStudents(response.data.students || []);
      
      // Initialize attendance state
      const initialAttendance = {};
      response.data.students.forEach(student => {
        initialAttendance[student.id] = { status: 'present', time_in: '07:45' };
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      const [attendanceRes, statsRes] = await Promise.all([
        axios.get(`https://eea.mcaforo.com/backend/api/academic.php?resource=attendance&class_id=${selectedClass}&date=${selectedDate}`),
        axios.get(`https://eea.mcaforo.com/backend/api/academic.php?resource=attendance&action=stats&class_id=${selectedClass}&date=${selectedDate}`)
      ]);
      
      // Map existing attendance
      const existingAttendance = {};
      attendanceRes.data.attendance.forEach(record => {
        existingAttendance[record.student_id] = {
          status: record.status,
          time_in: record.time_in || '07:45'
        };
      });
      setAttendance(prev => ({ ...prev, ...existingAttendance }));
      setStats(statsRes.data.stats);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const handleTimeChange = (studentId, time) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], time_in: time }
    }));
  };

  const handleSubmit = async () => {
    if (!selectedClass) {
      alert('Please select a class');
      return;
    }

    try {
      setLoading(true);
      const attendanceData = students.map(student => ({
        student_id: student.id,
        status: attendance[student.id]?.status || 'present',
        time_in: attendance[student.id]?.time_in || null
      }));

      await axios.post('https://eea.mcaforo.com/backend/api/academic.php?resource=attendance&action=mark_class', {
        class_id: selectedClass,
        term_id: 1,
        date: selectedDate,
        students: attendanceData,
        marked_by: 1
      });

      alert('Attendance marked successfully!');
      fetchAttendance();
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      present: 'bg-green-100 text-green-700 border-green-300',
      absent: 'bg-red-100 text-red-700 border-red-300',
      late: 'bg-orange-100 text-orange-700 border-orange-300',
      excused: 'bg-blue-100 text-blue-700 border-blue-300'
    };
    return colors[status] || colors.present;
  };

  // Bulk actions
  const handleBulkStatus = (status) => {
    const newAttendance = {};
    filteredStudents.forEach(student => {
      newAttendance[student.id] = { 
        ...attendance[student.id], 
        status,
        time_in: status === 'absent' ? null : (attendance[student.id]?.time_in || '07:45')
      };
    });
    setAttendance(prev => ({ ...prev, ...newAttendance }));
  };

  // Auto-mark late based on threshold
  const handleAutoMarkLate = () => {
    const newAttendance = {};
    filteredStudents.forEach(student => {
      const timeIn = attendance[student.id]?.time_in;
      if (timeIn && timeIn > lateThreshold && attendance[student.id]?.status === 'present') {
        newAttendance[student.id] = { ...attendance[student.id], status: 'late' };
      }
    });
    setAttendance(prev => ({ ...prev, ...newAttendance }));
  };

  // Add remarks
  const handleRemarkChange = (studentId, remarks) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks }
    }));
  };

  // Export functions
  const handleExport = (format) => {
    const className = classes.find(c => c.id == selectedClass)?.class_name || 'Class';
    const data = filteredStudents.map(s => ({
      'Student ID': s.student_id,
      'Name': `${s.first_name} ${s.last_name}`,
      'Status': attendance[s.id]?.status || 'present',
      'Time In': attendance[s.id]?.time_in || '-',
      'Remarks': attendance[s.id]?.remarks || ''
    }));

    if (format === 'csv') {
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(','));
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${className}_${selectedDate}.csv`;
      a.click();
    } else if (format === 'print') {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html><head><title>Attendance - ${className}</title>
        <style>
          body { font-family: Arial; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #2563eb; color: white; }
          h1 { color: #1f2937; }
          .present { color: green; } .absent { color: red; } .late { color: orange; }
          .stats { display: flex; gap: 20px; margin: 20px 0; }
          .stat { padding: 10px 20px; background: #f3f4f6; border-radius: 8px; }
        </style></head><body>
        <h1>Attendance Report - ${className}</h1>
        <p>Date: ${new Date(selectedDate).toLocaleDateString()}</p>
        <div class="stats">
          <div class="stat">Total: ${stats?.total || 0}</div>
          <div class="stat">Present: ${stats?.present || 0}</div>
          <div class="stat">Absent: ${stats?.absent || 0}</div>
          <div class="stat">Late: ${stats?.late || 0}</div>
        </div>
        <table>
          <thead><tr>${Object.keys(data[0]).map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${data.map(row => `<tr>${Object.entries(row).map(([k, v]) => 
            `<td class="${k === 'Status' ? v : ''}">${v}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
        </body></html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Teacher attendance handlers
  const handleTeacherStatusChange = (teacherId, status) => {
    setTeacherAttendance(prev => ({
      ...prev,
      [teacherId]: { ...prev[teacherId], status }
    }));
  };

  const handleTeacherSubmit = async () => {
    try {
      setLoading(true);
      const data = teachers.map(t => ({
        teacher_id: t.id,
        status: teacherAttendance[t.id]?.status || 'present',
        time_in: teacherAttendance[t.id]?.time_in || null
      }));
      await axios.post(`${API_BASE_URL}/attendance.php?action=mark_teacher`, {
        date: selectedDate,
        teachers: data
      });
      alert('Teacher attendance saved!');
    } catch (error) {
      alert('Failed to save teacher attendance');
    } finally {
      setLoading(false);
    }
  };

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  // Filter students by search
  const filteredStudents = students.filter(s => 
    !searchTerm || 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate attendance percentage
  const getAttendancePercentage = (studentId) => {
    const stats = studentStats[studentId];
    if (!stats || !stats.total) return 0;
    return Math.round((stats.present / stats.total) * 100);
  };

  const statCards = [
    { label: 'Total', value: stats?.total || 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Present', value: stats?.present || 0, icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Absent', value: stats?.absent || 0, icon: XCircle, color: 'bg-red-500' },
    { label: 'Late', value: stats?.late || 0, icon: Clock, color: 'bg-orange-500' },
  ];

  const viewTabs = [
    { id: 'mark', label: 'Mark Attendance', icon: UserCheck },
    { id: 'history', label: 'History', icon: History },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'teacher', label: 'Teacher', icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600 mt-1">Mark and track student & teacher attendance</p>
        </div>
        <button onClick={() => setShowSettings(true)} className="btn bg-gray-100 text-gray-700 hover:bg-gray-200">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {viewTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              viewMode === tab.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="input">
              <option value="">Choose a class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.class_name}</option>
              ))}
            </select>
          </div>
          {viewMode !== 'teacher' && (
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
              <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} className="input">
                <option value="">All Terms</option>
                {terms.map((term) => (
                  <option key={term.id} value={term.id}>{term.term_name} ({term.academic_year})</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="input" />
          </div>
          {viewMode === 'mark' && (
            <>
              <button onClick={handleSubmit} disabled={!selectedClass || loading} className="btn btn-primary disabled:opacity-50">
                {loading ? 'Saving...' : 'Save Attendance'}
              </button>
              <button onClick={() => handleExport('csv')} className="btn bg-green-600 text-white hover:bg-green-700">
                <Download className="w-4 h-4" />
              </button>
              <button onClick={() => handleExport('print')} className="btn bg-gray-600 text-white hover:bg-gray-700">
                <Printer className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && viewMode === 'mark' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <div key={index} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mark Attendance View */}
      {viewMode === 'mark' && selectedClass && (
        <>
          {/* Search and Bulk Actions */}
          <div className="card p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Bulk:</span>
                <button onClick={() => handleBulkStatus('present')} className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 hover:bg-green-200">
                  All Present
                </button>
                <button onClick={() => handleBulkStatus('absent')} className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 hover:bg-red-200">
                  All Absent
                </button>
                <button onClick={handleAutoMarkLate} className="px-3 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700 hover:bg-orange-200" title={`Mark late if after ${lateThreshold}`}>
                  Auto Late
                </button>
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          {filteredStudents.length > 0 ? (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time In</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">
                                {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900">{student.first_name} {student.last_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-gray-600">{student.student_id}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {['present', 'absent', 'late', 'excused'].map((status) => (
                              <button
                                key={status}
                                onClick={() => handleStatusChange(student.id, status)}
                                className={`px-2 py-1 text-xs font-medium rounded-full border transition-all ${
                                  attendance[student.id]?.status === status
                                    ? getStatusColor(status)
                                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                                }`}
                              >
                                {status.charAt(0).toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {attendance[student.id]?.status !== 'absent' && (
                            <input
                              type="time"
                              value={attendance[student.id]?.time_in || '07:45'}
                              onChange={(e) => handleTimeChange(student.id, e.target.value)}
                              className="input w-28 text-sm"
                            />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            placeholder="Add remarks..."
                            value={attendance[student.id]?.remarks || ''}
                            onChange={(e) => handleRemarkChange(student.id, e.target.value)}
                            className="input w-full text-sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No students found</p>
            </div>
          )}
        </>
      )}

      {/* History View */}
      {viewMode === 'history' && selectedClass && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold">Attendance History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Absent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Late</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {historyData.length === 0 ? (
                  <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">No history data</td></tr>
                ) : (
                  historyData.map((record, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{new Date(record.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{record.total}</td>
                      <td className="px-4 py-3 text-green-600">{record.present}</td>
                      <td className="px-4 py-3 text-red-600">{record.absent}</td>
                      <td className="px-4 py-3 text-orange-600">{record.late}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${record.total ? Math.round((record.present / record.total) * 100) : 0}%` }} />
                          </div>
                          <span className="text-sm">{record.total ? Math.round((record.present / record.total) * 100) : 0}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && selectedClass && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">{day}</div>
            ))}
            {(() => {
              const { firstDay, daysInMonth } = getDaysInMonth(currentMonth);
              const days = [];
              for (let i = 0; i < firstDay; i++) {
                days.push(<div key={`empty-${i}`} className="p-2" />);
              }
              for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayData = calendarData[dateStr];
                const rate = dayData?.total ? Math.round((dayData.present / dayData.total) * 100) : null;
                days.push(
                  <div
                    key={day}
                    className={`p-2 text-center rounded-lg cursor-pointer hover:bg-gray-100 ${
                      dateStr === selectedDate ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedDate(dateStr)}
                  >
                    <div className="text-sm font-medium">{day}</div>
                    {rate !== null && (
                      <div className={`text-xs mt-1 ${rate >= 90 ? 'text-green-600' : rate >= 70 ? 'text-orange-600' : 'text-red-600'}`}>
                        {rate}%
                      </div>
                    )}
                  </div>
                );
              }
              return days;
            })()}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-full" /> 90%+</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-500 rounded-full" /> 70-89%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-full" /> &lt;70%</span>
          </div>
        </div>
      )}

      {/* Reports View */}
      {viewMode === 'reports' && selectedClass && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold">Student Attendance Report</h3>
            <button onClick={() => handleExport('csv')} className="btn bg-green-600 text-white hover:bg-green-700 text-sm">
              <Download className="w-4 h-4 mr-1" /> Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Days</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Absent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Late</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map((student) => {
                  const stats = studentStats[student.id] || { total: 0, present: 0, absent: 0, late: 0 };
                  const percentage = stats.total ? Math.round((stats.present / stats.total) * 100) : 0;
                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-xs">
                              {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
                            </span>
                          </div>
                          <span className="font-medium">{student.first_name} {student.last_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{stats.total}</td>
                      <td className="px-4 py-3 text-green-600">{stats.present}</td>
                      <td className="px-4 py-3 text-red-600">{stats.absent}</td>
                      <td className="px-4 py-3 text-orange-600">{stats.late}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${percentage >= 90 ? 'bg-green-500' : percentage >= 70 ? 'bg-orange-500' : 'bg-red-500'}`} 
                              style={{ width: `${percentage}%` }} 
                            />
                          </div>
                          <span className={`text-sm font-medium ${percentage >= 90 ? 'text-green-600' : percentage >= 70 ? 'text-orange-600' : 'text-red-600'}`}>
                            {percentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Teacher Attendance View */}
      {viewMode === 'teacher' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold">Teacher Attendance - {new Date(selectedDate).toLocaleDateString()}</h3>
            <button onClick={handleTeacherSubmit} disabled={loading} className="btn btn-primary disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Teacher Attendance'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time In</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {teachers.length === 0 ? (
                  <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500">No teachers found</td></tr>
                ) : (
                  teachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-purple-600 font-semibold text-sm">
                              {teacher.first_name?.charAt(0)}{teacher.last_name?.charAt(0)}
                            </span>
                          </div>
                          <span className="font-medium">{teacher.first_name} {teacher.last_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{teacher.department || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {['present', 'absent', 'late', 'excused'].map((status) => (
                            <button
                              key={status}
                              onClick={() => handleTeacherStatusChange(teacher.id, status)}
                              className={`px-2 py-1 text-xs font-medium rounded-full border transition-all ${
                                teacherAttendance[teacher.id]?.status === status
                                  ? getStatusColor(status)
                                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              {status.charAt(0).toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {teacherAttendance[teacher.id]?.status !== 'absent' && (
                          <input
                            type="time"
                            value={teacherAttendance[teacher.id]?.time_in || '07:30'}
                            onChange={(e) => setTeacherAttendance(prev => ({
                              ...prev,
                              [teacher.id]: { ...prev[teacher.id], time_in: e.target.value }
                            }))}
                            className="input w-28 text-sm"
                          />
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Class Selected */}
      {!selectedClass && viewMode !== 'teacher' && (
        <div className="card p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Select a class to manage attendance</p>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Attendance Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Late Threshold Time</label>
                <input
                  type="time"
                  value={lateThreshold}
                  onChange={(e) => setLateThreshold(e.target.value)}
                  className="input"
                />
                <p className="text-xs text-gray-500 mt-1">Students arriving after this time will be marked late when using "Auto Late"</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowSettings(false)} className="btn bg-gray-200 text-gray-700 hover:bg-gray-300 flex-1">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
