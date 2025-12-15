import { useState } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, GraduationCap, FileText, Download, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState('this_month');

  const reportCategories = [
    {
      title: 'Academic Reports',
      icon: GraduationCap,
      color: 'blue',
      reports: [
        { name: 'Student Performance', description: 'View student grades and performance metrics', link: '/admin/reports/academic' },
        { name: 'Class Performance', description: 'Compare performance across classes', link: '/admin/reports/academic' },
        { name: 'Subject Analysis', description: 'Analyze performance by subject', link: '/admin/reports/academic' },
        { name: 'Attendance Summary', description: 'Student attendance statistics', link: '/admin/reports/academic' }
      ]
    },
    {
      title: 'Financial Reports',
      icon: DollarSign,
      color: 'green',
      reports: [
        { name: 'Revenue Report', description: 'Total revenue and collections', link: '/admin/reports/financial' },
        { name: 'Outstanding Fees', description: 'Unpaid invoices and balances', link: '/admin/reports/financial' },
        { name: 'Payment History', description: 'Payment transactions over time', link: '/admin/reports/financial' },
        { name: 'Fee Collection Rate', description: 'Collection efficiency metrics', link: '/admin/reports/financial' }
      ]
    },
    {
      title: 'Student Reports',
      icon: Users,
      color: 'purple',
      reports: [
        { name: 'Enrollment Report', description: 'Student enrollment statistics', link: '/admin/reports/students' },
        { name: 'Demographics', description: 'Student demographic breakdown', link: '/admin/reports/students' },
        { name: 'Class Distribution', description: 'Students per class/level', link: '/admin/reports/students' },
        { name: 'New Admissions', description: 'Recent admission statistics', link: '/admin/reports/students' }
      ]
    },
    {
      title: 'Executive Reports',
      icon: TrendingUp,
      color: 'orange',
      reports: [
        { name: 'Executive Dashboard', description: 'High-level overview of all metrics', link: '/admin/reports/executive' },
        { name: 'Monthly Summary', description: 'Comprehensive monthly report', link: '/admin/reports/executive' },
        { name: 'Year-over-Year', description: 'Compare performance across years', link: '/admin/reports/executive' },
        { name: 'Custom Report Builder', description: 'Create custom reports', link: '/admin/reports/custom' }
      ]
    }
  ];

  const quickStats = [
    { label: 'Total Students', value: '1,234', change: '+5.2%', trend: 'up', icon: Users, color: 'blue' },
    { label: 'Revenue (This Month)', value: '₵45,230', change: '+12.3%', trend: 'up', icon: DollarSign, color: 'green' },
    { label: 'Attendance Rate', value: '94.5%', change: '+2.1%', trend: 'up', icon: GraduationCap, color: 'purple' },
    { label: 'Outstanding Fees', value: '₵12,450', change: '-8.4%', trend: 'down', icon: FileText, color: 'orange' }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Generate and view comprehensive reports</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="input"
          >
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="this_term">This Term</option>
            <option value="this_year">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColorClasses(stat.color)}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Report Categories */}
      {reportCategories.map((category, catIndex) => {
        const Icon = category.icon;
        return (
          <div key={catIndex} className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClasses(category.color)}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">{category.title}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.reports.map((report, repIndex) => (
                <Link
                  key={repIndex}
                  to={report.link}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 group-hover:text-blue-600">{report.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                    </div>
                    <BarChart3 className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}

      {/* Recent Reports */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recently Generated Reports</h2>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All</button>
        </div>
        
        <div className="space-y-3">
          {[
            { name: 'Monthly Financial Summary - November 2024', date: '2024-11-25', size: '245 KB' },
            { name: 'Student Performance Report - Term 1', date: '2024-11-20', size: '1.2 MB' },
            { name: 'Attendance Report - Week 12', date: '2024-11-18', size: '156 KB' }
          ].map((report, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{report.name}</p>
                  <p className="text-sm text-gray-600">{report.date} • {report.size}</p>
                </div>
              </div>
              <button className="btn bg-gray-200 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
