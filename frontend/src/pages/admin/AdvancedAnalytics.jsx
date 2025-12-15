import { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Users, DollarSign, GraduationCap,
  BarChart3, PieChart, LineChart, Target, Award, AlertTriangle,
  Calendar, Clock, RefreshCw, Download, Filter, ChevronRight,
  ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

const API = `${API_BASE_URL}/advanced_analytics.php`;

export default function AdvancedAnalytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [enrollmentData, setEnrollmentData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [teacherData, setTeacherData] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [comparison, setComparison] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'enrollment') fetchEnrollmentData();
    if (activeTab === 'revenue') fetchRevenueData();
    if (activeTab === 'teachers') fetchTeacherData();
    if (activeTab === 'students') fetchStudentData();
    if (activeTab === 'comparison') fetchComparison();
  }, [activeTab]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}?action=dashboard`);
      setDashboard(response.data.analytics);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollmentData = async () => {
    try {
      setLoading(true);
      const [prediction, trends, byClass, funnel] = await Promise.all([
        axios.get(`${API}?action=enrollment_prediction&months=12`),
        axios.get(`${API}?action=enrollment_trends&years=3`),
        axios.get(`${API}?action=enrollment_by_class`),
        axios.get(`${API}?action=admission_funnel`)
      ]);
      setEnrollmentData({
        prediction: prediction.data,
        trends: trends.data.trends,
        byClass: byClass.data.classes,
        funnel: funnel.data.funnel
      });
    } catch (error) {
      console.error('Error fetching enrollment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const [forecast, breakdown, collection, outstanding] = await Promise.all([
        axios.get(`${API}?action=revenue_forecast&months=6`),
        axios.get(`${API}?action=revenue_breakdown&period=year`),
        axios.get(`${API}?action=fee_collection_rate`),
        axios.get(`${API}?action=outstanding_fees`)
      ]);
      setRevenueData({
        forecast: forecast.data,
        breakdown: breakdown.data,
        collection: collection.data,
        outstanding: outstanding.data
      });
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      const [effectiveness, rankings, workload] = await Promise.all([
        axios.get(`${API}?action=teacher_effectiveness`),
        axios.get(`${API}?action=teacher_rankings&metric=overall`),
        axios.get(`${API}?action=teacher_workload`)
      ]);
      setTeacherData({
        effectiveness: effectiveness.data.teachers,
        rankings: rankings.data.rankings,
        workload: workload.data.workload
      });
    } catch (error) {
      console.error('Error fetching teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const [performance, attendance, subjects] = await Promise.all([
        axios.get(`${API}?action=student_performance`),
        axios.get(`${API}?action=attendance_analytics`),
        axios.get(`${API}?action=subject_performance`)
      ]);
      setStudentData({
        performance: performance.data,
        attendance: attendance.data,
        subjects: subjects.data.subjects
      });
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComparison = async () => {
    try {
      setLoading(true);
      const [yearComp, benchmark] = await Promise.all([
        axios.get(`${API}?action=year_comparison`),
        axios.get(`${API}?action=benchmark`)
      ]);
      setComparison({
        year: yearComp.data,
        benchmark: benchmark.data.benchmarks
      });
    } catch (error) {
      console.error('Error fetching comparison:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount || 0);
  };

  const getChangeIcon = (change) => {
    if (change > 0) return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    if (change < 0) return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-500';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Advanced Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400">Predictive insights and performance metrics</p>
        </div>
        <button
          onClick={() => {
            fetchDashboard();
            if (activeTab === 'enrollment') fetchEnrollmentData();
            if (activeTab === 'revenue') fetchRevenueData();
            if (activeTab === 'teachers') fetchTeacherData();
            if (activeTab === 'students') fetchStudentData();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Quick Stats */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              {dashboard.enrollment_growth !== 0 && (
                <span className={`flex items-center gap-1 text-sm ${getChangeColor(dashboard.enrollment_growth)}`}>
                  {getChangeIcon(dashboard.enrollment_growth)}
                  {Math.abs(dashboard.enrollment_growth)}%
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-3">{dashboard.total_students || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Students</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
              {formatCurrency(dashboard.year_revenue)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Year Revenue</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl w-fit">
              <GraduationCap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-3">{dashboard.total_teachers || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Teachers</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl w-fit">
              <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-3">{dashboard.total_classes || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Classes</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'enrollment', label: 'Enrollment Prediction', icon: Users },
          { id: 'revenue', label: 'Revenue Forecast', icon: DollarSign },
          { id: 'teachers', label: 'Teacher Effectiveness', icon: Award },
          { id: 'students', label: 'Student Analytics', icon: GraduationCap },
          { id: 'comparison', label: 'Comparisons', icon: TrendingUp }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Enrollment Prediction Tab */}
      {activeTab === 'enrollment' && enrollmentData && !loading && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Predicted Enrollments</h3>
              <p className="text-3xl font-bold">{enrollmentData.prediction?.summary?.total_predicted || 0}</p>
              <p className="text-sm text-blue-100 mt-1">Next 12 months</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Monthly Average</h3>
              <p className="text-3xl font-bold">{enrollmentData.prediction?.summary?.average_monthly || 0}</p>
              <p className="text-sm text-green-100 mt-1">Based on historical data</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Trend</h3>
              <p className="text-3xl font-bold capitalize">{enrollmentData.prediction?.summary?.trend || 'Stable'}</p>
              <p className="text-sm text-purple-100 mt-1">
                {enrollmentData.prediction?.summary?.trend_value > 0 ? '+' : ''}
                {enrollmentData.prediction?.summary?.trend_value || 0} per month
              </p>
            </div>
          </div>

          {/* Predictions Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Monthly Predictions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Predicted</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {enrollmentData.prediction?.predictions?.map((pred, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{pred.month}</td>
                      <td className="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400">
                        {pred.predicted_enrollments}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${pred.confidence}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-500">{pred.confidence}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Class Capacity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Class Capacity</h3>
            <div className="space-y-3">
              {enrollmentData.byClass?.slice(0, 8).map((cls, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="w-24 text-sm text-gray-600 dark:text-gray-400 truncate">{cls.class_name}</span>
                  <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        cls.fill_rate >= 90 ? 'bg-red-500' : 
                        cls.fill_rate >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${cls.fill_rate}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20 text-right">
                    {cls.enrolled}/{cls.capacity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Revenue Forecast Tab */}
      {activeTab === 'revenue' && revenueData && !loading && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Billed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(revenueData.collection?.current?.total_billed)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Collected</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {formatCurrency(revenueData.collection?.current?.total_collected)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Outstanding</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {formatCurrency(revenueData.collection?.current?.outstanding)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Collection Rate</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {revenueData.collection?.current?.collection_rate}%
              </p>
            </div>
          </div>

          {/* Forecast */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Revenue Forecast (6 Months)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Predicted</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Range</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {revenueData.forecast?.forecasts?.map((f, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{f.month}</td>
                      <td className="px-4 py-3 font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(f.predicted_revenue)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatCurrency(f.lower_bound)} - {formatCurrency(f.upper_bound)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          f.confidence >= 80 ? 'bg-green-100 text-green-700' :
                          f.confidence >= 60 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {f.confidence}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Outstanding by Age */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Outstanding Fees by Age</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {revenueData.outstanding?.by_age?.map((age, i) => (
                <div key={i} className={`p-4 rounded-lg ${
                  age.age_bracket === '90+ days' ? 'bg-red-50 dark:bg-red-900/20' :
                  age.age_bracket === '61-90 days' ? 'bg-orange-50 dark:bg-orange-900/20' :
                  age.age_bracket === '31-60 days' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                  'bg-green-50 dark:bg-green-900/20'
                }`}>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{age.age_bracket}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                    {formatCurrency(age.outstanding)}
                  </p>
                  <p className="text-xs text-gray-500">{age.invoices} invoices</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Teacher Effectiveness Tab */}
      {activeTab === 'teachers' && teacherData && !loading && (
        <div className="space-y-6">
          {/* Rankings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Teacher Effectiveness Rankings</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effectiveness</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {teacherData.effectiveness?.map((teacher, i) => (
                    <tr key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${
                          i === 0 ? 'bg-yellow-100 text-yellow-700' :
                          i === 1 ? 'bg-gray-100 text-gray-700' :
                          i === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{teacher.name}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{teacher.department || '-'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{teacher.avg_student_score}%</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{teacher.class_attendance_rate}%</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                teacher.effectiveness_score >= 70 ? 'bg-green-500' :
                                teacher.effectiveness_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${teacher.effectiveness_score}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{teacher.effectiveness_score}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          teacher.rating === 'Excellent' ? 'bg-green-100 text-green-700' :
                          teacher.rating === 'Good' ? 'bg-blue-100 text-blue-700' :
                          teacher.rating === 'Average' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {teacher.rating}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Workload Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Workload Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teacherData.workload?.slice(0, 6).map((teacher, i) => (
                <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">{teacher.name}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      teacher.workload_level === 'High' ? 'bg-red-100 text-red-700' :
                      teacher.workload_level === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {teacher.workload_level}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Classes</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{teacher.classes}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Subjects</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{teacher.subjects}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Students</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{teacher.total_students}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Student Analytics Tab */}
      {activeTab === 'students' && studentData && !loading && (
        <div className="space-y-6">
          {/* Grade Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Grade Distribution</h3>
              <div className="space-y-3">
                {studentData.performance?.distribution?.map((grade, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-24 text-sm font-medium text-gray-700 dark:text-gray-300">{grade.grade_range}</span>
                    <div className="flex-1 h-6 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          grade.grade_range.startsWith('A') ? 'bg-green-500' :
                          grade.grade_range.startsWith('B') ? 'bg-blue-500' :
                          grade.grade_range.startsWith('C') ? 'bg-yellow-500' :
                          grade.grade_range.startsWith('D') ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, (grade.count / 50) * 100)}%` }}
                      />
                    </div>
                    <span className="w-12 text-sm text-gray-500 text-right">{grade.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Attendance Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">{studentData.attendance?.overall?.attendance_rate}%</p>
                  <p className="text-sm text-gray-500">Attendance Rate</p>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">{studentData.attendance?.overall?.present}</p>
                  <p className="text-sm text-gray-500">Present (30 days)</p>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-3xl font-bold text-red-600">{studentData.attendance?.overall?.absent}</p>
                  <p className="text-sm text-gray-500">Absent</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-3xl font-bold text-yellow-600">{studentData.attendance?.overall?.late}</p>
                  <p className="text-sm text-gray-500">Late</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Performers & Needs Attention */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Top Performers
              </h3>
              <div className="space-y-2">
                {studentData.performance?.top_performers?.map((student, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                        i === 0 ? 'bg-yellow-100 text-yellow-700' :
                        i === 1 ? 'bg-gray-200 text-gray-700' :
                        i === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                        <p className="text-xs text-gray-500">{student.class_name}</p>
                      </div>
                    </div>
                    <span className="font-bold text-green-600">{student.avg_score}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Needs Attention
              </h3>
              <div className="space-y-2">
                {studentData.performance?.needs_attention?.map((student, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.class_name}</p>
                    </div>
                    <span className="font-bold text-red-600">{student.avg_score}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Subject Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Subject Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase">
                    <th className="pb-3">Subject</th>
                    <th className="pb-3">Avg Score</th>
                    <th className="pb-3">Highest</th>
                    <th className="pb-3">Lowest</th>
                    <th className="pb-3">Students</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {studentData.subjects?.map((subject, i) => (
                    <tr key={i}>
                      <td className="py-3 font-medium text-gray-900 dark:text-white">{subject.subject_name}</td>
                      <td className="py-3">
                        <span className={`font-semibold ${
                          subject.avg_score >= 70 ? 'text-green-600' :
                          subject.avg_score >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {subject.avg_score}%
                        </span>
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">{subject.highest}%</td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">{subject.lowest}%</td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">{subject.students}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Tab */}
      {activeTab === 'comparison' && comparison && !loading && (
        <div className="space-y-6">
          {/* Year over Year */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-6">Year-over-Year Comparison</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(comparison.year?.comparison || {}).map(([key, data]) => (
                <div key={key} className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize mb-2">
                    {key.replace('_', ' ')}
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Previous</p>
                      <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                        {key === 'revenue' ? formatCurrency(data.previous) : 
                         key === 'avg_score' ? `${data.previous}%` : data.previous}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">Current</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {key === 'revenue' ? formatCurrency(data.current) : 
                         key === 'avg_score' ? `${data.current}%` : data.current}
                      </p>
                    </div>
                  </div>
                  <div className={`mt-2 flex items-center justify-center gap-1 ${getChangeColor(data.change)}`}>
                    {getChangeIcon(data.change)}
                    <span className="font-semibold">{Math.abs(data.change)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Benchmarks */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-6">Performance Benchmarks</h3>
            <div className="space-y-6">
              {Object.entries(comparison.benchmark || {}).map(([key, data]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {key.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-500">
                      Target: {data.target}% | Avg: {data.national_avg || data.industry_avg}%
                    </span>
                  </div>
                  <div className="relative h-8 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    {/* Current value */}
                    <div 
                      className={`absolute h-full rounded-full ${
                        data.current >= data.target ? 'bg-green-500' :
                        data.current >= (data.national_avg || data.industry_avg) ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, data.current)}%` }}
                    />
                    {/* Target marker */}
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-blue-600"
                      style={{ left: `${data.target}%` }}
                    />
                    {/* Current value label */}
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                      {data.current}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">Quick Insights</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <TrendingUp className="w-5 h-5 mt-0.5" />
                <span>Enrollment is {dashboard?.enrollment_growth > 0 ? 'growing' : 'stable'} compared to last year</span>
              </li>
              <li className="flex items-start gap-2">
                <Target className="w-5 h-5 mt-0.5" />
                <span>Revenue collection is on track for this quarter</span>
              </li>
              <li className="flex items-start gap-2">
                <Award className="w-5 h-5 mt-0.5" />
                <span>Teacher effectiveness metrics available for review</span>
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Analytics Modules</h3>
            <div className="space-y-3">
              {[
                { name: 'Enrollment Prediction', desc: 'Forecast future student enrollment', tab: 'enrollment' },
                { name: 'Revenue Forecast', desc: 'Project future revenue and collections', tab: 'revenue' },
                { name: 'Teacher Effectiveness', desc: 'Measure and compare teacher performance', tab: 'teachers' },
                { name: 'Student Analytics', desc: 'Track student performance and attendance', tab: 'students' }
              ].map((module, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTab(module.tab)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">{module.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{module.desc}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
