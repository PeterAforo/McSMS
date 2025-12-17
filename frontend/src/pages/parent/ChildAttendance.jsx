import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, CheckCircle, XCircle, Clock, AlertTriangle,
  ChevronLeft, ChevronRight, Loader2, TrendingUp, TrendingDown
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function ChildAttendance() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [child, setChild] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState({ present: 0, absent: 0, late: 0, excused: 0, total: 0 });
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [parentId, setParentId] = useState(null);

  useEffect(() => {
    fetchParentId();
  }, [user]);

  useEffect(() => {
    if (parentId && childId) {
      fetchChildDetails();
    }
  }, [parentId, childId]);

  useEffect(() => {
    if (child?.student_id) {
      fetchAttendance();
    }
  }, [child, currentMonth]);

  const fetchParentId = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/parents.php?user_id=${user?.id}`);
      if (response.data.parents?.length > 0) {
        setParentId(response.data.parents[0].id);
      }
    } catch (error) {
      console.error('Error fetching parent ID:', error);
    }
  };

  const fetchChildDetails = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/parent_portal.php?resource=child_details&child_id=${childId}`);
      if (response.data.success) {
        setChild(response.data.child);
      }
    } catch (error) {
      console.error('Error fetching child details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/parent_portal.php?resource=attendance&student_id=${child.student_id}&month=${currentMonth}`
      );
      if (response.data.success) {
        setAttendance(response.data.attendance || []);
        setSummary(response.data.summary || { present: 0, absent: 0, late: 0, excused: 0, total: 0 });
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const changeMonth = (direction) => {
    const date = new Date(currentMonth + '-01');
    date.setMonth(date.getMonth() + direction);
    setCurrentMonth(date.toISOString().slice(0, 7));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'absent': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'late': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'excused': return <AlertTriangle className="w-5 h-5 text-blue-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-700';
      case 'absent': return 'bg-red-100 text-red-700';
      case 'late': return 'bg-yellow-100 text-yellow-700';
      case 'excused': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const attendanceRate = summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0;

  const getDaysInMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    return new Date(year, month - 1, 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth();
    const firstDay = getFirstDayOfMonth();
    const days = [];
    const attendanceMap = {};

    attendance.forEach(a => {
      const day = new Date(a.date).getDate();
      attendanceMap[day] = a;
    });

    // Empty cells for days before the first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const record = attendanceMap[day];
      days.push(
        <div
          key={day}
          className={`p-2 text-center rounded-lg ${
            record ? getStatusColor(record.status) : 'bg-gray-50'
          }`}
          title={record ? `${record.status}${record.remarks ? `: ${record.remarks}` : ''}` : 'No record'}
        >
          <span className="text-sm font-medium">{day}</span>
          {record && (
            <div className="mt-1 flex justify-center">
              {getStatusIcon(record.status)}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600">{child?.full_name} • {child?.class_name}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4 text-center">
          <div className={`text-3xl font-bold ${attendanceRate >= 90 ? 'text-green-600' : attendanceRate >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
            {attendanceRate}%
          </div>
          <p className="text-sm text-gray-600">Attendance Rate</p>
          <div className="flex items-center justify-center gap-1 mt-1">
            {attendanceRate >= 90 ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
          </div>
        </div>
        <div className="card p-4 text-center bg-green-50">
          <div className="text-3xl font-bold text-green-600">{summary.present}</div>
          <p className="text-sm text-gray-600">Present</p>
        </div>
        <div className="card p-4 text-center bg-red-50">
          <div className="text-3xl font-bold text-red-600">{summary.absent}</div>
          <p className="text-sm text-gray-600">Absent</p>
        </div>
        <div className="card p-4 text-center bg-yellow-50">
          <div className="text-3xl font-bold text-yellow-600">{summary.late}</div>
          <p className="text-sm text-gray-600">Late</p>
        </div>
        <div className="card p-4 text-center bg-blue-50">
          <div className="text-3xl font-bold text-blue-600">{summary.excused || 0}</div>
          <p className="text-sm text-gray-600">Excused</p>
        </div>
      </div>

      {/* Calendar View */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-semibold">
            {new Date(currentMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {renderCalendar()}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 rounded"></div>
            <span className="text-sm text-gray-600">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 rounded"></div>
            <span className="text-sm text-gray-600">Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 rounded"></div>
            <span className="text-sm text-gray-600">Late</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 rounded"></div>
            <span className="text-sm text-gray-600">Excused</span>
          </div>
        </div>
      </div>

      {/* Detailed List */}
      <div className="card">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Attendance Records</h3>
        </div>
        <div className="divide-y max-h-96 overflow-y-auto">
          {attendance.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No attendance records for this month
            </div>
          ) : (
            attendance.map((record) => (
              <div key={record.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getStatusIcon(record.status)}
                  <div>
                    <p className="font-medium">
                      {new Date(record.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                    {record.remarks && (
                      <p className="text-sm text-gray-500">{record.remarks}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(record.status)}`}>
                    {record.status}
                  </span>
                  {record.check_in_time && (
                    <p className="text-xs text-gray-500 mt-1">
                      In: {record.check_in_time} {record.check_out_time && `• Out: ${record.check_out_time}`}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
