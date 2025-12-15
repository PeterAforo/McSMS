<div class="mb-5">
    <h1>Apply for Admission</h1>
    <p class="text-muted">Submit admission application for <?= htmlspecialchars($child['full_name']) ?></p>
</div>

<!-- Child Information -->
<div class="sms-card mb-5">
    <div class="card-header">
        <h2 class="card-title">Child Information</h2>
    </div>
    <div class="card-body">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--spacing-4);">
            <div>
                <p class="text-muted" style="margin-bottom: var(--spacing-1);">Full Name</p>
                <p style="font-weight: var(--font-weight-medium);"><?= htmlspecialchars($child['full_name']) ?></p>
            </div>
            <div>
                <p class="text-muted" style="margin-bottom: var(--spacing-1);">Gender</p>
                <p style="font-weight: var(--font-weight-medium);"><?= ucfirst($child['gender']) ?></p>
            </div>
            <div>
                <p class="text-muted" style="margin-bottom: var(--spacing-1);">Date of Birth</p>
                <p style="font-weight: var(--font-weight-medium);"><?= date('M d, Y', strtotime($child['date_of_birth'])) ?></p>
            </div>
            <div>
                <p class="text-muted" style="margin-bottom: var(--spacing-1);">Age</p>
                <p style="font-weight: var(--font-weight-medium);">
                    <?php
                    $dob = new DateTime($child['date_of_birth']);
                    $now = new DateTime();
                    $age = $now->diff($dob)->y;
                    echo $age . ' years';
                    ?>
                </p>
            </div>
        </div>
    </div>
</div>

<!-- Application Form -->
<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">Application Details</h2>
    </div>
    <div class="card-body">
        <form action="<?= APP_URL ?>/index.php?c=parent&a=submitApplication" method="POST" data-validate>
            <input type="hidden" name="child_id" value="<?= $child['id'] ?>">
            
            <div class="form-group">
                <label for="preferred_class_id" class="form-label">Select Class *</label>
                <select id="preferred_class_id" name="preferred_class_id" class="form-control form-select" required>
                    <option value="">Choose a class</option>
                    <?php foreach ($classes as $class): ?>
                        <option value="<?= $class['id'] ?>">
                            <?= htmlspecialchars($class['class_name']) ?> (<?= ucfirst($class['level']) ?>)
                        </option>
                    <?php endforeach; ?>
                </select>
                <small class="text-muted">Select the class you want your child to be admitted to.</small>
            </div>

            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                <strong>Note:</strong> After submitting this application, the admissions office will review it and contact you. You will be notified of the decision via email and in your dashboard.
            </div>

            <div class="form-group">
                <button type="submit" class="btn btn-primary-sms">
                    <i class="fas fa-paper-plane"></i> Submit Application
                </button>
                <a href="<?= APP_URL ?>/index.php?c=parent&a=children" class="btn btn-outline">
                    <i class="fas fa-times"></i> Cancel
                </a>
            </div>
        </form>
    </div>
</div>
