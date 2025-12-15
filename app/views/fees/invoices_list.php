<div class="d-flex justify-between align-center mb-5">
    <h1>Invoices</h1>
    <a href="<?= APP_URL ?>/index.php?c=fees&a=createInvoice" class="btn btn-primary-sms">
        <i class="fas fa-plus"></i> Create Invoice
    </a>
</div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">All Invoices</h2>
    </div>
    <div class="card-body">
        <?php if (empty($invoices)): ?>
            <div style="text-align: center; padding: var(--spacing-8);">
                <i class="fas fa-file-invoice" style="font-size: 48px; color: var(--color-text-muted); margin-bottom: var(--spacing-4);"></i>
                <p class="text-muted">No invoices generated yet.</p>
            </div>
        <?php else: ?>
            <table class="sms-table">
                <thead>
                    <tr>
                        <th>Invoice #</th>
                        <th>Student ID</th>
                        <th>Student Name</th>
                        <th>Class</th>
                        <th>Term</th>
                        <th>Total Amount</th>
                        <th>Amount Paid</th>
                        <th>Balance</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($invoices as $invoice): ?>
                        <tr>
                            <td>#<?= str_pad($invoice['id'], 5, '0', STR_PAD_LEFT) ?></td>
                            <td><?= htmlspecialchars($invoice['student_number']) ?></td>
                            <td><?= htmlspecialchars($invoice['student_name']) ?></td>
                            <td><?= htmlspecialchars($invoice['class_name']) ?></td>
                            <td><?= htmlspecialchars($invoice['term_name']) ?></td>
                            <td><?= formatCurrency($invoice['total_amount']) ?></td>
                            <td><?= formatCurrency($invoice['amount_paid']) ?></td>
                            <td><?= formatCurrency($invoice['balance']) ?></td>
                            <td>
                                <?php if ($invoice['status'] === 'paid'): ?>
                                    <span class="badge badge-success">Paid</span>
                                <?php elseif ($invoice['status'] === 'partial'): ?>
                                    <span class="badge badge-warning">Partial</span>
                                <?php else: ?>
                                    <span class="badge badge-danger">Unpaid</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <a href="<?= APP_URL ?>/index.php?c=fees&a=viewInvoice&id=<?= $invoice['id'] ?>" class="btn btn-primary-sms" style="padding: var(--spacing-2) var(--spacing-3); font-size: var(--font-size-sm);">
                                    <i class="fas fa-eye"></i> View
                                </a>
                                <?php if ($invoice['balance'] > 0): ?>
                                    <a href="<?= APP_URL ?>/index.php?c=fees&a=recordPayment&invoice_id=<?= $invoice['id'] ?>" class="btn btn-success" style="padding: var(--spacing-2) var(--spacing-3); font-size: var(--font-size-sm);">
                                        <i class="fas fa-dollar-sign"></i> Pay
                                    </a>
                                <?php endif; ?>
                                <a href="<?= APP_URL ?>/index.php?c=fees&a=editInvoice&id=<?= $invoice['id'] ?>" class="btn btn-info" style="padding: var(--spacing-2) var(--spacing-3); font-size: var(--font-size-sm);">
                                    <i class="fas fa-edit"></i> Edit
                                </a>
                                <?php if ($invoice['amount_paid'] == 0): ?>
                                    <a href="<?= APP_URL ?>/index.php?c=fees&a=deleteInvoice&id=<?= $invoice['id'] ?>" class="btn" style="padding: var(--spacing-2) var(--spacing-3); font-size: var(--font-size-sm); background: var(--color-error); color: white;" onclick="return confirm('Are you sure you want to delete this invoice?')">
                                        <i class="fas fa-trash"></i> Delete
                                    </a>
                                <?php endif; ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</div>
