import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import { Award, TrendingUp, BookOpen, Calendar, ChevronDown } from 'lucide-react';

export default function StudentGrades() {
  const { user } = useAuthStore();
  const [grades, setGrades] = useState([]);
  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ average: 0, totalSubjects: 0, position: null });

  useEffect(() => {
    fetchTerms();
  }, []);

  useEffect(() => {
    if (selectedTerm && user?.id) fetchGrades();
  }, [selectedTerm, user?.id]);

  const fetchTerms = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/terms.php`);
      const allTerms = response.data.terms || [];
      setTerms(allTerms);
      const activeTerm = allTerms.find(t => t.is_active) || allTerms[0];
      if (activeTerm) setSelectedTerm(activeTerm.id);
    } catch (error) {
      console.error('Error fetching terms:', error);
    }
  };

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const studentId = user.student_id || user.id;
      const response = await axios.get(
        `${API_BASE_URL}/grades.php?student_id=${studentId}&term_id=${selectedTerm}`
      );
      const gradesData = response.data.grades || [];
      setGrades(gradesData);
      
      // Calculate summary
      if (gradesData.length > 0) {
        const total = gradesData.reduce((sum, g) => sum + (parseFloat(g.total) || 0), 0);
        setSummary({
          average: (total / gradesData.length).toFixed(1),
          totalSubjects: gradesData.length,
          position: response.data.position || null
        });
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    if (!grade) return 'text-gray-500';
    if (grade >= 80) return 'text-green-600';
    if (grade >= 60) return 'text-blue-600';
    if (grade >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeLetter = (score) => {
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    if (score >= 40) return 'E';
    return 'F';
  };

  if (loading && !grades.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="text-yellow-600" /> My Grades
          </h1>
          <p className="text-gray-600">View your academic performance</p>
        </div>
        <div className="relative">
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="appearance-none bg-white border rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {terms.map(term => (
              <option key={term.id} value={term.id}>{term.term_name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Score</p>
              <p className={`text-2xl font-bold ${getGradeColor(summary.average)}`}>
                {summary.average}%
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BookOpen className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Subjects</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalSubjects}</p>
            </div>
          </div>
        </div>
        {summary.position && (
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Award className="text-yellow-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Class Position</p>
                <p className="text-2xl font-bold text-gray-900">{summary.position}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grades Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">CA Score</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Exam Score</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {grades.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No grades available for this term
                </td>
              </tr>
            ) : (
              grades.map((grade, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{grade.subject_name}</td>
                  <td className="px-6 py-4 text-center">{grade.ca_score || '-'}</td>
                  <td className="px-6 py-4 text-center">{grade.exam_score || '-'}</td>
                  <td className={`px-6 py-4 text-center font-bold ${getGradeColor(grade.total)}`}>
                    {grade.total || '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      getGradeLetter(grade.total) === 'A' ? 'bg-green-100 text-green-700' :
                      getGradeLetter(grade.total) === 'B' ? 'bg-blue-100 text-blue-700' :
                      getGradeLetter(grade.total) === 'C' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {getGradeLetter(grade.total)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
