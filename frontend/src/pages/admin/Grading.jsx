import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit, BookOpen, X, Award, Search, Download, Printer, Trash2,
  BarChart3, TrendingUp, Users, FileText, Settings, ChevronUp, ChevronDown,
  Upload, MessageSquare, Trophy, PieChart, Calendar, Filter, Eye, Copy
} from 'lucide-react';
import { classesAPI, subjectsAPI, termsAPI } from '../../services/api';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export default function Grading() {
  const [assessments, setAssessments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [terms, setTerms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);

  // Enhanced state
  const [viewMode, setViewMode] = useState('assessments'); // assessments, reports, rankings, trends, settings
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [termFilter, setTermFilter] = useState('');
  const [sortField, setSortField] = useState('assessment_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [assessmentStats, setAssessmentStats] = useState(null);
  const [showReportCard, setShowReportCard] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentReport, setStudentReport] = useState(null);
  const [classRankings, setClassRankings] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState([]);
  const fileInputRef = useRef();
  
  // Grading scale configuration
  const [gradingScale, setGradingScale] = useState([
    { grade: 'A+', minPercent: 90, maxPercent: 100, gpa: 4.0 },
    { grade: 'A', minPercent: 80, maxPercent: 89, gpa: 3.7 },
    { grade: 'B+', minPercent: 75, maxPercent: 79, gpa: 3.3 },
    { grade: 'B', minPercent: 70, maxPercent: 74, gpa: 3.0 },
    { grade: 'C+', minPercent: 65, maxPercent: 69, gpa: 2.7 },
    { grade: 'C', minPercent: 60, maxPercent: 64, gpa: 2.3 },
    { grade: 'D', minPercent: 50, maxPercent: 59, gpa: 1.0 },
    { grade: 'F', minPercent: 0, maxPercent: 49, gpa: 0.0 },
  ]);

  const [assessmentForm, setAssessmentForm] = useState({
    class_id: '',
    subject_id: '',
    term_id: '',
    assessment_name: '',
    assessment_type: 'test',
    total_marks: 100,
    weight_percentage: 100,
    assessment_date: new Date().toISOString().split('T')[0],
    description: '',
    status: 'draft'
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (viewMode === 'rankings' && classFilter) {
      fetchClassRankings();
    }
  }, [viewMode, classFilter, termFilter]);

  const fetchData = async () => {
    try {
      const [assessmentsRes, classesRes, subjectsRes, termsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/academic.php?resource=assessments`),
        classesAPI.getAll(),
        subjectsAPI.getAll(),
        termsAPI.getAll()
      ]);
      setAssessments(assessmentsRes.data.assessments || []);
      setClasses(classesRes.data.classes || []);
      setSubjects(subjectsRes.data.subjects || []);
      setTerms(termsRes.data.terms || []);
      
      // Set active term as default
      const activeTerm = (termsRes.data.terms || []).find(t => t.is_active == 1);
      if (activeTerm) setTermFilter(activeTerm.id);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchClassRankings = async () => {
    if (!classFilter) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/grading.php?action=rankings&class_id=${classFilter}&term_id=${termFilter}`);
      setClassRankings(response.data.rankings || []);
    } catch (error) {
      console.error('Error fetching rankings:', error);
      setClassRankings([]);
    }
  };

  const fetchAssessmentStats = async (assessment) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/grading.php?action=stats&assessment_id=${assessment.id}`);
      setAssessmentStats(response.data.stats);
      setSelectedAssessment(assessment);
      setShowStatsModal(true);
    } catch (error) {
      alert('Error fetching statistics');
    }
  };

  const fetchStudentReport = async (studentId, classId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/grading.php?action=student_report&student_id=${studentId}&class_id=${classId}&term_id=${termFilter}`);
      setStudentReport(response.data.report);
      setSelectedStudent(response.data.student);
      setShowReportCard(true);
    } catch (error) {
      alert('Error fetching report');
    }
  };

  const handleCreateAssessment = async (e) => {
    e.preventDefault();
    try {
      if (editingAssessment) {
        await axios.put(`${API_BASE_URL}/academic.php?resource=assessments&id=${editingAssessment.id}`, assessmentForm);
        alert('Assessment updated successfully!');
      } else {
        await axios.post(`${API_BASE_URL}/academic.php?resource=assessments`, assessmentForm);
        alert('Assessment created successfully!');
      }
      setShowModal(false);
      setEditingAssessment(null);
      fetchData();
      resetForm();
    } catch (error) {
      alert('Error saving assessment');
    }
  };

  const resetForm = () => {
    setAssessmentForm({
      class_id: '',
      subject_id: '',
      term_id: termFilter || '',
      assessment_name: '',
      assessment_type: 'test',
      total_marks: 100,
      weight_percentage: 100,
      assessment_date: new Date().toISOString().split('T')[0],
      description: '',
      status: 'draft'
    });
  };

  const handleEditAssessment = (assessment) => {
    setEditingAssessment(assessment);
    setAssessmentForm({
      class_id: assessment.class_id,
      subject_id: assessment.subject_id,
      term_id: assessment.term_id,
      assessment_name: assessment.assessment_name,
      assessment_type: assessment.assessment_type,
      total_marks: assessment.total_marks,
      weight_percentage: assessment.weight_percentage,
      assessment_date: assessment.assessment_date,
      description: assessment.description || '',
      status: assessment.status || 'draft'
    });
    setShowModal(true);
  };

  const handleDeleteAssessment = async (id) => {
    if (!window.confirm('Delete this assessment? All grades will be lost.')) return;
    try {
      await axios.delete(`${API_BASE_URL}/academic.php?resource=assessments&id=${id}`);
      fetchData();
      alert('Assessment deleted!');
    } catch (error) {
      alert('Error deleting assessment');
    }
  };

  const handleDuplicateAssessment = (assessment) => {
    setEditingAssessment(null);
    setAssessmentForm({
      ...assessment,
      assessment_name: `${assessment.assessment_name} (Copy)`,
      assessment_date: new Date().toISOString().split('T')[0],
      status: 'draft'
    });
    setShowModal(true);
  };

  const handleGradeAssessment = async (assessment) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/academic.php?resource=grades&action=by_assessment&assessment_id=${assessment.id}`);
      const existingGrades = response.data.grades || [];
      
      // Get students in the class
      const studentsRes = await axios.get(`${API_BASE_URL}/students.php?class_id=${assessment.class_id}`);
      const students = studentsRes.data.students || [];
      
      // Initialize grades
      const gradeData = students.map(student => {
        const existing = existingGrades.find(g => g.student_id == student.id);
        return {
          student_id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          student_id_code: student.student_id,
          marks_obtained: existing?.marks_obtained || '',
          grade: existing?.grade || '',
          remarks: existing?.remarks || ''
        };
      });
      
      setGrades(gradeData);
      setSelectedAssessment(assessment);
      setShowGradeModal(true);
    } catch (error) {
      alert('Error loading grades');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (studentId, field, value) => {
    setGrades(prev => prev.map(g => 
      g.student_id === studentId ? { ...g, [field]: value } : g
    ));
  };

  const calculateGrade = (marks, total) => {
    if (!marks || !total) return '';
    const percentage = (marks / total) * 100;
    for (const scale of gradingScale) {
      if (percentage >= scale.minPercent && percentage <= scale.maxPercent) {
        return scale.grade;
      }
    }
    return 'F';
  };

  const getGradeColor = (grade) => {
    if (!grade) return 'bg-gray-100 text-gray-600';
    if (grade.startsWith('A')) return 'bg-green-100 text-green-700';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-700';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-700';
    if (grade.startsWith('D')) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  // Sort handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Export functions
  const handleExportGrades = (format) => {
    if (!selectedAssessment || grades.length === 0) return;
    
    const data = grades.map(g => ({
      'Student ID': g.student_id_code,
      'Name': `${g.first_name} ${g.last_name}`,
      'Marks': g.marks_obtained || '-',
      'Grade': g.grade || calculateGrade(g.marks_obtained, selectedAssessment.total_marks),
      'Remarks': g.remarks || ''
    }));

    if (format === 'csv') {
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(','));
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `grades_${selectedAssessment.assessment_name}.csv`;
      a.click();
    } else if (format === 'print') {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html><head><title>Grades - ${selectedAssessment.assessment_name}</title>
        <style>
          body { font-family: Arial; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #2563eb; color: white; }
          h1 { color: #1f2937; margin-bottom: 5px; }
          .info { color: #666; margin-bottom: 20px; }
          .grade-A { color: green; } .grade-B { color: blue; } .grade-C { color: orange; } .grade-F { color: red; }
        </style></head><body>
        <h1>${selectedAssessment.assessment_name}</h1>
        <p class="info">${selectedAssessment.class_name} - ${selectedAssessment.subject_name} | Total: ${selectedAssessment.total_marks} marks</p>
        <table>
          <thead><tr>${Object.keys(data[0]).map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${data.map(row => `<tr>${Object.entries(row).map(([k, v]) => 
            `<td class="${k === 'Grade' ? 'grade-' + v : ''}">${v}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
        </body></html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Import grades from CSV
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row = {};
        headers.forEach((h, i) => row[h] = values[i]);
        return row;
      });
      
      setImportData(data);
      setShowImportModal(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportGrades = async () => {
    if (!selectedAssessment || importData.length === 0) return;
    
    try {
      // Match import data with students
      const gradesData = importData.map(row => {
        const student = grades.find(g => 
          g.student_id_code === row['Student ID'] || 
          `${g.first_name} ${g.last_name}`.toLowerCase() === (row['Name'] || '').toLowerCase()
        );
        if (student) {
          return {
            student_id: student.student_id,
            marks_obtained: row['Marks'] || row['Score'] || '',
            grade: row['Grade'] || '',
            remarks: row['Remarks'] || row['Comments'] || ''
          };
        }
        return null;
      }).filter(Boolean);

      await axios.post(`${API_BASE_URL}/academic.php?resource=grades&action=bulk`, {
        assessment_id: selectedAssessment.id,
        grades: gradesData,
        graded_by: 1
      });

      setShowImportModal(false);
      setImportData([]);
      handleGradeAssessment(selectedAssessment);
      alert('Grades imported successfully!');
    } catch (error) {
      alert('Error importing grades');
    }
  };

  // Print report card
  const printReportCard = () => {
    if (!selectedStudent || !studentReport) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Report Card - ${selectedStudent.first_name} ${selectedStudent.last_name}</title>
      <style>
        body { font-family: Arial; padding: 30px; max-width: 800px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
        .student-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #f5f5f5; }
        .grade-A { color: green; font-weight: bold; }
        .grade-B { color: blue; }
        .grade-C { color: orange; }
        .grade-F { color: red; }
        .summary { background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 20px; }
        .footer { margin-top: 40px; display: flex; justify-content: space-between; }
        .signature { border-top: 1px solid #333; padding-top: 5px; width: 200px; text-align: center; }
      </style></head><body>
      <div class="header">
        <h1>Student Report Card</h1>
        <p>Academic Term Report</p>
      </div>
      <div class="student-info">
        <div><strong>Student:</strong> ${selectedStudent.first_name} ${selectedStudent.last_name}</div>
        <div><strong>ID:</strong> ${selectedStudent.student_id}</div>
        <div><strong>Class:</strong> ${selectedStudent.class_name || ''}</div>
      </div>
      <table>
        <thead><tr><th>Subject</th><th>Assessment</th><th>Marks</th><th>Grade</th><th>Remarks</th></tr></thead>
        <tbody>
          ${(studentReport.grades || []).map(g => `
            <tr>
              <td>${g.subject_name}</td>
              <td>${g.assessment_name}</td>
              <td>${g.marks_obtained}/${g.total_marks}</td>
              <td class="grade-${g.grade?.charAt(0)}">${g.grade}</td>
              <td>${g.remarks || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="summary">
        <strong>Overall Performance:</strong> Average: ${studentReport.average?.toFixed(1) || 0}% | 
        GPA: ${studentReport.gpa?.toFixed(2) || 0}
      </div>
      <div class="footer">
        <div class="signature">Class Teacher</div>
        <div class="signature">Principal</div>
        <div class="signature">Parent/Guardian</div>
      </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Filter and sort assessments
  const filteredAssessments = assessments
    .filter(a => {
      const matchesSearch = !searchTerm || 
        a.assessment_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = !classFilter || a.class_id == classFilter;
      const matchesSubject = !subjectFilter || a.subject_id == subjectFilter;
      const matchesType = !typeFilter || a.assessment_type === typeFilter;
      const matchesTerm = !termFilter || a.term_id == termFilter;
      return matchesSearch && matchesClass && matchesSubject && matchesType && matchesTerm;
    })
    .sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      if (sortField === 'assessment_date') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      return sortDirection === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

  const viewTabs = [
    { id: 'assessments', label: 'Assessments', icon: BookOpen },
    { id: 'rankings', label: 'Class Rankings', icon: Trophy },
    { id: 'reports', label: 'Report Cards', icon: FileText },
    { id: 'settings', label: 'Grading Scale', icon: Settings },
  ];

  const assessmentTypes = ['quiz', 'test', 'exam', 'assignment', 'project', 'midterm', 'final'];

  const handleSaveGrades = async () => {
    try {
      setLoading(true);
      const gradesData = grades.map(g => ({
        student_id: g.student_id,
        marks_obtained: g.marks_obtained,
        grade: g.grade || calculateGrade(g.marks_obtained, selectedAssessment.total_marks),
        remarks: g.remarks || ''
      }));

      await axios.post(`${API_BASE_URL}/academic.php?resource=grades&action=bulk`, {
        assessment_id: selectedAssessment.id,
        grades: gradesData,
        graded_by: 1
      });

      setShowGradeModal(false);
      alert('Grades saved successfully!');
    } catch (error) {
      alert('Error saving grades');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grading & Assessments</h1>
          <p className="text-gray-600 mt-1">Create assessments, record grades, and generate reports</p>
        </div>
        <button onClick={() => { resetForm(); setEditingAssessment(null); setShowModal(true); }} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" /> Create Assessment
        </button>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {viewTabs.map(tab => (
          <button key={tab.id} onClick={() => setViewMode(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              viewMode === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      {viewMode === 'assessments' && (
        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search assessments..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input pl-10 w-full" />
            </div>
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="input w-auto">
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
            </select>
            <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="input w-auto">
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input w-auto">
              <option value="">All Types</option>
              {assessmentTypes.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
            <select value={termFilter} onChange={(e) => setTermFilter(e.target.value)} className="input w-auto">
              <option value="">All Terms</option>
              {terms.map(t => <option key={t.id} value={t.id}>{t.term_name}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Assessments View */}
      {viewMode === 'assessments' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('assessment_name')}>
                    Assessment {sortField === 'assessment_name' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('assessment_date')}>
                    Date {sortField === 'assessment_date' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredAssessments.length === 0 ? (
                  <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">No assessments found</td></tr>
                ) : filteredAssessments.map((assessment) => (
                  <tr key={assessment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{assessment.assessment_name}</td>
                    <td className="px-4 py-3 text-sm">{assessment.class_name}</td>
                    <td className="px-4 py-3 text-sm">{assessment.subject_name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 capitalize">{assessment.assessment_type}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{assessment.total_marks}</td>
                    <td className="px-4 py-3 text-sm">{new Date(assessment.assessment_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleGradeAssessment(assessment)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Grade"><Award className="w-4 h-4" /></button>
                        <button onClick={() => fetchAssessmentStats(assessment)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded" title="Statistics"><BarChart3 className="w-4 h-4" /></button>
                        <button onClick={() => handleEditAssessment(assessment)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Edit"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDuplicateAssessment(assessment)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Duplicate"><Copy className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteAssessment(assessment.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rankings View */}
      {viewMode === 'rankings' && (
        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center gap-4">
              <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="input w-auto">
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
              </select>
              <select value={termFilter} onChange={(e) => setTermFilter(e.target.value)} className="input w-auto">
                <option value="">All Terms</option>
                {terms.map(t => <option key={t.id} value={t.id}>{t.term_name}</option>)}
              </select>
            </div>
          </div>
          {classFilter && (
            <div className="card overflow-hidden">
              <div className="p-4 border-b bg-gray-50"><h3 className="font-semibold flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> Class Rankings</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Average %</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">GPA</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assessments</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {classRankings.length === 0 ? (
                      <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">No ranking data available</td></tr>
                    ) : classRankings.map((student, idx) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-200 text-gray-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                          }`}>{idx + 1}</span>
                        </td>
                        <td className="px-4 py-3 font-medium">{student.first_name} {student.last_name}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div className={`h-2 rounded-full ${student.average >= 80 ? 'bg-green-500' : student.average >= 60 ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: `${student.average}%` }} />
                            </div>
                            <span className="font-medium">{student.average?.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold">{student.gpa?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{student.total_assessments}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => fetchStudentReport(student.id, classFilter)} className="text-blue-600 hover:underline text-sm">View Report</button>
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

      {/* Reports View */}
      {viewMode === 'reports' && (
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Generate Report Card</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="input">
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
            </select>
            <select value={termFilter} onChange={(e) => setTermFilter(e.target.value)} className="input">
              <option value="">Select Term</option>
              {terms.map(t => <option key={t.id} value={t.id}>{t.term_name}</option>)}
            </select>
          </div>
          {classFilter && classRankings.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-4">Select a student to generate their report card:</p>
              {classRankings.map(student => (
                <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <span className="font-medium">{student.first_name} {student.last_name}</span>
                  <button onClick={() => fetchStudentReport(student.id, classFilter)} className="btn btn-primary text-sm">
                    <FileText className="w-4 h-4 mr-1" /> Generate Report
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grading Scale Settings */}
      {viewMode === 'settings' && (
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Grading Scale Configuration</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm">Grade</th>
                  <th className="px-4 py-2 text-left text-sm">Min %</th>
                  <th className="px-4 py-2 text-left text-sm">Max %</th>
                  <th className="px-4 py-2 text-left text-sm">GPA</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {gradingScale.map((scale, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(scale.grade)}`}>{scale.grade}</span>
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" value={scale.minPercent} onChange={(e) => {
                        const newScale = [...gradingScale];
                        newScale[idx].minPercent = parseInt(e.target.value);
                        setGradingScale(newScale);
                      }} className="input w-20" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" value={scale.maxPercent} onChange={(e) => {
                        const newScale = [...gradingScale];
                        newScale[idx].maxPercent = parseInt(e.target.value);
                        setGradingScale(newScale);
                      }} className="input w-20" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" step="0.1" value={scale.gpa} onChange={(e) => {
                        const newScale = [...gradingScale];
                        newScale[idx].gpa = parseFloat(e.target.value);
                        setGradingScale(newScale);
                      }} className="input w-20" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Assessment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">{editingAssessment ? 'Edit Assessment' : 'Create Assessment'}</h2>
              <button onClick={() => { setShowModal(false); setEditingAssessment(null); }}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleCreateAssessment} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Class *</label>
                  <select required value={assessmentForm.class_id} onChange={(e) => setAssessmentForm({...assessmentForm, class_id: e.target.value})} className="input">
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Subject *</label>
                  <select required value={assessmentForm.subject_id} onChange={(e) => setAssessmentForm({...assessmentForm, subject_id: e.target.value})} className="input">
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Term</label>
                  <select value={assessmentForm.term_id} onChange={(e) => setAssessmentForm({...assessmentForm, term_id: e.target.value})} className="input">
                    <option value="">Select Term</option>
                    {terms.map(t => <option key={t.id} value={t.id}>{t.term_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Type *</label>
                  <select value={assessmentForm.assessment_type} onChange={(e) => setAssessmentForm({...assessmentForm, assessment_type: e.target.value})} className="input">
                    {assessmentTypes.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Assessment Name *</label>
                  <input type="text" required value={assessmentForm.assessment_name} onChange={(e) => setAssessmentForm({...assessmentForm, assessment_name: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Total Marks *</label>
                  <input type="number" required value={assessmentForm.total_marks} onChange={(e) => setAssessmentForm({...assessmentForm, total_marks: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Weight %</label>
                  <input type="number" value={assessmentForm.weight_percentage} onChange={(e) => setAssessmentForm({...assessmentForm, weight_percentage: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date *</label>
                  <input type="date" required value={assessmentForm.assessment_date} onChange={(e) => setAssessmentForm({...assessmentForm, assessment_date: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select value={assessmentForm.status} onChange={(e) => setAssessmentForm({...assessmentForm, status: e.target.value})} className="input">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="graded">Graded</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea value={assessmentForm.description} onChange={(e) => setAssessmentForm({...assessmentForm, description: e.target.value})} className="input" rows="2" />
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t">
                <button type="button" onClick={() => { setShowModal(false); setEditingAssessment(null); }} className="btn bg-gray-200">Cancel</button>
                <button type="submit" className="btn btn-primary">{editingAssessment ? 'Update' : 'Create'} Assessment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {showGradeModal && selectedAssessment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between bg-white">
              <div>
                <h2 className="text-xl font-semibold">{selectedAssessment.assessment_name}</h2>
                <p className="text-sm text-gray-600">{selectedAssessment.class_name} - {selectedAssessment.subject_name} | Total: {selectedAssessment.total_marks} marks</p>
              </div>
              <div className="flex items-center gap-2">
                <input type="file" ref={fileInputRef} accept=".csv" onChange={handleFileSelect} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"><Upload className="w-4 h-4 mr-1" /> Import</button>
                <button onClick={() => handleExportGrades('csv')} className="btn bg-green-600 text-white hover:bg-green-700 text-sm"><Download className="w-4 h-4 mr-1" /> Export</button>
                <button onClick={() => handleExportGrades('print')} className="btn bg-gray-600 text-white hover:bg-gray-700 text-sm"><Printer className="w-4 h-4" /></button>
                <button onClick={() => setShowGradeModal(false)}><X className="w-6 h-6" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm">Student</th>
                    <th className="px-4 py-2 text-left text-sm">ID</th>
                    <th className="px-4 py-2 text-left text-sm">Marks</th>
                    <th className="px-4 py-2 text-left text-sm">Grade</th>
                    <th className="px-4 py-2 text-left text-sm">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {grades.map((grade) => (
                    <tr key={grade.student_id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{grade.first_name} {grade.last_name}</td>
                      <td className="px-4 py-2 font-mono text-sm text-gray-600">{grade.student_id_code}</td>
                      <td className="px-4 py-2">
                        <input type="number" step="0.01" max={selectedAssessment.total_marks} value={grade.marks_obtained}
                          onChange={(e) => handleGradeChange(grade.student_id, 'marks_obtained', e.target.value)} className="input w-20" />
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(grade.grade || calculateGrade(grade.marks_obtained, selectedAssessment.total_marks))}`}>
                          {grade.grade || calculateGrade(grade.marks_obtained, selectedAssessment.total_marks) || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <input type="text" placeholder="Add remarks..." value={grade.remarks || ''}
                          onChange={(e) => handleGradeChange(grade.student_id, 'remarks', e.target.value)} className="input w-full text-sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t bg-white flex justify-end gap-4">
              <button onClick={() => setShowGradeModal(false)} className="btn bg-gray-200">Cancel</button>
              <button onClick={handleSaveGrades} disabled={loading} className="btn btn-primary">{loading ? 'Saving...' : 'Save Grades'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Modal */}
      {showStatsModal && assessmentStats && selectedAssessment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Assessment Statistics</h2>
              <button onClick={() => setShowStatsModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <p className="text-gray-600 mb-4">{selectedAssessment.assessment_name}</p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-700">{parseFloat(assessmentStats.average || 0).toFixed(1)}</p>
                <p className="text-sm text-blue-600">Class Average</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-700">{assessmentStats.highest || 0}</p>
                <p className="text-sm text-green-600">Highest Score</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-700">{assessmentStats.lowest || 0}</p>
                <p className="text-sm text-red-600">Lowest Score</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-700">{assessmentStats.graded || 0}/{assessmentStats.total || 0}</p>
                <p className="text-sm text-purple-600">Students Graded</p>
              </div>
            </div>
            {assessmentStats.distribution && (
              <div>
                <h3 className="font-medium mb-2">Grade Distribution</h3>
                <div className="space-y-2">
                  {Object.entries(assessmentStats.distribution).map(([grade, count]) => (
                    <div key={grade} className="flex items-center gap-2">
                      <span className={`w-10 text-center px-2 py-1 rounded text-xs font-medium ${getGradeColor(grade)}`}>{grade}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-4">
                        <div className="bg-blue-500 h-4 rounded-full" style={{ width: `${(count / (assessmentStats.graded || 1)) * 100}%` }} />
                      </div>
                      <span className="text-sm text-gray-600 w-8">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report Card Modal */}
      {showReportCard && selectedStudent && studentReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Report Card</h2>
                <p className="text-gray-600">{selectedStudent.first_name} {selectedStudent.last_name}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={printReportCard} className="btn bg-gray-600 text-white hover:bg-gray-700"><Printer className="w-4 h-4 mr-1" /> Print</button>
                <button onClick={() => setShowReportCard(false)}><X className="w-6 h-6" /></button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-700">{studentReport.average?.toFixed(1) || 0}%</p>
                  <p className="text-sm text-blue-600">Average</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-700">{studentReport.gpa?.toFixed(2) || 0}</p>
                  <p className="text-sm text-green-600">GPA</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-700">#{studentReport.rank || '-'}</p>
                  <p className="text-sm text-purple-600">Class Rank</p>
                </div>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm">Subject</th>
                    <th className="px-4 py-2 text-left text-sm">Assessment</th>
                    <th className="px-4 py-2 text-left text-sm">Marks</th>
                    <th className="px-4 py-2 text-left text-sm">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(studentReport.grades || []).map((g, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2">{g.subject_name}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{g.assessment_name}</td>
                      <td className="px-4 py-2">{g.marks_obtained}/{g.total_marks}</td>
                      <td className="px-4 py-2"><span className={`px-2 py-1 rounded text-xs font-medium ${getGradeColor(g.grade)}`}>{g.grade}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Import Grades from CSV</h2>
              <button onClick={() => { setShowImportModal(false); setImportData([]); }}><X className="w-6 h-6" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Found {importData.length} records. Review and confirm import:</p>
            <div className="max-h-60 overflow-y-auto border rounded-lg mb-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>{Object.keys(importData[0] || {}).map(h => <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y">
                  {importData.slice(0, 10).map((row, idx) => (
                    <tr key={idx}>{Object.values(row).map((v, i) => <td key={i} className="px-3 py-2">{v}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-4">
              <button onClick={() => { setShowImportModal(false); setImportData([]); }} className="btn bg-gray-200">Cancel</button>
              <button onClick={handleImportGrades} className="btn btn-primary">Import {importData.length} Grades</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
