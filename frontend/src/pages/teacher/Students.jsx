import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Users, Mail, Phone, Calendar, MapPin, ArrowLeft, X, Eye, User, Home, FileText } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export default function TeacherStudents() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const classId = searchParams.get('class');
  const showAll = searchParams.get('all') === 'true';
  
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [classId, showAll]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get teacher record first
      const teacherResponse = await axios.get(`https://eea.mcaforo.com/backend/api/teachers.php?user_id=${user.id}`);
      const teachers = teacherResponse.data.teachers || [];
      
      if (teachers.length === 0) {
        console.error('No teacher record found');
        setLoading(false);
        return;
      }
      
      const teacherId = teachers[0].id;
      
      if (showAll) {
        // Fetch all classes and all students
        const classesResponse = await axios.get(`https://eea.mcaforo.com/backend/api/classes.php?teacher_id=${teacherId}`);
        const teacherClasses = classesResponse.data.classes || [];
        setClasses(teacherClasses);
        
        // Get all students from all classes
        const allStudents = [];
        for (const cls of teacherClasses) {
          const studentsRes = await axios.get(`https://eea.mcaforo.com/backend/api/students.php?class_id=${cls.id}`);
          const classStudents = (studentsRes.data.students || []).map(s => ({
            ...s,
            class_name: cls.class_name
          }));
          allStudents.push(...classStudents);
        }
        setStudents(allStudents);
      } else if (classId) {
        // Fetch specific class info
        const classResponse = await axios.get(`https://eea.mcaforo.com/backend/api/classes.php?id=${classId}`);
        setClassInfo(classResponse.data.class);
        
        // Fetch students in this class
        const studentsResponse = await axios.get(`https://eea.mcaforo.com/backend/api/students.php?class_id=${classId}`);
        setStudents(studentsResponse.data.students || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.first_name?.toLowerCase().includes(searchLower) ||
      student.last_name?.toLowerCase().includes(searchLower) ||
      student.student_id?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-700',
      graduated: 'bg-blue-100 text-blue-700',
      transferred: 'bg-orange-100 text-orange-700'
    };
    return badges[status] || badges.active;
  };

  const handleViewDetails = (student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(showAll ? '/teacher/dashboard' : '/teacher/classes')}
            className="btn bg-gray-200 hover:bg-gray-300"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {showAll ? 'All My Students' : `${classInfo?.class_name} Students`}
            </h1>
            <p className="text-gray-600 mt-1">
              {students.length} student{students.length !== 1 ? 's' : ''} {showAll ? 'across all classes' : 'enrolled'}
            </p>
          </div>
        </div>
      </div>

      {/* Class Info Card */}
      {classInfo && !showAll && (
        <div className="card p-6">
          <div className="grid grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Class Code</p>
              <p className="font-semibold text-gray-900">{classInfo.class_code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Level</p>
              <p className="font-semibold text-gray-900">{classInfo.level?.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Room</p>
              <p className="font-semibold text-gray-900">{classInfo.room_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Capacity</p>
              <p className="font-semibold text-gray-900">
                {students.length} / {classInfo.capacity}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="card p-4">
        <input
          type="text"
          placeholder="Search students by name, ID, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input w-full"
        />
      </div>

      {/* Students List */}
      {filteredStudents.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {searchTerm ? 'No students found matching your search' : 'No students enrolled in this class yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <div key={student.id} className="card p-6 hover:shadow-lg transition-shadow">
              {/* Student Photo */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {student.photo ? (
                    <img
                      src={`${API_BASE_URL}/${student.photo.replace(/^\//, '')}`}
                      alt={`${student.first_name} ${student.last_name}`}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-blue-600">
                        {student.first_name?.[0]}{student.last_name?.[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {student.first_name} {student.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">{student.student_id}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(student.status)}`}>
                  {student.status}
                </span>
              </div>

              {/* Student Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Gender:</span>
                  <span>{student.gender || 'N/A'}</span>
                </div>
                {student.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{student.email}</span>
                  </div>
                )}
                {student.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{student.phone}</span>
                  </div>
                )}
                {student.city && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{student.city}, {student.region}</span>
                  </div>
                )}
              </div>

              {/* Guardian Info */}
              {student.guardian_name && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Guardian</p>
                  <p className="text-sm font-medium text-gray-900">{student.guardian_name}</p>
                  {student.guardian_phone && (
                    <p className="text-xs text-gray-600">{student.guardian_phone}</p>
                  )}
                </div>
              )}

              {/* View Details Button */}
              <button
                onClick={() => handleViewDetails(student)}
                className="mt-4 w-full btn btn-primary flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Full Details
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Student Details Modal */}
      {showDetailsModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-semibold">Student Details</h2>
              <button 
                onClick={() => setShowDetailsModal(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Student Header */}
              <div className="flex items-start gap-6 pb-6 border-b">
                {selectedStudent.photo ? (
                  <img
                    src={`${API_BASE_URL}/${selectedStudent.photo.replace(/^\//, '')}`}
                    alt={`${selectedStudent.first_name} ${selectedStudent.last_name}`}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-5xl font-bold text-blue-600">
                      {selectedStudent.first_name?.[0]}{selectedStudent.last_name?.[0]}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {selectedStudent.first_name} {selectedStudent.last_name}
                      </h3>
                      <p className="text-gray-600 mt-1">Student ID: {selectedStudent.student_id}</p>
                      {selectedStudent.class_name && (
                        <p className="text-gray-600">Class: {selectedStudent.class_name}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(selectedStudent.status)}`}>
                      {selectedStudent.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Personal Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Date of Birth</p>
                    <p className="font-medium text-gray-900">
                      {selectedStudent.date_of_birth ? new Date(selectedStudent.date_of_birth).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Age</p>
                    <p className="font-medium text-gray-900">
                      {selectedStudent.date_of_birth 
                        ? Math.floor((new Date() - new Date(selectedStudent.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000)) + ' years'
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Gender</p>
                    <p className="font-medium text-gray-900">{selectedStudent.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Nationality</p>
                    <p className="font-medium text-gray-900">{selectedStudent.nationality || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Religion</p>
                    <p className="font-medium text-gray-900">{selectedStudent.religion || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Blood Group</p>
                    <p className="font-medium text-gray-900">{selectedStudent.blood_group || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-green-600" />
                  Contact Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{selectedStudent.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{selectedStudent.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Home className="w-5 h-5 text-purple-600" />
                  Address Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Street Address</p>
                    <p className="font-medium text-gray-900">{selectedStudent.address || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">City</p>
                    <p className="font-medium text-gray-900">{selectedStudent.city || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Region</p>
                    <p className="font-medium text-gray-900">{selectedStudent.region || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Country</p>
                    <p className="font-medium text-gray-900">{selectedStudent.country || 'Ghana'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Postal Code</p>
                    <p className="font-medium text-gray-900">{selectedStudent.postal_code || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Guardian Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-600" />
                  Guardian Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Guardian Name</p>
                    <p className="font-medium text-gray-900">{selectedStudent.guardian_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Relationship</p>
                    <p className="font-medium text-gray-900">{selectedStudent.guardian_relationship || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Guardian Phone</p>
                    <p className="font-medium text-gray-900">{selectedStudent.guardian_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Guardian Email</p>
                    <p className="font-medium text-gray-900">{selectedStudent.guardian_email || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Guardian Address</p>
                    <p className="font-medium text-gray-900">{selectedStudent.guardian_address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Academic Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Admission Date</p>
                    <p className="font-medium text-gray-900">
                      {selectedStudent.admission_date ? new Date(selectedStudent.admission_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Previous School</p>
                    <p className="font-medium text-gray-900">{selectedStudent.previous_school || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Medical Conditions</p>
                    <p className="font-medium text-gray-900">{selectedStudent.medical_conditions || 'None'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Allergies</p>
                    <p className="font-medium text-gray-900">{selectedStudent.allergies || 'None'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="btn bg-gray-200 hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
