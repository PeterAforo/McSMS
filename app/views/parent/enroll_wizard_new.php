<div class="mb-5">
    <h1>Enroll for Term: <?= htmlspecialchars($activeTerm['term_name']) ?></h1>
    <p class="text-muted">Student: <?= htmlspecialchars($student['full_name']) ?> - <?= htmlspecialchars($student['class_name']) ?></p>
</div>

<form action="<?= APP_URL ?>/index.php?c=parent&a=submitEnrollmentInvoice" method="POST" id="enrollmentForm">
    <input type="hidden" name="invoice_id" value="<?= $invoiceId ?>">
    
    <!-- Step 1: Mandatory Fees (Auto-loaded) -->
    <div class="sms-card mb-5">
        <div class="card-header" style="background: var(--color-success); color: white;">
            <h2 class="card-title" style="color: white;">
                <i class="fas fa-check-circle"></i> Step 1: Mandatory Fees (Auto-loaded)
            </h2>
        </div>
        <div class="card-body">
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                <strong>These fees are automatically included</strong> based on your child's class.
            </div>
            
            <table class="sms-table">
                <thead>
                    <tr>
                        <th>Fee Item</th>
                        <th>Category</th>
                        <th>Frequency</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($mandatoryFees as $fee): ?>
                        <tr>
                            <td><strong><?= htmlspecialchars($fee['fee_name']) ?></strong></td>
                            <td><?= htmlspecialchars($fee['group_name']) ?></td>
                            <td>
                                <span class="badge badge-info"><?= ucfirst($fee['frequency']) ?></span>
                            </td>
                            <td><strong><?= formatCurrency($fee['amount']) ?></strong></td>
                        </tr>
                    <?php endforeach; ?>
                    <tr style="background: var(--color-surface); font-weight: var(--font-weight-bold); font-size: var(--font-size-lg);">
                        <td colspan="3">Total Mandatory Fees</td>
                        <td><?= formatCurrency($totalMandatory) ?></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    
    <!-- Step 2: Optional Services -->
    <div class="sms-card mb-5">
        <div class="card-header" style="background: var(--color-warning); color: white;">
            <h2 class="card-title" style="color: white;">
                <i class="fas fa-plus-circle"></i> Step 2: Optional Services (Select as needed)
            </h2>
        </div>
        <div class="card-body">
            <?php if (empty($optionalServices)): ?>
                <p class="text-muted">No optional services available at this time.</p>
            <?php else: ?>
                <div style="display: grid; gap: var(--spacing-3);">
                    <?php foreach ($optionalServices as $service): ?>
                        <label class="service-option" style="display: flex; align-items: center; padding: var(--spacing-3); border: 2px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s;">
                            <input type="checkbox" name="optional_services[]" value="<?= $service['id'] ?>" style="margin-right: var(--spacing-3); width: 20px; height: 20px;" onchange="updateTotal()">
                            <div style="flex: 1;">
                                <strong><?= htmlspecialchars($service['service_name']) ?></strong>
                                <?php if ($service['description']): ?>
                                    <p class="text-muted" style="margin: 0; font-size: var(--font-size-sm);"><?= htmlspecialchars($service['description']) ?></p>
                                <?php endif; ?>
                            </div>
                            <div style="font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--color-primary);" data-amount="<?= $service['amount'] ?>">
                                <?= formatCurrency($service['amount']) ?>
                            </div>
                        </label>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
    
    <!-- Step 3: Payment Plan -->
    <div class="sms-card mb-5">
        <div class="card-header" style="background: var(--color-primary); color: white;">
            <h2 class="card-title" style="color: white;">
                <i class="fas fa-calendar-alt"></i> Step 3: Choose Payment Plan *
            </h2>
        </div>
        <div class="card-body">
            <?php if (empty($installmentPlans)): ?>
                <p class="text-muted">No payment plans available.</p>
            <?php else: ?>
                <div style="display: grid; gap: var(--spacing-3);">
                    <?php foreach ($installmentPlans as $index => $plan): ?>
                        <label class="plan-option" style="display: flex; align-items: center; padding: var(--spacing-3); border: 2px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer; transition: all 0.3s;">
                            <input type="radio" name="installment_plan_id" value="<?= $plan['id'] ?>" <?= $index === 0 ? 'checked' : '' ?> required style="margin-right: var(--spacing-3); width: 20px; height: 20px;">
                            <div style="flex: 1;">
                                <strong><?= htmlspecialchars($plan['name']) ?></strong>
                                <?php if ($plan['description']): ?>
                                    <p class="text-muted" style="margin: 0; font-size: var(--font-size-sm);"><?= htmlspecialchars($plan['description']) ?></p>
                                <?php endif; ?>
                            </div>
                        </label>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
    
    <!-- Step 4: Notes (Optional) -->
    <div class="sms-card mb-5">
        <div class="card-header">
            <h2 class="card-title">
                <i class="fas fa-comment"></i> Step 4: Additional Notes (Optional)
            </h2>
        </div>
        <div class="card-body">
            <div class="form-group">
                <label for="parent_notes" class="form-label">Special Requests or Comments</label>
                <textarea id="parent_notes" name="parent_notes" class="form-control" rows="3" placeholder="Enter any special requests or comments for the finance office..."></textarea>
            </div>
        </div>
    </div>
    
    <!-- Total Summary -->
    <div class="sms-card mb-5" style="background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%); color: white;">
        <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="margin: 0; color: white;">Estimated Total</h3>
                    <p style="margin: 0; opacity: 0.9;">Mandatory fees + Selected optional services</p>
                </div>
                <div style="font-size: 2.5rem; font-weight: var(--font-weight-bold);">
                    <span id="totalAmount"><?= formatCurrency($totalMandatory) ?></span>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Actions -->
    <div style="display: flex; gap: var(--spacing-3);">
        <button type="submit" class="btn btn-success" style="flex: 1; padding: var(--spacing-4);">
            <i class="fas fa-check"></i> Submit Enrollment Invoice
        </button>
        <a href="<?= APP_URL ?>/index.php?c=parent&a=children" class="btn btn-outline" style="padding: var(--spacing-4);">
            <i class="fas fa-times"></i> Cancel
        </a>
    </div>
