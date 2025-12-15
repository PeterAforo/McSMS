<div class="mb-5">
    <h1>Review Enrollment Invoice</h1>
    <p class="text-muted">Invoice #<?= str_pad($invoice['id'], 5, '0', STR_PAD_LEFT) ?></p>
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
            <div>
                <p class="text-muted" style="margin-bottom: var(--spacing-1);">Submitted</p>
                <p style="font-weight: var(--font-weight-medium);"><?= date('M d, Y H:i', strtotime($invoice['created_at'])) ?></p>
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
                <?php 
                $mandatoryTotal = 0;
                $optionalTotal = 0;
                foreach ($invoice['items'] as $item): 
                    $isOptional = strpos($item['label'], '(Optional)') !== false;
                    if ($isOptional) {
                        $optionalTotal += $item['amount'];
                    } else {
                        $mandatoryTotal += $item['amount'];
                    }
                ?>
                    <tr>
                        <td><?= htmlspecialchars($item['label']) ?></td>
                        <td>
                            <?php if ($isOptional): ?>
                                <span class="badge badge-info">Optional</span>
                            <?php else: ?>
                                <span class="badge badge-success">Mandatory</span>
                            <?php endif; ?>
                        </td>
                        <td><?= formatCurrency($item['amount']) ?></td>
                    </tr>
                <?php endforeach; ?>
                <tr style="background: var(--color-surface);">
                    <td colspan="2">Mandatory Fees Subtotal</td>
                    <td><strong><?= formatCurrency($mandatoryTotal) ?></strong></td>
                </tr>
                <?php if ($optionalTotal > 0): ?>
                <tr style="background: var(--color-surface);">
                    <td colspan="2">Optional Services Subtotal</td>
                    <td><strong><?= formatCurrency($optionalTotal) ?></strong></td>
                </tr>
                <?php endif; ?>
                <tr style="background: var(--color-primary-light); font-weight: var(--font-weight-bold); font-size: var(--font-size-lg);">
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
        <p class="text-muted mb-4">Payment plan: <strong><?= htmlspecialchars($installmentPlan['name']) ?></strong></p>
        
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
        <h2 class="card-title">Parent's Notes</h2>
    </div>
    <div class="card-body">
        <p><?= nl2br(htmlspecialchars($invoice['parent_notes'])) ?></p>
    </div>
</div>
<?php endif; ?>

<!-- Approval Actions -->
<div class="sms-card mb-5" style="border-left: 4px solid var(--color-success);">
    <div class="card-header" style="background: var(--color-success-light);">
        <h2 class="card-title">Approve Invoice</h2>
    </div>
    <div class="card-body">
        <form action="<?= APP_URL ?>/index.php?c=fees&a=approveEnrollmentInvoice" method="POST" id="approveForm">
            <input type="hidden" name="invoice_id" value="<?= $invoice['id'] ?>">
            
            <div class="form-group">
                <label for="finance_notes_approve" class="form-label">Notes (Optional)</label>
                <textarea id="finance_notes_approve" name="finance_notes" class="form-control" rows="2" placeholder="Add any notes for the parent..."></textarea>
            </div>
            
            <button type="submit" class="btn btn-success">
                <i class="fas fa-check"></i> Approve & Enroll Student
            </button>
        </form>
    </div>
</div>

<!-- Rejection Actions -->
<div class="sms-card mb-5" style="border-left: 4px solid var(--color-error);">
    <div class="card-header" style="background: var(--color-error-light);">
        <h2 class="card-title">Reject Invoice</h2>
    </div>
    <div class="card-body">
        <form action="<?= APP_URL ?>/index.php?c=fees&a=rejectEnrollmentInvoice" method="POST" id="rejectForm" onsubmit="return confirm('Are you sure you want to reject this invoice? The parent will be notified.')">
            <input type="hidden" name="invoice_id" value="<?= $invoice['id'] ?>">
            
            <div class="form-group">
                <label for="finance_notes_reject" class="form-label">Rejection Reason *</label>
                <textarea id="finance_notes_reject" name="finance_notes" class="form-control" rows="3" required placeholder="Please provide a reason for rejection..."></textarea>
            </div>
            
            <button type="submit" class="btn" style="background: var(--color-error); color: white;">
                <i class="fas fa-times"></i> Reject Invoice
            </button>
        </form>
    </div>
</div>

<!-- Back Button -->
<div>
    <a href="<?= APP_URL ?>/index.php?c=fees&a=pendingInvoices" class="btn btn-outline">
        <i class="fas fa-arrow-left"></i> Back to Pending Invoices
    </a>
</div>
