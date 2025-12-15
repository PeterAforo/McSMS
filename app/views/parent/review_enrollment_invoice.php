<div class="mb-5">
    <h1>Review Enrollment Invoice</h1>
    <p class="text-muted">Please review your enrollment invoice before submitting to Finance</p>
</div>

<!-- Student & Term Info -->
<div class="sms-card mb-5">
    <div class="card-header">
        <h2 class="card-title">Enrollment Details</h2>
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
                <p class="text-muted" style="margin-bottom: var(--spacing-1);">Payment Plan</p>
                <p style="font-weight: var(--font-weight-medium);"><?= htmlspecialchars($installmentPlan['name'] ?? 'N/A') ?></p>
            </div>
        </div>
    </div>
</div>

<!-- Invoice Items -->
<div class="sms-card mb-5">
    <div class="card-header">
        <h2 class="card-title">Fee Breakdown</h2>
    </div>
    <div class="card-body">
        <table class="sms-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($invoice['items'] as $item): ?>
                    <tr>
                        <td><?= htmlspecialchars($item['label']) ?></td>
                        <td>
                            <?php if (strpos($item['label'], '(Optional)') !== false): ?>
                                <span class="badge badge-info">Optional</span>
                            <?php else: ?>
                                <span class="badge badge-success">Mandatory</span>
                            <?php endif; ?>
                        </td>
                        <td><?= formatCurrency($item['amount']) ?></td>
                    </tr>
                <?php endforeach; ?>
                <tr style="background: var(--color-surface); font-weight: var(--font-weight-bold); font-size: var(--font-size-lg);">
                    <td colspan="2">Total Amount</td>
                    <td><?= formatCurrency($invoice['total_amount']) ?></td>
                </tr>
            </tbody>
        </table>
    </div>
</div>

<!-- Payment Schedule -->
<?php if (!empty($installments)): ?>
<div class="sms-card mb-5">
    <div class="card-header">
        <h2 class="card-title">Payment Schedule</h2>
    </div>
    <div class="card-body">
        <p class="text-muted mb-4">Based on your selected payment plan: <strong><?= htmlspecialchars($installmentPlan['name']) ?></strong></p>
        
        <table class="sms-table">
            <thead>
                <tr>
                    <th>Installment</th>
                    <th>Percentage</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($installments as $index => $installment): ?>
                    <tr>
                        <td>Payment <?= $index + 1 ?></td>
                        <td><?= $installment['percentage'] ?>%</td>
                        <td><?= formatCurrency($installment['amount']) ?></td>
                        <td><?= date('M d, Y', strtotime($installment['due_date'])) ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>
<?php endif; ?>

<!-- Parent Notes -->
<?php if (!empty($invoice['parent_notes'])): ?>
<div class="sms-card mb-5">
    <div class="card-header">
        <h2 class="card-title">Your Notes</h2>
    </div>
    <div class="card-body">
        <p><?= nl2br(htmlspecialchars($invoice['parent_notes'])) ?></p>
    </div>
</div>
<?php endif; ?>

<!-- Important Notice -->
<div class="sms-card mb-5" style="border-left: 4px solid var(--color-warning);">
    <div class="card-body">
        <h3 style="color: var(--color-warning); margin-bottom: var(--spacing-2);">
            <i class="fas fa-exclamation-triangle"></i> Important Notice
        </h3>
        <ul style="margin: 0; padding-left: var(--spacing-5);">
            <li>Once submitted, this invoice will be sent to the Finance Office for approval.</li>
            <li>You will be notified once the invoice is approved or if any changes are needed.</li>
            <li>After approval, you can proceed with making payments according to your chosen payment plan.</li>
            <li>Your child's enrollment will be confirmed once the invoice is approved.</li>
        </ul>
    </div>
</div>

<!-- Actions -->
<form action="<?= APP_URL ?>/index.php?c=parent&a=submitEnrollmentInvoice" method="POST">
    <input type="hidden" name="invoice_id" value="<?= $invoice['id'] ?>">
    
    <div style="display: flex; gap: var(--spacing-3);">
        <button type="submit" class="btn btn-success" style="flex: 1;">
            <i class="fas fa-check"></i> Submit to Finance for Approval
        </button>
        <a href="<?= APP_URL ?>/index.php?c=parent&a=children" class="btn btn-outline">
            <i class="fas fa-arrow-left"></i> Back to Children
        </a>
    </div>
</form>
