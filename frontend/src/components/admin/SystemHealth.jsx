import { useState, useEffect } from 'react';
import { 
  Activity, 
  Server, 
  Database, 
  HardDrive, 
  Cpu, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  XCircle,
  Clock,
  Users,
  TrendingUp,
  Loader2,
  Wifi,
  WifiOff,
  BarChart3,
  FileWarning
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

export default function SystemHealth() {
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [errors, setErrors] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAllData();
    
    // Auto-refresh every 30 seconds
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchAllData, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  });

  const fetchAllData = async () => {
    setRefreshing(true);
    
    try {
      const [healthRes, metricsRes, errorsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/health.php?action=status`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/health.php?action=metrics`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/health.php?action=errors&limit=10`, { headers: getAuthHeaders() }),
      ]);

      const healthData = await healthRes.json();
      const metricsData = await metricsRes.json();
      const errorsData = await errorsRes.json();

      if (healthData.success) setHealth(healthData.data);
      if (metricsData.success) setMetrics(metricsData.data);
      if (errorsData.success) setErrors(errorsData.data);
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch health data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getCheckIcon = (name) => {
    switch (name.toLowerCase()) {
      case 'database':
        return Database;
      case 'disk space':
      case 'disk':
        return HardDrive;
      case 'memory':
        return Cpu;
      case 'php':
        return Server;
      default:
        return Activity;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Health</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor server health and performance
            {lastUpdated && (
              <span className="ml-2 text-sm">
                • Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            Auto-refresh
          </label>
          <button
            onClick={fetchAllData}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overall Status */}
      {health && (
        <div className={`p-6 rounded-xl border ${
          health.status === 'healthy' 
            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
            : health.status === 'warning'
            ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
            : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${
              health.status === 'healthy' 
                ? 'bg-green-100 dark:bg-green-900/50' 
                : health.status === 'warning'
                ? 'bg-yellow-100 dark:bg-yellow-900/50'
                : 'bg-red-100 dark:bg-red-900/50'
            }`}>
              {health.status === 'healthy' ? (
                <Wifi className="w-8 h-8 text-green-600 dark:text-green-400" />
              ) : (
                <WifiOff className="w-8 h-8 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
                System {health.status}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {health.status === 'healthy' 
                  ? 'All systems are operational' 
                  : health.status === 'warning'
                  ? 'Some systems need attention'
                  : 'Critical issues detected'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'metrics'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Application Metrics
          </button>
          <button
            onClick={() => setActiveTab('errors')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'errors'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Recent Errors
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && health && (
        <div className="space-y-6">
          {/* Health Checks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(health.checks || {}).map(([key, check]) => {
              const Icon = getCheckIcon(check.name);
              return (
                <div
                  key={key}
                  className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        check.status === 'healthy' 
                          ? 'bg-green-100 dark:bg-green-900/30' 
                          : check.status === 'warning'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30'
                          : 'bg-red-100 dark:bg-red-900/30'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          check.status === 'healthy' 
                            ? 'text-green-600 dark:text-green-400' 
                            : check.status === 'warning'
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-red-600 dark:text-red-400'
                        }`} />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{check.name}</h3>
                    </div>
                    {getStatusIcon(check.status)}
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{check.message}</p>
                  
                  {check.details && (
                    <div className="space-y-2 text-sm">
                      {check.details.used_percent !== undefined && (
                        <div>
                          <div className="flex justify-between text-gray-600 dark:text-gray-400 mb-1">
                            <span>Usage</span>
                            <span>{check.details.used_percent}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                check.details.used_percent > 90 
                                  ? 'bg-red-500' 
                                  : check.details.used_percent > 75
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(check.details.used_percent, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {check.details.response_time_ms !== undefined && (
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                          <span>Response Time</span>
                          <span>{check.details.response_time_ms}ms</span>
                        </div>
                      )}
                      
                      {check.details.size_formatted && (
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                          <span>Size</span>
                          <span>{check.details.size_formatted}</span>
                        </div>
                      )}
                      
                      {check.details.version && (
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                          <span>Version</span>
                          <span>{check.details.version}</span>
                        </div>
                      )}
                      
                      {check.details.connections !== undefined && (
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                          <span>Connections</span>
                          <span>{check.details.connections} / {check.details.max_connections}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Server Info */}
          {health.server && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Server className="w-5 h-5" />
                Server Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Hostname</p>
                  <p className="font-medium text-gray-900 dark:text-white">{health.server.hostname}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">OS</p>
                  <p className="font-medium text-gray-900 dark:text-white">{health.server.os}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Server Time</p>
                  <p className="font-medium text-gray-900 dark:text-white">{health.server.server_time}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Uptime</p>
                  <p className="font-medium text-gray-900 dark:text-white">{health.server.uptime}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metrics Tab */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {metrics ? (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{metrics.total_users?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Active (24h)</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{metrics.active_users_24h?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{metrics.total_students?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Errors (24h)</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{metrics.errors_24h || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Users by Role */}
              {metrics.users_by_role && Object.keys(metrics.users_by_role).length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Users by Role</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {Object.entries(metrics.users_by_role).map(([role, count]) => (
                      <div key={role} className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{role}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Login Trend */}
              {metrics.login_trend && metrics.login_trend.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Login Activity (Last 7 Days)
                  </h3>
                  <div className="flex items-end gap-2 h-32">
                    {metrics.login_trend.map((day, index) => {
                      const maxCount = Math.max(...metrics.login_trend.map(d => d.count));
                      const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full bg-blue-500 dark:bg-blue-600 rounded-t"
                            style={{ height: `${height}%`, minHeight: day.count > 0 ? '4px' : '0' }}
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </p>
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{day.count}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No metrics available</p>
            </div>
          )}
        </div>
      )}

      {/* Errors Tab */}
      {activeTab === 'errors' && (
        <div className="space-y-6">
          {errors?.audit_errors?.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileWarning className="w-5 h-5 text-red-500" />
                  Recent High/Critical Events
                </h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {errors.audit_errors.map((error, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          error.severity === 'critical' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}>
                          {error.severity}
                        </span>
                        <div>
                          <p className="text-gray-900 dark:text-white">{error.description || error.action}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {error.entity_type} • {error.user_email || 'System'}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(error.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No recent errors</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">System is running smoothly</p>
            </div>
          )}

          {errors?.file_errors?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-gray-900 dark:text-white">PHP Error Log</h3>
              </div>
              <div className="p-4 max-h-64 overflow-y-auto">
                <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono">
                  {errors.file_errors.join('\n')}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
