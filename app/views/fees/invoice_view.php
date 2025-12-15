<div class="mb-5">
    <h1>Invoice Details</h1>
    <p class="text-muted">Invoice #<?= str_pad($invoice['id'], 5, '0', STR_PAD_LEFT) ?></p>
</div>

<!-- Invoice Header -->
<div class="sms-card mb-5">
    <div class="card-header">
        <h2 class="card-title">Invoice Information</h2>
    </div>
    <div class="card-body">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--spacing-4);">
            <div>
                <p class="text-muted" style="margin-bottom: var(--spacing-1);">Student</p>
                <p style="font-weight: var(--font-weight-medium);"><?= htmlspecialchars($invoice['student_name']) ?></p>
                <p class="text-muted"><?= htmlspecialchars($invoice['student_number']) ?></p>
            </div>
            <div>
                <p class="text-muted" style="margin-bottom: var(--spacing-1);">Class</p>
                <p style="font-weight: var(--font-weight-medium);"><?= htmlspecialchars($invoice['class_name']) ?></p>
            </div>
            <div>
                <p class="text-muted" style="margin-bottom: var(--spacing-1);">Term</p>
                <p style="font-weight: var(--font-weight-medium);"><?= htmlspecialchars($invoice['term_name']) ?></p>
            </div>
            <div>
                <p class="text-muted" style="margin-bottom: var(--spacing-1);">Status</p>
                <p>
                    <?php if ($invoice['status'] === 'paid'): ?>
                        <span class="badge badge-success">Paid</span>
                    <?php elseif ($invoice['status'] === 'partial'): ?>
                        <span class="badge badge-warning">Partial Payment</span>
                    <?php else: ?>
                        <span class="badge badge-danger">Unpaid</span>
                    <?php endif; ?>
                </p>
            </div>
        </div>
    </div>
</div>

<!-- Invoice Items -->
<div class="sms-card mb-5">
    <div class="card-header">
        <h2 class="card-title">Invoice Items</h2>
    </div>
    <div class="card-body">
        <table class="sms-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($invoice['items'] as $item): ?>
                    <tr>
                        <td><?= htmlspecialchars($item['label']) ?></td>
                        <td><?= formatCurrency($item['amount']) ?></td>
                    </tr>
                <?php endforeach; ?>
                <tr style="background: var(--color-surface); font-weight: var(--font-weight-bold);">
                    <td>Total Amount</td>
                    <td><?= formatCurrency($invoice['total_amount']) ?></td>
                </tr>
                <tr style="background: var(--color-success-light);">
                    <td>Amount Paid</td>
                    <td><?= formatCurrency($invoice['amount_paid']) ?></td>
                </tr>
                <tr style="background: var(--color-warning-light); font-weight: var(--font-weight-bold);">
                    <td>Balance Due</td>
                    <td><?= formatCurrency($invoice['balance']) ?></td>
                </tr>
            </tbody>
        </table>
    </div>
</div>

<!-- Payment History -->
<?php if (!empty($invoice['payments'])): ?>
<div class="sms-card mb-5">
    <div class="card-header">
        <h2 class="card-title">Payment History</h2>
    </div>
    <div class="card-body">
        <table class="sms-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Reference</th>
                    <th>Received By</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($invoice['payments'] as $payment): ?>
                    <tr>
                        <td><?= date('M d, Y', strtotime($payment['created_at'])) ?></td>
                        <td><?= formatCurrency($payment['amount']) ?></td>
                        <td><?= ucfirst($payment['payment_method']) ?></td>
                        <td><?= htmlspecialchars($payment['reference_no'] ?? 'N/A') ?></td>
                        <td><?= htmlspecialchars($payment['received_by_name'] ?? 'N/A') ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>
<?php endif; ?>

<!-- Actions -->
<div>
    <?php if ($invoice['balance'] > 0): ?>
        <a href="<?= APP_URL ?>/index.php?c=fees&a=recordPayment&invoice_id=<?= $invoice['id'] ?>" class="btn btn-success">
            <i class="fas fa-dollar-sign"></i> Record Payment
        </a>
    <?php endif; ?>
    <a href="<?= APP_URL ?>/index.php?c=fees&a=invoices" class="btn btn-outline">
        <i class="fas fa-arrow-left"></i> Back to Invoices
    </a>
</div>
