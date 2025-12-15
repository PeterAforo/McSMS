import { useState, useEffect, useRef } from 'react';
import { 
  FileText, CheckCircle, XCircle, Eye, X, Search, Plus, Edit, Trash2,
  Printer, Mail, Download, Calendar, Filter, CreditCard, Clock, AlertTriangle,
  Copy, Send, History, DollarSign, CheckSquare, RefreshCw, Users
} from 'lucide-react';
import { financeAPI, classesAPI, termsAPI, studentsAPI } from '../../services/api';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Enhanced state
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [termFilter, setTermFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [classes, setClasses] = useState([]);
  const [terms, setTerms] = useState([]);
  const [students, setStudents] = useState([]);
  const [feeItems, setFeeItems] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [invoiceHistory, setInvoiceHistory] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [editingInvoice, setEditingInvoice] = useState(null);

  const [invoiceForm, setInvoiceForm] = useState({
    student_id: '',
    term_id: '',
    due_date: '',
    notes: '',
    items: [{ fee_item_id: '', description: '', quantity: 1, unit_price: 0 }]
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'cash',
    reference: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
    fetchBaseData();
  }, [filter, classFilter, termFilter, dateFrom, dateTo]);

  const fetchBaseData = async () => {
    try {
      const [classesRes, termsRes, studentsRes] = await Promise.all([
        classesAPI.getAll(),
        termsAPI.getAll(),
        studentsAPI.getAll()
      ]);
      setClasses(classesRes.data.classes || []);
      setTerms(termsRes.data.terms || []);
      setStudents(studentsRes.data.students || []);

      // Fetch fee items
      try {
        const feeRes = await axios.get(`${API_BASE_URL}/fee_items.php`);
        setFeeItems(feeRes.data.fee_items || []);
      } catch (e) {
        setFeeItems([]);
      }
    } catch (error) {
      console.error('Error fetching base data:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') params.status = filter;
      if (classFilter) params.class_id = classFilter;
      if (termFilter) params.term_id = termFilter;
      
      const [invoicesRes, statsRes] = await Promise.all([
        financeAPI.getInvoices(params),
        financeAPI.getInvoiceStats()
      ]);
      setInvoices(invoicesRes.data.invoices || []);
      setStats(statsRes.data.stats);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (invoice) => {
    try {
      const response = await financeAPI.getInvoiceById(invoice.id);
      setSelectedInvoice(response.data.invoice);
      setShowModal(true);
    } catch (error) {
      alert('Error loading invoice details');
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Approve this invoice?')) return;
    try {
      await financeAPI.approveInvoice(selectedInvoice.id, { approved_by: 1 });
      setShowModal(false);
      fetchData();
      alert('Invoice approved successfully!');
    } catch (error) {
      alert('Error approving invoice');
    }
  };

  const handleReject = async () => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      await financeAPI.rejectInvoice(selectedInvoice.id, { rejection_reason: reason });
      setShowModal(false);
      fetchData();
      alert('Invoice rejected');
    } catch (error) {
      alert('Error rejecting invoice');
    }
  };

  const resetInvoiceForm = () => {
    setInvoiceForm({
      student_id: '',
      term_id: '',
      due_date: '',
      notes: '',
      items: [{ fee_item_id: '', description: '', quantity: 1, unit_price: 0 }]
    });
    setEditingInvoice(null);
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...invoiceForm,
        items: invoiceForm.items.filter(i => i.description && i.unit_price > 0)
      };
      
      if (editingInvoice) {
        await axios.put(`${API_BASE_URL}/finance.php?resource=invoices&id=${editingInvoice.id}`, data);
        alert('Invoice updated!');
      } else {
        await axios.post(`${API_BASE_URL}/finance.php?resource=invoices`, data);
        alert('Invoice created!');
      }
      setShowCreateModal(false);
      resetInvoiceForm();
      fetchData();
    } catch (error) {
      alert('Error saving invoice: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    setInvoiceForm({
      student_id: invoice.student_id,
      term_id: invoice.term_id,
      due_date: invoice.due_date || '',
      notes: invoice.notes || '',
      items: invoice.items || [{ fee_item_id: '', description: '', quantity: 1, unit_price: 0 }]
    });
    setShowCreateModal(true);
  };

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/finance.php?resource=invoices&id=${id}`);
      fetchData();
      alert('Invoice deleted!');
    } catch (error) {
      alert('Error deleting invoice');
    }
  };

  const handleDuplicateInvoice = (invoice) => {
    setEditingInvoice(null);
    setInvoiceForm({
      student_id: invoice.student_id,
      term_id: '',
      due_date: '',
      notes: invoice.notes || '',
      items: invoice.items?.map(i => ({ ...i, id: undefined })) || []
    });
    setShowCreateModal(true);
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      await financeAPI.recordPayment({
        invoice_id: selectedInvoice.id,
        ...paymentForm
      });
      setShowPaymentModal(false);
      setPaymentForm({ amount: '', payment_method: 'cash', reference: '', notes: '' });
      handleView(selectedInvoice);
      fetchData();
      alert('Payment recorded!');
    } catch (error) {
      alert('Error recording payment');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedInvoices.length === 0) {
      alert('Select invoices to approve');
      return;
    }
    if (!window.confirm(`Approve ${selectedInvoices.length} invoices?`)) return;
    try {
      for (const id of selectedInvoices) {
        await financeAPI.approveInvoice(id, { approved_by: 1 });
      }
      setSelectedInvoices([]);
      fetchData();
      alert('Invoices approved!');
    } catch (error) {
      alert('Error approving invoices');
    }
  };

  const handleBulkReject = async () => {
    if (selectedInvoices.length === 0) {
      alert('Select invoices to reject');
      return;
    }
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      for (const id of selectedInvoices) {
        await financeAPI.rejectInvoice(id, { rejection_reason: reason });
      }
      setSelectedInvoices([]);
      fetchData();
      alert('Invoices rejected!');
    } catch (error) {
      alert('Error rejecting invoices');
    }
  };

  const handlePrintInvoice = () => {
    if (!selectedInvoice) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Invoice ${selectedInvoice.invoice_number}</title>
      <style>
        body { font-family: Arial; padding: 30px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
        .invoice-number { font-size: 24px; font-weight: bold; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #f5f5f5; }
        .total-row { font-weight: bold; background: #f5f5f5; }
        .amount { text-align: right; }
      </style></head><body>
      <div class="header">
        <div class="invoice-number">INVOICE #${selectedInvoice.invoice_number}</div>
        <div>Date: ${new Date().toLocaleDateString()}</div>
        <div>Status: ${selectedInvoice.status.replace('_', ' ').toUpperCase()}</div>
      </div>
      <div class="info-grid">
        <div><strong>Student:</strong> ${selectedInvoice.first_name} ${selectedInvoice.last_name}<br>ID: ${selectedInvoice.student_id}</div>
        <div><strong>Class:</strong> ${selectedInvoice.class_name}<br><strong>Term:</strong> ${selectedInvoice.term_name}</div>
      </div>
      <table>
        <thead><tr><th>Description</th><th>Qty</th><th class="amount">Unit Price</th><th class="amount">Amount</th></tr></thead>
        <tbody>
          ${selectedInvoice.items?.map(i => `<tr><td>${i.description}</td><td>${i.quantity}</td><td class="amount">GHS ${parseFloat(i.unit_price).toFixed(2)}</td><td class="amount">GHS ${parseFloat(i.amount).toFixed(2)}</td></tr>`).join('')}
        </tbody>
        <tfoot>
          <tr class="total-row"><td colspan="3" class="amount">Total:</td><td class="amount">GHS ${parseFloat(selectedInvoice.total_amount).toFixed(2)}</td></tr>
          <tr><td colspan="3" class="amount">Paid:</td><td class="amount">GHS ${parseFloat(selectedInvoice.paid_amount || 0).toFixed(2)}</td></tr>
          <tr class="total-row"><td colspan="3" class="amount">Balance:</td><td class="amount">GHS ${parseFloat(selectedInvoice.balance || 0).toFixed(2)}</td></tr>
        </tfoot>
      </table>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleEmailInvoice = async () => {
    if (!selectedInvoice) return;
    if (!window.confirm('Send invoice to parent email?')) return;
    try {
      await axios.post(`${API_BASE_URL}/finance.php?action=email_invoice`, { invoice_id: selectedInvoice.id });
      alert('Invoice sent to parent email!');
    } catch (error) {
      alert('Error sending email');
    }
  };

  const handleSendReminder = async (invoiceId) => {
    if (!window.confirm('Send payment reminder?')) return;
    try {
      await axios.post(`${API_BASE_URL}/finance.php?action=send_reminder`, { invoice_id: invoiceId });
      alert('Reminder sent!');
    } catch (error) {
      alert('Error sending reminder');
    }
  };

  const handleVoidInvoice = async () => {
    if (!window.confirm('Void this invoice? This cannot be undone.')) return;
    try {
      await axios.put(`${API_BASE_URL}/finance.php?resource=invoices&id=${selectedInvoice.id}&action=void`);
      setShowModal(false);
      fetchData();
      alert('Invoice voided!');
    } catch (error) {
      alert('Error voiding invoice');
    }
  };

  const fetchInvoiceHistory = async (invoiceId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/finance.php?action=invoice_history&invoice_id=${invoiceId}`);
      setInvoiceHistory(response.data.history || []);
      
      const paymentsRes = await axios.get(`${API_BASE_URL}/finance.php?resource=payments&invoice_id=${invoiceId}`);
      setPaymentHistory(paymentsRes.data.payments || []);
      
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleExportInvoices = () => {
    const csv = [
      ['Invoice #', 'Student', 'Class', 'Term', 'Total', 'Paid', 'Balance', 'Status', 'Due Date'],
      ...filteredInvoices.map(i => [
        i.invoice_number,
        `${i.first_name} ${i.last_name}`,
        i.class_name,
        i.term_name,
        i.total_amount,
        i.paid_amount,
        i.balance,
        i.status,
        i.due_date || ''
      ])
    ].map(r => r.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const addInvoiceItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { fee_item_id: '', description: '', quantity: 1, unit_price: 0 }]
    });
  };

  const removeInvoiceItem = (index) => {
    setInvoiceForm({
      ...invoiceForm,
      items: invoiceForm.items.filter((_, i) => i !== index)
    });
  };

  const updateInvoiceItem = (index, field, value) => {
    const newItems = [...invoiceForm.items];
    newItems[index][field] = value;
    
    // Auto-fill from fee item
    if (field === 'fee_item_id' && value) {
      const feeItem = feeItems.find(f => f.id == value);
      if (feeItem) {
        newItems[index].description = feeItem.item_name;
        newItems[index].unit_price = feeItem.amount || 0;
      }
    }
    
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const getInvoiceTotal = () => {
    return invoiceForm.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const isOverdue = (invoice) => {
    if (!invoice.due_date || invoice.status === 'paid') return false;
    return new Date(invoice.due_date) < new Date();
  };

  const toggleSelectInvoice = (id) => {
    setSelectedInvoices(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const pendingIds = filteredInvoices.filter(i => i.status === 'pending_finance').map(i => i.id);
    if (selectedInvoices.length === pendingIds.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(pendingIds);
    }
  };

  // Filtering
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = !searchTerm || 
      inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${inv.first_name} ${inv.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.student_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = (!dateFrom || inv.created_at >= dateFrom) && (!dateTo || inv.created_at <= dateTo);
    return matchesSearch && matchesDate;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-700',
      pending_finance: 'bg-orange-100 text-orange-700',
      approved: 'bg-teal-100 text-teal-700',
      rejected: 'bg-red-100 text-red-700',
      partial: 'bg-blue-100 text-blue-700',
      paid: 'bg-green-100 text-green-700',
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  const statCards = [
    { label: 'Total Invoices', value: stats?.total_invoices || 0, color: 'bg-blue-500', icon: FileText },
    { label: 'Pending', value: stats?.pending || 0, color: 'bg-orange-500', icon: Clock },
    { label: 'Approved', value: stats?.approved || 0, color: 'bg-teal-500', icon: CheckCircle },
    { label: 'Paid', value: stats?.paid || 0, color: 'bg-green-500', icon: DollarSign },
  ];

  const overdueCount = filteredInvoices.filter(i => isOverdue(i)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
          <p className="text-gray-600 mt-1">Create, review, and manage student invoices</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportInvoices} className="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-2">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => { resetInvoiceForm(); setShowCreateModal(true); }} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Invoice
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
        {overdueCount > 0 && (
          <div className="card p-5 bg-red-50 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm mb-1">Overdue</p>
                <p className="text-2xl font-bold text-red-700">{overdueCount}</p>
              </div>
              <div className="bg-red-500 w-10 h-10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters & Search */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search invoices..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input pl-10 w-full" />
          </div>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="input w-auto">
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
          </select>
          <select value={termFilter} onChange={(e) => setTermFilter(e.target.value)} className="input w-auto">
            <option value="">All Terms</option>
            {terms.map(t => <option key={t.id} value={t.id}>{t.term_name}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input w-auto" placeholder="From" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input w-auto" placeholder="To" />
          <button onClick={fetchData} className="btn bg-gray-100 hover:bg-gray-200">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {['all', 'pending_finance', 'approved', 'partial', 'paid', 'rejected'].map((status) => (
          <button key={status} onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
            {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
        
        {/* Bulk Actions */}
        {selectedInvoices.length > 0 && (
          <div className="ml-auto flex gap-2">
            <span className="text-sm text-gray-600 self-center">{selectedInvoices.length} selected</span>
            <button onClick={handleBulkApprove} className="btn bg-green-600 text-white hover:bg-green-700 text-sm">
              <CheckCircle className="w-4 h-4 mr-1" /> Approve All
            </button>
            <button onClick={handleBulkReject} className="btn bg-red-600 text-white hover:bg-red-700 text-sm">
              <XCircle className="w-4 h-4 mr-1" /> Reject All
            </button>
          </div>
        )}
      </div>

      {/* Invoices Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" onChange={toggleSelectAll} checked={selectedInvoices.length > 0 && selectedInvoices.length === filteredInvoices.filter(i => i.status === 'pending_finance').length} className="rounded" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Term</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan="10" className="px-4 py-12 text-center text-gray-500">Loading...</td></tr>
              ) : filteredInvoices.length === 0 ? (
                <tr><td colSpan="10" className="px-4 py-12 text-center text-gray-500">No invoices found</td></tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className={`hover:bg-gray-50 ${isOverdue(invoice) ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3">
                      {invoice.status === 'pending_finance' && (
                        <input type="checkbox" checked={selectedInvoices.includes(invoice.id)} onChange={() => toggleSelectInvoice(invoice.id)} className="rounded" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">{invoice.invoice_number}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{invoice.first_name} {invoice.last_name}</p>
                        <p className="text-xs text-gray-500">{invoice.student_id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{invoice.class_name}</td>
                    <td className="px-4 py-3 text-sm">{invoice.term_name}</td>
                    <td className="px-4 py-3 font-semibold text-sm">{formatCurrency(invoice.total_amount)}</td>
                    <td className="px-4 py-3 font-semibold text-sm">{formatCurrency(invoice.balance)}</td>
                    <td className="px-4 py-3 text-sm">
                      {invoice.due_date ? (
                        <span className={isOverdue(invoice) ? 'text-red-600 font-medium' : ''}>
                          {invoice.due_date}
                          {isOverdue(invoice) && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(invoice.status)}`}>
                        {invoice.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => handleView(invoice)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        {invoice.status === 'draft' && (
                          <button onClick={() => handleEditInvoice(invoice)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDuplicateInvoice(invoice)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded" title="Duplicate">
                          <Copy className="w-4 h-4" />
                        </button>
                        {invoice.balance > 0 && invoice.status !== 'rejected' && (
                          <button onClick={() => handleSendReminder(invoice.id)} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded" title="Send Reminder">
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        {invoice.status === 'draft' && (
                          <button onClick={() => handleDeleteInvoice(invoice.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Invoice Details Modal */}
      {showModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold">Invoice Details</h2>
              <div className="flex items-center gap-2">
                <button onClick={handlePrintInvoice} className="p-2 text-gray-600 hover:bg-gray-100 rounded" title="Print">
                  <Printer className="w-5 h-5" />
                </button>
                <button onClick={handleEmailInvoice} className="p-2 text-gray-600 hover:bg-gray-100 rounded" title="Email">
                  <Mail className="w-5 h-5" />
                </button>
                <button onClick={() => fetchInvoiceHistory(selectedInvoice.id)} className="p-2 text-gray-600 hover:bg-gray-100 rounded" title="History">
                  <History className="w-5 h-5" />
                </button>
                <button onClick={() => setShowModal(false)}><X className="w-6 h-6" /></button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Invoice Header */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Invoice Number</p>
                  <p className="font-mono font-semibold text-lg">{selectedInvoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(selectedInvoice.status)}`}>
                    {selectedInvoice.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Due Date</p>
                  <p className={`font-medium ${isOverdue(selectedInvoice) ? 'text-red-600' : ''}`}>
                    {selectedInvoice.due_date || 'Not set'}
                    {isOverdue(selectedInvoice) && <span className="text-xs ml-2">(Overdue)</span>}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Student</p>
                  <p className="font-medium">{selectedInvoice.first_name} {selectedInvoice.last_name}</p>
                  <p className="text-sm text-gray-500">{selectedInvoice.student_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Parent</p>
                  <p className="font-medium">{selectedInvoice.parent_name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Class / Term</p>
                  <p className="font-medium">{selectedInvoice.class_name} • {selectedInvoice.term_name}</p>
                </div>
              </div>

              {/* Invoice Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Invoice Items</h3>
                <table className="w-full border rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm">Description</th>
                      <th className="px-4 py-2 text-right text-sm">Qty</th>
                      <th className="px-4 py-2 text-right text-sm">Unit Price</th>
                      <th className="px-4 py-2 text-right text-sm">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedInvoice.items?.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2">{item.description}</td>
                        <td className="px-4 py-2 text-right">{item.quantity}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(item.unit_price)}</td>
                        <td className="px-4 py-2 text-right font-semibold">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-semibold">
                    <tr>
                      <td colSpan="3" className="px-4 py-2 text-right">Total:</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(selectedInvoice.total_amount)}</td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="px-4 py-2 text-right text-green-600">Paid:</td>
                      <td className="px-4 py-2 text-right text-green-600">{formatCurrency(selectedInvoice.paid_amount)}</td>
                    </tr>
                    <tr className="text-lg">
                      <td colSpan="3" className="px-4 py-2 text-right">Balance Due:</td>
                      <td className="px-4 py-2 text-right text-blue-600">{formatCurrency(selectedInvoice.balance)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Notes */}
              {selectedInvoice.notes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">Notes</h4>
                  <p className="text-sm text-gray-600">{selectedInvoice.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
                <div className="flex gap-2">
                  {selectedInvoice.balance > 0 && selectedInvoice.status !== 'rejected' && (
                    <button onClick={() => { setPaymentForm({ amount: selectedInvoice.balance, payment_method: 'cash', reference: '', notes: '' }); setShowPaymentModal(true); }} className="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> Record Payment
                    </button>
                  )}
                  {selectedInvoice.status === 'approved' && (
                    <button onClick={handleVoidInvoice} className="btn bg-gray-600 text-white hover:bg-gray-700 flex items-center gap-2">
                      <XCircle className="w-4 h-4" /> Void Invoice
                    </button>
                  )}
                </div>
                
                {selectedInvoice.status === 'pending_finance' && (
                  <div className="flex gap-2">
                    <button onClick={handleReject} className="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2">
                      <XCircle className="w-5 h-5" /> Reject
                    </button>
                    <button onClick={handleApprove} className="btn btn-primary flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" /> Approve Invoice
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold">{editingInvoice ? 'Edit Invoice' : 'Create Invoice'}</h2>
              <button onClick={() => { setShowCreateModal(false); resetInvoiceForm(); }}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Student *</label>
                  <select required value={invoiceForm.student_id} onChange={(e) => setInvoiceForm({...invoiceForm, student_id: e.target.value})} className="input">
                    <option value="">Select Student</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.student_id})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Term *</label>
                  <select required value={invoiceForm.term_id} onChange={(e) => setInvoiceForm({...invoiceForm, term_id: e.target.value})} className="input">
                    <option value="">Select Term</option>
                    {terms.map(t => <option key={t.id} value={t.id}>{t.term_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Due Date</label>
                  <input type="date" value={invoiceForm.due_date} onChange={(e) => setInvoiceForm({...invoiceForm, due_date: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <input type="text" value={invoiceForm.notes} onChange={(e) => setInvoiceForm({...invoiceForm, notes: e.target.value})} className="input" placeholder="Optional notes" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Invoice Items *</label>
                  <button type="button" onClick={addInvoiceItem} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                </div>
                <div className="space-y-2 border rounded-lg p-4 bg-gray-50">
                  {invoiceForm.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4">
                        <select value={item.fee_item_id} onChange={(e) => updateInvoiceItem(idx, 'fee_item_id', e.target.value)} className="input text-sm">
                          <option value="">Select Fee Item</option>
                          {feeItems.map(f => <option key={f.id} value={f.id}>{f.item_name}</option>)}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input type="text" placeholder="Description" value={item.description} onChange={(e) => updateInvoiceItem(idx, 'description', e.target.value)} className="input text-sm" />
                      </div>
                      <div className="col-span-2">
                        <input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={(e) => updateInvoiceItem(idx, 'quantity', parseInt(e.target.value) || 1)} className="input text-sm" />
                      </div>
                      <div className="col-span-2">
                        <input type="number" step="0.01" placeholder="Price" value={item.unit_price} onChange={(e) => updateInvoiceItem(idx, 'unit_price', parseFloat(e.target.value) || 0)} className="input text-sm" />
                      </div>
                      <div className="col-span-1">
                        {invoiceForm.items.length > 1 && (
                          <button type="button" onClick={() => removeInvoiceItem(idx)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="text-right pt-2 border-t mt-2">
                    <span className="font-semibold">Total: {formatCurrency(getInvoiceTotal())}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <button type="button" onClick={() => { setShowCreateModal(false); resetInvoiceForm(); }} className="btn bg-gray-200">Cancel</button>
                <button type="submit" className="btn btn-primary">{editingInvoice ? 'Update Invoice' : 'Create Invoice'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Record Payment</h2>
              <button onClick={() => setShowPaymentModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <p className="text-gray-600 mb-4">Invoice: {selectedInvoice.invoice_number} • Balance: {formatCurrency(selectedInvoice.balance)}</p>
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Amount (GHS) *</label>
                <input type="number" step="0.01" required max={selectedInvoice.balance} value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Payment Method</label>
                <select value={paymentForm.payment_method} onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})} className="input">
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Reference</label>
                <input type="text" value={paymentForm.reference} onChange={(e) => setPaymentForm({...paymentForm, reference: e.target.value})} className="input" placeholder="Transaction reference" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea value={paymentForm.notes} onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})} className="input" rows="2" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn bg-gray-200">Cancel</button>
                <button type="submit" className="btn btn-primary">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">Invoice History</h2>
              <button onClick={() => setShowHistoryModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-6">
              {/* Payment History */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" /> Payment History
                </h3>
                {paymentHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No payments recorded</p>
                ) : (
                  <div className="space-y-2">
                    {paymentHistory.map((payment, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium">{formatCurrency(payment.amount)}</p>
                          <p className="text-sm text-gray-500">{payment.payment_method} • {payment.payment_date}</p>
                        </div>
                        <span className="text-xs text-gray-500">{payment.reference || '-'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status History */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <History className="w-5 h-5" /> Status Changes
                </h3>
                {invoiceHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No history available</p>
                ) : (
                  <div className="space-y-2">
                    {invoiceHistory.map((entry, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{entry.action}</p>
                          <p className="text-sm text-gray-500">{entry.created_at}</p>
                        </div>
                        <span className="text-xs text-gray-500">{entry.user_name || 'System'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
