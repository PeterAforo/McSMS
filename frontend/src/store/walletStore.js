import { create } from 'zustand';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export const useWalletStore = create((set, get) => ({
  balance: 0,
  transactions: [],
  loading: false,
  error: null,
  walletId: null,
  
  // Fetch wallet balance and transactions from API
  fetchWallet: async (userId) => {
    if (!userId) return;
    
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/wallet.php?action=get_balance&user_id=${userId}`);
      if (response.data.success) {
        set({
          balance: response.data.wallet.balance,
          walletId: response.data.wallet.id,
          transactions: response.data.transactions.map(t => ({
            id: t.id,
            type: t.type,
            amount: parseFloat(t.amount),
            description: t.description,
            reference: t.reference,
            date: t.created_at,
            balanceBefore: parseFloat(t.balance_before),
            balanceAfter: parseFloat(t.balance_after)
          })),
          loading: false
        });
        return response.data.wallet.balance;
      } else {
        set({ error: response.data.error, loading: false });
        return 0;
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
      set({ error: 'Failed to fetch wallet', loading: false });
      return 0;
    }
  },
  
  // Set wallet balance (local only, for optimistic updates)
  setBalance: (balance) => set({ balance }),
  
  // Add funds to wallet via API
  addFunds: async (userId, amount, paymentMethod = 'online', description = 'Wallet Top-up') => {
    if (!userId || amount <= 0) return false;
    
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${API_BASE_URL}/wallet.php?action=top_up`, {
        user_id: userId,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        description
      });
      
      if (response.data.success) {
        // Refresh wallet data
        await get().fetchWallet(userId);
        return { success: true, reference: response.data.reference, balance: response.data.balance };
      } else {
        set({ error: response.data.error, loading: false });
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      console.error('Error adding funds:', error);
      set({ error: 'Failed to add funds', loading: false });
      return { success: false, error: 'Failed to add funds' };
    }
  },
  
  // Deduct from wallet via API
  deductFunds: async (userId, amount, description = 'Payment', invoiceId = null) => {
    if (!userId || amount <= 0) return { success: false, error: 'Invalid parameters' };
    
    const currentBalance = get().balance;
    if (currentBalance < parseFloat(amount)) {
      return { success: false, error: 'Insufficient balance' };
    }
    
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${API_BASE_URL}/wallet.php?action=deduct`, {
        user_id: userId,
        amount: parseFloat(amount),
        description,
        invoice_id: invoiceId
      });
      
      if (response.data.success) {
        // Refresh wallet data
        await get().fetchWallet(userId);
        return { success: true, reference: response.data.reference, balance: response.data.balance };
      } else {
        set({ error: response.data.error, loading: false });
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      console.error('Error deducting funds:', error);
      set({ error: 'Failed to process payment', loading: false });
      return { success: false, error: 'Failed to process payment' };
    }
  },
  
  // Get transaction history
  getTransactions: () => get().transactions,
  
  // Clear error
  clearError: () => set({ error: null }),
  
  // Reset store (for logout)
  reset: () => set({ balance: 0, transactions: [], walletId: null, error: null })
}));
