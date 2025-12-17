import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Award, TrendingUp, TrendingDown, BarChart3,
  Loader2, BookOpen, Calendar, Filter
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function ChildGrades() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [child, setChild] = useState(null);
  const [grades, setGrades] = useState([]);
  const [subjectAverages, setSubjectAverages] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('');
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
      fetchGrades();
    }
  }, [child, selectedTerm]);

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

  const fetchGrades = async () => {
    try {
      let url = `${API_BASE_URL}/parent_portal.php?resource=grades&student_id=${child.student_id}`;
      if (selectedTerm) {
        url += `&term=${selectedTerm}`;
      }
      const response = await axios.get(url);
      if (response.data.success) {
        setGrades(response.data.grades || []);
        setSubjectAverages(response.data.subject_averages || []);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50';
    if (percentage >= 60) return 'text-blue-600 bg-blue-50';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getGradeLetter = (percentage) => {
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const overallAverage = subjectAverages.length > 0
    ? Math.round(subjectAverages.reduce((sum, s) => sum + s.average, 0) / subjectAverages.length)
    : 0;

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
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Grades & Results</h1>
          <p className="text-gray-600">{child?.full_name} • {child?.class_name}</p>
        </div>
        <select
          value={selectedTerm}
          onChange={(e) => setSelectedTerm(e.target.value)}
          className="input"
        >
          <option value="">All Terms</option>
          <option value="Term 1">Term 1</option>
          <option value="Term 2">Term 2</option>
          <option value="Term 3">Term 3</option>
        </select>
      </div>

      {/* Overall Performance */}
      <div className="card p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 mb-1">Overall Average</p>
            <div className="text-5xl font-bold">{overallAverage}%</div>
            <p className="text-blue-100 mt-2">Grade: {getGradeLetter(overallAverage)}</p>
          </div>
          <div className="text-right">
            <Award className="w-16 h-16 text-white/30" />
            <p className="text-sm text-blue-100 mt-2">{subjectAverages.length} subjects</p>
          </div>
        </div>
      </div>

      {/* Subject Averages */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Subject Performance
        </h3>
        
        {subjectAverages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No grades recorded yet
          </div>
        ) : (
          <div className="space-y-4">
            {subjectAverages.map((subject, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium text-gray-700 truncate">
                  {subject.subject}
                </div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        subject.average >= 80 ? 'bg-green-500' :
                        subject.average >= 60 ? 'bg-blue-500' :
                        subject.average >= 50 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${subject.average}%` }}
                    />
                  </div>
                </div>
                <div className={`w-16 text-center font-bold rounded-lg py-1 ${getGradeColor(subject.average)}`}>
                  {subject.average}%
                </div>
                <div className="w-8 text-center font-bold text-gray-600">
                  {getGradeLetter(subject.average)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Assessments */}
      <div className="card">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-600" />
            Assessment Results
          </h3>
          <span className="text-sm text-gray-500">{grades.length} assessments</span>
        </div>
        
        {grades.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No assessment results yet
          </div>
        ) : (
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {grades.map((grade) => {
              const percentage = grade.max_score > 0 
                ? Math.round((grade.score / grade.max_score) * 100) 
                : 0;
              
              return (
                <div key={grade.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{grade.assessment_title}</p>
                      <p className="text-sm text-gray-600">{grade.subject_name || 'General'}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(grade.assessment_date).toLocaleDateString()}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 rounded">
                          {grade.assessment_type}
                        </span>
                        {grade.teacher_name && (
                          <span>By: {grade.teacher_name}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        percentage >= 80 ? 'text-green-600' :
                        percentage >= 60 ? 'text-blue-600' :
                        percentage >= 50 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {grade.score}/{grade.max_score}
                      </div>
                      <div className={`text-sm px-2 py-0.5 rounded-full inline-block mt-1 ${getGradeColor(percentage)}`}>
                        {percentage}% • {getGradeLetter(percentage)}
                      </div>
                    </div>
                  </div>
                  {grade.remarks && (
                    <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      💬 {grade.remarks}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
