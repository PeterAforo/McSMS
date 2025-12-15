import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  TrendingUp, Users, DollarSign, Calendar, AlertTriangle, Award, 
  Download, RefreshCw, BarChart3, PieChart, FileText, GraduationCap,
  BookOpen, Clock, ChevronRight, ArrowUp, ArrowDown, Briefcase, Filter,
  Search, UserCheck, ClipboardList, Printer, Mail, Target, Bell, Settings,
  TrendingDown, Percent, Activity, Layers, GitCompare, Eye, X, Check,
  ChevronDown, Play, Pause, Zap
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Tab-specific data
  const [studentData, setStudentData] = useState({ distribution: [], performance: [], atRisk: [], gradeDistribution: [], progress: [] });
  const [financeData, setFinanceData] = useState({ trends: [], collection: [], paymentMethods: [], projections: [], collectionRate: 0 });
  const [attendanceData, setAttendanceData] = useState({ trends: [], byClass: [], absentees: [], patterns: [], weekday: [] });
  const [examData, setExamData] = useState({ trends: [], subjectPerformance: [], gradeBreakdown: [], classRankings: [] });
  const [teacherData, setTeacherData] = useState({ workload: [], performance: [], studentOutcomes: [] });
  const [customReport, setCustomReport] = useState({ results: [], filters: { class_id: '', status: '', date_from: '', date_to: '' } });
  const [classes, setClasses] = useState([]);
  const [terms, setTerms] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);

  // Enhanced filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [academicYear, setAcademicYear] = useState('2024/2025');
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);

  // KPI and Targets
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [kpiTargets, setKpiTargets] = useState({
    revenue_target: 500000,
    attendance_target: 90,
    collection_rate_target: 85,
    pass_rate_target: 80
  });
  const [alerts, setAlerts] = useState([]);
  const [scheduledReports, setScheduledReports] = useState([]);

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(false);
  const refreshInterval = useRef(null);

  // Drill-down
  const [drillDownData, setDrillDownData] = useState(null);
  const [showDrillDown, setShowDrillDown] = useState(false);

  const academicYears = ['2022/2023', '2023/2024', '2024/2025', '2025/2026'];

  useEffect(() => {
    fetchOverview();
    fetchClasses();
    fetchTerms();
    loadSavedSettings();
  }, []);

  useEffect(() => {
    if (activeTab !== 'overview') {
      loadTabData(activeTab);
    }
  }, [activeTab, dateFrom, dateTo, selectedTerm, academicYear]);

  useEffect(() => {
    if (autoRefresh) {
      refreshInterval.current = setInterval(() => {
        fetchOverview();
        if (activeTab !== 'overview') loadTabData(activeTab);
      }, 60000); // Refresh every minute
    } else {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    }
    return () => { if (refreshInterval.current) clearInterval(refreshInterval.current); };
  }, [autoRefresh, activeTab]);

  useEffect(() => {
    checkAlerts();
  }, [overview, financeData, attendanceData]);

  const loadSavedSettings = () => {
    const savedTargets = localStorage.getItem('analytics_kpi_targets');
    if (savedTargets) setKpiTargets(JSON.parse(savedTargets));
    const savedSchedules = localStorage.getItem('analytics_scheduled_reports');
    if (savedSchedules) setScheduledReports(JSON.parse(savedSchedules));
  };

  const saveKpiTargets = () => {
    localStorage.setItem('analytics_kpi_targets', JSON.stringify(kpiTargets));
    setShowTargetModal(false);
    alert('KPI targets saved!');
  };

  const checkAlerts = () => {
    const newAlerts = [];
    if (overview) {
      const collectionRate = overview.revenue_ytd / (overview.revenue_ytd + overview.overdue_amount) * 100;
      if (collectionRate < kpiTargets.collection_rate_target) {
        newAlerts.push({ type: 'warning', message: `Collection rate (${collectionRate.toFixed(1)}%) below target (${kpiTargets.collection_rate_target}%)` });
      }
      if (parseFloat(overview.avg_attendance_30days) < kpiTargets.attendance_target) {
        newAlerts.push({ type: 'warning', message: `Attendance (${overview.avg_attendance_30days}%) below target (${kpiTargets.attendance_target}%)` });
      }
    }
    setAlerts(newAlerts);
  };

  const fetchTerms = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/terms.php`);
      setTerms(res.data.terms || []);
    } catch (e) { console.error(e); }
  };

  const fetchOverview = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/analytics.php?resource=overview`);
      if (response.data.success) {
        setOverview(response.data.overview);
      }
    } catch (error) {
      console.error('Error fetching overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    if (selectedTerm) params.append('term_id', selectedTerm);
    if (academicYear) params.append('academic_year', academicYear);
    return params.toString() ? `&${params.toString()}` : '';
  };

  const loadTabData = async (tab) => {
    setTabLoading(true);
    const queryParams = buildQueryParams();
    try {
      if (tab === 'students') {
        const [distRes, perfRes, riskRes, gradeRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/analytics.php?resource=students&action=by_class${queryParams}`),
          axios.get(`${API_BASE_URL}/analytics.php?resource=students&action=performance${queryParams}`),
          axios.get(`${API_BASE_URL}/analytics.php?resource=students&action=at_risk${queryParams}`),
          axios.get(`${API_BASE_URL}/analytics.php?resource=students&action=grade_distribution${queryParams}`)
        ]);
        setStudentData({
          distribution: distRes.data.distribution || [],
          performance: perfRes.data.performance || [],
          atRisk: riskRes.data.at_risk_students || [],
          gradeDistribution: gradeRes.data.grade_distribution || [],
          progress: []
        });
      } else if (tab === 'finance') {
        const [trendRes, collRes, methodRes, projRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/analytics.php?resource=finance&action=revenue_trends${queryParams}`),
          axios.get(`${API_BASE_URL}/analytics.php?resource=finance&action=collection_rate${queryParams}`),
          axios.get(`${API_BASE_URL}/analytics.php?resource=finance&action=payment_methods${queryParams}`),
          axios.get(`${API_BASE_URL}/analytics.php?resource=finance&action=projections${queryParams}`)
        ]);
        setFinanceData({
          trends: trendRes.data.trends || [],
          collection: collRes.data.collection || [],
          paymentMethods: methodRes.data.payment_methods || [],
          projections: projRes.data.projections || [],
          collectionRate: collRes.data.rate || 0
        });
        
        // Load comparison data if enabled
        if (comparisonMode) {
          try {
            const compRes = await axios.get(`${API_BASE_URL}/analytics.php?resource=finance&action=comparison${queryParams}`);
            setComparisonData(compRes.data.comparison || null);
          } catch (e) { console.error(e); }
        }
      } else if (tab === 'attendance') {
        const [attTrendRes, attClassRes, absentRes, weekdayRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/analytics.php?resource=attendance&action=trends${queryParams}`),
          axios.get(`${API_BASE_URL}/analytics.php?resource=attendance&action=by_class${queryParams}`),
          axios.get(`${API_BASE_URL}/analytics.php?resource=attendance&action=chronic_absentees${queryParams}`),
          axios.get(`${API_BASE_URL}/analytics.php?resource=attendance&action=weekday_pattern${queryParams}`)
        ]);
        setAttendanceData({
          trends: attTrendRes.data.trends || [],
          byClass: attClassRes.data.by_class || [],
          absentees: absentRes.data.chronic_absentees || [],
          patterns: [],
          weekday: weekdayRes.data.weekday_pattern || []
        });
      } else if (tab === 'exams') {
        const [examTrendRes, subjectRes, gradeRes, rankRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/analytics.php?resource=exams&action=performance_trends${queryParams}`),
          axios.get(`${API_BASE_URL}/analytics.php?resource=exams&action=subject_performance${queryParams}`),
          axios.get(`${API_BASE_URL}/analytics.php?resource=exams&action=grade_breakdown${queryParams}`),
          axios.get(`${API_BASE_URL}/analytics.php?resource=exams&action=class_rankings${queryParams}`)
        ]);
        setExamData({
          trends: examTrendRes.data.trends || [],
          subjectPerformance: subjectRes.data.subject_performance || [],
          gradeBreakdown: gradeRes.data.grade_breakdown || [],
          classRankings: rankRes.data.class_rankings || []
        });
      } else if (tab === 'teachers') {
        const [workloadRes, perfRes, outcomesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/analytics.php?resource=teachers&action=workload${queryParams}`),
          axios.get(`${API_BASE_URL}/analytics.php?resource=teachers&action=performance${queryParams}`),
          axios.get(`${API_BASE_URL}/analytics.php?resource=teachers&action=student_outcomes${queryParams}`)
        ]);
        setTeacherData({
          workload: workloadRes.data.workload || [],
          performance: perfRes.data.performance || [],
          studentOutcomes: outcomesRes.data.student_outcomes || []
        });
      }
    } catch (error) {
      console.error(`Error loading ${tab} data:`, error);
    } finally {
      setTabLoading(false);
    }
  };

  const handleDrillDown = async (type, id, name) => {
    setTabLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/analytics.php?resource=drilldown&type=${type}&id=${id}`);
      setDrillDownData({ type, name, data: res.data.details || [] });
      setShowDrillDown(true);
    } catch (e) { console.error(e); }
    finally { setTabLoading(false); }
  };

  const addScheduledReport = (report) => {
    const updated = [...scheduledReports, { ...report, id: Date.now() }];
    setScheduledReports(updated);
    localStorage.setItem('analytics_scheduled_reports', JSON.stringify(updated));
    setShowScheduleModal(false);
    alert('Report scheduled!');
  };

  const removeScheduledReport = (id) => {
    const updated = scheduledReports.filter(r => r.id !== id);
    setScheduledReports(updated);
    localStorage.setItem('analytics_scheduled_reports', JSON.stringify(updated));
  };

  const exportToExcel = () => {
    // Export current tab data to CSV
    let csvContent = '';
    let filename = '';
    
    if (activeTab === 'students' && studentData.distribution.length > 0) {
      csvContent = 'Class,Total,Male,Female\n' + studentData.distribution.map(d => 
        `${d.class_name},${d.student_count},${d.male_count},${d.female_count}`
      ).join('\n');
      filename = 'student_distribution';
    } else if (activeTab === 'finance' && financeData.trends.length > 0) {
      csvContent = 'Month,Revenue,Payments\n' + financeData.trends.map(t => 
        `${t.month},${t.revenue},${t.payment_count}`
      ).join('\n');
      filename = 'finance_trends';
    } else if (activeTab === 'attendance' && attendanceData.byClass.length > 0) {
      csvContent = 'Class,Present,Absent,Rate\n' + attendanceData.byClass.map(a => 
        `${a.class_name},${a.present_count},${a.absent_count},${a.attendance_rate}%`
      ).join('\n');
      filename = 'attendance_by_class';
    } else if (activeTab === 'exams' && examData.trends.length > 0) {
      csvContent = 'Exam,Students,Average,Highest,Lowest\n' + examData.trends.map(e => 
        `${e.exam_name},${e.student_count},${e.avg_percentage}%,${e.highest_percentage}%,${e.lowest_percentage}%`
      ).join('\n');
      filename = 'exam_performance';
    } else {
      alert('No data to export');
      return;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Analytics Report - ${activeTab}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 30px; }
        h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #f3f4f6; }
        .stat { display: inline-block; margin: 10px; padding: 15px; background: #f0f9ff; border-radius: 8px; }
      </style></head><body>
      <h1>Analytics Report - ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
      ${generatePrintContent()}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const generatePrintContent = () => {
    if (activeTab === 'overview' && overview) {
      return `
        <div class="stat"><strong>Students:</strong> ${overview.total_students}</div>
        <div class="stat"><strong>Teachers:</strong> ${overview.total_teachers}</div>
        <div class="stat"><strong>Revenue YTD:</strong> ${formatCurrency(overview.revenue_ytd)}</div>
        <div class="stat"><strong>Attendance:</strong> ${formatPercent(overview.avg_attendance_30days)}</div>
      `;
    }
    if (activeTab === 'students' && studentData.distribution.length > 0) {
      return `<table><tr><th>Class</th><th>Total</th><th>Male</th><th>Female</th></tr>
        ${studentData.distribution.map(d => `<tr><td>${d.class_name}</td><td>${d.student_count}</td><td>${d.male_count}</td><td>${d.female_count}</td></tr>`).join('')}
      </table>`;
    }
    if (activeTab === 'finance' && financeData.trends.length > 0) {
      return `<table><tr><th>Month</th><th>Revenue</th><th>Payments</th></tr>
        ${financeData.trends.map(t => `<tr><td>${t.month}</td><td>${formatCurrency(t.revenue)}</td><td>${t.payment_count}</td></tr>`).join('')}
      </table>`;
    }
    return '<p>No data available</p>';
  };

  // Calculate KPI progress
  const getKpiProgress = () => {
    if (!overview) return {};
    const collectionRate = overview.revenue_ytd / (overview.revenue_ytd + (overview.overdue_amount || 1)) * 100;
    return {
      revenue: { current: overview.revenue_ytd, target: kpiTargets.revenue_target, percent: Math.min((overview.revenue_ytd / kpiTargets.revenue_target) * 100, 100) },
      attendance: { current: parseFloat(overview.avg_attendance_30days) || 0, target: kpiTargets.attendance_target, percent: Math.min((parseFloat(overview.avg_attendance_30days) / kpiTargets.attendance_target) * 100, 100) },
      collection: { current: collectionRate, target: kpiTargets.collection_rate_target, percent: Math.min((collectionRate / kpiTargets.collection_rate_target) * 100, 100) }
    };
  };

  const fetchClasses = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/classes.php`);
      setClasses(res.data.classes || []);
    } catch (e) { console.error(e); }
  };

  const runCustomReport = async () => {
    setTabLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/analytics.php?resource=custom_report`, customReport.filters);
      setCustomReport(prev => ({ ...prev, results: res.data.results || [] }));
    } catch (e) { console.error(e); }
    finally { setTabLoading(false); }
  };

  const exportToPDF = async (type) => {
    // Fetch fresh data for export
    let exportStudentData = studentData;
    let exportFinanceData = financeData;
    let exportAttendanceData = attendanceData;
    let exportExamData = examData;
    let exportOverview = overview;

    try {
      // Always fetch overview
      const overviewRes = await axios.get(`${API_BASE_URL}/analytics.php?resource=overview`);
      if (overviewRes.data.success) {
        exportOverview = overviewRes.data.overview;
      }

      if (type === 'all' || type === 'students') {
        const [distRes, perfRes, riskRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/analytics.php?resource=students&action=by_class`),
          axios.get(`${API_BASE_URL}/analytics.php?resource=students&action=performance`),
          axios.get(`${API_BASE_URL}/analytics.php?resource=students&action=at_risk`)
        ]);
        exportStudentData = {
          distribution: distRes.data.distribution || [],
          performance: perfRes.data.performance || [],
          atRisk: riskRes.data.at_risk_students || []
        };
      }
      
      if (type === 'all' || type === 'finance') {
        const [trendRes, collRes, methodRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/analytics.php?resource=finance&action=revenue_trends`),
          axios.get(`${API_BASE_URL}/analytics.php?resource=finance&action=collection_rate`),
          axios.get(`${API_BASE_URL}/analytics.php?resource=finance&action=payment_methods`)
        ]);
        exportFinanceData = {
          trends: trendRes.data.trends || [],
          collection: collRes.data.collection || [],
          paymentMethods: methodRes.data.payment_methods || []
        };
      }
      
      if (type === 'all' || type === 'attendance') {
        const [attTrendRes, attClassRes, absentRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/analytics.php?resource=attendance&action=trends`),
          axios.get(`${API_BASE_URL}/analytics.php?resource=attendance&action=by_class`),
          axios.get(`${API_BASE_URL}/analytics.php?resource=attendance&action=chronic_absentees`)
        ]);
        exportAttendanceData = {
          trends: attTrendRes.data.trends || [],
          byClass: attClassRes.data.by_class || [],
          absentees: absentRes.data.chronic_absentees || []
        };
      }
      
      if (type === 'all' || type === 'exams') {
        const examTrendRes = await axios.get(`${API_BASE_URL}/analytics.php?resource=exams&action=performance_trends`);
        exportExamData = {
          trends: examTrendRes.data.trends || [],
          subjectPerformance: []
        };
      }
    } catch (error) {
      console.error('Error fetching data for export:', error);
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(31, 41, 55);
    doc.text('Analytics Report', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128);
    doc.text(`Generated: ${today}`, pageWidth / 2, 28, { align: 'center' });
    
    let yPos = 40;

    if (type === 'overview' || type === 'all') {
      // Overview Section
      doc.setFontSize(16);
      doc.setTextColor(31, 41, 55);
      doc.text('Overview Summary', 14, yPos);
      yPos += 10;

      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: [
          ['Total Students', exportOverview?.total_students || 0],
          ['Total Teachers', exportOverview?.total_teachers || 0],
          ['Total Classes', exportOverview?.total_classes || 0],
          ['LMS Courses', exportOverview?.total_courses || 0],
          ['Revenue YTD', formatCurrency(exportOverview?.revenue_ytd)],
          ['Overdue Fees', formatCurrency(exportOverview?.overdue_amount)],
          ['Pending Applications', exportOverview?.pending_applications || 0],
          ['Avg Attendance (30 days)', formatPercent(exportOverview?.avg_attendance_30days)],
        ],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });
      yPos = doc.lastAutoTable.finalY + 15;
    }

    if (type === 'students' || type === 'all') {
      if (yPos > 240) { doc.addPage(); yPos = 20; }
      
      doc.setFontSize(16);
      doc.setTextColor(31, 41, 55);
      doc.text('Student Distribution by Class', 14, yPos);
      yPos += 10;

      if (exportStudentData.distribution.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [['Class', 'Total', 'Male', 'Female']],
          body: exportStudentData.distribution.map(item => [
            item.class_name,
            item.student_count,
            item.male_count,
            item.female_count
          ]),
          theme: 'striped',
          headStyles: { fillColor: [34, 197, 94] },
        });
        yPos = doc.lastAutoTable.finalY + 15;
      }

      if (exportStudentData.atRisk.length > 0) {
        if (yPos > 240) { doc.addPage(); yPos = 20; }
        
        doc.setFontSize(14);
        doc.text('At-Risk Students', 14, yPos);
        yPos += 8;

        autoTable(doc, {
          startY: yPos,
          head: [['Student', 'Class', 'Avg %', 'Attendance', 'Risk Reason']],
          body: exportStudentData.atRisk.map(s => [
            s.student_name,
            s.class_name,
            formatPercent(s.avg_percentage),
            formatPercent(s.attendance_rate),
            s.risk_reason
          ]),
          theme: 'striped',
          headStyles: { fillColor: [239, 68, 68] },
        });
        yPos = doc.lastAutoTable.finalY + 15;
      }
    }

    if (type === 'finance' || type === 'all') {
      if (yPos > 240) { doc.addPage(); yPos = 20; }
      
      doc.setFontSize(16);
      doc.setTextColor(31, 41, 55);
      doc.text('Financial Analytics', 14, yPos);
      yPos += 10;

      if (exportFinanceData.trends.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [['Month', 'Revenue', 'Payments']],
          body: exportFinanceData.trends.map(item => [
            item.month,
            formatCurrency(item.revenue),
            item.payment_count
          ]),
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129] },
        });
        yPos = doc.lastAutoTable.finalY + 15;
      }

      if (exportFinanceData.paymentMethods.length > 0) {
        if (yPos > 240) { doc.addPage(); yPos = 20; }
        
        doc.setFontSize(14);
        doc.text('Payment Methods', 14, yPos);
        yPos += 8;

        autoTable(doc, {
          startY: yPos,
          head: [['Method', 'Transactions', 'Total Amount']],
          body: exportFinanceData.paymentMethods.map(m => [
            m.payment_method?.replace('_', ' ') || 'Unknown',
            m.transaction_count,
            formatCurrency(m.total_amount)
          ]),
          theme: 'striped',
          headStyles: { fillColor: [139, 92, 246] },
        });
        yPos = doc.lastAutoTable.finalY + 15;
      }
    }

    if (type === 'attendance' || type === 'all') {
      if (yPos > 240) { doc.addPage(); yPos = 20; }
      
      doc.setFontSize(16);
      doc.setTextColor(31, 41, 55);
      doc.text('Attendance Analytics', 14, yPos);
      yPos += 10;

      if (exportAttendanceData.byClass.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [['Class', 'Present', 'Absent', 'Rate']],
          body: exportAttendanceData.byClass.map(item => [
            item.class_name,
            item.present_count,
            item.absent_count,
            formatPercent(item.attendance_rate)
          ]),
          theme: 'striped',
          headStyles: { fillColor: [168, 85, 247] },
        });
        yPos = doc.lastAutoTable.finalY + 15;
      } else {
        doc.setFontSize(11);
        doc.setTextColor(107, 114, 128);
        doc.text('No attendance data available for the last 30 days.', 14, yPos);
        yPos += 15;
      }
    }

    if (type === 'exams' || type === 'all') {
      if (yPos > 240) { doc.addPage(); yPos = 20; }
      
      doc.setFontSize(16);
      doc.setTextColor(31, 41, 55);
      doc.text('Exam Performance', 14, yPos);
      yPos += 10;

      if (exportExamData.trends.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [['Exam', 'Students', 'Avg %', 'Highest', 'Lowest']],
          body: exportExamData.trends.map(exam => [
            exam.exam_name,
            exam.student_count,
            formatPercent(exam.avg_percentage),
            formatPercent(exam.highest_percentage),
            formatPercent(exam.lowest_percentage)
          ]),
          theme: 'striped',
          headStyles: { fillColor: [249, 115, 22] },
        });
      } else {
        doc.setFontSize(11);
        doc.setTextColor(107, 114, 128);
        doc.text('No exam performance data available.', 14, yPos);
      }
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(156, 163, 175);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    // Save
    const filename = type === 'all' ? 'analytics_full_report' : `analytics_${type}`;
    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const formatCurrency = (amount) => {
    return `GHS ${(parseFloat(amount) || 0).toLocaleString()}`;
  };

  const formatPercent = (value) => {
    return `${(parseFloat(value) || 0).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Loading analytics...</span>
      </div>
    );
  }

  const kpiProgress = getKpiProgress();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights, predictions, and KPI tracking</p>
          {alerts.length > 0 && (
            <div className="mt-2 flex gap-2">
              {alerts.map((alert, idx) => (
                <span key={idx} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm flex items-center gap-1">
                  <AlertTriangle size={14} /> {alert.message}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setAutoRefresh(!autoRefresh)} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${autoRefresh ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`} title="Auto-refresh">
            {autoRefresh ? <Pause size={16} /> : <Play size={16} />}
            {autoRefresh ? 'Auto' : 'Manual'}
          </button>
          <button onClick={() => setShowTargetModal(true)} className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200" title="KPI Targets">
            <Target size={16} /> Targets
          </button>
          <button onClick={() => setShowScheduleModal(true)} className="flex items-center gap-2 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200" title="Schedule Reports">
            <Mail size={16} /> Schedule
          </button>
          <button onClick={printReport} className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            <Printer size={16} /> Print
          </button>
          <button onClick={exportToExcel} className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
            <Download size={16} /> Excel
          </button>
          <button onClick={() => exportToPDF(activeTab)} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <FileText size={16} /> PDF
          </button>
          <button onClick={() => { fetchOverview(); if (activeTab !== 'overview') loadTabData(activeTab); }} className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-500" />
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border rounded px-3 py-1.5 text-sm" />
            <span className="text-gray-400">to</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border rounded px-3 py-1.5 text-sm" />
          </div>
          <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
            <option value="">All Terms</option>
            {terms.map(t => <option key={t.id} value={t.id}>{t.term_name}</option>)}
          </select>
          <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
            {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => setComparisonMode(!comparisonMode)} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${comparisonMode ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
            <GitCompare size={16} /> Compare
          </button>
          <button onClick={() => { setDateFrom(''); setDateTo(''); setSelectedTerm(''); }} className="text-sm text-gray-500 hover:text-gray-700">
            Clear Filters
          </button>
        </div>
      </div>

      {/* KPI Progress Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Revenue vs Target</span>
              <span className={`text-sm font-medium ${kpiProgress.revenue?.percent >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                {kpiProgress.revenue?.percent?.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className={`h-3 rounded-full ${kpiProgress.revenue?.percent >= 100 ? 'bg-green-500' : kpiProgress.revenue?.percent >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${kpiProgress.revenue?.percent || 0}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-1">{formatCurrency(kpiProgress.revenue?.current)} / {formatCurrency(kpiProgress.revenue?.target)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Attendance vs Target</span>
              <span className={`text-sm font-medium ${kpiProgress.attendance?.percent >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                {kpiProgress.attendance?.percent?.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className={`h-3 rounded-full ${kpiProgress.attendance?.percent >= 100 ? 'bg-green-500' : kpiProgress.attendance?.percent >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${kpiProgress.attendance?.percent || 0}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-1">{kpiProgress.attendance?.current?.toFixed(1)}% / {kpiProgress.attendance?.target}%</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Collection Rate vs Target</span>
              <span className={`text-sm font-medium ${kpiProgress.collection?.percent >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                {kpiProgress.collection?.percent?.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className={`h-3 rounded-full ${kpiProgress.collection?.percent >= 100 ? 'bg-green-500' : kpiProgress.collection?.percent >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${kpiProgress.collection?.percent || 0}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-1">{kpiProgress.collection?.current?.toFixed(1)}% / {kpiProgress.collection?.target}%</p>
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <Users size={32} />
            <div className="flex items-center text-blue-200">
              <ArrowUp size={16} />
              <span className="text-sm">Active</span>
            </div>
          </div>
          <p className="text-blue-100 text-sm">Total Students</p>
          <p className="text-3xl font-bold">{overview?.total_students || 0}</p>
          <p className="text-blue-200 text-xs mt-1">{overview?.total_teachers || 0} Teachers • {overview?.total_classes || 0} Classes</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign size={32} />
            <TrendingUp size={20} className="text-green-200" />
          </div>
          <p className="text-green-100 text-sm">Revenue YTD</p>
          <p className="text-3xl font-bold">{formatCurrency(overview?.revenue_ytd)}</p>
          <p className="text-green-200 text-xs mt-1">Year to date collections</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg shadow-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <Calendar size={32} />
            <span className="text-purple-200 text-sm">30 days</span>
          </div>
          <p className="text-purple-100 text-sm">Avg Attendance</p>
          <p className="text-3xl font-bold">{formatPercent(overview?.avg_attendance_30days)}</p>
          <p className="text-purple-200 text-xs mt-1">Last 30 days average</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-lg shadow-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle size={32} />
            <ArrowDown size={20} className="text-orange-200" />
          </div>
          <p className="text-orange-100 text-sm">Outstanding Balance</p>
          <p className="text-3xl font-bold">{formatCurrency(overview?.overdue_amount)}</p>
          <p className="text-orange-200 text-xs mt-1">Unpaid fees to collect</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <div className="flex overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'students', label: 'Students', icon: GraduationCap },
              { id: 'finance', label: 'Finance', icon: DollarSign },
              { id: 'attendance', label: 'Attendance', icon: Calendar },
              { id: 'exams', label: 'Exams', icon: Award },
              { id: 'teachers', label: 'Teachers', icon: Briefcase },
              { id: 'reports', label: 'Custom Reports', icon: ClipboardList }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {tabLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2">Loading data...</span>
            </div>
          ) : (
            <>
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Users className="text-blue-600" />
                        Student Overview
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Total Students:</span>
                          <span className="font-semibold text-lg">{overview?.total_students || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Active Teachers:</span>
                          <span className="font-semibold text-lg">{overview?.total_teachers || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Active Classes:</span>
                          <span className="font-semibold text-lg">{overview?.total_classes || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">LMS Courses:</span>
                          <span className="font-semibold text-lg">{overview?.total_courses || 0}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setActiveTab('students')}
                        className="mt-4 w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-800"
                      >
                        View Details <ChevronRight size={18} />
                      </button>
                    </div>

                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <DollarSign className="text-green-600" />
                        Financial Overview
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Revenue YTD:</span>
                          <span className="font-semibold text-lg text-green-600">
                            {formatCurrency(overview?.revenue_ytd)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Overdue Amount:</span>
                          <span className="font-semibold text-lg text-red-600">
                            {formatCurrency(overview?.overdue_amount)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Pending Applications:</span>
                          <span className="font-semibold text-lg">{overview?.pending_applications || 0}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setActiveTab('finance')}
                        className="mt-4 w-full flex items-center justify-center gap-2 text-green-600 hover:text-green-800"
                      >
                        View Details <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <button 
                        onClick={() => setActiveTab('students')}
                        className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700"
                      >
                        <GraduationCap size={20} />
                        Student Report
                      </button>
                      <button 
                        onClick={() => setActiveTab('finance')}
                        className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700"
                      >
                        <DollarSign size={20} />
                        Finance Report
                      </button>
                      <button 
                        onClick={() => setActiveTab('attendance')}
                        className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700"
                      >
                        <Calendar size={20} />
                        Attendance Report
                      </button>
                      <button 
                        onClick={() => exportToPDF('all')}
                        className="flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700"
                      >
                        <Download size={20} />
                        Export Full PDF
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STUDENTS TAB */}
              {activeTab === 'students' && (
                <div className="space-y-6">
                  {/* Class Distribution */}
                  <div className="border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <PieChart className="text-blue-600" />
                      Students by Class
                    </h3>
                    {studentData.distribution.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left">Class</th>
                              <th className="px-4 py-2 text-right">Total</th>
                              <th className="px-4 py-2 text-right">Male</th>
                              <th className="px-4 py-2 text-right">Female</th>
                              <th className="px-4 py-2 text-left">Distribution</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentData.distribution.map((item, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="px-4 py-2 font-medium">{item.class_name}</td>
                                <td className="px-4 py-2 text-right">{item.student_count}</td>
                                <td className="px-4 py-2 text-right text-blue-600">{item.male_count}</td>
                                <td className="px-4 py-2 text-right text-pink-600">{item.female_count}</td>
                                <td className="px-4 py-2">
                                  <div className="flex gap-1">
                                    <div 
                                      className="h-4 bg-blue-500 rounded"
                                      style={{ width: `${(item.male_count / (item.student_count || 1)) * 100}px` }}
                                    />
                                    <div 
                                      className="h-4 bg-pink-500 rounded"
                                      style={{ width: `${(item.female_count / (item.student_count || 1)) * 100}px` }}
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No class distribution data available</p>
                    )}
                  </div>

                  {/* At-Risk Students */}
                  <div className="border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <AlertTriangle className="text-red-600" />
                      At-Risk Students
                    </h3>
                    {studentData.atRisk.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left">Student</th>
                              <th className="px-4 py-2 text-left">Class</th>
                              <th className="px-4 py-2 text-right">Avg %</th>
                              <th className="px-4 py-2 text-right">Attendance</th>
                              <th className="px-4 py-2 text-left">Risk Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentData.atRisk.map((student, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="px-4 py-2 font-medium">{student.student_name}</td>
                                <td className="px-4 py-2">{student.class_name}</td>
                                <td className="px-4 py-2 text-right text-red-600">
                                  {formatPercent(student.avg_percentage)}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  {formatPercent(student.attendance_rate)}
                                </td>
                                <td className="px-4 py-2">
                                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm">
                                    {student.risk_reason}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-green-600 text-center py-4">✓ No at-risk students identified</p>
                    )}
                  </div>
                </div>
              )}

              {/* FINANCE TAB */}
              {activeTab === 'finance' && (
                <div className="space-y-6">
                  {/* Revenue Trends */}
                  <div className="border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="text-green-600" />
                      Revenue Trends (Last 12 Months)
                    </h3>
                    {financeData.trends.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left">Month</th>
                              <th className="px-4 py-2 text-right">Revenue</th>
                              <th className="px-4 py-2 text-right">Payments</th>
                              <th className="px-4 py-2 text-left">Trend</th>
                            </tr>
                          </thead>
                          <tbody>
                            {financeData.trends.map((item, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="px-4 py-2 font-medium">{item.month}</td>
                                <td className="px-4 py-2 text-right text-green-600 font-semibold">
                                  {formatCurrency(item.revenue)}
                                </td>
                                <td className="px-4 py-2 text-right">{item.payment_count}</td>
                                <td className="px-4 py-2">
                                  <div className="w-full bg-gray-200 rounded h-4">
                                    <div 
                                      className="bg-green-500 h-4 rounded"
                                      style={{ 
                                        width: `${Math.min((parseFloat(item.revenue) / Math.max(...financeData.trends.map(t => parseFloat(t.revenue) || 0))) * 100, 100)}%` 
                                      }}
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No revenue data available</p>
                    )}
                  </div>

                  {/* Payment Methods */}
                  <div className="border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <PieChart className="text-purple-600" />
                      Payment Methods (Last 30 Days)
                    </h3>
                    {financeData.paymentMethods.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {financeData.paymentMethods.map((method, idx) => (
                          <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-gray-600 capitalize">{method.payment_method?.replace('_', ' ') || 'Unknown'}</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(method.total_amount)}</p>
                            <p className="text-sm text-gray-500">{method.transaction_count} transactions</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No payment method data available</p>
                    )}
                  </div>
                </div>
              )}

              {/* ATTENDANCE TAB */}
              {activeTab === 'attendance' && (
                <div className="space-y-6">
                  {/* Attendance by Class */}
                  <div className="border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <BarChart3 className="text-purple-600" />
                      Attendance by Class (Last 30 Days)
                    </h3>
                    {attendanceData.byClass.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left">Class</th>
                              <th className="px-4 py-2 text-right">Present</th>
                              <th className="px-4 py-2 text-right">Absent</th>
                              <th className="px-4 py-2 text-right">Rate</th>
                              <th className="px-4 py-2 text-left">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendanceData.byClass.map((item, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="px-4 py-2 font-medium">{item.class_name}</td>
                                <td className="px-4 py-2 text-right text-green-600">{item.present_count}</td>
                                <td className="px-4 py-2 text-right text-red-600">{item.absent_count}</td>
                                <td className="px-4 py-2 text-right font-semibold">
                                  {formatPercent(item.attendance_rate)}
                                </td>
                                <td className="px-4 py-2">
                                  <span className={`px-2 py-1 rounded text-sm ${
                                    parseFloat(item.attendance_rate) >= 90 ? 'bg-green-100 text-green-700' :
                                    parseFloat(item.attendance_rate) >= 75 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {parseFloat(item.attendance_rate) >= 90 ? 'Excellent' :
                                     parseFloat(item.attendance_rate) >= 75 ? 'Good' : 'Needs Attention'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No attendance data available</p>
                    )}
                  </div>

                  {/* Chronic Absentees */}
                  <div className="border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <AlertTriangle className="text-red-600" />
                      Chronic Absentees (&gt;25% absence rate)
                    </h3>
                    {attendanceData.absentees.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left">Student</th>
                              <th className="px-4 py-2 text-left">Class</th>
                              <th className="px-4 py-2 text-right">Days Absent</th>
                              <th className="px-4 py-2 text-right">Total Days</th>
                              <th className="px-4 py-2 text-right">Absence Rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendanceData.absentees.map((student, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="px-4 py-2 font-medium">{student.student_name}</td>
                                <td className="px-4 py-2">{student.class_name}</td>
                                <td className="px-4 py-2 text-right text-red-600">{student.absent_days}</td>
                                <td className="px-4 py-2 text-right">{student.total_days}</td>
                                <td className="px-4 py-2 text-right">
                                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                                    {formatPercent(student.absence_rate)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-green-600 text-center py-4">✓ No chronic absentees identified</p>
                    )}
                  </div>
                </div>
              )}

              {/* EXAMS TAB */}
              {activeTab === 'exams' && (
                <div className="space-y-6">
                  {/* Exam Performance Trends */}
                  <div className="border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Award className="text-orange-600" />
                      Exam Performance Trends
                    </h3>
                    {examData.trends.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left">Exam</th>
                              <th className="px-4 py-2 text-right">Students</th>
                              <th className="px-4 py-2 text-right">Avg %</th>
                              <th className="px-4 py-2 text-right">Highest</th>
                              <th className="px-4 py-2 text-right">Lowest</th>
                              <th className="px-4 py-2 text-left">Performance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {examData.trends.map((exam, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="px-4 py-2 font-medium">{exam.exam_name}</td>
                                <td className="px-4 py-2 text-right">{exam.student_count}</td>
                                <td className="px-4 py-2 text-right font-semibold">
                                  {formatPercent(exam.avg_percentage)}
                                </td>
                                <td className="px-4 py-2 text-right text-green-600">
                                  {formatPercent(exam.highest_percentage)}
                                </td>
                                <td className="px-4 py-2 text-right text-red-600">
                                  {formatPercent(exam.lowest_percentage)}
                                </td>
                                <td className="px-4 py-2">
                                  <div className="w-full bg-gray-200 rounded h-4">
                                    <div 
                                      className={`h-4 rounded ${
                                        parseFloat(exam.avg_percentage) >= 70 ? 'bg-green-500' :
                                        parseFloat(exam.avg_percentage) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${Math.min(parseFloat(exam.avg_percentage) || 0, 100)}%` }}
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No exam performance data available</p>
                    )}
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <p className="text-blue-600 text-sm">Total Exams</p>
                      <p className="text-3xl font-bold text-blue-900">{examData.trends.length}</p>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg">
                      <p className="text-green-600 text-sm">Overall Average</p>
                      <p className="text-3xl font-bold text-green-900">
                        {examData.trends.length > 0 
                          ? formatPercent(examData.trends.reduce((sum, e) => sum + parseFloat(e.avg_percentage || 0), 0) / examData.trends.length)
                          : '0%'}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-lg">
                      <p className="text-purple-600 text-sm">Students Assessed</p>
                      <p className="text-3xl font-bold text-purple-900">
                        {examData.trends.reduce((sum, e) => sum + parseInt(e.student_count || 0), 0)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TEACHERS TAB */}
              {activeTab === 'teachers' && (
                <div className="space-y-6">
                  {/* Teacher Workload */}
                  <div className="border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Briefcase className="text-indigo-600" />
                      Teacher Workload Analysis
                    </h3>
                    {teacherData.workload.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left">Teacher</th>
                              <th className="px-4 py-2 text-right">Classes</th>
                              <th className="px-4 py-2 text-right">Courses</th>
                              <th className="px-4 py-2 text-right">Invigilation</th>
                              <th className="px-4 py-2 text-left">Workload</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teacherData.workload.map((teacher, idx) => {
                              const totalLoad = (parseInt(teacher.classes_assigned) || 0) + (parseInt(teacher.courses_assigned) || 0) + (parseInt(teacher.invigilation_duties) || 0);
                              const maxLoad = Math.max(...teacherData.workload.map(t => (parseInt(t.classes_assigned) || 0) + (parseInt(t.courses_assigned) || 0) + (parseInt(t.invigilation_duties) || 0)));
                              return (
                                <tr key={idx} className="border-t">
                                  <td className="px-4 py-2 font-medium">{teacher.teacher_name}</td>
                                  <td className="px-4 py-2 text-right">{teacher.classes_assigned || 0}</td>
                                  <td className="px-4 py-2 text-right">{teacher.courses_assigned || 0}</td>
                                  <td className="px-4 py-2 text-right">{teacher.invigilation_duties || 0}</td>
                                  <td className="px-4 py-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-24 bg-gray-200 rounded h-3">
                                        <div 
                                          className={`h-3 rounded ${totalLoad > maxLoad * 0.8 ? 'bg-red-500' : totalLoad > maxLoad * 0.5 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                          style={{ width: `${maxLoad > 0 ? (totalLoad / maxLoad) * 100 : 0}%` }}
                                        />
                                      </div>
                                      <span className={`text-xs px-2 py-1 rounded ${totalLoad > maxLoad * 0.8 ? 'bg-red-100 text-red-700' : totalLoad > maxLoad * 0.5 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                        {totalLoad > maxLoad * 0.8 ? 'High' : totalLoad > maxLoad * 0.5 ? 'Medium' : 'Low'}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No teacher workload data available</p>
                    )}
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-indigo-50 p-6 rounded-lg">
                      <p className="text-indigo-600 text-sm">Total Teachers</p>
                      <p className="text-3xl font-bold text-indigo-900">{teacherData.workload.length}</p>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <p className="text-blue-600 text-sm">Total Classes Assigned</p>
                      <p className="text-3xl font-bold text-blue-900">
                        {teacherData.workload.reduce((sum, t) => sum + parseInt(t.classes_assigned || 0), 0)}
                      </p>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg">
                      <p className="text-green-600 text-sm">Total Courses</p>
                      <p className="text-3xl font-bold text-green-900">
                        {teacherData.workload.reduce((sum, t) => sum + parseInt(t.courses_assigned || 0), 0)}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-lg">
                      <p className="text-purple-600 text-sm">Invigilation Duties</p>
                      <p className="text-3xl font-bold text-purple-900">
                        {teacherData.workload.reduce((sum, t) => sum + parseInt(t.invigilation_duties || 0), 0)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* CUSTOM REPORTS TAB */}
              {activeTab === 'reports' && (
                <div className="space-y-6">
                  {/* Report Builder */}
                  <div className="border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Filter className="text-teal-600" />
                      Custom Report Builder
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                        <select
                          value={customReport.filters.class_id}
                          onChange={(e) => setCustomReport(prev => ({ ...prev, filters: { ...prev.filters, class_id: e.target.value } }))}
                          className="w-full border rounded-lg px-3 py-2"
                        >
                          <option value="">All Classes</option>
                          {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          value={customReport.filters.status}
                          onChange={(e) => setCustomReport(prev => ({ ...prev, filters: { ...prev.filters, status: e.target.value } }))}
                          className="w-full border rounded-lg px-3 py-2"
                        >
                          <option value="">All Status</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="graduated">Graduated</option>
                          <option value="transferred">Transferred</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={runCustomReport}
                          className="w-full bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center justify-center gap-2"
                        >
                          <Search size={18} />
                          Generate Report
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Report Results */}
                  <div className="border rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="text-gray-600" />
                        Report Results ({customReport.results.length} records)
                      </h3>
                      {customReport.results.length > 0 && (
                        <button
                          onClick={() => exportToPDF('students')}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          <Download size={16} />
                          Export PDF
                        </button>
                      )}
                    </div>
                    {customReport.results.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left">Student ID</th>
                              <th className="px-4 py-2 text-left">Name</th>
                              <th className="px-4 py-2 text-left">Gender</th>
                              <th className="px-4 py-2 text-left">Status</th>
                              <th className="px-4 py-2 text-left">Admission Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customReport.results.map((student, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="px-4 py-2 font-mono text-sm">{student.student_id}</td>
                                <td className="px-4 py-2 font-medium">{student.first_name} {student.last_name}</td>
                                <td className="px-4 py-2 capitalize">{student.gender || '-'}</td>
                                <td className="px-4 py-2">
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    student.status === 'active' ? 'bg-green-100 text-green-700' :
                                    student.status === 'graduated' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {student.status}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-600">{student.admission_date?.split('T')[0] || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <ClipboardList size={48} className="mx-auto mb-4 text-gray-300" />
                        <p>Select filters and click "Generate Report" to view results</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* KPI Targets Modal */}
      {showTargetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2"><Target className="text-purple-600" /> KPI Targets</h2>
              <button onClick={() => setShowTargetModal(false)}><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Revenue Target (GHS)</label>
                <input type="number" value={kpiTargets.revenue_target} onChange={(e) => setKpiTargets({...kpiTargets, revenue_target: parseFloat(e.target.value)})} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Attendance Target (%)</label>
                <input type="number" min="0" max="100" value={kpiTargets.attendance_target} onChange={(e) => setKpiTargets({...kpiTargets, attendance_target: parseFloat(e.target.value)})} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Collection Rate Target (%)</label>
                <input type="number" min="0" max="100" value={kpiTargets.collection_rate_target} onChange={(e) => setKpiTargets({...kpiTargets, collection_rate_target: parseFloat(e.target.value)})} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pass Rate Target (%)</label>
                <input type="number" min="0" max="100" value={kpiTargets.pass_rate_target} onChange={(e) => setKpiTargets({...kpiTargets, pass_rate_target: parseFloat(e.target.value)})} className="w-full border rounded px-3 py-2" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowTargetModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={saveKpiTargets} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Save Targets</button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Reports Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2"><Mail className="text-orange-600" /> Scheduled Reports</h2>
              <button onClick={() => setShowScheduleModal(false)}><X size={24} /></button>
            </div>
            
            {/* Existing Schedules */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">Active Schedules</h3>
              {scheduledReports.length === 0 ? (
                <p className="text-gray-500 text-sm">No scheduled reports</p>
              ) : (
                <div className="space-y-2">
                  {scheduledReports.map(report => (
                    <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{report.type} Report</p>
                        <p className="text-sm text-gray-500">{report.frequency} • {report.email}</p>
                      </div>
                      <button onClick={() => removeScheduledReport(report.id)} className="text-red-600 hover:bg-red-50 p-2 rounded">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Schedule */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Add New Schedule</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                addScheduledReport({
                  type: formData.get('type'),
                  frequency: formData.get('frequency'),
                  email: formData.get('email')
                });
              }} className="space-y-3">
                <select name="type" required className="w-full border rounded px-3 py-2">
                  <option value="">Select Report Type</option>
                  <option value="Overview">Overview</option>
                  <option value="Students">Students</option>
                  <option value="Finance">Finance</option>
                  <option value="Attendance">Attendance</option>
                  <option value="Exams">Exams</option>
                  <option value="Full">Full Report</option>
                </select>
                <select name="frequency" required className="w-full border rounded px-3 py-2">
                  <option value="">Select Frequency</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
                <input type="email" name="email" required placeholder="Email address" className="w-full border rounded px-3 py-2" />
                <button type="submit" className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700">
                  Schedule Report
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Drill-Down Modal */}
      {showDrillDown && drillDownData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Eye className="text-blue-600" /> {drillDownData.name} Details
              </h2>
              <button onClick={() => setShowDrillDown(false)}><X size={24} /></button>
            </div>
            <div className="p-6">
              {drillDownData.data.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(drillDownData.data[0]).map(key => (
                        <th key={key} className="px-4 py-2 text-left text-sm capitalize">{key.replace('_', ' ')}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {drillDownData.data.map((row, idx) => (
                      <tr key={idx} className="border-t">
                        {Object.values(row).map((val, i) => (
                          <td key={i} className="px-4 py-2 text-sm">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500 text-center py-8">No detailed data available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
