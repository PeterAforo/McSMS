import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useInvoiceStore = create(
  persist(
    (set, get) => ({
      invoicePayments: {}, // { invoiceId: { paidAmount, payments: [] } }
      
      // Record a payment for an invoice
      recordPayment: (invoiceId, amount, method = 'wallet') => {
        set((state) => {
          const existing = state.invoicePayments[invoiceId] || { paidAmount: 0, payments: [] };
          const newPaidAmount = existing.paidAmount + parseFloat(amount);
          
          return {
            invoicePayments: {
              ...state.invoicePayments,
              [invoiceId]: {
                paidAmount: newPaidAmount,
                payments: [
                  {
                    id: Date.now(),
                    amount: parseFloat(amount),
                    method,
                    date: new Date().toISOString(),
                    reference: `PAY-${Date.now()}`
                  },
                  ...existing.payments
                ]
              }
            }
          };
        });
      },
      
      // Get payment info for an invoice
      getInvoicePayment: (invoiceId) => {
        const payments = get().invoicePayments[invoiceId];
        return payments || { paidAmount: 0, payments: [] };
      },
      
      // Get total paid amount for an invoice
      getPaidAmount: (invoiceId) => {
        const payment = get().invoicePayments[invoiceId];
        return payment ? payment.paidAmount : 0;
      },
      
      // Check if invoice is fully paid
      isFullyPaid: (invoiceId, totalAmount) => {
        const paidAmount = get().getPaidAmount(invoiceId);
        return paidAmount >= parseFloat(totalAmount);
      },
      
      // Get invoice status
      getInvoiceStatus: (invoiceId, totalAmount, originalPaidAmount = 0) => {
        const additionalPaid = get().getPaidAmount(invoiceId);
        const totalPaid = parseFloat(originalPaidAmount) + additionalPaid;
        const balance = parseFloat(totalAmount) - totalPaid;
        
        if (balance <= 0) return 'paid';
        if (totalPaid > 0) return 'partial';
        return 'pending';
      },
      
      // Clear all (for testing)
      reset: () => set({ invoicePayments: {} })
    }),
    {
      name: 'invoice-payments-storage',
      getStorage: () => localStorage
    }
  )
);
