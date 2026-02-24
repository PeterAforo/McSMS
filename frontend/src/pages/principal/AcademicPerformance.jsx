import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { Award, TrendingUp, BarChart3, BookOpen, Users, ChevronDown } from 'lucide-react';

export default function AcademicPerformance() {
  const [data, setData] = useState({ classes: [], subjects: [], topStudents: [] });
  const [loading, setLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [terms, setTerms] = useState([]);

  useEffect(() => {
    fetchTerms();
  }, []);

  useEffect(() => {
    if (selectedTerm) fetchPerformanceData();
  }, [selectedTerm]);

  const fetchTerms = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/terms.php`);
      const allTerms = response.data.terms || [];
      setTerms(allTerms);
      const active = allTerms.find(t => t.is_active) || allTerms[0];
      if (active) setSelectedTerm(active.id);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const [classesRes, gradesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/classes.php`),
        axios.get(`${API_BASE_URL}/grades.php?term_id=${selectedTerm}`)
      ]);
      
      const classes = classesRes.data.classes || [];
      const grades = gradesRes.data.grades || [];
      
      // Calculate class averages
      const classPerformance = classes.map(cls => {
        const classGrades = grades.filter(g => g.class_id === cls.id);
        const avg = classGrades.length > 0 
          ? classGrades.reduce((sum, g) => sum + (parseFloat(g.total) || 0), 0) / classGrades.length 
          : 0;
        return { ...cls, average: avg.toFixed(1), studentCount: classGrades.length };
      }).sort((a, b) => b.average - a.average);

      // Get top students
      const studentGrades = {};
      grades.forEach(g => {
        if (!studentGrades[g.student_id]) {
          studentGrades[g.student_id] = { 
            id: g.student_id, 
            name: g.student_name || 'Unknown', 
            class: g.class_name,
            grades: [] 
          };
        }
        studentGrades[g.student_id].grades.push(parseFloat(g.total) || 0);
      });

      const topStudents = Object.values(studentGrades)
        .map(s => ({
          ...s,
          average: (s.grades.reduce((a, b) => a + b, 0) / s.grades.length).toFixed(1)
        }))
        .sort((a, b) => b.average - a.average)
        .slice(0, 10);

      setData({ classes: classPerformance, topStudents });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (avg) => {
    if (avg >= 80) return 'text-green-600 bg-green-100';
    if (avg >= 60) return 'text-blue-600 bg-blue-100';
    if (avg >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="text-indigo-600" /> Academic Performance
          </h1>
          <p className="text-gray-600">School-wide academic analytics</p>
        </div>
        <select
          value={selectedTerm}
          onChange={(e) => setSelectedTerm(e.target.value)}
          className="border rounded-lg px-4 py-2"
        >
          {terms.map(t => (
            <option key={t.id} value={t.id}>{t.term_name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Performance */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={20} /> Class Rankings
          </h2>
          <div className="space-y-3">
            {data.classes.slice(0, 10).map((cls, idx) => (
              <div key={cls.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  idx < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium">{cls.class_name}</p>
                  <p className="text-sm text-gray-500">{cls.studentCount} students</p>
                </div>
                <span className={`px-3 py-1 rounded-full font-bold ${getGradeColor(cls.average)}`}>
                  {cls.average}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Students */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="text-green-600" size={20} /> Top Performers
          </h2>
          <div className="space-y-3">
            {data.topStudents.map((student, idx) => (
              <div key={student.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  idx < 3 ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-gray-500">{student.class}</p>
                </div>
                <span className={`px-3 py-1 rounded-full font-bold ${getGradeColor(student.average)}`}>
                  {student.average}%
                </span>
              </div>
            ))}
            {data.topStudents.length === 0 && (
              <p className="text-center text-gray-500 py-4">No grade data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
