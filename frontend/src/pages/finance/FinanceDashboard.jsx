import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard, Receipt, Wallet,
  AlertTriangle, CheckCircle, Info, Brain, ArrowUpRight, BarChart3,
  PieChart, Users, Calendar, ArrowDownRight, Activity, FileText
} from 'lucide-react';

const API_BASE_URL = 'https://eea.mcaforo.com/backend/api';

export default function FinanceDashboard() {
  const { user } = useAuthStore();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchDashboardData();
  }, [user?.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/dashboard.php?role=finance&user_id=${user.id}`);
      if (response.data.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-600">Failed to load dashboard</p></div>;
  }

  const growthRate = dashboardData.revenue?.growth_rate || 0;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Finance Dashboard</h1>
            <p className="text-green-100 mt-1">Financial Management & Analytics</p>
          </div>
          <div className="text-right">
            <p className="text-green-100">This Month's Revenue</p>
            <p className="text-2xl font-bold">GHS {parseFloat(dashboardData.revenue?.this_month?.total || 0).toLocaleString()}</p>
            <div className={`flex items-center justify-end gap-1 text-sm ${growthRate >= 0 ? 'text-green-200' : 'text-red-200'}`}>
              {growthRate >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {Math.abs(growthRate)}% vs last month
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {dashboardData.insights?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg"><Brain className="text-green-600" size={24} /></div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">AI Insights</h2>
              <p className="text-gray-500 text-sm">Financial recommendations and alerts</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.insights.map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="This Month" 
          value={`GHS ${parseFloat(dashboardData.revenue?.this_month?.total || 0).toLocaleString()}`} 
          icon={<DollarSign className="text-green-600" size={24} />} 
          color="green"
          subtitle={`${dashboardData.revenue?.this_month?.count || 0} payments`}
        />
        <StatCard 
          title="This Year" 
          value={`GHS ${parseFloat(dashboardData.revenue?.this_year?.total || 0).toLocaleString()}`} 
          icon={<TrendingUp className="text-blue-600" size={24} />} 
          color="blue"
          subtitle={`${dashboardData.revenue?.this_year?.count || 0} payments`}
        />
        <StatCard 
          title="Outstanding" 
          value={`GHS ${parseFloat(dashboardData.fees?.outstanding || 0).toLocaleString()}`} 
          icon={<AlertTriangle className="text-orange-600" size={24} />} 
          color="orange"
          subtitle={`${dashboardData.outstanding?.summary?.count || 0} invoices`}
        />
        <StatCard 
          title="Collection Rate" 
          value={`${dashboardData.fees?.collection_rate || 0}%`} 
          icon={<PieChart className="text-purple-600" size={24} />} 
          color="purple"
          subtitle={dashboardData.fees?.collection_rate >= 85 ? 'On Target' : 'Below Target'}
        />
      </div>

      {/* Fee Collection & Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Fee Collection */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Fee Collection</h2>
            <Receipt className="text-green-600" size={24} />
          </div>
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <svg className="w-40 h-40">
                <circle className="text-gray-200" strokeWidth="12" stroke="currentColor" fill="transparent" r="64" cx="80" cy="80" />
                <circle className={dashboardData.fees?.collection_rate >= 85 ? 'text-green-500' : dashboardData.fees?.collection_rate >= 70 ? 'text-yellow-500' : 'text-red-500'} strokeWidth="12" strokeDasharray={`${(dashboardData.fees?.collection_rate || 0) * 4.02} 402`} strokeLinecap="round" stroke="currentColor" fill="transparent" r="64" cx="80" cy="80" transform="rotate(-90 80 80)" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-3xl font-bold">{dashboardData.fees?.collection_rate || 0}%</span>
                  <p className="text-sm text-gray-500">Collected</p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Invoiced</span>
              <span className="font-semibold text-gray-800">GHS {parseFloat(dashboardData.fees?.total_invoiced || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-gray-600">Total Collected</span>
              <span className="font-semibold text-green-600">GHS {parseFloat(dashboardData.fees?.total_collected || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-gray-600">Outstanding</span>
              <span className="font-semibold text-red-600">GHS {parseFloat(dashboardData.fees?.outstanding || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Expenses (Payroll) */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Payroll Expenses</h2>
            <Wallet className="text-purple-600" size={24} />
          </div>
          <div className="text-center p-6 bg-purple-50 rounded-xl mb-6">
            <p className="text-sm text-gray-600 mb-2">Total Payroll This Month</p>
            <p className="text-3xl font-bold text-purple-600">GHS {parseFloat(dashboardData.expenses?.payroll || 0).toLocaleString()}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-lg font-bold text-green-600">GHS {parseFloat(dashboardData.expenses?.payment_status?.paid || 0).toLocaleString()}</p>
              <p className="text-sm text-gray-600">Paid</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-lg font-bold text-orange-600">GHS {parseFloat(dashboardData.expenses?.payment_status?.pending || 0).toLocaleString()}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Earnings</span>
              <span className="text-gray-800">GHS {parseFloat(dashboardData.expenses?.breakdown?.earnings || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Deductions</span>
              <span className="text-gray-800">GHS {parseFloat(dashboardData.expenses?.breakdown?.deductions || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Outstanding & Debtors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Outstanding by Age */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Outstanding by Age</h2>
            <Calendar className="text-orange-600" size={24} />
          </div>
          <div className="space-y-3">
            {dashboardData.outstanding?.by_age?.map((item, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium ${item.age_bracket === '90+ days' ? 'text-red-600' : item.age_bracket === '61-90 days' ? 'text-orange-600' : 'text-gray-800'}`}>
                    {item.age_bracket}
                  </span>
                  <span className="font-semibold text-gray-800">GHS {parseFloat(item.total || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{item.count} invoices</span>
                  <span>{dashboardData.outstanding?.summary?.total > 0 ? Math.round((item.total / dashboardData.outstanding.summary.total) * 100) : 0}%</span>
                </div>
              </div>
            ))}
            {(!dashboardData.outstanding?.by_age || dashboardData.outstanding.by_age.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="mx-auto text-green-400 mb-2" size={48} />
                <p>No outstanding payments!</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Debtors */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Top Debtors</h2>
            <Users className="text-red-600" size={24} />
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {dashboardData.debtors?.map((debtor, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{debtor.student_name}</p>
                  <p className="text-sm text-gray-500">{debtor.class_name || 'N/A'} • {debtor.admission_number}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-red-600">GHS {parseFloat(debtor.total_owed || 0).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {(!dashboardData.debtors || dashboardData.debtors.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="mx-auto text-green-400 mb-2" size={48} />
                <p>No debtors!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Chart & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Revenue Trend (12 Months)</h2>
            <BarChart3 className="text-green-600" size={24} />
          </div>
          <div className="h-64">
            {dashboardData.charts?.revenue && <RevenueChart data={dashboardData.charts.revenue} />}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Recent Transactions</h2>
            <Activity className="text-blue-600" size={24} />
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {dashboardData.transactions?.map((tx, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-green-100 rounded-full">
                  <DollarSign className="text-green-600" size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{tx.student_name || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">{tx.payment_method || 'N/A'} • {tx.reference_number || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">GHS {parseFloat(tx.amount || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{formatDate(tx.payment_date)}</p>
                </div>
              </div>
            ))}
            {(!dashboardData.transactions || dashboardData.transactions.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="mx-auto text-gray-400 mb-2" size={48} />
                <p>No recent transactions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, subtitle }) {
  const colors = { green: 'bg-green-50', blue: 'bg-blue-50', orange: 'bg-orange-50', purple: 'bg-purple-50' };
  return (
    <div className={`${colors[color]} rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">{icon}</div>
      <p className="text-xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-600">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function InsightCard({ insight }) {
  const styles = {
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: AlertTriangle, iconColor: 'text-yellow-600' },
    alert: { bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle, iconColor: 'text-red-600' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: Info, iconColor: 'text-blue-600' },
    success: { bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle, iconColor: 'text-green-600' }
  };
  const style = styles[insight.type] || styles.info;
  const Icon = style.icon;
  return (
    <div className={`${style.bg} ${style.border} border rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <Icon className={style.iconColor} size={20} />
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800">{insight.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{insight.message}</p>
          {insight.action && <button className="mt-2 text-sm text-green-600 hover:text-green-800 font-medium flex items-center gap-1">{insight.action}<ArrowUpRight size={14} /></button>}
        </div>
      </div>
    </div>
  );
}

function RevenueChart({ data }) {
  const maxValue = Math.max(...data.map(d => d.amount), 1);
  return (
    <div className="flex items-end justify-between h-full gap-1">
      {data.map((month, index) => (
        <div key={index} className="flex-1 flex flex-col items-center gap-1">
          <div 
            className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t transition-all hover:from-green-600 hover:to-green-500"
            style={{ height: `${(month.amount / maxValue) * 200}px`, minHeight: month.amount > 0 ? '4px' : '0' }}
          ></div>
          <span className="text-xs text-gray-500">{month.month}</span>
        </div>
      ))}
    </div>
  );
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}