</form>

<script>
// Store service amounts
const serviceAmounts = {};
document.querySelectorAll('.service-option [data-amount]').forEach(el => {
    const checkbox = el.closest('.service-option').querySelector('input[type="checkbox"]');
    serviceAmounts[checkbox.value] = parseFloat(el.dataset.amount);
});

const mandatoryTotal = <?= $totalMandatory ?>;

function updateTotal() {
    let total = mandatoryTotal;
    
    // Add selected optional services
    document.querySelectorAll('input[name="optional_services[]"]:checked').forEach(checkbox => {
        total += serviceAmounts[checkbox.value] || 0;
    });
    
    // Update display with Ghana Cedis
    document.getElementById('totalAmount').textContent = 'GH₵ ' + total.toLocaleString('en-GH', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

// Style selected options
document.querySelectorAll('.service-option input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        if (this.checked) {
            this.closest('.service-option').style.borderColor = 'var(--color-success)';
            this.closest('.service-option').style.background = 'var(--color-success-light)';
        } else {
            this.closest('.service-option').style.borderColor = 'var(--color-border)';
            this.closest('.service-option').style.background = 'white';
        }
    });
});

document.querySelectorAll('.plan-option input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', function() {
        document.querySelectorAll('.plan-option').forEach(label => {
            label.style.borderColor = 'var(--color-border)';
            label.style.background = 'white';
        });
        if (this.checked) {
            this.closest('.plan-option').style.borderColor = 'var(--color-primary)';
            this.closest('.plan-option').style.background = 'var(--color-primary-light)';
        }
    });
    
    // Trigger for initially checked
    if (radio.checked) {
        radio.dispatchEvent(new Event('change'));
    }
});
</script>
