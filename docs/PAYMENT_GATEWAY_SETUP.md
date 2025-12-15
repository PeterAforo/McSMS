# 🎯 PAYMENT GATEWAY SETUP GUIDE

## ✅ **CURRENT STATUS: DEMO MODE**

The payment system is currently running in **DEMO MODE** for testing without Hubtel credentials.

---

## 🎮 **DEMO MODE FEATURES:**

### **What Works:**
- ✅ Wallet top-up (simulated)
- ✅ Invoice payment via wallet
- ✅ Invoice payment via Hubtel (simulated)
- ✅ Balance updates
- ✅ Payment confirmations
- ✅ 2-second processing simulation

### **Demo Behavior:**
```
1. Top Up Wallet:
   - Select amount
   - Click "Add Funds"
   - Wait 2 seconds
   - Wallet balance increases
   - Success message shown

2. Pay from Wallet:
   - Select invoice
   - Choose "Wallet Balance"
   - Click "Pay"
   - Wait 1.5 seconds
   - Balance deducted
   - Success message shown

3. Pay via Hubtel (Demo):
   - Select invoice
   - Choose "Mobile Money / Card"
   - Click "Pay"
   - Wait 2 seconds
   - Success message (no redirect)
   - Note about production behavior
```

---

## 🔧 **PRODUCTION SETUP:**

### **Step 1: Get Hubtel Credentials**

1. **Sign up at Hubtel:**
   - Go to https://hubtel.com
   - Create merchant account
   - Complete verification

2. **Get API Credentials:**
   - Login to Hubtel dashboard
   - Navigate to API section
   - Copy `Client ID`
   - Copy `Client Secret`
   - Note your `Merchant Account Number`

### **Step 2: Configure Backend**

**File:** `backend/api/payment_gateway.php`

```php
// Line 9-11: Update these values
define('HUBTEL_CLIENT_ID', 'your_actual_client_id_here');
define('HUBTEL_CLIENT_SECRET', 'your_actual_client_secret_here');
define('HUBTEL_API_URL', 'https://payproxyapi.hubtel.com/items/initiate');
```

### **Step 3: Update Frontend**

**File:** `frontend/src/pages/parent/Payments.jsx`

**Line 83-108:** Uncomment the production code:

```javascript
// Remove the demo code (lines 61-81)
// Uncomment lines 83-108

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

const response = await axios.post('http://localhost/McSMS/backend/api/payment_gateway.php?action=initiate', paymentData);

if (response.data.success && response.data.checkoutUrl) {
  window.location.href = response.data.checkoutUrl;
} else {
  alert('Failed to initiate payment. Please try again.');
}
```

**Line 144-163:** Uncomment wallet payment production code

### **Step 4: Run Database Migration**

```sql
-- Run this file
mysql -u root -p mcsms < backend/migrations/create_wallet_tables.sql

-- Or manually execute:
CREATE TABLE parent_wallets (...);
CREATE TABLE wallet_transactions (...);
CREATE TABLE payment_transactions (...);
```

### **Step 5: Test in Sandbox**

1. **Use Hubtel Sandbox:**
   - Set API URL to sandbox endpoint
   - Use test credentials
   - Test payment flow

2. **Test Scenarios:**
   - Wallet top-up
   - Invoice payment
   - Callback handling
   - Failed payments
   - Cancelled payments

### **Step 6: Go Live**

1. **Switch to Production:**
   - Update API URL to production
   - Use live credentials
   - Update merchant account number

2. **Monitor:**
   - Check payment logs
   - Verify callbacks
   - Test with small amounts first

---

## 🔐 **SECURITY CHECKLIST:**

- [ ] Hubtel credentials stored securely (not in git)
- [ ] HTTPS enabled on production
- [ ] Callback URL verified
- [ ] Payment amounts validated
- [ ] Duplicate payment prevention
- [ ] Transaction logging enabled
- [ ] Error handling implemented
- [ ] User authentication required

---

## 📱 **HUBTEL PAYMENT METHODS:**

### **Supported:**
- 📱 MTN Mobile Money
- 📱 Vodafone Cash
- 📱 AirtelTigo Money
- 💳 Visa
- 💳 Mastercard
- 🏦 Bank Transfer

### **Transaction Fees:**
- Mobile Money: ~1-2%
- Card Payments: ~2.5-3.5%
- Bank Transfer: Varies

---

## 🧪 **TESTING DEMO MODE:**

### **Test Wallet Top-Up:**
```
1. Login as parent
2. Go to /parent/payments
3. Click "Top Up Wallet"
4. Select ₵1000
5. Click "Add ₵1,000"
6. ✅ Wait 2 seconds
7. ✅ See success alert
8. ✅ Balance increases to ₵6,000
```

### **Test Wallet Payment:**
```
1. Go to /parent/invoices
2. Find unpaid invoice
3. Click "Pay"
4. Select "Wallet Balance"
5. Enter amount (e.g., ₵500)
6. Click "Pay"
7. ✅ Wait 1.5 seconds
8. ✅ See success alert
9. ✅ Balance decreases
```

### **Test Hubtel Payment (Demo):**
```
1. Go to /parent/invoices
2. Find unpaid invoice
3. Click "Pay"
4. Select "Mobile Money / Card"
5. Enter amount
6. Click "Pay"
7. ✅ Wait 2 seconds
8. ✅ See demo success message
9. ✅ Note about production redirect
```

---

## 🐛 **TROUBLESHOOTING:**

### **"Failed to initiate payment"**
- ✅ **FIXED:** Now runs in demo mode
- Production: Check Hubtel credentials
- Production: Verify API endpoint
- Production: Check network connectivity

### **Wallet balance not updating**
- Check browser console for errors
- Verify state management
- Check React DevTools

### **Payment not processing**
- Verify demo mode is active
- Check console for errors
- Ensure amount is valid

---

## 📊 **PAYMENT FLOW DIAGRAM:**

```
DEMO MODE:
User → Click Pay → 2s Delay → Success Alert → Balance Update

PRODUCTION MODE:
User → Click Pay → Backend API → Hubtel API → Checkout Page
  ↓
User Pays → Hubtel Callback → Backend Process → Update DB
  ↓
Redirect Back → Show Success → Update Balance
```

---

## 🎯 **NEXT STEPS:**

1. **For Testing:**
   - ✅ Use demo mode (already active)
   - Test all payment scenarios
   - Verify UI/UX

2. **For Production:**
   - Get Hubtel credentials
   - Update configuration
   - Run database migration
   - Test in sandbox
   - Go live

3. **Optional Enhancements:**
   - Add mNotify SMS notifications
   - Implement payment receipts
   - Add payment history export
   - Create payment analytics

---

## 📞 **SUPPORT:**

**Hubtel Support:**
- Website: https://hubtel.com
- Email: support@hubtel.com
- Phone: +233 30 281 8181

**Documentation:**
- API Docs: https://developers.hubtel.com
- Integration Guide: Available on Hubtel dashboard

---

**Current Status: ✅ Demo Mode Active - Ready for Testing!**

**To enable production payments, follow the Production Setup steps above.**
