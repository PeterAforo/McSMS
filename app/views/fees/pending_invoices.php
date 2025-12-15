<div class="d-flex justify-between align-center mb-5">
    <h1>Pending Enrollment Invoices</h1>
    <span class="badge" style="background: var(--color-warning); color: white; padding: var(--spacing-2) var(--spacing-4); font-size: var(--font-size-lg);">
        <?= count($pendingInvoices) ?> Pending
    </span>
</div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">Awaiting Approval</h2>
    </div>
    <div class="card-body">
        <?php if (empty($pendingInvoices)): ?>
            <div style="text-align: center; padding: var(--spacing-8);">
                <i class="fas fa-check-circle" style="font-size: 48px; color: var(--color-success); margin-bottom: var(--spacing-4);"></i>
                <h3>All Caught Up!</h3>
                <p class="text-muted">No pending enrollment invoices at the moment.</p>
            </div>
        <?php else: ?>
            <table class="sms-table">
                <thead>
                    <tr>
                        <th>Invoice #</th>
                        <th>Student</th>
                        <th>Class</th>
                        <th>Term</th>
                        <th>Payment Plan</th>
                        <th>Total Amount</th>
                        <th>Submitted</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($pendingInvoices as $invoice): ?>
                        <tr>
                            <td>#<?= str_pad($invoice['id'], 5, '0', STR_PAD_LEFT) ?></td>
                            <td>
                                <strong><?= htmlspecialchars($invoice['student_name']) ?></strong><br>
                                <span class="text-muted"><?= htmlspecialchars($invoice['student_number']) ?></span>
                            </td>
                            <td><?= htmlspecialchars($invoice['class_name']) ?></td>
                            <td><?= htmlspecialchars($invoice['term_name']) ?></td>
                            <td><?= htmlspecialchars($invoice['plan_name'] ?? 'N/A') ?></td>
                            <td><strong><?= formatCurrency($invoice['total_amount']) ?></strong></td>
                            <td><?= date('M d, Y', strtotime($invoice['created_at'])) ?></td>
                            <td>
                                <a href="<?= APP_URL ?>/index.php?c=fees&a=reviewInvoice&id=<?= $invoice['id'] ?>" class="btn btn-primary-sms" style="padding: var(--spacing-2) var(--spacing-3); font-size: var(--font-size-sm);">
                                    <i class="fas fa-eye"></i> Review
                                </a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</div>
