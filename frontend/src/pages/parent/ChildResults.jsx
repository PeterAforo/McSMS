import { useState, useEffect } from 'react';
import { 
  Award, TrendingUp, TrendingDown, BookOpen, User, Calendar,
  BarChart2, Star, Target, Loader2, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function ChildResults() {
  const { user } = useAuthStore();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [results, setResults] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('academics'); // academics, activities
  const [selectedTerm, setSelectedTerm] = useState('');
  const [terms, setTerms] = useState([]);
  const [expandedSubject, setExpandedSubject] = useState(null);

  useEffect(() => {
    fetchChildren();
    fetchTerms();
  }, [user?.id]);

  useEffect(() => {
    if (selectedChild && selectedTerm) {
      fetchResults(selectedChild.id, selectedTerm);
      fetchActivities(selectedChild.id);
    }
  }, [selectedChild, selectedTerm]);

  const fetchChildren = async () => {
    try {
      // Use parent_portal API which handles user_id to parent_id conversion
      const response = await axios.get(`${API_BASE_URL}/parent_portal.php?resource=children&parent_id=${user?.id}`);
      const childrenData = response.data.children || [];
      const mappedChildren = childrenData.map(c => ({
        id: c.child_id || c.student_id,
        student_id: c.student_id,
        first_name: c.full_name?.split(' ')[0] || '',
        last_name: c.full_name?.split(' ').slice(1).join(' ') || '',
        full_name: c.full_name,
        class_name: c.class_name,
        class_id: c.class_id
      }));
      setChildren(mappedChildren);
      if (mappedChildren.length > 0) {
        setSelectedChild(mappedChildren[0]);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    }
  };

  const fetchTerms = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/terms.php`);
      const termsData = response.data.terms || [];
      setTerms(termsData);
      // Find active term (is_active == 1 or status == 'active')
      const currentTerm = termsData.find(t => t.is_active == 1 || t.status === 'active') || termsData[0];
      if (currentTerm) {
        setSelectedTerm(currentTerm.id);
      }
    } catch (error) {
      console.error('Error fetching terms:', error);
      setTerms([]);
    }
  };

  const fetchResults = async (studentId, termId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/grades.php?student_id=${studentId}&term_id=${termId}`);
      setResults(response.data.grades || []);
    } catch (error) {
      console.error('Error fetching results:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async (studentId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/activities.php?student_id=${studentId}`);
      setActivities(response.data.activities || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    }
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return 'text-green-600 bg-green-100';
    if (grade.startsWith('B')) return 'text-blue-600 bg-blue-100';
    if (grade.startsWith('C')) return 'text-yellow-600 bg-yellow-100';
    if (grade.startsWith('D')) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const calculateOverall = () => {
    if (results.length === 0) return { average: 0, grade: '-', position: '-' };
    const total = results.reduce((sum, r) => sum + r.total, 0);
    const average = Math.round(total / results.length);
    let grade = 'F';
    if (average >= 90) grade = 'A+';
    else if (average >= 80) grade = 'A';
    else if (average >= 75) grade = 'B+';
    else if (average >= 70) grade = 'B';
    else if (average >= 65) grade = 'B-';
    else if (average >= 60) grade = 'C+';
    else if (average >= 55) grade = 'C';
    else if (average >= 50) grade = 'D';
    return { average, grade, position: results[0]?.overall_position || '-' };
  };

  const overall = calculateOverall();

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star} 
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-7 h-7 text-blue-600" />
            Child Results & Performance
          </h1>
          <p className="text-gray-600 mt-1">View academic results and activity performance</p>
        </div>
      </div>

      {/* Child & Term Selector */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4">
          {children.length > 1 && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Child</label>
              <select
                value={selectedChild?.id || ''}
                onChange={(e) => setSelectedChild(children.find(c => c.id == e.target.value))}
                className="input"
              >
                {children.map(child => (
                  <option key={child.id} value={child.id}>
                    {child.first_name} {child.last_name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Term</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="input"
            >
              {terms.map(term => (
                <option key={term.id} value={term.id}>
                  {term.term_name || term.name} {(term.is_active == 1 || term.is_current) && '(Current)'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <BarChart2 className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-sm opacity-80">Average Score</p>
          <p className="text-3xl font-bold">{overall.average}%</p>
        </div>
        <div className="card p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <Award className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-sm opacity-80">Overall Grade</p>
          <p className="text-3xl font-bold">{overall.grade}</p>
        </div>
        <div className="card p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <Target className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-sm opacity-80">Class Position</p>
          <p className="text-3xl font-bold">{overall.position}</p>
        </div>
        <div className="card p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <BookOpen className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-sm opacity-80">Subjects</p>
          <p className="text-3xl font-bold">{results.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('academics')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'academics' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-2" />
          Academic Results
        </button>
        <button
          onClick={() => setActiveTab('activities')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'activities' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <Star className="w-4 h-4 inline mr-2" />
          Activities & Skills
        </button>
      </div>

      {/* Content */}
      {activeTab === 'academics' ? (
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            </div>
          ) : results.length === 0 ? (
            <div className="p-12 text-center">
              <Award className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No results available</h3>
              <p className="text-gray-500 mt-1">Results for this term have not been published yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {results.map((result) => (
                <div key={result.id}>
                  <div 
                    onClick={() => setExpandedSubject(expandedSubject === result.id ? null : result.id)}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getGradeColor(result.grade)}`}>
                          <span className="font-bold text-lg">{result.grade}</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{result.subject}</h3>
                          <p className="text-sm text-gray-500">Position: {result.position} | Class Avg: {result.class_average}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">{result.total}%</p>
                          <p className="text-xs text-gray-500">CA: {result.class_score} | Exam: {result.exam_score}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {result.total > result.class_average ? (
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-600" />
                          )}
                          {expandedSubject === result.id ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {expandedSubject === result.id && (
                    <div className="px-4 pb-4 bg-gray-50">
                      <div className="p-4 bg-white rounded-lg border">
                        {result.assessments && result.assessments.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Assessment Breakdown</h4>
                            <div className="grid grid-cols-3 gap-2">
                              {result.assessments.map((a, i) => (
                                <div key={i} className="bg-gray-50 p-2 rounded text-center">
                                  <p className="text-xs text-gray-500">{a.name}</p>
                                  <p className="font-medium">{a.score}/{a.max}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {result.remarks && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Teacher's Remarks</h4>
                            <p className="text-sm text-gray-600 italic">"{result.remarks}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          {activities.length === 0 ? (
            <div className="p-12 text-center">
              <Star className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No activities recorded</h3>
              <p className="text-gray-500 mt-1">Activity performance will appear here</p>
            </div>
          ) : (
            <div className="divide-y">
              {activities.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{activity.name}</h3>
                      <p className="text-sm text-gray-500">{activity.category}</p>
                    </div>
                    <div className="text-right">
                      {renderStars(activity.rating)}
                      <p className="text-sm text-gray-500 mt-1">{activity.remarks}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
