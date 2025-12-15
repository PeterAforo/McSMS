import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, BookOpen, Calendar, Eye, Search, Filter, Clock, 
  TrendingUp, FileText, Award, ChevronRight, Loader2,
  CheckCircle, AlertCircle, BarChart3, GraduationCap, RefreshCw
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function MyClasses() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [classStats, setClassStats] = useState({});
  const [classSubjects, setClassSubjects] = useState({});
  const [classTimetable, setClassTimetable] = useState({});
  const [recentActivity, setRecentActivity] = useState({});
  const [expandedClass, setExpandedClass] = useState(null);

  useEffect(() => {
    fetchMyClasses();
  }, []);

  const fetchMyClasses = async () => {
    try {
      setLoading(true);
      
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
      const teacherId = teacher.id;
      
      // Fetch classes assigned to this teacher
      const response = await axios.get(`${API_BASE_URL}/classes.php?teacher_id=${teacherId}`);
      const classesData = response.data.classes || [];
      setClasses(classesData);
      
      // Fetch additional data for each class
      await Promise.all([
        fetchClassStats(classesData),
        fetchClassSubjects(teacherId, classesData),
        fetchClassTimetable(teacherId),
        fetchRecentActivity(teacherId, classesData)
      ]);
      
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassStats = async (classesData) => {
    const stats = {};
    const today = new Date().toISOString().split('T')[0];
    
    for (const cls of classesData) {
      try {
        // Get student count
        const studentsRes = await axios.get(`${API_BASE_URL}/students.php?class_id=${cls.id}`);
        const students = studentsRes.data.students || [];
        
        // Get attendance for today
        let attendanceRate = null;
        try {
          const attRes = await axios.get(`${API_BASE_URL}/attendance.php?class_id=${cls.id}&date=${today}`);
          const attendance = attRes.data.attendance || [];
          if (attendance.length > 0) {
            const present = attendance.filter(a => a.status === 'present').length;
            attendanceRate = Math.round((present / attendance.length) * 100);
          }
        } catch (e) {}
        
        // Get average grade
        let avgGrade = null;
        try {
          const gradesRes = await axios.get(`${API_BASE_URL}/academic.php?resource=grades&class_id=${cls.id}`);
          const grades = gradesRes.data.grades || [];
          if (grades.length > 0) {
            const sum = grades.reduce((acc, g) => acc + (parseFloat(g.marks_obtained) || 0), 0);
            avgGrade = Math.round(sum / grades.length);
          }
        } catch (e) {}
        
        stats[cls.id] = {
          studentCount: students.length,
          attendanceRate,
          avgGrade,
          attendanceMarked: attendanceRate !== null
        };
      } catch (e) {
        stats[cls.id] = { studentCount: 0, attendanceRate: null, avgGrade: null, attendanceMarked: false };
      }
    }
    
    setClassStats(stats);
  };

  const fetchClassSubjects = async (teacherId, classesData) => {
    try {
      // Get subjects taught by this teacher
      const subjectsRes = await axios.get(`${API_BASE_URL}/teacher_subjects.php?teacher_id=${teacherId}`);
      const teacherSubjects = subjectsRes.data.subjects || subjectsRes.data.teacher_subjects || [];
      
      // Group by class
      const subjectsByClass = {};
      for (const cls of classesData) {
        subjectsByClass[cls.id] = teacherSubjects.filter(s => s.class_id == cls.id);
      }
      
      setClassSubjects(subjectsByClass);
    } catch (e) {
      // Try alternative approach - get from timetable
      try {
        const timetableRes = await axios.get(`${API_BASE_URL}/timetable.php?teacher_id=${teacherId}`);
        const entries = timetableRes.data.entries || timetableRes.data.timetable || [];
        
        const subjectsByClass = {};
        for (const cls of classesData) {
          const classEntries = entries.filter(e => e.class_id == cls.id);
          const uniqueSubjects = [...new Map(classEntries.map(e => [e.subject_id, { subject_name: e.subject_name, subject_id: e.subject_id }])).values()];
          subjectsByClass[cls.id] = uniqueSubjects;
        }
        
        setClassSubjects(subjectsByClass);
      } catch (e2) {
        console.error('Could not fetch subjects:', e2);
      }
    }
  };

  const fetchClassTimetable = async (teacherId) => {
    try {
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const response = await axios.get(`${API_BASE_URL}/timetable.php?teacher_id=${teacherId}&day=${today}`);
      const entries = response.data.entries || response.data.timetable || [];
      
      // Group by class
      const timetableByClass = {};
      entries.forEach(entry => {
        if (!timetableByClass[entry.class_id]) {
          timetableByClass[entry.class_id] = [];
        }
        timetableByClass[entry.class_id].push(entry);
      });
      
      setClassTimetable(timetableByClass);
    } catch (e) {
      console.error('Could not fetch timetable:', e);
    }
  };

  const fetchRecentActivity = async (teacherId, classesData) => {
    const activity = {};
    
    for (const cls of classesData) {
      try {
        // Get recent homework
        const homeworkRes = await axios.get(`${API_BASE_URL}/academic.php?resource=homework&class_id=${cls.id}&limit=1`);
        const homework = homeworkRes.data.homework || [];
        
        // Get pending grades count
        let pendingGrades = 0;
        try {
          const assessmentsRes = await axios.get(`${API_BASE_URL}/academic.php?resource=assessments&class_id=${cls.id}`);
          const assessments = assessmentsRes.data.assessments || [];
          // Count assessments without grades (simplified)
          pendingGrades = assessments.filter(a => !a.graded).length;
        } catch (e) {}
        
        activity[cls.id] = {
          lastHomework: homework[0] || null,
          pendingGrades
        };
      } catch (e) {
        activity[cls.id] = { lastHomework: null, pendingGrades: 0 };
      }
    }
    
    setRecentActivity(activity);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMyClasses();
    setRefreshing(false);
  };

  // Get unique levels for filter
  const levels = [...new Set(classes.map(c => c.level).filter(Boolean))];

  // Filter classes
  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.class_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.level?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === 'all' || cls.level === filterLevel;
    const matchesStatus = filterStatus === 'all' || cls.status === filterStatus;
    return matchesSearch && matchesLevel && matchesStatus;
  });

  // Stats summary
  const totalStudents = Object.values(classStats).reduce((sum, s) => sum + (s.studentCount || 0), 0);
  const classesWithAttendance = Object.values(classStats).filter(s => s.attendanceMarked).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your classes...</p>
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
            <BookOpen className="text-blue-600" />
            My Classes
          </h1>
          <p className="text-gray-600 mt-1">
            {teacherInfo ? `${teacherInfo.first_name} ${teacherInfo.last_name}` : 'Teacher'} • {classes.length} class{classes.length !== 1 ? 'es' : ''} assigned
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn bg-gray-100 hover:bg-gray-200 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
              <p className="text-xs text-gray-500">Classes</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
              <p className="text-xs text-gray-500">Total Students</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{classesWithAttendance}/{classes.length}</p>
              <p className="text-xs text-gray-500">Attendance Today</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {Object.values(classSubjects).flat().length}
              </p>
              <p className="text-xs text-gray-500">Subjects</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="input w-full md:w-40"
          >
            <option value="all">All Levels</option>
            {levels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input w-full md:w-40"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredClasses.map((cls) => {
          const stats = classStats[cls.id] || {};
          const subjects = classSubjects[cls.id] || [];
          const timetable = classTimetable[cls.id] || [];
          const activity = recentActivity[cls.id] || {};
          const isExpanded = expandedClass === cls.id;
          
          return (
            <div key={cls.id} className="card hover:shadow-lg transition-shadow">
              {/* Card Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {cls.class_name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{cls.class_name}</h3>
                      <p className="text-sm text-gray-500">{cls.level} • {cls.section || 'Main'} • Room {cls.room_number || 'TBA'}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    cls.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {cls.status}
                  </span>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xl font-bold text-gray-900">{stats.studentCount || 0}</p>
                    <p className="text-xs text-gray-500">Students</p>
                  </div>
                  <div className={`text-center p-3 rounded-lg ${stats.attendanceMarked ? 'bg-green-50' : 'bg-orange-50'}`}>
                    <p className={`text-xl font-bold ${stats.attendanceMarked ? 'text-green-700' : 'text-orange-700'}`}>
                      {stats.attendanceRate !== null ? `${stats.attendanceRate}%` : '—'}
                    </p>
                    <p className="text-xs text-gray-500">Attendance</p>
                  </div>
                  <div className={`text-center p-3 rounded-lg ${
                    stats.avgGrade >= 70 ? 'bg-green-50' : 
                    stats.avgGrade >= 50 ? 'bg-yellow-50' : 
                    stats.avgGrade ? 'bg-red-50' : 'bg-gray-50'
                  }`}>
                    <p className={`text-xl font-bold ${
                      stats.avgGrade >= 70 ? 'text-green-700' : 
                      stats.avgGrade >= 50 ? 'text-yellow-700' : 
                      stats.avgGrade ? 'text-red-700' : 'text-gray-700'
                    }`}>
                      {stats.avgGrade !== null ? `${stats.avgGrade}%` : '—'}
                    </p>
                    <p className="text-xs text-gray-500">Avg Grade</p>
                  </div>
                </div>
              </div>

              {/* Subjects */}
              {subjects.length > 0 && (
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
                  <p className="text-xs text-gray-500 mb-2">Subjects I Teach:</p>
                  <div className="flex flex-wrap gap-2">
                    {subjects.slice(0, 4).map((sub, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {sub.subject_name}
                      </span>
                    ))}
                    {subjects.length > 4 && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                        +{subjects.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Today's Schedule */}
              {timetable.length > 0 && (
                <div className="px-6 py-3 border-b border-gray-100">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Today's Schedule:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {timetable.map((entry, idx) => (
                      <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                        {entry.start_time} - {entry.subject_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              {(activity.lastHomework || activity.pendingGrades > 0) && (
                <div className="px-6 py-3 border-b border-gray-100 bg-yellow-50">
                  <div className="flex items-center gap-4 text-xs">
                    {activity.lastHomework && (
                      <span className="flex items-center gap-1 text-gray-600">
                        <FileText className="w-3 h-3" />
                        Last HW: {activity.lastHomework.title?.substring(0, 20)}...
                      </span>
                    )}
                    {activity.pendingGrades > 0 && (
                      <span className="flex items-center gap-1 text-orange-600">
                        <AlertCircle className="w-3 h-3" />
                        {activity.pendingGrades} pending grades
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="p-4">
                <button
                  onClick={() => navigate(`/teacher/students?class=${cls.id}`)}
                  className="btn btn-primary w-full mb-3 flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  View Students
                  <ChevronRight className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => navigate(`/teacher/attendance?class=${cls.id}`)}
                    className={`btn text-xs py-2 flex flex-col items-center gap-1 ${
                      stats.attendanceMarked 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Attendance
                  </button>
                  <button
                    onClick={() => navigate(`/teacher/homework?class=${cls.id}`)}
                    className="btn bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs py-2 flex flex-col items-center gap-1"
                  >
                    <FileText className="w-4 h-4" />
                    Homework
                  </button>
                  <button
                    onClick={() => navigate(`/teacher/grading?class=${cls.id}`)}
                    className="btn bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs py-2 flex flex-col items-center gap-1"
                  >
                    <Award className="w-4 h-4" />
                    Grading
                  </button>
                  <button
                    onClick={() => navigate(`/teacher/reports?class=${cls.id}`)}
                    className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs py-2 flex flex-col items-center gap-1"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Reports
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredClasses.length === 0 && (
        <div className="card p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          {classes.length === 0 ? (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Assigned</h3>
              <p className="text-gray-500">You haven't been assigned to any classes yet.</p>
              <p className="text-sm text-gray-400 mt-2">Contact your administrator to get assigned to classes.</p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Matching Classes</h3>
              <p className="text-gray-500">Try adjusting your search or filters.</p>
              <button
                onClick={() => { setSearchTerm(''); setFilterLevel('all'); setFilterStatus('all'); }}
                className="btn btn-primary mt-4"
              >
                Clear Filters
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
