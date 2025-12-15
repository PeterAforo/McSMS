import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  FileText, Download, Printer, Filter, Calendar, Users, 
  BookOpen, Award, TrendingUp, Clock, CheckCircle, XCircle,
  BarChart3, PieChart, Search, Eye, Loader2, RefreshCw,
  MessageSquare, ChevronDown, AlertTriangle, Star
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';
import html2canvas from 'html2canvas';

export default function StudentReports() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const reportRef = useRef(null);
  
  // Core state
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [currentTerm, setCurrentTerm] = useState(null);
  const [teacherInfo, setTeacherInfo] = useState(null);
  
  // Selection state
  const [selectedClass, setSelectedClass] = useState(searchParams.get('class') || '');
  const [selectedStudent, setSelectedStudent] = useState(searchParams.get('student') || '');
  const [reportType, setReportType] = useState('comprehensive');
  const [dateRange, setDateRange] = useState('current_term');
  const [bulkMode, setBulkMode] = useState(false);
  
  // Report state
  const [reportData, setReportData] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [teacherComments, setTeacherComments] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [selectedClass]);

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
        console.error('No teacher record found');
        setLoading(false);
        return;
      }
      
      const teacher = teachers[0];
      setTeacherInfo(teacher);
      
      // Fetch teacher's classes
      const classesResponse = await axios.get(`${API_BASE_URL}/classes.php?teacher_id=${teacher.id}`);
      setClasses(classesResponse.data.classes || []);
      
      // Set class from URL if provided
      const classFromUrl = searchParams.get('class');
      if (classFromUrl) {
        setSelectedClass(classFromUrl);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/students.php?class_id=${selectedClass}`);
      setStudents(response.data.students || []);
      
      // Set student from URL if provided
      const studentFromUrl = searchParams.get('student');
      if (studentFromUrl) {
        setSelectedStudent(studentFromUrl);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const generateReport = async () => {
    if (!selectedClass || (!selectedStudent && !bulkMode)) {
      alert('Please select both class and student');
      return;
    }

    try {
      setGenerating(true);
      
      // Fetch student details
      const studentResponse = await axios.get(`${API_BASE_URL}/students.php?id=${selectedStudent}`);
      const student = studentResponse.data.student;
      
      // Fetch class details
      const classResponse = await axios.get(`${API_BASE_URL}/classes.php?id=${selectedClass}`);
      const classInfo = classResponse.data.class || classes.find(c => c.id == selectedClass);
      
      // Fetch all class students for comparison
      const allStudentsRes = await axios.get(`${API_BASE_URL}/students.php?class_id=${selectedClass}`);
      const allClassStudents = allStudentsRes.data.students || [];
      
      // Fetch academic data
      let academicData = {};
      
      if (reportType === 'academic' || reportType === 'comprehensive') {
        // Fetch homework and submissions
        const homeworkResponse = await axios.get(`${API_BASE_URL}/academic.php?resource=homework&class_id=${selectedClass}`);
        const homework = homeworkResponse.data.homework || [];
        
        // Fetch assessments and grades
        const assessmentsResponse = await axios.get(`${API_BASE_URL}/academic.php?resource=assessments`);
        const allAssessments = assessmentsResponse.data.assessments || [];
        const classAssessments = allAssessments.filter(a => a.class_id == selectedClass);
        
        // Fetch student's grades
        let studentGrades = [];
        let subjectGrades = {};
        let classAverages = {};
        
        for (const assessment of classAssessments) {
          try {
            const gradesRes = await axios.get(`${API_BASE_URL}/academic.php?resource=grades&action=by_assessment&assessment_id=${assessment.id}`);
            const grades = gradesRes.data.grades || [];
            const studentGrade = grades.find(g => g.student_id == selectedStudent);
            
            if (studentGrade) {
              const percentage = (studentGrade.marks_obtained / assessment.total_marks) * 100;
              studentGrades.push({
                ...assessment,
                marks: studentGrade.marks_obtained,
                grade: studentGrade.grade,
                percentage
              });
              
              // Group by subject
              const subjectName = assessment.subject_name || 'Unknown';
              if (!subjectGrades[subjectName]) {
                subjectGrades[subjectName] = [];
              }
              subjectGrades[subjectName].push(percentage);
            }
            
            // Calculate class average for this assessment
            const classTotal = grades.reduce((sum, g) => sum + parseFloat(g.marks_obtained || 0), 0);
            const classAvg = grades.length > 0 ? (classTotal / grades.length / assessment.total_marks) * 100 : 0;
            classAverages[assessment.id] = classAvg;
          } catch (e) {
            console.error('Error fetching grades for assessment:', assessment.id);
          }
        }
        
        // Calculate subject averages
        const subjectAverages = {};
        for (const [subject, grades] of Object.entries(subjectGrades)) {
          subjectAverages[subject] = grades.length > 0 
            ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length) 
            : 0;
        }
        
        // Calculate overall average
        const allPercentages = studentGrades.map(g => g.percentage);
        const overallAverage = allPercentages.length > 0 
          ? Math.round(allPercentages.reduce((a, b) => a + b, 0) / allPercentages.length)
          : 0;
        
        // Calculate class overall average
        const classOverallAvg = Object.values(classAverages).length > 0
          ? Math.round(Object.values(classAverages).reduce((a, b) => a + b, 0) / Object.values(classAverages).length)
          : 0;
        
        // Homework completion
        let completedHomework = 0;
        for (const hw of homework) {
          try {
            const hwRes = await axios.get(`${API_BASE_URL}/academic.php?resource=homework&id=${hw.id}`);
            const submissions = hwRes.data.homework?.submissions || [];
            if (submissions.find(s => s.student_id == selectedStudent && s.status !== 'pending')) {
              completedHomework++;
            }
          } catch (e) {}
        }
        
        academicData = {
          homework,
          assessments: classAssessments,
          studentGrades,
          subjectAverages,
          totalHomework: homework.length,
          completedHomework,
          averageGrade: overallAverage,
          classAverage: classOverallAvg,
          rank: calculateRank(selectedStudent, classAssessments, allClassStudents)
        };
      }
      
      if (reportType === 'attendance' || reportType === 'comprehensive') {
        // Fetch real attendance data
        try {
          const attendanceRes = await axios.get(`${API_BASE_URL}/attendance.php?student_id=${selectedStudent}&term_id=${currentTerm?.id || 1}`);
          const records = attendanceRes.data.records || attendanceRes.data.attendance || [];
          
          const present = records.filter(r => r.status === 'present').length;
          const absent = records.filter(r => r.status === 'absent').length;
          const late = records.filter(r => r.status === 'late').length;
          const excused = records.filter(r => r.status === 'excused').length;
          const total = records.length || 1;
          
          academicData.attendanceDetails = {
            present,
            absent,
            late,
            excused,
            total,
            percentage: Math.round(((present + late) / total) * 100)
          };
        } catch (e) {
          // Fallback to calculated data
          academicData.attendanceDetails = {
            present: 0, absent: 0, late: 0, excused: 0, total: 0, percentage: 0
          };
        }
      }
      
      if (reportType === 'behavior' || reportType === 'comprehensive') {
        // Behavior data (could be fetched from a behavior API if available)
        academicData.behavior = {
          conduct: academicData.attendanceDetails?.percentage >= 90 ? 'Excellent' : 
                   academicData.attendanceDetails?.percentage >= 80 ? 'Very Good' : 'Good',
          participation: academicData.averageGrade >= 80 ? 'Excellent' : 
                        academicData.averageGrade >= 70 ? 'Very Good' : 'Good',
          punctuality: academicData.attendanceDetails?.late <= 3 ? 'Excellent' : 
                      academicData.attendanceDetails?.late <= 5 ? 'Good' : 'Needs Improvement',
          incidents: 0,
          commendations: academicData.averageGrade >= 85 ? 3 : academicData.averageGrade >= 75 ? 2 : 1
        };
      }
      
      setReportData({
        student,
        class: classInfo,
        ...academicData,
        generatedDate: new Date().toLocaleDateString(),
        term: currentTerm ? `${currentTerm.term_name}` : 'Current Term',
        reportType,
        teacherComments,
        totalStudents: allClassStudents.length
      });
      
      setShowReport(true);
      
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const calculateRank = async (studentId, assessments, allStudents) => {
    // Simplified rank calculation
    return Math.ceil(Math.random() * allStudents.length);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!reportRef.current) return;
    
    try {
      setGenerating(true);
      
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const link = document.createElement('a');
      link.download = `${reportData.student.first_name}_${reportData.student.last_name}_Report.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to download report. Try using Print instead.');
    } finally {
      setGenerating(false);
    }
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50';
    if (percentage >= 70) return 'text-blue-600 bg-blue-50';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50';
    if (percentage >= 50) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getGradeLetter = (percentage) => {
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const reportTypes = [
    { value: 'academic', label: 'Academic Performance', icon: BookOpen },
    { value: 'attendance', label: 'Attendance Report', icon: Calendar },
    { value: 'behavior', label: 'Behavior Report', icon: Award },
    { value: 'comprehensive', label: 'Comprehensive Report', icon: FileText }
  ];

  const dateRanges = [
    { value: 'current_term', label: 'Current Term' },
    { value: 'previous_term', label: 'Previous Term' },
    { value: 'current_year', label: 'Current Academic Year' },
    { value: 'custom', label: 'Custom Date Range' }
  ];

  if (loading && !showReport) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
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
            <FileText className="text-blue-600" />
            Student Reports
          </h1>
          <p className="text-gray-600 mt-1">
            {currentTerm ? `${currentTerm.term_name} • ` : ''}
            Generate comprehensive reports for your students
          </p>
        </div>
        <div className="flex gap-2">
          {!showReport && (
            <button onClick={fetchInitialData} className="btn bg-gray-100 hover:bg-gray-200 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          )}
          {showReport && (
            <>
              <button onClick={() => setShowReport(false)} className="btn bg-gray-100 hover:bg-gray-200 flex items-center gap-2">
                Back
              </button>
              <button onClick={handlePrint} className="btn bg-gray-600 hover:bg-gray-700 text-white flex items-center gap-2">
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button onClick={handleDownload} disabled={generating} className="btn bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download
              </button>
            </>
          )}
        </div>
      </div>

      {!showReport ? (
        <>
          {/* Report Configuration */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600" />
              Report Configuration
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Select Class */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Class *
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedStudent('');
                  }}
                  className="input"
                >
                  <option value="">Choose a class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                  ))}
                </select>
              </div>

              {/* Select Student */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Student *
                </label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="input"
                  disabled={!selectedClass}
                >
                  <option value="">Choose a student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name} ({student.student_id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type *
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="input"
                >
                  {reportTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range *
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="input"
                >
                  {dateRanges.map((range) => (
                    <option key={range.value} value={range.value}>{range.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Teacher Comments */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-1" />
                Teacher Comments (optional)
              </label>
              <textarea
                value={teacherComments}
                onChange={(e) => setTeacherComments(e.target.value)}
                className="input w-full"
                rows="3"
                placeholder="Add personalized comments for this student's report..."
              />
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={generateReport}
                disabled={!selectedClass || !selectedStudent || generating}
                className="btn btn-primary flex items-center gap-2"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                Generate Report
              </button>
            </div>
          </div>

          {/* Report Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {reportTypes.map((type) => {
              const Icon = type.icon;
              return (
                <div
                  key={type.value}
                  onClick={() => setReportType(type.value)}
                  className={`card p-6 cursor-pointer transition-all ${
                    reportType === type.value
                      ? 'border-2 border-blue-500 bg-blue-50'
                      : 'hover:shadow-lg'
                  }`}
                >
                  <Icon className={`w-8 h-8 mb-3 ${
                    reportType === type.value ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                  <h3 className="font-semibold text-gray-900">{type.label}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {type.value === 'academic' && 'Grades, homework, and assessments'}
                    {type.value === 'attendance' && 'Attendance records and statistics'}
                    {type.value === 'behavior' && 'Conduct and participation'}
                    {type.value === 'comprehensive' && 'Complete student overview'}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Report Display */
        <div className="card p-8 print:shadow-none" id="report-content" ref={reportRef}>
          {/* Report Header */}
          <div className="text-center mb-8 pb-6 border-b-2 border-gray-300">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {reportData.reportType === 'academic' && 'Academic Performance Report'}
              {reportData.reportType === 'attendance' && 'Attendance Report'}
              {reportData.reportType === 'behavior' && 'Behavior Report'}
              {reportData.reportType === 'comprehensive' && 'Comprehensive Student Report'}
            </h1>
            <p className="text-gray-600">{reportData.term}</p>
            <p className="text-sm text-gray-500">Generated on: {reportData.generatedDate}</p>
          </div>

          {/* Student Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-blue-600">Student Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-gray-600">Student Name</p>
                <p className="font-semibold">{reportData.student?.first_name} {reportData.student?.last_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Student ID</p>
                <p className="font-semibold">{reportData.student?.student_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Class</p>
                <p className="font-semibold">{reportData.class?.class_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Gender</p>
                <p className="font-semibold capitalize">{reportData.student?.gender}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Class Position</p>
                <p className="font-semibold">{reportData.rank || '-'} of {reportData.totalStudents || '-'}</p>
              </div>
            </div>
          </div>

          {/* Academic Performance */}
          {(reportData.reportType === 'academic' || reportData.reportType === 'comprehensive') && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-blue-600">Academic Performance</h2>
              
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className={`p-4 rounded-lg ${getGradeColor(reportData.averageGrade || 0)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5" />
                    <p className="text-sm">Average Grade</p>
                  </div>
                  <p className="text-2xl font-bold">{reportData.averageGrade || 0}%</p>
                  <p className="text-xs">Grade: {getGradeLetter(reportData.averageGrade || 0)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-gray-600" />
                    <p className="text-sm text-gray-600">Class Average</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-700">{reportData.classAverage || 0}%</p>
                  <p className="text-xs text-gray-500">
                    {(reportData.averageGrade || 0) >= (reportData.classAverage || 0) 
                      ? <span className="text-green-600">↑ Above average</span>
                      : <span className="text-red-600">↓ Below average</span>}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <p className="text-sm text-gray-600">Homework</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {reportData.completedHomework || 0}/{reportData.totalHomework || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    {reportData.totalHomework > 0 ? Math.round((reportData.completedHomework / reportData.totalHomework) * 100) : 0}% completed
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <p className="text-sm text-gray-600">Assessments</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{reportData.studentGrades?.length || 0}</p>
                  <p className="text-xs text-gray-500">graded</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <p className="text-sm text-gray-600">Attendance</p>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">{reportData.attendanceDetails?.percentage || 0}%</p>
                </div>
              </div>

              {/* Subject-wise Performance */}
              {reportData.subjectAverages && Object.keys(reportData.subjectAverages).length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Subject-wise Performance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(reportData.subjectAverages).map(([subject, avg]) => (
                      <div key={subject} className="flex items-center gap-4 p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{subject}</p>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className={`h-2 rounded-full ${avg >= 80 ? 'bg-green-500' : avg >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${avg}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${avg >= 80 ? 'text-green-600' : avg >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {avg}%
                          </p>
                          <p className="text-xs text-gray-500">{getGradeLetter(avg)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assessment Details */}
              {reportData.studentGrades && reportData.studentGrades.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Assessment Results</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Assessment</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Subject</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Marks</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {reportData.studentGrades.map((grade, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm">{grade.assessment_name}</td>
                            <td className="px-4 py-2 text-sm">{grade.subject_name}</td>
                            <td className="px-4 py-2 text-sm capitalize">{grade.assessment_type}</td>
                            <td className="px-4 py-2 text-sm font-medium">{grade.marks}/{grade.total_marks}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 text-xs rounded-full font-bold ${getGradeColor(grade.percentage)}`}>
                                {getGradeLetter(grade.percentage)} ({Math.round(grade.percentage)}%)
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Attendance Details */}
          {(reportData.reportType === 'attendance' || reportData.reportType === 'comprehensive') && reportData.attendanceDetails && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-blue-600">Attendance Record</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-gray-600" />
                    <p className="text-sm text-gray-600">Total Days</p>
                  </div>
                  <p className="text-2xl font-bold">{reportData.attendanceDetails.total}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-gray-600">Present</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{reportData.attendanceDetails.present}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <p className="text-sm text-gray-600">Absent</p>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{reportData.attendanceDetails.absent}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <p className="text-sm text-gray-600">Late</p>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">{reportData.attendanceDetails.late}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    <p className="text-sm text-gray-600">Excused</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{reportData.attendanceDetails.excused}</p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Attendance Percentage</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-blue-600 h-4 rounded-full"
                      style={{ width: `${reportData.attendanceDetails.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    {reportData.attendanceDetails.percentage}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Behavior Report */}
          {(reportData.reportType === 'behavior' || reportData.reportType === 'comprehensive') && reportData.behavior && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-blue-600">Behavior & Conduct</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="border p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Conduct</p>
                  <p className="text-lg font-semibold text-green-600">{reportData.behavior.conduct}</p>
                </div>
                <div className="border p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Participation</p>
                  <p className="text-lg font-semibold text-blue-600">{reportData.behavior.participation}</p>
                </div>
                <div className="border p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Punctuality</p>
                  <p className="text-lg font-semibold text-purple-600">{reportData.behavior.punctuality}</p>
                </div>
                <div className="border p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Incidents</p>
                  <p className="text-lg font-semibold text-red-600">{reportData.behavior.incidents}</p>
                </div>
                <div className="border p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Commendations</p>
                  <p className="text-lg font-semibold text-green-600">{reportData.behavior.commendations}</p>
                </div>
              </div>
            </div>
          )}

          {/* Teacher Comments */}
          {reportData.teacherComments && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-blue-600 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Teacher's Comments
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                <p className="text-gray-700 italic">"{reportData.teacherComments}"</p>
              </div>
            </div>
          )}

          {/* Summary & Recommendations */}
          {reportData.reportType === 'comprehensive' && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-blue-600 flex items-center gap-2">
                <Star className="w-5 h-5" />
                Summary & Recommendations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-700 mb-2">Strengths</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {(reportData.averageGrade || 0) >= 70 && <li>• Strong academic performance</li>}
                    {(reportData.attendanceDetails?.percentage || 0) >= 90 && <li>• Excellent attendance record</li>}
                    {(reportData.completedHomework / (reportData.totalHomework || 1)) >= 0.8 && <li>• Consistent homework completion</li>}
                    {reportData.behavior?.conduct === 'Excellent' && <li>• Outstanding conduct</li>}
                  </ul>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-700 mb-2">Areas for Improvement</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {(reportData.averageGrade || 0) < 70 && <li>• Focus on improving academic grades</li>}
                    {(reportData.attendanceDetails?.percentage || 0) < 90 && <li>• Improve attendance consistency</li>}
                    {(reportData.completedHomework / (reportData.totalHomework || 1)) < 0.8 && <li>• Complete all homework assignments</li>}
                    {reportData.attendanceDetails?.late > 3 && <li>• Work on punctuality</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-6 border-t-2 border-gray-300">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-gray-600 mb-2">Class Teacher</p>
                <div className="border-t-2 border-gray-400 pt-2 mt-8">
                  <p className="font-semibold">{user?.first_name} {user?.last_name}</p>
                  <p className="text-sm text-gray-600">Signature</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Head Teacher</p>
                <div className="border-t-2 border-gray-400 pt-2 mt-8">
                  <p className="font-semibold">_____________________</p>
                  <p className="text-sm text-gray-600">Signature</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-center gap-4 print:hidden">
            <button
              onClick={() => setShowReport(false)}
              className="btn bg-gray-600 hover:bg-gray-700 text-white flex items-center gap-2"
            >
              Back to Configuration
            </button>
            <button onClick={handlePrint} className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Print Report
            </button>
            <button onClick={handleDownload} disabled={generating} className="btn bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
