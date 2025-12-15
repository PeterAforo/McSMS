<div class="mb-5">
    <h1>Record Payment</h1>
    <p class="text-muted">Invoice #<?= str_pad($invoice['id'], 5, '0', STR_PAD_LEFT) ?> - <?= htmlspecialchars($invoice['student_name']) ?></p>
</div>

<!-- Invoice Summary -->
<div class="sms-card mb-5">
    <div class="card-header">
        <h2 class="card-title">Invoice Summary</h2>
    </div>
    <div class="card-body">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-4);">
            <div>
                <p class="text-muted">Total Amount</p>
                <p style="font-size: var(--font-size-lg); font-weight: var(--font-weight-bold);">
                    <?= formatCurrency($invoice['total_amount']) ?>
                </p>
            </div>
            <div>
                <p class="text-muted">Amount Paid</p>
                <p style="font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--color-success);">
                    <?= formatCurrency($invoice['amount_paid']) ?>
                </p>
            </div>
            <div>
                <p class="text-muted">Balance Due</p>
                <p style="font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--color-error);">
                    <?= formatCurrency($invoice['balance']) ?>
                </p>
            </div>
        </div>
    </div>
</div>

<!-- Payment Form -->
<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">Payment Details</h2>
    </div>
    <div class="card-body">
        <form action="<?= APP_URL ?>/index.php?c=fees&a=storePayment" method="POST" data-validate>
            <input type="hidden" name="invoice_id" value="<?= $invoice['id'] ?>">
            
            <div class="form-group">
                <label for="amount" class="form-label">Payment Amount *</label>
                <input type="number" id="amount" name="amount" class="form-control" required min="0.01" max="<?= $invoice['balance'] ?>" step="0.01" value="<?= $invoice['balance'] ?>" placeholder="0.00">
                <small class="text-muted">Maximum: <?= formatCurrency($invoice['balance']) ?></small>
            </div>

            <div class="form-group">
                <label for="payment_method" class="form-label">Payment Method *</label>
                <select id="payment_method" name="payment_method" class="form-control form-select" required>
                    <option value="">Select Method</option>
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="online">Online Payment</option>
                </select>
            </div>

            <div class="form-group">
                <label for="reference_no" class="form-label">Reference Number</label>
                <input type="text" id="reference_no" name="reference_no" class="form-control" placeholder="Transaction reference (optional)">
            </div>

            <div class="form-group">
                <button type="submit" class="btn btn-success">
                    <i class="fas fa-check"></i> Record Payment
                </button>
                <a href="<?= APP_URL ?>/index.php?c=fees&a=viewInvoice&id=<?= $invoice['id'] ?>" class="btn btn-outline">
                    <i class="fas fa-times"></i> Cancel
                </a>
            </div>
        </form>
    </div>
</div>
