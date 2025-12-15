<div class="mb-5">
    <h1>Enroll for Term: <?= htmlspecialchars($activeTerm['term_name']) ?></h1>
    <p class="text-muted">Student: <?= htmlspecialchars($student['full_name']) ?> - <?= htmlspecialchars($student['class_name']) ?></p>
</div>

<form action="<?= APP_URL ?>/index.php?c=parent&a=createEnrollmentInvoice" method="POST" id="enrollmentForm">
    <input type="hidden" name="student_id" value="<?= $student['id'] ?>">
    <input type="hidden" name="term_id" value="<?= $activeTerm['id'] ?>">
    
    <!-- Step 1: Mandatory Fees -->
    <div class="sms-card mb-5">
        <div class="card-header" style="background: var(--color-primary); color: white;">
            <h2 class="card-title" style="color: white;">
                <i class="fas fa-check-circle"></i> Step 1: Mandatory Fees
            </h2>
        </div>
        <div class="card-body">
            <p class="text-muted mb-4">These fees are automatically included based on your child's class.</p>
            
            <?php if (empty($mandatoryFees)): ?>
                <p class="text-muted">No mandatory fees configured for this class.</p>
            <?php else: ?>
                <table class="sms-table">
                    <thead>
                        <tr>
                            <th>Fee Type</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($mandatoryFees as $fee): ?>
                            <tr>
                                <td><?= htmlspecialchars($fee['fee_name']) ?></td>
                                <td>$<?= number_format($fee['amount'], 2) ?></td>
                            </tr>
                        <?php endforeach; ?>
                        <tr style="background: var(--color-surface); font-weight: var(--font-weight-bold);">
                            <td>Total Mandatory Fees</td>
                            <td>$<?= number_format($totalMandatory, 2) ?></td>
                        </tr>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
    </div>
    
    <!-- Step 2: Optional Services -->
    <div class="sms-card mb-5">
        <div class="card-header" style="background: var(--color-info); color: white;">
            <h2 class="card-title" style="color: white;">
                <i class="fas fa-plus-circle"></i> Step 2: Optional Services (Select as needed)
            </h2>
        </div>
        <div class="card-body">
            <?php if (empty($optionalServices)): ?>
                <p class="text-muted">No optional services available.</p>
            <?php else: ?>
                <div style="display: grid; gap: var(--spacing-3);">
                    <?php foreach ($optionalServices as $service): ?>
                        <label class="service-option" style="display: flex; align-items: center; padding: var(--spacing-3); border: 2px solid var(--color-border); border-radius: var(--border-radius); cursor: pointer; transition: all 0.3s;">
                            <input type="checkbox" name="optional_services[]" value="<?= $service['id'] ?>" style="margin-right: var(--spacing-3); width: 20px; height: 20px;" onchange="updateTotal()">
                            <div style="flex: 1;">
                                <strong><?= htmlspecialchars($service['service_name']) ?></strong>
                                <?php if ($service['description']): ?>
                                    <p class="text-muted" style="margin: 0; font-size: var(--font-size-sm);"><?= htmlspecialchars($service['description']) ?></p>
                                <?php endif; ?>
                            </div>
                            <div style="font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--color-primary);">
                                $<?= number_format($service['amount'], 2) ?>
                            </div>
                        </label>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
    
    <!-- Step 3: Payment Plan -->
    <div class="sms-card mb-5">
        <div class="card-header" style="background: var(--color-success); color: white;">
            <h2 class="card-title" style="color: white;">
                <i class="fas fa-calendar-alt"></i> Step 3: Choose Payment Plan
            </h2>
        </div>
        <div class="card-body">
            <?php if (empty($installmentPlans)): ?>
                <p class="text-muted">No payment plans available.</p>
            <?php else: ?>
                <div style="display: grid; gap: var(--spacing-3);">
                    <?php foreach ($installmentPlans as $index => $plan): ?>
                        <label class="plan-option" style="display: flex; align-items: center; padding: var(--spacing-3); border: 2px solid var(--color-border); border-radius: var(--border-radius); cursor: pointer; transition: all 0.3s;">
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
    <div class="sms-card mb-5" style="background: var(--color-primary-light);">
        <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="margin: 0; color: var(--color-primary);">Estimated Total</h3>
                    <p class="text-muted" style="margin: 0;">Mandatory fees + Selected optional services</p>
                </div>
                <div style="font-size: 2rem; font-weight: var(--font-weight-bold); color: var(--color-primary);">
                    $<span id="totalAmount"><?= number_format($totalMandatory, 2) ?></span>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Actions -->
    <div style="display: flex; gap: var(--spacing-3);">
        <button type="submit" class="btn btn-primary-sms" style="flex: 1;">
            <i class="fas fa-arrow-right"></i> Review Enrollment Invoice
        </button>
        <a href="<?= APP_URL ?>/index.php?c=parent&a=children" class="btn btn-outline">
            <i class="fas fa-times"></i> Cancel
        </a>
    </div>
</form>

<script>
// Store service amounts
const serviceAmounts = {
    <?php foreach ($optionalServices as $service): ?>
    <?= $service['id'] ?>: <?= $service['amount'] ?>,
    <?php endforeach; ?>
};

const mandatoryTotal = <?= $totalMandatory ?>;

function updateTotal() {
    let total = mandatoryTotal;
    
    // Add selected optional services
    document.querySelectorAll('input[name="optional_services[]"]:checked').forEach(checkbox => {
        total += serviceAmounts[checkbox.value] || 0;
    });
    
    // Update display
    document.getElementById('totalAmount').textContent = total.toFixed(2);
}

// Style selected options
document.querySelectorAll('.service-option input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        if (this.checked) {
            this.closest('.service-option').style.borderColor = 'var(--color-primary)';
            this.closest('.service-option').style.background = 'var(--color-primary-light)';
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
            this.closest('.plan-option').style.borderColor = 'var(--color-success)';
            this.closest('.plan-option').style.background = 'var(--color-success-light)';
        }
    });
    
    // Trigger for initially checked
    if (radio.checked) {
        radio.dispatchEvent(new Event('change'));
    }
});
</script>
