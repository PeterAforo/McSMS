<div class="mb-5">
    <h1>Reject Application</h1>
    <p class="text-muted">Application #<?= str_pad($application['id'], 5, '0', STR_PAD_LEFT) ?> - <?= htmlspecialchars($child['full_name']) ?></p>
</div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">Rejection Details</h2>
    </div>
    <div class="card-body">
        <form action="<?= APP_URL ?>/index.php?c=admissions&a=doReject" method="POST" data-validate>
            <input type="hidden" name="application_id" value="<?= $application['id'] ?>">
            
            <div class="form-group">
                <label for="remarks" class="form-label">Reason for Rejection *</label>
                <textarea id="remarks" name="remarks" class="form-control" rows="4" placeholder="Please provide a reason for rejection" required></textarea>
                <small class="text-muted">This will be visible to the parent.</small>
            </div>

            <div class="alert" style="background: #ffebee; border-left: 4px solid var(--color-error); color: #c62828;">
                <i class="fas fa-exclamation-triangle"></i>
                <strong>Warning:</strong> Rejecting this application will notify the parent. This action cannot be undone.
            </div>

            <div class="form-group">
                <button type="submit" class="btn" style="background: var(--color-error); color: white;">
                    <i class="fas fa-times"></i> Reject Application
                </button>
                <a href="<?= APP_URL ?>/index.php?c=admissions&a=view&id=<?= $application['id'] ?>" class="btn btn-outline">
                    <i class="fas fa-arrow-left"></i> Back
                </a>
            </div>
        </form>
    </div>
</div>
