<div class="mb-5">
    <h1>Application Review</h1>
    <p class="text-muted">Application #<?= str_pad($application['id'], 5, '0', STR_PAD_LEFT) ?></p>
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
                    echo $now->diff($dob)->y . ' years';
                    ?>
                </p>
            </div>
        </div>
    </div>
</div>

<!-- Parent Information -->
<div class="sms-card mb-5">
    <div class="card-header">
        <h2 class="card-title">Parent Information</h2>
    </div>
    <div class="card-body">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--spacing-4);">
            <div>
                <p class="text-muted" style="margin-bottom: var(--spacing-1);">Parent Name</p>
                <p style="font-weight: var(--font-weight-medium);"><?= htmlspecialchars($child['parent_name']) ?></p>
            </div>
            <div>
                <p class="text-muted" style="margin-bottom: var(--spacing-1);">Email</p>
                <p style="font-weight: var(--font-weight-medium);"><?= htmlspecialchars($child['parent_email']) ?></p>
            </div>
            <div>
                <p class="text-muted" style="margin-bottom: var(--spacing-1);">Phone</p>
                <p style="font-weight: var(--font-weight-medium);"><?= htmlspecialchars($child['parent_phone'] ?? 'N/A') ?></p>
            </div>
        </div>
    </div>
</div>

<!-- Application Details -->
<div class="sms-card mb-5">
    <div class="card-header">
        <h2 class="card-title">Application Details</h2>
    </div>
    <div class="card-body">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--spacing-4);">
            <div>
                <p class="text-muted" style="margin-bottom: var(--spacing-1);">Preferred Class</p>
                <p style="font-weight: var(--font-weight-medium);"><?= htmlspecialchars($class['class_name']) ?></p>
            </div>
            <div>
                <p class="text-muted" style="margin-bottom: var(--spacing-1);">Level</p>
                <p style="font-weight: var(--font-weight-medium);"><?= ucfirst($class['level']) ?></p>
            </div>
            <div>
                <p class="text-muted" style="margin-bottom: var(--spacing-1);">Submitted Date</p>
                <p style="font-weight: var(--font-weight-medium);"><?= date('M d, Y', strtotime($application['created_at'])) ?></p>
            </div>
            <div>
                <p class="text-muted" style="margin-bottom: var(--spacing-1);">Status</p>
                <p>
                    <?php if ($application['status'] === 'pending'): ?>
                        <span class="badge badge-warning">Pending</span>
                    <?php elseif ($application['status'] === 'approved'): ?>
                        <span class="badge badge-success">Approved</span>
                    <?php else: ?>
                        <span class="badge badge-danger">Rejected</span>
                    <?php endif; ?>
                </p>
            </div>
        </div>
    </div>
</div>

<!-- Actions -->
<?php if ($application['status'] === 'pending'): ?>
<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">Actions</h2>
    </div>
    <div class="card-body">
        <div style="display: flex; gap: var(--spacing-4);">
            <a href="<?= APP_URL ?>/index.php?c=admissions&a=approve&id=<?= $application['id'] ?>" class="btn btn-success">
                <i class="fas fa-check"></i> Approve Application
            </a>
            <a href="<?= APP_URL ?>/index.php?c=admissions&a=reject&id=<?= $application['id'] ?>" class="btn" style="background: var(--color-error); color: white;">
                <i class="fas fa-times"></i> Reject Application
            </a>
            <a href="<?= APP_URL ?>/index.php?c=admissions&a=pending" class="btn btn-outline">
                <i class="fas fa-arrow-left"></i> Back to List
            </a>
        </div>
    </div>
</div>
<?php endif; ?>
