import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, BookOpen, CheckCircle, Clock, FileText, DollarSign } from 'lucide-react';
import axios from 'axios';

export default function ChildDetails() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [grades, setGrades] = useState([]);
  const [homework, setHomework] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchChildData();
  }, [studentId]);

  const fetchChildData = async () => {
    try {
      setLoading(true);
      const [studentRes, attendanceRes, gradesRes, homeworkRes] = await Promise.all([
        axios.get(`https://eea.mcaforo.com/backend/api/students.php?id=${studentId}`),
        axios.get(`https://eea.mcaforo.com/backend/api/academic.php?resource=attendance&student_id=${studentId}`).catch(() => ({ data: { attendance: [] } })),
        axios.get(`https://eea.mcaforo.com/backend/api/academic.php?resource=grades&action=by_student&student_id=${studentId}`).catch(() => ({ data: { grades: [] } })),
        axios.get(`https://eea.mcaforo.com/backend/api/academic.php?resource=homework_submissions&student_id=${studentId}`).catch(() => ({ data: { submissions: [] } }))
      ]);

      setStudent(studentRes.data.student);
      setAttendance(attendanceRes.data.attendance || []);
      setGrades(gradesRes.data.grades || []);
      setHomework(homeworkRes.data.submissions || []);
    } catch (error) {
      console.error('Error fetching child data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dob) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculateAttendanceRate = () => {
    if (attendance.length === 0) return 0;
    const present = attendance.filter(a => a.status === 'present').length;
    return ((present / attendance.length) * 100).toFixed(1);
  };

  const calculateAverageGrade = () => {
    if (grades.length === 0) return 'N/A';
    const total = grades.reduce((sum, g) => sum + parseFloat(g.marks_obtained || 0), 0);
    return (total / grades.length).toFixed(1);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Loading...</p></div>;
  }

  if (!student) {
    return <div className="text-center py-12"><p className="text-gray-500">Student not found</p></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/parent/dashboard')} className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{student.first_name} {student.last_name}</h1>
          <p className="text-gray-600">{student.student_id}</p>
        </div>
      </div>

      {/* Student Info Card */}
      <div className="card p-6">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-3xl font-bold text-blue-600">
            {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Age</p>
              <p className="font-semibold">{calculateAge(student.date_of_birth)} years</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Class</p>
              <p className="font-semibold">{student.class_name || 'Not assigned'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Gender</p>
              <p className="font-semibold capitalize">{student.gender}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                {student.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-sm text-gray-600">Attendance Rate</p>
          <p className="text-2xl font-bold text-gray-900">{calculateAttendanceRate()}%</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <BookOpen className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-sm text-gray-600">Average Grade</p>
          <p className="text-2xl font-bold text-gray-900">{calculateAverageGrade()}</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-8 h-8 text-purple-500" />
          </div>
          <p className="text-sm text-gray-600">Homework</p>
          <p className="text-2xl font-bold text-gray-900">{homework.length}</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
          <p className="text-sm text-gray-600">Days Present</p>
          <p className="text-2xl font-bold text-gray-900">{attendance.filter(a => a.status === 'present').length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {['overview', 'attendance', 'grades', 'homework'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Date of Birth:</span>
                <span className="font-medium">{new Date(student.date_of_birth).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Blood Group:</span>
                <span className="font-medium">{student.blood_group || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nationality:</span>
                <span className="font-medium">{student.nationality}</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Guardian Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{student.guardian_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{student.guardian_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{student.guardian_email}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Attendance Records</h3>
          {attendance.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No attendance records</p>
          ) : (
            <div className="space-y-2">
              {attendance.slice(0, 10).map((record, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm">{new Date(record.date).toLocaleDateString()}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    record.status === 'present' ? 'bg-green-100 text-green-700' :
                    record.status === 'absent' ? 'bg-red-100 text-red-700' :
                    record.status === 'late' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'grades' && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Academic Performance</h3>
          {grades.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No grades recorded</p>
          ) : (
            <div className="space-y-3">
              {grades.map((grade, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{grade.assessment_name}</p>
                    <p className="text-sm text-gray-600">{grade.subject_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">{grade.grade}</p>
                    <p className="text-sm text-gray-600">{grade.marks_obtained}/{grade.total_marks}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'homework' && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Homework Submissions</h3>
          {homework.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No homework submissions</p>
          ) : (
            <div className="space-y-3">
              {homework.map((hw, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">Homework #{hw.homework_id}</p>
                      <p className="text-sm text-gray-600">
                        Submitted: {hw.submitted_at ? new Date(hw.submitted_at).toLocaleDateString() : 'Not submitted'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      hw.status === 'graded' ? 'bg-green-100 text-green-700' :
                      hw.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                      hw.status === 'late' ? 'bg-red-100 text-red-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {hw.status}
                    </span>
                  </div>
                  {hw.status === 'graded' && (
                    <div className="bg-green-50 p-3 rounded mt-2">
                      <p className="text-sm font-semibold text-green-700">Score: {hw.marks_obtained}</p>
                      {hw.feedback && <p className="text-sm text-gray-600 mt-1">{hw.feedback}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
