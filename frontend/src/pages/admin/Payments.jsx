import { useState, useEffect } from 'react';
import { 
  Plus, CreditCard, X, DollarSign, Search, Download, Printer, Mail,
  Calendar, Filter, Eye, Edit, Trash2, RefreshCw, CheckCircle, XCircle,
  TrendingUp, Users, Clock, AlertTriangle, BarChart3, FileText, ArrowUpRight
} from 'lucide-react';
import { financeAPI, classesAPI, termsAPI } from '../../services/api';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    invoice_id: '',
    student_id: '',
    parent_id: '',
    amount: '',
    payment_method: 'cash',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: ''
  });

  // Enhanced state
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [termFilter, setTermFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [classes, setClasses] = useState([]);
  const [terms, setTerms] = useState([]);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // list, chart
  const [dailyStats, setDailyStats] = useState([]);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [voidReason, setVoidReason] = useState('');
  const [bulkPayments, setBulkPayments] = useState([{ invoice_id: '', amount: '' }]);

  useEffect(() => {
    fetchData();
    fetchBaseData();
  }, [methodFilter, classFilter, termFilter]);

  const fetchBaseData = async () => {
    try {
      const [classesRes, termsRes] = await Promise.all([
        classesAPI.getAll(),
        termsAPI.getAll()
      ]);
      setClasses(classesRes.data.classes || []);
      setTerms(termsRes.data.terms || []);
      
      // Fetch daily stats for chart
      try {
        const statsRes = await axios.get(`${API_BASE_URL}/finance.php?action=daily_payments&days=7`);
        setDailyStats(statsRes.data.daily_stats || []);
      } catch (e) {
        console.error('Error fetching daily stats:', e);
      }
    } catch (error) {
      console.error('Error fetching base data:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (methodFilter) params.payment_method = methodFilter;
      if (classFilter) params.class_id = classFilter;
      if (termFilter) params.term_id = termFilter;
      
      const [paymentsRes, invoicesRes] = await Promise.all([
        financeAPI.getPayments(params),
        financeAPI.getInvoices()
      ]);
      setPayments(paymentsRes.data.payments || []);
      
      // Filter invoices that need payment (approved or pending_payment) and have balance > 0
      const unpaidInvoices = (invoicesRes.data.invoices || []).filter(inv => 
        (inv.status === 'approved' || inv.status === 'pending_payment' || inv.status === 'partial') && 
        parseFloat(inv.balance || 0) > 0
      );
      setInvoices(unpaidInvoices);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceSelect = (e) => {
    const invoiceId = e.target.value;
    const invoice = invoices.find(inv => inv.id == invoiceId);
    if (invoice) {
      setFormData({
        ...formData,
        invoice_id: invoiceId,
        student_id: invoice.student_id,
        parent_id: invoice.parent_id,
        amount: invoice.balance
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await financeAPI.createPayment(formData);
      setShowModal(false);
      fetchData();
      alert('Payment recorded successfully!');
      resetForm();
    } catch (error) {
      alert('Error recording payment: ' + (error.response?.data?.error || error.message));
    }
  };

  const resetForm = () => {
    setFormData({
      invoice_id: '',
      student_id: '',
      parent_id: '',
      amount: '',
      payment_method: 'cash',
      payment_date: new Date().toISOString().split('T')[0],
      reference_number: '',
      notes: ''
    });
  };

  const handleViewReceipt = (payment) => {
    setSelectedPayment(payment);
    setShowReceiptModal(true);
  };

  const handlePrintReceipt = () => {
    if (!selectedPayment) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Payment Receipt #${selectedPayment.payment_number}</title>
      <style>
        body { font-family: Arial; padding: 40px; max-width: 400px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
        .receipt-number { font-size: 18px; font-weight: bold; margin-top: 10px; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd; }
        .label { color: #666; }
        .value { font-weight: bold; }
        .total { font-size: 24px; text-align: center; margin: 20px 0; padding: 15px; background: #f5f5f5; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
      </style></head><body>
      <div class="header">
        <h2>PAYMENT RECEIPT</h2>
        <div class="receipt-number">#${selectedPayment.payment_number}</div>
      </div>
      <div class="row"><span class="label">Date:</span><span class="value">${new Date(selectedPayment.payment_date).toLocaleDateString()}</span></div>
      <div class="row"><span class="label">Student:</span><span class="value">${selectedPayment.first_name} ${selectedPayment.last_name}</span></div>
      <div class="row"><span class="label">Student ID:</span><span class="value">${selectedPayment.student_id}</span></div>
      <div class="row"><span class="label">Invoice:</span><span class="value">${selectedPayment.invoice_number}</span></div>
      <div class="row"><span class="label">Method:</span><span class="value">${selectedPayment.payment_method.replace('_', ' ').toUpperCase()}</span></div>
      <div class="row"><span class="label">Reference:</span><span class="value">${selectedPayment.reference_number || '-'}</span></div>
      <div class="total">Amount Paid: GHS ${parseFloat(selectedPayment.amount).toFixed(2)}</div>
      <div class="footer">Thank you for your payment!<br>This is a computer-generated receipt.</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleEmailReceipt = async () => {
    if (!selectedPayment) return;
    if (!window.confirm('Send receipt to parent email?')) return;
    try {
      await axios.post(`${API_BASE_URL}/finance.php?action=email_receipt`, { payment_id: selectedPayment.id });
      alert('Receipt sent successfully!');
    } catch (error) {
      alert('Error sending receipt');
    }
  };

  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
    setFormData({
      invoice_id: payment.invoice_id,
      student_id: payment.student_id,
      parent_id: payment.parent_id,
      amount: payment.amount,
      payment_method: payment.payment_method,
      payment_date: payment.payment_date,
      reference_number: payment.reference_number || '',
      notes: payment.notes || ''
    });
    setShowEditModal(true);
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE_URL}/finance.php?resource=payments&id=${editingPayment.id}`, formData);
      setShowEditModal(false);
      setEditingPayment(null);
      resetForm();
      fetchData();
      alert('Payment updated!');
    } catch (error) {
      alert('Error updating payment');
    }
  };

  const handleVoidPayment = async () => {
    if (!voidReason.trim()) {
      alert('Please enter a reason for voiding');
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/finance.php?action=void_payment`, { 
        payment_id: selectedPayment.id, 
        reason: voidReason 
      });
      setShowVoidModal(false);
      setVoidReason('');
      setSelectedPayment(null);
      fetchData();
      alert('Payment voided!');
    } catch (error) {
      alert('Error voiding payment');
    }
  };

  const handleRefundPayment = async () => {
    if (!refundAmount || parseFloat(refundAmount) <= 0) {
      alert('Please enter a valid refund amount');
      return;
    }
    if (parseFloat(refundAmount) > parseFloat(selectedPayment.amount)) {
      alert('Refund amount cannot exceed payment amount');
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/finance.php?action=refund_payment`, { 
        payment_id: selectedPayment.id, 
        amount: refundAmount,
        reason: refundReason 
      });
      setShowRefundModal(false);
      setRefundAmount('');
      setRefundReason('');
      setSelectedPayment(null);
      fetchData();
      alert('Refund processed!');
    } catch (error) {
      alert('Error processing refund');
    }
  };

  const handleBulkPayment = async (e) => {
    e.preventDefault();
    const validPayments = bulkPayments.filter(p => p.invoice_id && p.amount > 0);
    if (validPayments.length === 0) {
      alert('Please add at least one valid payment');
      return;
    }
    try {
      for (const payment of validPayments) {
        const invoice = invoices.find(inv => inv.id == payment.invoice_id);
        await financeAPI.createPayment({
          invoice_id: payment.invoice_id,
          student_id: invoice?.student_id,
          amount: payment.amount,
          payment_method: 'cash',
          payment_date: new Date().toISOString().split('T')[0]
        });
      }
      setShowBulkModal(false);
      setBulkPayments([{ invoice_id: '', amount: '' }]);
      fetchData();
      alert(`${validPayments.length} payments recorded!`);
    } catch (error) {
      alert('Error recording bulk payments');
    }
  };

  const addBulkPaymentRow = () => {
    setBulkPayments([...bulkPayments, { invoice_id: '', amount: '' }]);
  };

  const updateBulkPayment = (index, field, value) => {
    const updated = [...bulkPayments];
    updated[index][field] = value;
    if (field === 'invoice_id' && value) {
      const invoice = invoices.find(inv => inv.id == value);
      if (invoice) updated[index].amount = invoice.balance;
    }
    setBulkPayments(updated);
  };

  const removeBulkPaymentRow = (index) => {
    setBulkPayments(bulkPayments.filter((_, i) => i !== index));
  };

  const handleExportPayments = () => {
    const csv = [
      ['Payment #', 'Date', 'Invoice #', 'Student', 'Amount', 'Method', 'Reference', 'Status'],
      ...filteredPayments.map(p => [
        p.payment_number,
        p.payment_date,
        p.invoice_number,
        `${p.first_name} ${p.last_name}`,
        p.amount,
        p.payment_method,
        p.reference_number || '',
        p.status
      ])
    ].map(r => r.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const generateDailyReport = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayPayments = payments.filter(p => p.payment_date === today);
    const byMethod = {};
    todayPayments.forEach(p => {
      byMethod[p.payment_method] = (byMethod[p.payment_method] || 0) + parseFloat(p.amount);
    });
    return { todayPayments, byMethod, total: todayPayments.reduce((s, p) => s + parseFloat(p.amount), 0) };
  };

  // Filtering
  const filteredPayments = payments.filter(p => {
    const matchesSearch = !searchTerm || 
      p.payment_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || p.status === statusFilter;
    const matchesDate = (!dateFrom || p.payment_date >= dateFrom) && (!dateTo || p.payment_date <= dateTo);
    return matchesSearch && matchesStatus && matchesDate;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount || 0);
  };

  const getMethodBadge = (method) => {
    const badges = {
      cash: 'bg-green-100 text-green-700',
      bank_transfer: 'bg-blue-100 text-blue-700',
      mobile_money: 'bg-purple-100 text-purple-700',
      cheque: 'bg-orange-100 text-orange-700',
      card: 'bg-pink-100 text-pink-700',
    };
    return badges[method] || 'bg-gray-100 text-gray-700';
  };

  const totalPayments = filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const todayDate = new Date().toISOString().split('T')[0];
  const todayPaymentsList = payments.filter(p => p.payment_date === todayDate);
  const todayTotal = todayPaymentsList.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const pendingCount = invoices.length;

  const paymentMethods = ['cash', 'bank_transfer', 'mobile_money', 'cheque', 'card'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600 mt-1">Record, track, and manage student payments</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowReportModal(true)} className="btn bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Daily Report
          </button>
          <button onClick={handleExportPayments} className="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-2">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => setShowBulkModal(true)} className="btn bg-orange-600 text-white hover:bg-orange-700 flex items-center gap-2">
            <Users className="w-4 h-4" /> Bulk Payment
          </button>
          <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Record Payment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">{filteredPayments.length}</p>
            </div>
            <div className="bg-blue-500 w-10 h-10 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Amount</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalPayments)}</p>
            </div>
            <div className="bg-green-500 w-10 h-10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Today's Payments</p>
              <p className="text-2xl font-bold text-gray-900">{todayPaymentsList.length}</p>
            </div>
            <div className="bg-purple-500 w-10 h-10 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Today's Total</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(todayTotal)}</p>
            </div>
            <div className="bg-orange-500 w-10 h-10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="card p-5 bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-700 text-sm mb-1">Pending Invoices</p>
              <p className="text-2xl font-bold text-yellow-800">{pendingCount}</p>
            </div>
            <div className="bg-yellow-500 w-10 h-10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search payments..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input pl-10 w-full" />
          </div>
          <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="input w-auto">
            <option value="">All Methods</option>
            {paymentMethods.map(m => <option key={m} value={m}>{m.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto">
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="voided">Voided</option>
            <option value="refunded">Refunded</option>
          </select>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="input w-auto">
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input w-auto" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input w-auto" />
          <button onClick={fetchData} className="btn bg-gray-100 hover:bg-gray-200">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan="9" className="px-4 py-12 text-center text-gray-500">Loading...</td></tr>
              ) : filteredPayments.length === 0 ? (
                <tr><td colSpan="9" className="px-4 py-12 text-center text-gray-500">No payments found</td></tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className={`hover:bg-gray-50 ${payment.status === 'voided' ? 'bg-red-50 opacity-60' : ''}`}>
                    <td className="px-4 py-3 font-mono text-sm">{payment.payment_number}</td>
                    <td className="px-4 py-3 text-sm">{new Date(payment.payment_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-mono text-sm">{payment.invoice_number}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{payment.first_name} {payment.last_name}</p>
                        <p className="text-xs text-gray-500">{payment.student_id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-green-600">{formatCurrency(payment.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getMethodBadge(payment.payment_method)}`}>
                        {payment.payment_method.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{payment.reference_number || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        payment.status === 'completed' ? 'bg-green-100 text-green-700' : 
                        payment.status === 'voided' ? 'bg-red-100 text-red-700' :
                        payment.status === 'refunded' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => handleViewReceipt(payment)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="View Receipt">
                          <Eye className="w-4 h-4" />
                        </button>
                        {payment.status === 'completed' && (
                          <>
                            <button onClick={() => handleEditPayment(payment)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Edit">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setSelectedPayment(payment); setShowVoidModal(true); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Void">
                              <XCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setSelectedPayment(payment); setRefundAmount(payment.amount); setShowRefundModal(true); }} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded" title="Refund">
                              <ArrowUpRight className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Record Payment</h2>
              <button onClick={() => setShowModal(false)}><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Invoice *</label>
                  <select
                    required
                    value={formData.invoice_id}
                    onChange={handleInvoiceSelect}
                    className="input"
                  >
                    <option value="">
                      {invoices.length === 0 ? 'No unpaid invoices available' : 'Select an invoice'}
                    </option>
                    {invoices.map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.invoice_number} - {invoice.student_name || `${invoice.first_name} ${invoice.last_name}`} - Balance: {formatCurrency(invoice.balance)}
                      </option>
                    ))}
                  </select>
                  {invoices.length === 0 && (
                    <p className="text-sm text-orange-600 mt-2">
                      No invoices available for payment. Please ensure invoices are approved in the Finance section.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (GHS) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
                  <select
                    required
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="input"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="cheque">Cheque</option>
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number</label>
                  <input
                    type="text"
                    value={formData.reference_number}
                    onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                    className="input"
                    placeholder="Transaction reference"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input"
                    rows="3"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="btn bg-gray-200 text-gray-700 hover:bg-gray-300">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Payment Receipt</h2>
              <div className="flex gap-2">
                <button onClick={handlePrintReceipt} className="p-2 text-gray-600 hover:bg-gray-100 rounded" title="Print">
                  <Printer className="w-5 h-5" />
                </button>
                <button onClick={handleEmailReceipt} className="p-2 text-gray-600 hover:bg-gray-100 rounded" title="Email">
                  <Mail className="w-5 h-5" />
                </button>
                <button onClick={() => setShowReceiptModal(false)}><X className="w-6 h-6" /></button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center border-b pb-4">
                <h3 className="text-lg font-bold">PAYMENT RECEIPT</h3>
                <p className="text-2xl font-mono font-bold text-blue-600 mt-2">#{selectedPayment.payment_number}</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-600">Date:</span><span className="font-medium">{new Date(selectedPayment.payment_date).toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Student:</span><span className="font-medium">{selectedPayment.first_name} {selectedPayment.last_name}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Student ID:</span><span className="font-medium">{selectedPayment.student_id}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Invoice:</span><span className="font-medium">{selectedPayment.invoice_number}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Method:</span><span className="font-medium capitalize">{selectedPayment.payment_method.replace('_', ' ')}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Reference:</span><span className="font-medium">{selectedPayment.reference_number || '-'}</span></div>
              </div>
              <div className="text-center bg-green-50 p-4 rounded-lg mt-4">
                <p className="text-sm text-gray-600">Amount Paid</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(selectedPayment.amount)}</p>
              </div>
              <p className="text-center text-xs text-gray-500 mt-4">Thank you for your payment!</p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {showEditModal && editingPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Edit Payment</h2>
              <button onClick={() => { setShowEditModal(false); setEditingPayment(null); resetForm(); }}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleUpdatePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Amount (GHS)</label>
                <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Payment Method</label>
                <select value={formData.payment_method} onChange={(e) => setFormData({...formData, payment_method: e.target.value})} className="input">
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="cheque">Cheque</option>
                  <option value="card">Card</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Reference</label>
                <input type="text" value={formData.reference_number} onChange={(e) => setFormData({...formData, reference_number: e.target.value})} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="input" rows="2" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setShowEditModal(false); setEditingPayment(null); resetForm(); }} className="btn bg-gray-200">Cancel</button>
                <button type="submit" className="btn btn-primary">Update Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Void Payment Modal */}
      {showVoidModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-red-600">Void Payment</h2>
              <button onClick={() => { setShowVoidModal(false); setVoidReason(''); }}><X className="w-6 h-6" /></button>
            </div>
            <div className="bg-red-50 p-4 rounded-lg mb-4">
              <p className="text-red-700 text-sm">You are about to void payment <strong>#{selectedPayment.payment_number}</strong> for <strong>{formatCurrency(selectedPayment.amount)}</strong>. This action cannot be undone.</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Reason for voiding *</label>
              <textarea value={voidReason} onChange={(e) => setVoidReason(e.target.value)} className="input" rows="3" placeholder="Enter reason..." />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowVoidModal(false); setVoidReason(''); }} className="btn bg-gray-200">Cancel</button>
              <button onClick={handleVoidPayment} className="btn bg-red-600 text-white hover:bg-red-700">Void Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-orange-600">Process Refund</h2>
              <button onClick={() => { setShowRefundModal(false); setRefundAmount(''); setRefundReason(''); }}><X className="w-6 h-6" /></button>
            </div>
            <p className="text-gray-600 mb-4">Payment: #{selectedPayment.payment_number} • Original: {formatCurrency(selectedPayment.amount)}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Refund Amount (GHS) *</label>
                <input type="number" step="0.01" max={selectedPayment.amount} value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Reason</label>
                <textarea value={refundReason} onChange={(e) => setRefundReason(e.target.value)} className="input" rows="2" placeholder="Reason for refund..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => { setShowRefundModal(false); setRefundAmount(''); setRefundReason(''); }} className="btn bg-gray-200">Cancel</button>
              <button onClick={handleRefundPayment} className="btn bg-orange-600 text-white hover:bg-orange-700">Process Refund</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Payment Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">Bulk Payment Entry</h2>
              <button onClick={() => { setShowBulkModal(false); setBulkPayments([{ invoice_id: '', amount: '' }]); }}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleBulkPayment} className="p-6">
              <div className="space-y-3">
                {bulkPayments.map((bp, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-7">
                      <select value={bp.invoice_id} onChange={(e) => updateBulkPayment(idx, 'invoice_id', e.target.value)} className="input text-sm">
                        <option value="">Select Invoice</option>
                        {invoices.map(inv => <option key={inv.id} value={inv.id}>{inv.invoice_number} - {inv.first_name} {inv.last_name} ({formatCurrency(inv.balance)})</option>)}
                      </select>
                    </div>
                    <div className="col-span-4">
                      <input type="number" step="0.01" placeholder="Amount" value={bp.amount} onChange={(e) => updateBulkPayment(idx, 'amount', e.target.value)} className="input text-sm" />
                    </div>
                    <div className="col-span-1">
                      {bulkPayments.length > 1 && (
                        <button type="button" onClick={() => removeBulkPaymentRow(idx)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addBulkPaymentRow} className="mt-3 text-sm text-blue-600 hover:underline flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add Another
              </button>
              <div className="text-right mt-4 pt-4 border-t">
                <p className="text-lg font-semibold">Total: {formatCurrency(bulkPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0))}</p>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => { setShowBulkModal(false); setBulkPayments([{ invoice_id: '', amount: '' }]); }} className="btn bg-gray-200">Cancel</button>
                <button type="submit" className="btn btn-primary">Record All Payments</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Daily Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Daily Collection Report</h2>
              <button onClick={() => setShowReportModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6">
              {(() => {
                const report = generateDailyReport();
                return (
                  <div className="space-y-4">
                    <div className="text-center bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Today's Date</p>
                      <p className="text-lg font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div className="text-center bg-green-50 p-6 rounded-lg">
                      <p className="text-sm text-gray-600">Total Collections</p>
                      <p className="text-4xl font-bold text-green-600">{formatCurrency(report.total)}</p>
                      <p className="text-sm text-gray-500 mt-1">{report.todayPayments.length} payments</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">By Payment Method</h4>
                      <div className="space-y-2">
                        {Object.entries(report.byMethod).map(([method, amount]) => (
                          <div key={method} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="capitalize">{method.replace('_', ' ')}</span>
                            <span className="font-semibold">{formatCurrency(amount)}</span>
                          </div>
                        ))}
                        {Object.keys(report.byMethod).length === 0 && (
                          <p className="text-gray-500 text-center py-4">No payments today</p>
                        )}
                      </div>
                    </div>
                    <button onClick={() => {
                      const printWindow = window.open('', '_blank');
                      printWindow.document.write(`<html><head><title>Daily Report</title><style>body{font-family:Arial;padding:30px;}</style></head><body>
                        <h1>Daily Collection Report</h1>
                        <p>${new Date().toLocaleDateString()}</p>
                        <h2>Total: GHS ${report.total.toFixed(2)}</h2>
                        <p>Payments: ${report.todayPayments.length}</p>
                        <h3>By Method:</h3>
                        ${Object.entries(report.byMethod).map(([m, a]) => `<p>${m}: GHS ${a.toFixed(2)}</p>`).join('')}
                      </body></html>`);
                      printWindow.document.close();
                      printWindow.print();
                    }} className="btn btn-primary w-full flex items-center justify-center gap-2">
                      <Printer className="w-4 h-4" /> Print Report
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
