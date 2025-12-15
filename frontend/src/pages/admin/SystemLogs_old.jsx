import { useState, useEffect } from 'react';
import { Activity, Filter, Download, Search, RefreshCw, AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import axios from 'axios';

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    user: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    errors: 0,
    warnings: 0
  });

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.user) params.append('user', filters.user);
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`https://eea.mcaforo.com/backend/api/logs.php?${params}`);
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('https://eea.mcaforo.com/backend/api/logs.php?stats=true');
      setStats(response.data.stats || stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get('https://eea.mcaforo.com/backend/api/logs.php?export=csv', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `system_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Error exporting logs: ' + error.message);
    }
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getLogBadge = (type) => {
    const badges = {
      error: 'bg-red-100 text-red-700',
      warning: 'bg-orange-100 text-orange-700',
      success: 'bg-green-100 text-green-700',
      info: 'bg-blue-100 text-blue-700'
    };
    return badges[type] || badges.info;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
          <p className="text-gray-600 mt-1">Monitor system activity and events</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchLogs} className="btn bg-gray-200 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button onClick={handleExport} className="btn btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Today's Logs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Errors</p>
              <p className="text-2xl font-bold text-gray-900">{stats.errors}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Warnings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.warnings}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="input"
            >
              <option value="all">All Types</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Date From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Date To</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search logs..."
              className="input"
            />
          </div>
          <div className="flex items-end">
            <button onClick={fetchLogs} className="btn btn-primary w-full flex items-center justify-center gap-2">
              <Filter className="w-4 h-4" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    Loading logs...
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No logs found</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getLogIcon(log.type)}
                      <span className={`px-2 py-1 text-xs rounded-full ${getLogBadge(log.type)}`}>
                        {log.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{log.message}</p>
                    {log.details && (
                      <p className="text-xs text-gray-500 mt-1">{log.details}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{log.user_name || 'System'}</td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-600">{log.ip_address || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(log.created_at).toLocaleString()}
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
