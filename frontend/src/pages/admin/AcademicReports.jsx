import { useState, useEffect } from 'react';
import { Download, Calendar, Filter, TrendingUp, Users, Award } from 'lucide-react';
import axios from 'axios';

export default function AcademicReports() {
  const [activeReport, setActiveReport] = useState('class_performance');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    date_from: new Date().toISOString().split('T')[0].slice(0, 8) + '01',
    date_to: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchReport();
  }, [activeReport]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ type: activeReport, ...filters });
      const response = await axios.get(`https://eea.mcaforo.com/backend/api/reports.php?${params}`);
      setReportData(response.data.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format) => {
    // Implement export functionality
    alert(`Exporting as ${format}...`);
  };

  const reports = [
    { id: 'class_performance', label: 'Class Performance', icon: Award },
    { id: 'attendance_summary', label: 'Attendance Summary', icon: Users },
    { id: 'academic_performance', label: 'Student Performance', icon: TrendingUp }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Reports</h1>
          <p className="text-gray-600 mt-1">View and analyze academic performance</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => handleExport('pdf')} className="btn bg-gray-200 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button onClick={() => handleExport('excel')} className="btn btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="card p-4">
        <div className="flex gap-4 border-b pb-4 mb-4">
          {reports.map(report => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => setActiveReport(report.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeReport === report.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {report.label}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">From Date</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">To Date</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              className="input"
            />
          </div>
          <div className="flex items-end">
            <button onClick={fetchReport} className="btn btn-primary w-full flex items-center justify-center gap-2">
              <Filter className="w-4 h-4" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="card p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          {/* Report Header */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900">{reportData.report_title}</h2>
            <p className="text-sm text-gray-600 mt-1">Generated on {new Date(reportData.generated_at).toLocaleString()}</p>
          </div>

          {/* Class Performance Report */}
          {activeReport === 'class_performance' && reportData.classes && (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reportData.classes.map((cls, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{cls.class_name}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                          {cls.level.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{cls.student_count}</td>
                      <td className="px-6 py-4 text-gray-600">{cls.teacher_name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Attendance Summary Report */}
          {activeReport === 'attendance_summary' && reportData.summary && (
            <div className="space-y-4">
              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4">Overall Attendance Rate</h3>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-green-600">{reportData.overall_rate}%</div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-green-600 h-4 rounded-full" 
                        style={{ width: `${reportData.overall_rate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Students</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reportData.summary.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{item.class_name}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">
                            {item.level.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{item.total_students}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card p-12 text-center text-gray-500">
          Select a report and apply filters to view data
        </div>
      )}
    </div>
  );
}
