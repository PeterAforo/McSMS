import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  CreditCard, Wallet, DollarSign, Plus, ArrowRight, 
  CheckCircle, AlertCircle, Clock, History, TrendingUp
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useWalletStore } from '../../store/walletStore';
import { useInvoiceStore } from '../../store/invoiceStore';
import axios from 'axios';

export default function ParentPayments() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    balance: walletBalance, 
    addFunds, 
    deductFunds, 
    transactions, 
    fetchWallet,
    loading: walletLoading 
  } = useWalletStore();
  const { recordPayment } = useInvoiceStore();
  
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [topUpAmount, setTopUpAmount] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchWalletData();
    }
    
    // Check if invoice was passed from Invoices page
    if (location.state?.invoice) {
      setSelectedInvoice(location.state.invoice);
      setPaymentAmount(location.state.invoice.balance);
      setShowPaymentModal(true);
    }
  }, [location, user?.id]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      // Fetch wallet from API (now persisted in database)
      await fetchWallet(user.id);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHubtelPayment = async (amount) => {
    try {
      setProcessing(true);
      
      // Simulate processing delay (in production, this would redirect to Hubtel)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (selectedInvoice) {
        // Process invoice payment
        recordPayment(selectedInvoice.id, amount, 'hubtel');
        alert(`Payment of GHS ${amount} for Invoice ${selectedInvoice.invoice_number} successful!`);
        setShowPaymentModal(false);
        navigate('/parent/invoices', { 
          state: { 
            paymentSuccess: true, 
            paidInvoiceId: selectedInvoice.id,
            paidAmount: amount 
          } 
        });
      } else {
        // Process wallet top-up via API
        const result = await addFunds(user.id, amount, 'hubtel', 'Wallet Top-up via Hubtel');
        
        if (result.success) {
          alert(`Wallet topped up successfully!\n\nAmount: GHS ${amount}\nReference: ${result.reference}\nNew Balance: GHS ${result.balance.toLocaleString()}`);
          setShowTopUpModal(false);
          setTopUpAmount('');
        } else {
          alert(`Top-up failed: ${result.error}`);
        }
      }
      
      /* PRODUCTION CODE - Uncomment when Hubtel is configured:
      
      const paymentData = {
        amount: amount,
        currency: 'GHS',
        description: selectedInvoice 
          ? `Payment for Invoice ${selectedInvoice.invoice_number}` 
          : `Wallet Top-up - Parent ID: ${user.id}`,
        clientReference: `PAY-${Date.now()}`,
        callbackUrl: `${window.location.origin}/parent/payments/callback`,
        returnUrl: `${window.location.origin}/parent/payments`,
        cancellationUrl: `${window.location.origin}/parent/payments`,
        merchantAccountNumber: 'YOUR_HUBTEL_MERCHANT_NUMBER',
        customerName: `${user.first_name} ${user.last_name}`,
        customerEmail: user.email,
        customerMobileNumber: user.phone || ''
      };

      const response = await axios.post('https://eea.mcaforo.com/backend/api/payment_gateway.php?action=initiate', paymentData);
      
      if (response.data.success && response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      } else {
        alert('Failed to initiate payment. Please try again.');
      }
      */
      
    } catch (error) {
      console.error('Error initiating payment:', error);
      alert('Payment initiation failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleWalletPayment = async () => {
    if (!selectedInvoice) return;
    
    const amount = parseFloat(paymentAmount);
    
    if (amount > walletBalance) {
      alert('Insufficient wallet balance. Please top up your wallet first.');
      return;
    }

    try {
      setProcessing(true);
      
      // Deduct from wallet using API
      const result = await deductFunds(
        user.id, 
        amount, 
        `Payment for Invoice ${selectedInvoice.invoice_number}`,
        selectedInvoice.id
      );
      
      if (!result.success) {
        alert(result.error || 'Payment failed. Please try again.');
        return;
      }
      
      // Record payment in invoice store (for local state)
      recordPayment(selectedInvoice.id, amount, 'wallet');
      
      // Show success message
      alert(`Payment successful!\n\nAmount: GHS ${amount}\nInvoice: ${selectedInvoice.invoice_number}\nReference: ${result.reference}\nNew Balance: GHS ${result.balance.toLocaleString()}`);
      
      setShowPaymentModal(false);
      
      // Navigate back with payment success state
      navigate('/parent/invoices', { 
        state: { 
          paymentSuccess: true, 
          paidInvoiceId: selectedInvoice.id,
          paidAmount: amount 
        } 
      });
      
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    
    if (amount < 10) {
      alert('Minimum top-up amount is ₵10');
      return;
    }

    // Initiate Hubtel payment for top-up
    await handleHubtelPayment(amount);
  };

  const handlePayment = async () => {
    if (paymentMethod === 'wallet') {
      await handleWalletPayment();
    } else {
      // Direct payment via Hubtel
      await handleHubtelPayment(parseFloat(paymentAmount));
    }
  };

  const quickTopUpAmounts = [100, 500, 1000, 5000, 10000];

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
          <h1 className="text-2xl font-bold text-gray-900">Payments & Wallet</h1>
          <p className="text-gray-600 mt-1">Manage payments and wallet balance</p>
        </div>
        <button
          onClick={() => setShowTopUpModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          Top Up Wallet
        </button>
      </div>

      {/* Wallet Balance Card */}
      <div className="card p-8 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-6 h-6" />
              <p className="text-blue-100">Wallet Balance</p>
            </div>
            <p className="text-4xl font-bold">₵{walletBalance.toLocaleString()}</p>
            <p className="text-blue-100 mt-2">Available for payments</p>
          </div>
          <div className="text-right">
            <button
              onClick={() => setShowTopUpModal(true)}
              className="btn bg-white text-blue-600 hover:bg-blue-50"
            >
              <Plus className="w-4 h-4" />
              Add Funds
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">
                ₵{transactions
                  .filter(t => t.type === 'debit')
                  .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <History className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                ₵{transactions
                  .filter(t => t.type === 'debit' && new Date(t.date).getMonth() === new Date().getMonth())
                  .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Payment History</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    {walletLoading ? 'Loading transactions...' : 'No transaction history yet'}
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm">{transaction.reference}</td>
                    <td className="px-6 py-4">{transaction.description}</td>
                    <td className="px-6 py-4 capitalize">
                      {transaction.type === 'credit' ? 'Top-up' : 'Payment'}
                    </td>
                    <td className={`px-6 py-4 font-semibold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'credit' ? '+' : '-'}GHS {parseFloat(transaction.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                        Completed
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-semibold">Make Payment</h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Invoice Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Invoice</p>
                <p className="font-semibold">{selectedInvoice.invoice_number}</p>
                <p className="text-sm text-gray-600 mt-2">Student</p>
                <p className="font-semibold">{selectedInvoice.student_name}</p>
                <p className="text-sm text-gray-600 mt-2">Balance Due</p>
                <p className="text-2xl font-bold text-orange-600">₵{parseFloat(selectedInvoice.balance).toLocaleString()}</p>
              </div>

              {/* Payment Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  max={selectedInvoice.balance}
                  className="input"
                  placeholder="Enter amount"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <div className="space-y-2">
                  <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="wallet"
                      checked={paymentMethod === 'wallet'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <Wallet className="w-5 h-5 mr-2 text-blue-600" />
                    <div className="flex-1">
                      <p className="font-medium">Wallet Balance</p>
                      <p className="text-sm text-gray-600">Available: ₵{walletBalance.toLocaleString()}</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="hubtel"
                      checked={paymentMethod === 'hubtel'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <CreditCard className="w-5 h-5 mr-2 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium">Mobile Money / Card</p>
                      <p className="text-sm text-gray-600">Pay via Hubtel</p>
                    </div>
                  </label>
                </div>
              </div>

              {paymentMethod === 'wallet' && parseFloat(paymentAmount) > walletBalance && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-900">Insufficient Balance</p>
                      <p className="text-sm text-orange-700 mt-1">
                        Please top up your wallet or choose another payment method.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="btn bg-gray-200 hover:bg-gray-300"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={processing || !paymentAmount || parseFloat(paymentAmount) <= 0}
                className="btn btn-primary"
              >
                {processing ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    Pay ₵{parseFloat(paymentAmount || 0).toLocaleString()}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-semibold">Top Up Wallet</h2>
              <p className="text-gray-600 mt-1">Add funds to your wallet for easy payments</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Current Balance */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Current Balance</p>
                <p className="text-2xl font-bold text-blue-600">₵{walletBalance.toLocaleString()}</p>
              </div>

              {/* Quick Amounts */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quick Select</label>
                <div className="grid grid-cols-3 gap-2">
                  {quickTopUpAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setTopUpAmount(amount.toString())}
                      className={`p-3 border-2 rounded-lg font-semibold transition-colors ${
                        topUpAmount === amount.toString()
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      ₵{amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Or Enter Custom Amount</label>
                <input
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  min="10"
                  className="input"
                  placeholder="Enter amount (min ₵10)"
                />
              </div>

              {/* Payment Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <CreditCard className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Secure Payment via Hubtel</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Pay with Mobile Money, Visa, or Mastercard
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowTopUpModal(false);
                  setTopUpAmount('');
                }}
                className="btn bg-gray-200 hover:bg-gray-300"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleTopUp}
                disabled={processing || !topUpAmount || parseFloat(topUpAmount) < 10}
                className="btn btn-primary"
              >
                {processing ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add ₵{parseFloat(topUpAmount || 0).toLocaleString()}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
