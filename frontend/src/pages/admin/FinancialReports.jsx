import { useState, useEffect } from 'react';
import { Download, Calendar, Filter, DollarSign, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function FinancialReports() {
  const [activeReport, setActiveReport] = useState('revenue_report');
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount || 0);
  };

  const handleExport = (format) => {
    alert(`Exporting as ${format}...`);
  };

  const reports = [
    { id: 'revenue_report', label: 'Revenue Report', icon: DollarSign },
    { id: 'outstanding_fees', label: 'Outstanding Fees', icon: Clock },
    { id: 'payment_history', label: 'Payment History', icon: TrendingUp },
    { id: 'collection_rate', label: 'Collection Rate', icon: AlertCircle }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600 mt-1">Comprehensive financial analysis and reporting</p>
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
        <div className="flex gap-4 border-b pb-4 mb-4 overflow-x-auto">
          {reports.map(report => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => setActiveReport(report.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
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
        {activeReport !== 'collection_rate' && (
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
        )}
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
            {reportData.period && (
              <p className="text-sm text-gray-600">
                Period: {new Date(reportData.period.from).toLocaleDateString()} - {new Date(reportData.period.to).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Revenue Report */}
          {activeReport === 'revenue_report' && reportData.totals && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="card p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Invoiced</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.totals.total_invoiced)}</p>
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Collected</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.totals.total_collected)}</p>
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Outstanding</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.totals.total_outstanding)}</p>
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Invoices</p>
                      <p className="text-2xl font-bold text-gray-900">{reportData.totals.total_invoices}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily Breakdown */}
              {reportData.daily_breakdown && reportData.daily_breakdown.length > 0 && (
                <div className="card overflow-hidden">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold">Daily Breakdown</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoices</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoiced</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collected</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {reportData.daily_breakdown.map((day, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">
                              {new Date(day.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-gray-600">{day.invoice_count}</td>
                            <td className="px-6 py-4 text-gray-900 font-medium">{formatCurrency(day.total_invoiced)}</td>
                            <td className="px-6 py-4 text-green-600 font-medium">{formatCurrency(day.total_collected)}</td>
                            <td className="px-6 py-4 text-orange-600 font-medium">{formatCurrency(day.total_outstanding)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Outstanding Fees Report */}
          {activeReport === 'outstanding_fees' && reportData.summary && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="card p-6">
                  <p className="text-sm text-gray-600 mb-2">Total Outstanding</p>
                  <p className="text-3xl font-bold text-orange-600">{formatCurrency(reportData.summary.total_outstanding)}</p>
                </div>
                <div className="card p-6">
                  <p className="text-sm text-gray-600 mb-2">Overdue Amount</p>
                  <p className="text-3xl font-bold text-red-600">{formatCurrency(reportData.summary.overdue_amount)}</p>
                </div>
                <div className="card p-6">
                  <p className="text-sm text-gray-600 mb-2">Total Invoices</p>
                  <p className="text-3xl font-bold text-gray-900">{reportData.summary.total_invoices}</p>
                </div>
                <div className="card p-6">
                  <p className="text-sm text-gray-600 mb-2">Overdue Invoices</p>
                  <p className="text-3xl font-bold text-red-600">{reportData.summary.overdue_count}</p>
                </div>
              </div>

              {/* Outstanding Invoices Table */}
              {reportData.invoices && reportData.invoices.length > 0 && (
                <div className="card overflow-hidden">
                  <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold">Outstanding Invoices</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {reportData.invoices.map((invoice, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-mono text-sm text-gray-900">{invoice.invoice_number}</td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{invoice.student_name}</div>
                              <div className="text-xs text-gray-500">{invoice.student_id}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{invoice.class_name}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(invoice.total_amount)}</td>
                            <td className="px-6 py-4 text-sm text-green-600">{formatCurrency(invoice.paid_amount)}</td>
                            <td className="px-6 py-4 text-sm font-medium text-orange-600">{formatCurrency(invoice.balance)}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {new Date(invoice.due_date).toLocaleDateString()}
                              {invoice.days_overdue > 0 && (
                                <span className="ml-2 text-xs text-red-600">({invoice.days_overdue} days overdue)</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                invoice.days_overdue > 0 
                                  ? 'bg-red-100 text-red-700' 
                                  : 'bg-orange-100 text-orange-700'
                              }`}>
                                {invoice.days_overdue > 0 ? 'Overdue' : invoice.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment History Report */}
          {activeReport === 'payment_history' && reportData.payments && (
            <div className="space-y-6">
              {/* Payment Methods Summary */}
              {reportData.by_method && reportData.by_method.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                  {reportData.by_method.map((method, index) => (
                    <div key={index} className="card p-6">
                      <p className="text-sm text-gray-600 mb-2">{method.payment_method || 'Unknown'}</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(method.total_amount)}</p>
                      <p className="text-xs text-gray-500 mt-1">{method.count} payments</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Payments Table */}
              <div className="card overflow-hidden">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold">Payment Transactions</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {reportData.payments.map((payment, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 font-mono text-sm text-gray-600">{payment.invoice_number}</td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{payment.student_name}</div>
                            <div className="text-xs text-gray-500">{payment.student_id}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{payment.class_name}</td>
                          <td className="px-6 py-4 text-sm font-medium text-green-600">{formatCurrency(payment.amount)}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                              {payment.payment_method}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-gray-500">{payment.reference_number || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Collection Rate Report */}
          {activeReport === 'collection_rate' && reportData.summary && (
            <div className="space-y-6">
              {/* Main Metric */}
              <div className="card p-8 text-center">
                <h3 className="text-lg font-semibold text-gray-600 mb-4">Overall Collection Rate</h3>
                <div className="text-6xl font-bold text-blue-600 mb-4">
                  {reportData.summary.collection_rate.toFixed(1)}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-6 mb-4">
                  <div 
                    className="bg-blue-600 h-6 rounded-full transition-all duration-500" 
                    style={{ width: `${reportData.summary.collection_rate}%` }}
                  ></div>
                </div>
                <p className="text-gray-600">
                  {formatCurrency(reportData.summary.total_collected)} collected out of {formatCurrency(reportData.summary.total_invoiced)} invoiced
                </p>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-3 gap-4">
                <div className="card p-6">
                  <p className="text-sm text-gray-600 mb-2">Fully Paid Invoices</p>
                  <p className="text-3xl font-bold text-green-600">{reportData.summary.paid_invoices}</p>
                  <p className="text-xs text-gray-500 mt-1">100% collected</p>
                </div>
                <div className="card p-6">
                  <p className="text-sm text-gray-600 mb-2">Partially Paid</p>
                  <p className="text-3xl font-bold text-orange-600">{reportData.summary.partial_invoices}</p>
                  <p className="text-xs text-gray-500 mt-1">Partial payment</p>
                </div>
                <div className="card p-6">
                  <p className="text-sm text-gray-600 mb-2">Total Invoices</p>
                  <p className="text-3xl font-bold text-gray-900">{reportData.summary.total_invoices}</p>
                  <p className="text-xs text-gray-500 mt-1">All invoices</p>
                </div>
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
