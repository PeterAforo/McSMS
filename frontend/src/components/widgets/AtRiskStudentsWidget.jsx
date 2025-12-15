import { useState, useEffect } from 'react';
import { AlertTriangle, TrendingDown, User, ChevronRight, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

/**
 * At-Risk Students Widget
 * Displays students who are at risk of failing based on ML predictions
 */
export default function AtRiskStudentsWidget({ classId = null, limit = 5 }) {
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({ critical: 0, high: 0, medium: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchAtRiskStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        action: 'at_risk',
        limit: limit.toString()
      });
      if (classId) params.append('class_id', classId);
      
      const response = await axios.get(`${API_BASE_URL}/student_analytics.php?${params}`);
      if (response.data.success) {
        setStudents(response.data.students || []);
        setSummary(response.data.summary || { critical: 0, high: 0, medium: 0 });
      }
    } catch (err) {
      console.error('Error fetching at-risk students:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAtRiskStudents();
  }, [classId, limit]);

  const getRiskIcon = (level) => {
    switch (level) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'medium':
        return <TrendingDown className="w-4 h-4 text-yellow-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getRiskBadgeClass = (level) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">At-Risk Students</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Early warning system</p>
            </div>
          </div>
          <button
            onClick={fetchAtRiskStudents}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Summary badges */}
        {!loading && students.length > 0 && (
          <div className="flex gap-2 mt-3">
            {summary.critical > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                {summary.critical} Critical
              </span>
            )}
            {summary.high > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full">
                {summary.high} High
              </span>
            )}
            {summary.medium > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
                {summary.medium} Medium
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Analyzing student data...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={fetchAtRiskStudents}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">All Students On Track!</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              No students are currently at risk of failing
            </p>
          </div>
        ) : (
          students.map((student) => (
            <div
              key={student.id}
              onClick={() => navigate(`/admin/students/${student.id}`)}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative">
                  {student.photo ? (
                    <img
                      src={student.photo}
                      alt={student.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1">
                    {getRiskIcon(student.risk_level)}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {student.name}
                    </p>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRiskBadgeClass(student.risk_level)}`}>
                      {student.risk_label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {student.class_name} • Risk Score: {student.risk_score}%
                  </p>

                  {/* Metrics */}
                  <div className="flex gap-3 mt-2">
                    <div className="text-xs">
                      <span className="text-gray-400">Attendance:</span>
                      <span className={`ml-1 font-medium ${student.metrics.attendance < 80 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                        {student.metrics.attendance}%
                      </span>
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-400">Avg Grade:</span>
                      <span className={`ml-1 font-medium ${student.metrics.average_grade < 50 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                        {student.metrics.average_grade}%
                      </span>
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-400">Homework:</span>
                      <span className={`ml-1 font-medium ${student.metrics.homework_completion < 60 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                        {student.metrics.homework_completion}%
                      </span>
                    </div>
                  </div>

                  {/* Top recommendation */}
                  {student.recommendations?.[0] && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        💡 {student.recommendations[0].message}
                      </p>
                    </div>
                  )}
                </div>

                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {!loading && students.length > 0 && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={() => navigate('/admin/analytics?tab=at-risk')}
            className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            View All At-Risk Students →
          </button>
        </div>
      )}
    </div>
  );
}
