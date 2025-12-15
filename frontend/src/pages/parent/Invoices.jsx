import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FileText, DollarSign, Calendar, Eye, CreditCard, 
  AlertCircle, CheckCircle, Clock, Download, Filter, Printer, Receipt, X
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useInvoiceStore } from '../../store/invoiceStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function ParentInvoices() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { getPaidAmount, getInvoiceStatus } = useInvoiceStore();
  
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printType, setPrintType] = useState('invoice'); // 'invoice' or 'receipt'
  const [schoolSettings, setSchoolSettings] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const printRef = useRef(null);

  useEffect(() => {
    fetchData();
    
    // Handle payment success from navigation state
    if (location.state?.paymentSuccess) {
      const { paidInvoiceId, paidAmount } = location.state;
      
      // Update the invoice in state
      setInvoices(prevInvoices => 
        prevInvoices.map(inv => {
          if (inv.id === paidInvoiceId) {
            const newPaidAmount = parseFloat(inv.paid_amount || 0) + parseFloat(paidAmount);
            const newBalance = parseFloat(inv.total_amount) - newPaidAmount;
            const newStatus = newBalance <= 0 ? 'paid' : 'partial';
            
            return {
              ...inv,
              paid_amount: newPaidAmount,
              balance: newBalance,
              status: newStatus
            };
          }
          return inv;
        })
      );
      
      // Clear the navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch school settings
      try {
        const settingsResponse = await axios.get(`${API_BASE_URL}/settings.php`);
        setSchoolSettings(settingsResponse.data.settings || {});
      } catch (e) {
        console.log('Could not fetch school settings');
      }
      
      // Fetch children for this parent
      const childrenResponse = await axios.get(`${API_BASE_URL}/students.php?parent_id=${user.id}`);
      const childrenData = childrenResponse.data.students || [];
      setChildren(childrenData);
      
      // Fetch all invoices for this parent in one call
      const invoiceResponse = await axios.get(`${API_BASE_URL}/finance.php?resource=invoices&parent_id=${user.id}`);
      const allInvoices = (invoiceResponse.data.invoices || []).map(inv => {
        // Get additional payments from store
        const additionalPaid = getPaidAmount(inv.id);
        const originalPaid = parseFloat(inv.paid_amount || 0);
        const totalPaid = originalPaid + additionalPaid;
        const totalAmount = parseFloat(inv.total_amount);
        const newBalance = totalAmount - totalPaid;
        const newStatus = getInvoiceStatus(inv.id, totalAmount, originalPaid);
        
        // Find the child for this invoice
        const child = childrenData.find(c => c.id == inv.student_id);
        
        return {
          ...inv,
          paid_amount: totalPaid,
          balance: newBalance,
          status: newStatus,
          student_name: child ? `${child.first_name} ${child.last_name}` : `${inv.first_name || ''} ${inv.last_name || ''}`.trim() || 'Unknown',
          student_id: inv.student_id,
          class_name: child?.class_name || inv.class_name || 'N/A',
          student_code: child?.student_id || inv.student_code || 'N/A'
        };
      });
      
      setInvoices(allInvoices);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch invoice details for printing
  const fetchInvoiceDetails = async (invoice) => {
    try {
      // Fetch invoice items
      const detailsResponse = await axios.get(`${API_BASE_URL}/finance.php?resource=invoices&id=${invoice.id}`);
      if (detailsResponse.data.invoice?.items) {
        setInvoiceItems(detailsResponse.data.invoice.items);
      } else {
        // If no items, create a default item from the invoice
        setInvoiceItems([{
          description: `School Fees - ${invoice.term_name || 'Current Term'}`,
          quantity: 1,
          unit_price: invoice.total_amount,
          amount: invoice.total_amount
        }]);
      }
      
      // Fetch payments for this invoice
      try {
        const paymentsResponse = await axios.get(`${API_BASE_URL}/finance.php?resource=payments&invoice_id=${invoice.id}`);
        setPayments(paymentsResponse.data.payments || []);
      } catch (e) {
        setPayments([]);
      }
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      setInvoiceItems([{
        description: `School Fees - ${invoice.term_name || 'Current Term'}`,
        quantity: 1,
        unit_price: invoice.total_amount,
        amount: invoice.total_amount
      }]);
    }
  };

  // Handle print
  const handlePrint = async (invoice, type = 'invoice') => {
    setSelectedInvoice(invoice);
    setPrintType(type);
    await fetchInvoiceDetails(invoice);
    setShowPrintModal(true);
  };

  // Print document
  const printDocument = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${printType === 'invoice' ? 'Invoice' : 'Receipt'} - ${selectedInvoice?.invoice_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #333; }
          .print-container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #1e40af; padding-bottom: 15px; margin-bottom: 20px; }
          .logo { max-height: 60px; margin-bottom: 10px; }
          .school-name { font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 5px; }
          .school-details { font-size: 11px; color: #666; }
          .document-title { font-size: 20px; font-weight: bold; color: ${printType === 'receipt' ? '#059669' : '#1e40af'}; 
                           margin: 15px 0; text-transform: uppercase; letter-spacing: 2px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .info-box { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .info-box h4 { font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 8px; }
          .info-box p { margin: 4px 0; }
          .info-box .value { font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #1e40af; color: white; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; }
          td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) { background: #f8fafc; }
          .totals { margin-top: 20px; }
          .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
          .totals-row.total { font-size: 16px; font-weight: bold; border-top: 2px solid #1e40af; border-bottom: none; padding-top: 15px; }
          .totals-row.paid { color: #059669; }
          .totals-row.balance { color: #dc2626; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; }
          .status-paid { background: #dcfce7; color: #166534; }
          .status-partial { background: #dbeafe; color: #1e40af; }
          .status-pending { background: #fef3c7; color: #92400e; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 10px; color: #64748b; }
          .payment-info { background: #ecfdf5; padding: 15px; border-radius: 8px; margin-top: 20px; border: 1px solid #a7f3d0; }
          .payment-info h4 { color: #059669; margin-bottom: 10px; }
          .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); 
                       font-size: 100px; color: rgba(0,0,0,0.03); font-weight: bold; z-index: -1; }
          @media print { 
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesChild = selectedChild === 'all' || invoice.student_id == selectedChild;
    const matchesStatus = selectedStatus === 'all' || invoice.status === selectedStatus;
    return matchesChild && matchesStatus;
  });

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
  const paidAmount = filteredInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
  const pendingAmount = filteredInvoices
    .filter(inv => inv.status !== 'paid')
    .reduce((sum, inv) => sum + parseFloat(inv.balance || 0), 0);

  const getStatusColor = (status) => {
    const colors = {
      paid: 'bg-green-100 text-green-700 border-green-300',
      partial: 'bg-blue-100 text-blue-700 border-blue-300',
      pending_payment: 'bg-orange-100 text-orange-700 border-orange-300',
      approved: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      pending_approval: 'bg-gray-100 text-gray-700 border-gray-300'
    };
    return colors[status] || colors.pending_approval;
  };

  const getStatusIcon = (status) => {
    if (status === 'paid') return CheckCircle;
    if (status === 'partial') return Clock;
    return AlertCircle;
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };

  const handlePayInvoice = (invoice) => {
    navigate('/parent/payments', { state: { invoice } });
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === '0000-00-00' || dateString === 'null') {
      return 'N/A';
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">View and pay your children's school fees</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{filteredInvoices.length}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-green-600">₵{paidAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">₵{pendingAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Child</label>
            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="input"
            >
              <option value="all">All Children</option>
              {children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.first_name} {child.last_name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partially Paid</option>
              <option value="pending_payment">Pending Payment</option>
              <option value="approved">Approved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Child</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Term</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                    No invoices found
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice, index) => {
                  const StatusIcon = getStatusIcon(invoice.status);
                  return (
                    <tr key={`invoice-${invoice.id}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-sm">{invoice.invoice_number}</td>
                      <td className="px-6 py-4">{invoice.student_name}</td>
                      <td className="px-6 py-4">{invoice.term_name}</td>
                      <td className="px-6 py-4 font-semibold">₵{parseFloat(invoice.total_amount).toLocaleString()}</td>
                      <td className="px-6 py-4 text-green-600">₵{parseFloat(invoice.paid_amount || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-orange-600 font-semibold">₵{parseFloat(invoice.balance || 0).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(invoice.status)}`}>
                          <StatusIcon className="w-3 h-3 inline mr-1" />
                          {invoice.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {formatDate(invoice.due_date)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1 flex-wrap">
                          <button
                            onClick={() => handleViewInvoice(invoice)}
                            className="btn bg-gray-200 hover:bg-gray-300 text-sm p-2"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePrint(invoice, 'invoice')}
                            className="btn bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm p-2"
                            title="Print Invoice"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          {parseFloat(invoice.paid_amount || 0) > 0 && (
                            <button
                              onClick={() => handlePrint(invoice, 'receipt')}
                              className="btn bg-green-100 hover:bg-green-200 text-green-700 text-sm p-2"
                              title="Print Receipt"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                          )}
                          {invoice.status !== 'paid' && parseFloat(invoice.balance) > 0 && (
                            <button
                              onClick={() => handlePayInvoice(invoice)}
                              className="btn btn-primary text-sm"
                            >
                              <CreditCard className="w-4 h-4" />
                              Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Invoice Details</h2>
              <button 
                onClick={() => setShowInvoiceModal(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Invoice Header */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Invoice Number</p>
                  <p className="font-semibold">{selectedInvoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(selectedInvoice.status)}`}>
                    {selectedInvoice.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Student</p>
                  <p className="font-semibold">{selectedInvoice.student_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Term</p>
                  <p className="font-semibold">{selectedInvoice.term_name}</p>
                </div>
              </div>

              {/* Amount Details */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Amount Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-semibold">₵{parseFloat(selectedInvoice.total_amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid Amount:</span>
                    <span className="font-semibold text-green-600">₵{parseFloat(selectedInvoice.paid_amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Balance:</span>
                    <span className="font-bold text-orange-600">₵{parseFloat(selectedInvoice.balance || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Issue Date</p>
                    <p className="font-semibold">
                      {formatDate(selectedInvoice.issue_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Due Date</p>
                    <p className="font-semibold">
                      {formatDate(selectedInvoice.due_date)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowInvoiceModal(false);
                    handlePrint(selectedInvoice, 'invoice');
                  }}
                  className="btn bg-blue-100 hover:bg-blue-200 text-blue-700"
                >
                  <FileText className="w-4 h-4" />
                  Print Invoice
                </button>
                {parseFloat(selectedInvoice.paid_amount || 0) > 0 && (
                  <button
                    onClick={() => {
                      setShowInvoiceModal(false);
                      handlePrint(selectedInvoice, 'receipt');
                    }}
                    className="btn bg-green-100 hover:bg-green-200 text-green-700"
                  >
                    <Receipt className="w-4 h-4" />
                    Print Receipt
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="btn bg-gray-200 hover:bg-gray-300"
                >
                  Close
                </button>
                {selectedInvoice.status !== 'paid' && parseFloat(selectedInvoice.balance) > 0 && (
                  <button
                    onClick={() => {
                      setShowInvoiceModal(false);
                      handlePayInvoice(selectedInvoice);
                    }}
                    className="btn btn-primary"
                  >
                    <CreditCard className="w-4 h-4" />
                    Make Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {showPrintModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white p-4 border-b flex items-center justify-between z-10">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                {printType === 'invoice' ? (
                  <><FileText className="w-5 h-5 text-blue-600" /> Invoice Preview</>
                ) : (
                  <><Receipt className="w-5 h-5 text-green-600" /> Receipt Preview</>
                )}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={printDocument}
                  className={`btn ${printType === 'invoice' ? 'btn-primary' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                >
                  <Printer className="w-4 h-4" />
                  Print {printType === 'invoice' ? 'Invoice' : 'Receipt'}
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="btn bg-gray-200 hover:bg-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Print Content */}
            <div ref={printRef} className="p-8">
              <div className="print-container">
                {/* Watermark for paid invoices */}
                {printType === 'receipt' && (
                  <div className="watermark">PAID</div>
                )}

                {/* Header with School Info */}
                <div className="header text-center border-b-2 border-blue-800 pb-4 mb-6">
                  {schoolSettings?.school_logo && (
                    <img 
                      src={schoolSettings.school_logo} 
                      alt="School Logo" 
                      className="logo h-16 mx-auto mb-2"
                    />
                  )}
                  <h1 className="school-name text-2xl font-bold text-blue-800">
                    {schoolSettings?.school_name || 'School Name'}
                  </h1>
                  <div className="school-details text-sm text-gray-600 mt-1">
                    <p>{schoolSettings?.school_address || 'School Address'}</p>
                    <p>
                      {schoolSettings?.school_phone && `Tel: ${schoolSettings.school_phone}`}
                      {schoolSettings?.school_phone && schoolSettings?.school_email && ' | '}
                      {schoolSettings?.school_email && `Email: ${schoolSettings.school_email}`}
                    </p>
                    {schoolSettings?.school_website && (
                      <p>Website: {schoolSettings.school_website}</p>
                    )}
                  </div>
                </div>

                {/* Document Title */}
                <div className="text-center mb-6">
                  <h2 className={`document-title text-xl font-bold uppercase tracking-wider ${
                    printType === 'receipt' ? 'text-green-600' : 'text-blue-800'
                  }`}>
                    {printType === 'invoice' ? 'INVOICE' : 'PAYMENT RECEIPT'}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    {printType === 'invoice' ? 'Invoice' : 'Receipt'} #: {selectedInvoice.invoice_number}
                  </p>
                </div>

                {/* Info Grid */}
                <div className="info-grid grid grid-cols-2 gap-6 mb-6">
                  {/* Student Info */}
                  <div className="info-box bg-gray-50 p-4 rounded-lg border">
                    <h4 className="text-xs text-gray-500 uppercase font-semibold mb-2">Student Information</h4>
                    <p><span className="text-gray-600">Name:</span> <span className="value font-semibold">{selectedInvoice.student_name}</span></p>
                    <p><span className="text-gray-600">Student ID:</span> <span className="value font-semibold">{selectedInvoice.student_code}</span></p>
                    <p><span className="text-gray-600">Class:</span> <span className="value font-semibold">{selectedInvoice.class_name}</span></p>
                    <p><span className="text-gray-600">Term:</span> <span className="value font-semibold">{selectedInvoice.term_name}</span></p>
                  </div>

                  {/* Invoice Info */}
                  <div className="info-box bg-gray-50 p-4 rounded-lg border">
                    <h4 className="text-xs text-gray-500 uppercase font-semibold mb-2">{printType === 'invoice' ? 'Invoice' : 'Receipt'} Details</h4>
                    <p><span className="text-gray-600">{printType === 'invoice' ? 'Invoice' : 'Receipt'} No:</span> <span className="value font-semibold">{selectedInvoice.invoice_number}</span></p>
                    <p><span className="text-gray-600">Date:</span> <span className="value font-semibold">{formatDate(selectedInvoice.created_at) || formatDate(new Date())}</span></p>
                    {printType === 'invoice' && selectedInvoice.due_date && (
                      <p><span className="text-gray-600">Due Date:</span> <span className="value font-semibold">{formatDate(selectedInvoice.due_date)}</span></p>
                    )}
                    <p>
                      <span className="text-gray-600">Status:</span> 
                      <span className={`status-badge ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                        selectedInvoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                        selectedInvoice.status === 'partial' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {selectedInvoice.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full border-collapse mb-6">
                  <thead>
                    <tr className="bg-blue-800 text-white">
                      <th className="p-3 text-left text-xs uppercase">#</th>
                      <th className="p-3 text-left text-xs uppercase">Description</th>
                      <th className="p-3 text-center text-xs uppercase">Qty</th>
                      <th className="p-3 text-right text-xs uppercase">Unit Price</th>
                      <th className="p-3 text-right text-xs uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceItems.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="p-3 border-b">{index + 1}</td>
                        <td className="p-3 border-b">{item.description || item.item_name || 'School Fees'}</td>
                        <td className="p-3 border-b text-center">{item.quantity || 1}</td>
                        <td className="p-3 border-b text-right">GHS {parseFloat(item.unit_price || item.amount).toLocaleString()}</td>
                        <td className="p-3 border-b text-right font-semibold">GHS {parseFloat(item.amount).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="totals max-w-sm ml-auto">
                  <div className="totals-row flex justify-between py-2 border-b">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">GHS {parseFloat(selectedInvoice.total_amount).toLocaleString()}</span>
                  </div>
                  <div className="totals-row paid flex justify-between py-2 border-b text-green-600">
                    <span>Amount Paid:</span>
                    <span className="font-semibold">GHS {parseFloat(selectedInvoice.paid_amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="totals-row total flex justify-between py-3 border-t-2 border-blue-800 mt-2">
                    <span className="font-bold text-lg">
                      {printType === 'receipt' ? 'Total Paid:' : 'Balance Due:'}
                    </span>
                    <span className={`font-bold text-lg ${printType === 'receipt' ? 'text-green-600' : 'text-red-600'}`}>
                      GHS {printType === 'receipt' 
                        ? parseFloat(selectedInvoice.paid_amount || 0).toLocaleString()
                        : parseFloat(selectedInvoice.balance || 0).toLocaleString()
                      }
                    </span>
                  </div>
                </div>

                {/* Payment History for Receipt */}
                {printType === 'receipt' && payments.length > 0 && (
                  <div className="payment-info bg-green-50 p-4 rounded-lg mt-6 border border-green-200">
                    <h4 className="text-green-700 font-semibold mb-3">Payment History</h4>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-green-200">
                          <th className="py-2 text-left">Date</th>
                          <th className="py-2 text-left">Reference</th>
                          <th className="py-2 text-left">Method</th>
                          <th className="py-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((payment, index) => (
                          <tr key={index} className="border-b border-green-100">
                            <td className="py-2">{formatDate(payment.payment_date)}</td>
                            <td className="py-2">{payment.reference_number || payment.payment_number}</td>
                            <td className="py-2 capitalize">{payment.payment_method}</td>
                            <td className="py-2 text-right font-semibold">GHS {parseFloat(payment.amount).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Footer */}
                <div className="footer mt-8 pt-4 border-t text-center text-xs text-gray-500">
                  <p className="mb-1">Thank you for your payment. For any inquiries, please contact the school office.</p>
                  <p>This is a computer-generated {printType === 'invoice' ? 'invoice' : 'receipt'} and does not require a signature.</p>
                  <p className="mt-2 text-gray-400">Generated on {new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
