<div class="mb-5">
    <h1>Fees & Invoices</h1>
    <p class="text-muted">View and manage your children's fees</p>
</div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">Invoice History</h2>
    </div>
    <div class="card-body">
        <?php if (empty($invoices)): ?>
            <div style="text-align: center; padding: var(--spacing-8);">
                <i class="fas fa-file-invoice" style="font-size: 48px; color: var(--color-text-muted); margin-bottom: var(--spacing-4);"></i>
                <p class="text-muted">No invoices yet. Invoices will appear here once your child is enrolled.</p>
            </div>
        <?php else: ?>
            <table class="sms-table">
                <thead>
                    <tr>
                        <th>Invoice #</th>
                        <th>Student</th>
                        <th>Class</th>
                        <th>Term</th>
                        <th>Total Amount</th>
                        <th>Amount Paid</th>
                        <th>Balance</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($invoices as $invoice): ?>
                        <tr>
                            <td>#<?= str_pad($invoice['id'], 5, '0', STR_PAD_LEFT) ?></td>
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
                            <td><?= date('M d, Y', strtotime($invoice['created_at'])) ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</div>
