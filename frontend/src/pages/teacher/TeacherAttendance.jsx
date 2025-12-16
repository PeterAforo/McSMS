import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, Users, CheckCircle, XCircle, Clock, Save, Search,
  ChevronLeft, ChevronRight, Download, BarChart3, History,
  AlertTriangle, Loader2, FileText, TrendingUp, RefreshCw,
  CheckSquare, Square, MessageSquare, Filter
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function TeacherAttendance() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  
  // Core state
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState(searchParams.get('class') || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const [notes, setNotes] = useState({});
  const [stats, setStats] = useState(null);
  const [currentTerm, setCurrentTerm] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('mark'); // mark, history, trends
  const [weeklyData, setWeeklyData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [teacherInfo, setTeacherInfo] = useState(null);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
      fetchAttendance();
      if (activeTab === 'history') fetchHistory();
      if (activeTab === 'trends') fetchWeeklyTrends();
    }
  }, [selectedClass, selectedDate, activeTab]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Get current term
      try {
        const termRes = await axios.get(`${API_BASE_URL}/terms.php?current=true`);
        if (termRes.data.term) {
          setCurrentTerm(termRes.data.term);
        } else if (termRes.data.terms?.length > 0) {
          setCurrentTerm(termRes.data.terms[0]);
        }
      } catch (e) {
        console.error('Could not fetch current term:', e);
      }
      
      // Get teacher record
      const teacherResponse = await axios.get(`${API_BASE_URL}/teachers.php?user_id=${user?.id}`);
      const teachers = teacherResponse.data.teachers || [];
      
      if (teachers.length === 0) {
        console.error('No teacher record found for this user');
        setLoading(false);
        return;
      }
      
      const teacher = teachers[0];
      setTeacherInfo(teacher);
      
      // Fetch classes assigned to this teacher
      const response = await axios.get(`${API_BASE_URL}/classes.php?teacher_id=${teacher.id}`);
      setClasses(response.data.classes || []);
      
      // If class was passed in URL, set it
      const classFromUrl = searchParams.get('class');
      if (classFromUrl) {
        setSelectedClass(classFromUrl);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/students.php?class_id=${selectedClass}`);
      const studentList = response.data.students || [];
      setStudents(studentList);
      
      // Initialize attendance with present status
      const initialAttendance = {};
      const initialNotes = {};
      studentList.forEach(student => {
        initialAttendance[student.id] = { status: 'present', time_in: '07:45' };
        initialNotes[student.id] = '';
      });
      setAttendance(initialAttendance);
      setNotes(initialNotes);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      const [attendanceRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/attendance.php?class_id=${selectedClass}&date=${selectedDate}`),
        axios.get(`${API_BASE_URL}/attendance.php?action=stats&class_id=${selectedClass}&date=${selectedDate}`)
      ]);
      
      const records = attendanceRes.data.attendance || [];
      const existingAttendance = {};
      const existingNotes = {};
      
      records.forEach(record => {
        existingAttendance[record.student_id] = {
          status: record.status,
          time_in: record.time_in || '07:45'
        };
        existingNotes[record.student_id] = record.notes || '';
      });
      
      if (records.length > 0) {
        setAttendance(prev => ({ ...prev, ...existingAttendance }));
        setNotes(prev => ({ ...prev, ...existingNotes }));
      }
      
      setStats(statsRes.data.stats || statsRes.data);
      setSaved(records.length > 0);
      setHasChanges(false);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/attendance.php?action=history&class_id=${selectedClass}&limit=30`);
      setHistoryData(response.data.history || response.data.attendance || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const fetchWeeklyTrends = async () => {
    try {
      // Get last 7 days of attendance
      const dates = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }
      
      const weekData = [];
      for (const date of dates) {
        try {
          const res = await axios.get(`${API_BASE_URL}/attendance.php?action=stats&class_id=${selectedClass}&date=${date}`);
          const stats = res.data.stats || res.data;
          weekData.push({
            date,
            day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
            present: stats.present || 0,
            absent: stats.absent || 0,
            late: stats.late || 0,
            total: stats.total || 0,
            rate: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0
          });
        } catch (e) {
          weekData.push({ date, day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }), present: 0, absent: 0, late: 0, total: 0, rate: 0 });
        }
      }
      
      setWeeklyData(weekData);
    } catch (error) {
      console.error('Error fetching weekly trends:', error);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
    setHasChanges(true);
    setSaved(false);
  };

  const handleTimeChange = (studentId, time) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], time_in: time }
    }));
    setHasChanges(true);
    setSaved(false);
  };

  const handleNoteChange = (studentId, note) => {
    setNotes(prev => ({ ...prev, [studentId]: note }));
    setHasChanges(true);
    setSaved(false);
  };

  const handleQuickMark = (status) => {
    const updated = {};
    const targetStudents = selectedStudents.length > 0 ? selectedStudents : students.map(s => s.id);
    
    targetStudents.forEach(studentId => {
      updated[studentId] = { status, time_in: status === 'present' ? '07:45' : null };
    });
    
    setAttendance(prev => ({ ...prev, ...updated }));
    setHasChanges(true);
    setSaved(false);
    setSelectedStudents([]);
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  const handleSubmit = async () => {
    if (!selectedClass) {
      alert('Please select a class');
      return;
    }

    if (!students || students.length === 0) {
      alert('No students found in this class. Please select a class with students.');
      return;
    }

    try {
      setSaving(true);
      const attendanceData = students.map(student => ({
        student_id: parseInt(student.id),
        status: attendance[student.id]?.status || 'present',
        time_in: attendance[student.id]?.time_in || null,
        notes: notes[student.id] || null
      }));
      
      console.log('Submitting attendance:', { class_id: selectedClass, students: attendanceData });

      await axios.post(`${API_BASE_URL}/attendance.php?action=mark_class`, {
        class_id: selectedClass,
        term_id: currentTerm?.id || 1,
        date: selectedDate,
        students: attendanceData,
        marked_by: user?.id
      });

      setSaved(true);
      setHasChanges(false);
      alert('Attendance marked successfully!');
      fetchAttendance();
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const className = classes.find(c => c.id == selectedClass)?.class_name || 'Class';
    const csv = [
      ['#', 'Student ID', 'Name', 'Status', 'Time In', 'Notes'],
      ...students.map((s, i) => [
        i + 1,
        s.student_id,
        `${s.first_name} ${s.last_name}`,
        attendance[s.id]?.status || 'present',
        attendance[s.id]?.time_in || '',
        notes[s.id] || ''
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${className}_${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const navigateDate = (direction) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + direction);
    setSelectedDate(date.toISOString().split('T')[0]);
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

  // Filter students by search
  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate live stats from current attendance state
  const liveStats = {
    total: students.length,
    present: Object.values(attendance).filter(a => a.status === 'present').length,
    absent: Object.values(attendance).filter(a => a.status === 'absent').length,
    late: Object.values(attendance).filter(a => a.status === 'late').length,
    excused: Object.values(attendance).filter(a => a.status === 'excused').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading attendance...</p>
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
            <CheckCircle className="text-green-600" />
            Mark Attendance
          </h1>
          <p className="text-gray-600 mt-1">
            {currentTerm ? `${currentTerm.term_name} • ` : ''}
            Record daily attendance for your classes
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="flex items-center gap-1 text-orange-600 text-sm">
              <AlertTriangle className="w-4 h-4" />
              Unsaved changes
            </span>
          )}
          {saved && !hasChanges && (
            <span className="flex items-center gap-1 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              Saved
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          {[
            { id: 'mark', label: 'Mark Attendance', icon: CheckCircle },
            { id: 'history', label: 'History', icon: History },
            { id: 'trends', label: 'Trends', icon: TrendingUp }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Class *</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input"
            >
              <option value="">Choose a class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.class_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
            <div className="flex items-center gap-1">
              <button onClick={() => navigateDate(-1)} className="p-2 hover:bg-gray-100 rounded">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input flex-1"
              />
              <button onClick={() => navigateDate(1)} className="p-2 hover:bg-gray-100 rounded">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleExport}
              disabled={!selectedClass}
              className="btn bg-gray-100 hover:bg-gray-200 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSubmit}
              disabled={!selectedClass || saving}
              className="btn btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        {selectedClass && activeTab === 'mark' && (
          <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Quick Mark{selectedStudents.length > 0 ? ` (${selectedStudents.length} selected)` : ''}:</span>
              <button onClick={() => handleQuickMark('present')} className="btn bg-green-100 text-green-700 hover:bg-green-200 text-sm">All Present</button>
              <button onClick={() => handleQuickMark('absent')} className="btn bg-red-100 text-red-700 hover:bg-red-200 text-sm">All Absent</button>
              <button onClick={() => handleQuickMark('late')} className="btn bg-orange-100 text-orange-700 hover:bg-orange-200 text-sm">All Late</button>
            </div>
            <div className="flex-1" />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-9 w-64"
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      {selectedClass && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{liveStats.total}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Present</p>
                <p className="text-2xl font-bold text-green-600">{liveStats.present}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Absent</p>
                <p className="text-2xl font-bold text-red-600">{liveStats.absent}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Late</p>
                <p className="text-2xl font-bold text-orange-600">{liveStats.late}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                liveStats.total > 0 && (liveStats.present / liveStats.total) >= 0.9 ? 'bg-green-100' :
                liveStats.total > 0 && (liveStats.present / liveStats.total) >= 0.7 ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <span className={`text-lg font-bold ${
                  liveStats.total > 0 && (liveStats.present / liveStats.total) >= 0.9 ? 'text-green-600' :
                  liveStats.total > 0 && (liveStats.present / liveStats.total) >= 0.7 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {liveStats.total > 0 ? Math.round((liveStats.present / liveStats.total) * 100) : 0}%
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Rate</p>
                <p className="text-sm text-gray-500">Attendance</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mark Attendance Tab */}
      {activeTab === 'mark' && selectedClass && filteredStudents.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button onClick={handleSelectAll} className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase">
                      {selectedStudents.length === filteredStudents.length ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      #
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time In</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStudents.map((student, index) => (
                  <tr key={student.id} className={`hover:bg-gray-50 ${selectedStudents.includes(student.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3">
                      <button onClick={() => handleSelectStudent(student.id)} className="flex items-center gap-2 text-sm text-gray-600">
                        {selectedStudents.includes(student.id) ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                        {index + 1}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          attendance[student.id]?.status === 'present' ? 'bg-green-100' :
                          attendance[student.id]?.status === 'absent' ? 'bg-red-100' :
                          attendance[student.id]?.status === 'late' ? 'bg-orange-100' : 'bg-blue-100'
                        }`}>
                          <span className={`font-semibold text-sm ${
                            attendance[student.id]?.status === 'present' ? 'text-green-600' :
                            attendance[student.id]?.status === 'absent' ? 'text-red-600' :
                            attendance[student.id]?.status === 'late' ? 'text-orange-600' : 'text-blue-600'
                          }`}>
                            {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900">{student.first_name} {student.last_name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-gray-600">{student.student_id}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {['present', 'absent', 'late', 'excused'].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(student.id, status)}
                            className={`px-2 py-1 text-xs font-medium rounded-full border-2 transition-all ${
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
                        placeholder="Add note..."
                        value={notes[student.id] || ''}
                        onChange={(e) => handleNoteChange(student.id, e.target.value)}
                        className="input w-32 text-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && selectedClass && (
        <div className="card">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Attendance History (Last 30 Days)</h3>
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
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">No attendance history found</td>
                  </tr>
                ) : (
                  historyData.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{new Date(record.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{record.total || 0}</td>
                      <td className="px-4 py-3 text-green-600">{record.present || 0}</td>
                      <td className="px-4 py-3 text-red-600">{record.absent || 0}</td>
                      <td className="px-4 py-3 text-orange-600">{record.late || 0}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.rate >= 90 ? 'bg-green-100 text-green-700' :
                          record.rate >= 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {record.rate || 0}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && selectedClass && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Weekly Attendance Trends</h3>
          <div className="grid grid-cols-7 gap-2">
            {weeklyData.map((day, index) => (
              <div key={index} className="text-center">
                <p className="text-xs text-gray-500 mb-2">{day.day}</p>
                <div className="h-32 bg-gray-100 rounded-lg relative overflow-hidden">
                  {day.total > 0 && (
                    <>
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-green-500 transition-all"
                        style={{ height: `${(day.present / day.total) * 100}%` }}
                      />
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-orange-500 transition-all"
                        style={{ height: `${(day.late / day.total) * 100}%`, bottom: `${(day.present / day.total) * 100}%` }}
                      />
                    </>
                  )}
                </div>
                <p className={`text-sm font-bold mt-2 ${
                  day.rate >= 90 ? 'text-green-600' :
                  day.rate >= 70 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {day.rate}%
                </p>
                <p className="text-xs text-gray-400">{new Date(day.date).getDate()}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-sm text-gray-600">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded" />
              <span className="text-sm text-gray-600">Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300 rounded" />
              <span className="text-sm text-gray-600">Absent</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty States */}
      {activeTab === 'mark' && selectedClass && filteredStudents.length === 0 && (
        <div className="card p-12 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          {students.length === 0 ? (
            <p className="text-gray-500">No students found in this class</p>
          ) : (
            <>
              <p className="text-gray-500">No students match your search</p>
              <button onClick={() => setSearchTerm('')} className="btn btn-primary mt-4">Clear Search</button>
            </>
          )}
        </div>
      )}

      {!selectedClass && (
        <div className="card p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Select a class to mark attendance</p>
        </div>
      )}
    </div>
  );
}
