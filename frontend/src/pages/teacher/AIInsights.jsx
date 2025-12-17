import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, 
  Users, BookOpen, Clock, Target, Lightbulb, BarChart3, 
  ArrowRight, RefreshCw, Loader2, ChevronDown, ChevronUp,
  Award, AlertCircle, Zap, Calendar, FileText, MessageSquare,
  ThumbsUp, ThumbsDown, Star, Sparkles, PieChart
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function AIInsights() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedInsight, setExpandedInsight] = useState(null);
  const [teacherData, setTeacherData] = useState(null);
  const [insights, setInsights] = useState({
    performance: [],
    students: [],
    recommendations: [],
    predictions: [],
    alerts: []
  });
  const [stats, setStats] = useState({
    overallScore: 0,
    classAverage: 0,
    attendanceRate: 0,
    homeworkCompletion: 0,
    studentEngagement: 0
  });

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      
      // Fetch teacher data
      const teacherRes = await axios.get(`${API_BASE_URL}/teachers.php?user_id=${user?.id}`);
      const teachers = teacherRes.data.teachers || [];
      let teacherId = user?.id;
      
      if (teachers.length > 0) {
        setTeacherData(teachers[0]);
        teacherId = teachers[0].id;
      }

      // Fetch AI insights from backend - always use real data
      const insightsRes = await axios.get(`${API_BASE_URL}/ai_insights.php?teacher_id=${teacherId}`);
      if (insightsRes.data.success) {
        setInsights(insightsRes.data.insights || {
          performance: [],
          students: [],
          recommendations: [],
          predictions: [],
          alerts: []
        });
        setStats(insightsRes.data.stats || {
          overallScore: 0,
          classAverage: 0,
          attendanceRate: 0,
          homeworkCompletion: 0,
          studentEngagement: 0
        });
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
      // Set empty data instead of mock data
      setInsights({
        performance: [],
        students: [],
        recommendations: [],
        predictions: [],
        alerts: []
      });
      setStats({
        overallScore: 0,
        classAverage: 0,
        attendanceRate: 0,
        homeworkCompletion: 0,
        studentEngagement: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInsights();
    setRefreshing(false);
  };

  const handleFeedback = async (insightId, isPositive) => {
    try {
      await axios.post(`${API_BASE_URL}/ai_insights.php`, {
        action: 'feedback',
        teacher_id: teacherData?.id || user?.id,
        insight_id: insightId,
        is_positive: isPositive
      });
      // Show brief feedback confirmation
      alert(isPositive ? 'Thanks for the positive feedback!' : 'Thanks for your feedback. We\'ll improve our insights.');
    } catch (error) {
      console.error('Error sending feedback:', error);
    }
  };

  const handleAlertAction = (action) => {
    switch (action) {
      case 'Review Now':
        navigate('/teacher/grades');
        break;
      case 'View Homework':
        navigate('/teacher/homework');
        break;
      case 'Grade Now':
        navigate('/teacher/grades');
        break;
      case 'Mark Attendance':
        navigate('/teacher/attendance');
        break;
      default:
        console.log('Action:', action);
    }
  };

  const handleViewStudentProfile = (studentId) => {
    navigate(`/teacher/student-progress?student=${studentId}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'at_risk': return 'text-red-600 bg-red-50';
      case 'excelling': return 'text-green-600 bg-green-50';
      case 'improving': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: PieChart },
    { id: 'students', label: 'Student Insights', icon: Users },
    { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
    { id: 'predictions', label: 'Predictions', icon: TrendingUp }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="relative">
            <Brain className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">AI is analyzing your data...</p>
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
            <Brain className="text-purple-600" />
            AI Insights & Recommendations
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Beta</span>
          </h1>
          <p className="text-gray-600 mt-1">Personalized insights powered by AI to improve teaching outcomes</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn bg-purple-100 hover:bg-purple-200 text-purple-700 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Insights'}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-purple-600">{stats.overallScore}%</div>
          <p className="text-sm text-gray-600">Overall Score</p>
          <div className="flex items-center justify-center gap-1 mt-1 text-green-600 text-xs">
            <TrendingUp className="w-3 h-3" /> +5% this month
          </div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.classAverage}%</div>
          <p className="text-sm text-gray-600">Class Average</p>
          <div className="flex items-center justify-center gap-1 mt-1 text-green-600 text-xs">
            <TrendingUp className="w-3 h-3" /> +3% this term
          </div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-green-600">{stats.attendanceRate}%</div>
          <p className="text-sm text-gray-600">Attendance Rate</p>
          <div className="flex items-center justify-center gap-1 mt-1 text-gray-500 text-xs">
            <span>—</span> Stable
          </div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-orange-600">{stats.homeworkCompletion}%</div>
          <p className="text-sm text-gray-600">Homework Done</p>
          <div className="flex items-center justify-center gap-1 mt-1 text-red-600 text-xs">
            <TrendingDown className="w-3 h-3" /> -2% this week
          </div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-indigo-600">{stats.studentEngagement}%</div>
          <p className="text-sm text-gray-600">Engagement</p>
          <div className="flex items-center justify-center gap-1 mt-1 text-green-600 text-xs">
            <TrendingUp className="w-3 h-3" /> +8% this month
          </div>
        </div>
      </div>

      {/* Alerts */}
      {insights.alerts.length > 0 && (
        <div className="space-y-2">
          {insights.alerts.map(alert => (
            <div 
              key={alert.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                alert.type === 'urgent' ? 'bg-red-50 border border-red-200' :
                alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                'bg-blue-50 border border-blue-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {alert.type === 'urgent' ? <AlertCircle className="w-5 h-5 text-red-600" /> :
                 alert.type === 'warning' ? <AlertTriangle className="w-5 h-5 text-yellow-600" /> :
                 <AlertCircle className="w-5 h-5 text-blue-600" />}
                <div>
                  <p className="font-medium">{alert.title}</p>
                  <p className="text-sm text-gray-600">{alert.description}</p>
                </div>
              </div>
              <button 
                onClick={() => handleAlertAction(alert.action)}
                className="btn btn-sm bg-white shadow-sm"
              >{alert.action}</button>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-2 border-b pb-4">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Insights */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Performance Insights
            </h3>
            <div className="space-y-4">
              {insights.performance.map(insight => (
                <div 
                  key={insight.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    expandedInsight === insight.id ? 'ring-2 ring-purple-300' : ''
                  } ${
                    insight.type === 'positive' ? 'bg-green-50 border-green-200' :
                    insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-gray-50 border-gray-200'
                  }`}
                  onClick={() => setExpandedInsight(expandedInsight === insight.id ? null : insight.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {insight.type === 'positive' ? 
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" /> :
                        insight.type === 'warning' ?
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" /> :
                        <Target className="w-5 h-5 text-gray-600 mt-0.5" />
                      }
                      <div>
                        <p className="font-medium">{insight.title}</p>
                        <p className="text-sm text-gray-600">{insight.description}</p>
                      </div>
                    </div>
                    <span className={`text-lg font-bold ${
                      insight.type === 'positive' ? 'text-green-600' :
                      insight.type === 'warning' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {insight.metric}
                    </span>
                  </div>
                  
                  {expandedInsight === insight.id && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-700 mb-3">{insight.details}</p>
                      <div className="flex items-center justify-between">
                        {insight.actionable && (
                          <button className="btn btn-sm btn-primary flex items-center gap-1">
                            {insight.action} <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Was this helpful?</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleFeedback(insight.id, true); }}
                            className="p-1 hover:bg-green-100 rounded"
                          >
                            <ThumbsUp className="w-4 h-4 text-gray-400 hover:text-green-600" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleFeedback(insight.id, false); }}
                            className="p-1 hover:bg-red-100 rounded"
                          >
                            <ThumbsDown className="w-4 h-4 text-gray-400 hover:text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Recommendations */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Top Recommendations
            </h3>
            <div className="space-y-3">
              {insights.recommendations.slice(0, 3).map(rec => (
                <div key={rec.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(rec.priority)}`}>
                      {rec.priority} priority
                    </span>
                    <span className="text-xs text-gray-500">{rec.timeframe}</span>
                  </div>
                  <p className="font-medium">{rec.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>Impact: <strong>{rec.impact}</strong></span>
                    <span>Effort: <strong>{rec.effort}</strong></span>
                  </div>
                </div>
              ))}
              <button 
                onClick={() => setActiveTab('recommendations')}
                className="w-full btn bg-gray-100 hover:bg-gray-200 flex items-center justify-center gap-2"
              >
                View All Recommendations <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Student Performance Insights
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Student</th>
                  <th className="text-left py-3 px-4">Class</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Trend</th>
                  <th className="text-left py-3 px-4">Reason</th>
                  <th className="text-left py-3 px-4">Recommendation</th>
                  <th className="text-left py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {insights.students.map(student => (
                  <tr key={student.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{student.name}</td>
                    <td className="py-3 px-4 text-gray-600">{student.class}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(student.status)}`}>
                        {student.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {student.trend === 'up' ? 
                        <TrendingUp className="w-5 h-5 text-green-600" /> :
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      }
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 max-w-xs">{student.reason}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 max-w-xs">{student.recommendation}</td>
                    <td className="py-3 px-4">
                      <button 
                        onClick={() => handleViewStudentProfile(student.id)}
                        className="btn btn-sm bg-blue-100 text-blue-700 hover:bg-blue-200"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          {insights.recommendations.map(rec => (
            <div key={rec.id} className="card p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    rec.category === 'Teaching' ? 'bg-blue-100' :
                    rec.category === 'Assessment' ? 'bg-green-100' :
                    rec.category === 'Engagement' ? 'bg-purple-100' :
                    'bg-orange-100'
                  }`}>
                    {rec.category === 'Teaching' ? <BookOpen className="w-5 h-5 text-blue-600" /> :
                     rec.category === 'Assessment' ? <FileText className="w-5 h-5 text-green-600" /> :
                     rec.category === 'Engagement' ? <Zap className="w-5 h-5 text-purple-600" /> :
                     <MessageSquare className="w-5 h-5 text-orange-600" />}
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">{rec.category}</span>
                    <h4 className="font-semibold">{rec.title}</h4>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${getPriorityColor(rec.priority)}`}>
                  {rec.priority} priority
                </span>
              </div>
              <p className="text-gray-600 mb-4">{rec.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-gray-500">Impact:</span>
                    <span className="ml-1 font-medium">{rec.impact}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Effort:</span>
                    <span className="ml-1 font-medium">{rec.effort}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Timeframe:</span>
                    <span className="ml-1 font-medium">{rec.timeframe}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn btn-sm bg-gray-100 hover:bg-gray-200">Dismiss</button>
                  <button className="btn btn-sm btn-primary">Apply</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Predictions Tab */}
      {activeTab === 'predictions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {insights.predictions.map(pred => (
            <div key={pred.id} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">{pred.title}</h4>
                {pred.trend === 'up' ? 
                  <TrendingUp className="w-5 h-5 text-green-600" /> :
                  pred.trend === 'warning' ?
                  <AlertTriangle className="w-5 h-5 text-yellow-600" /> :
                  <TrendingDown className="w-5 h-5 text-red-600" />
                }
              </div>
              <p className="text-gray-600 mb-4">{pred.prediction}</p>
              
              {/* Confidence Meter */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-500">Confidence</span>
                  <span className="font-medium">{pred.confidence}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      pred.confidence >= 80 ? 'bg-green-500' :
                      pred.confidence >= 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${pred.confidence}%` }}
                  />
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Key Factors:</p>
                <ul className="space-y-1">
                  {pred.factors.map((factor, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Disclaimer */}
      <div className="card p-4 bg-purple-50 border border-purple-200">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
          <div>
            <p className="font-medium text-purple-900">About AI Insights</p>
            <p className="text-sm text-purple-700">
              These insights are generated using AI analysis of your teaching data. While we strive for accuracy, 
              please use your professional judgment when making decisions. Feedback helps improve our recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
