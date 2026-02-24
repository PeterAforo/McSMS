import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import { Calendar, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

export default function StudentAttendance() {
  const { user } = useAuthStore();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [summary, setSummary] = useState({ present: 0, absent: 0, late: 0, total: 0 });

  useEffect(() => {
    if (user?.id) fetchAttendance();
  }, [user?.id, currentMonth]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const studentId = user.student_id || user.id;
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      
      const response = await axios.get(
        `${API_BASE_URL}/attendance.php?student_id=${studentId}&year=${year}&month=${month}`
      );
      const records = response.data.attendance || [];
      setAttendance(records);
      
      // Calculate summary
      const present = records.filter(r => r.status === 'present').length;
      const absent = records.filter(r => r.status === 'absent').length;
      const late = records.filter(r => r.status === 'late').length;
      setSummary({ present, absent, late, total: records.length });
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    // Add days of month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const record = attendance.find(a => a.date === dateStr);
      days.push({ day: i, date: dateStr, status: record?.status || null });
    }
    
    return days;
  };

  const getStatusIcon = (status) => {
    if (status === 'present') return <CheckCircle className="text-green-500" size={20} />;
    if (status === 'absent') return <XCircle className="text-red-500" size={20} />;
    if (status === 'late') return <Clock className="text-yellow-500" size={20} />;
    return null;
  };

  const getStatusBg = (status) => {
    if (status === 'present') return 'bg-green-50 border-green-200';
    if (status === 'absent') return 'bg-red-50 border-red-200';
    if (status === 'late') return 'bg-yellow-50 border-yellow-200';
    return 'bg-gray-50';
  };

  const changeMonth = (delta) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
  };

  const attendanceRate = summary.total > 0 
    ? (((summary.present + summary.late) / summary.total) * 100).toFixed(1) 
    : 0;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="text-blue-600" /> My Attendance
          </h1>
          <p className="text-gray-600">Track your attendance record</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Present</p>
              <p className="text-xl font-bold text-green-600">{summary.present}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Absent</p>
              <p className="text-xl font-bold text-red-600">{summary.absent}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="text-yellow-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Late</p>
              <p className="text-xl font-bold text-yellow-600">{summary.late}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Rate</p>
              <p className="text-xl font-bold text-blue-600">{attendanceRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {getDaysInMonth().map((item, idx) => (
                <div
                  key={idx}
                  className={`aspect-square p-2 rounded-lg border flex flex-col items-center justify-center ${
                    item ? getStatusBg(item.status) : 'bg-transparent border-transparent'
                  }`}
                >
                  {item && (
                    <>
                      <span className="text-sm font-medium">{item.day}</span>
                      {getStatusIcon(item.status)}
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-500" size={16} />
            <span className="text-sm text-gray-600">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="text-red-500" size={16} />
            <span className="text-sm text-gray-600">Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="text-yellow-500" size={16} />
            <span className="text-sm text-gray-600">Late</span>
          </div>
        </div>
      </div>
    </div>
  );
}
