<div class="mb-5">
    <h1><?= $feeType ? 'Edit Fee Type' : 'Create Fee Type' ?></h1>
</div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">Fee Type Information</h2>
    </div>
    <div class="card-body">
        <form action="<?= APP_URL ?>/index.php?c=fees&a=storeFeeType" method="POST" data-validate>
            <?php if ($feeType): ?>
                <input type="hidden" name="fee_type_id" value="<?= $feeType['id'] ?>">
            <?php endif; ?>
            
            <div class="form-group">
                <label for="fee_name" class="form-label">Fee Name *</label>
                <input type="text" id="fee_name" name="fee_name" class="form-control" required value="<?= htmlspecialchars($feeType['fee_name'] ?? '') ?>" placeholder="e.g., Tuition Fee, Registration Fee">
            </div>

            <div class="form-group">
                <label for="class_id" class="form-label">Class *</label>
                <select id="class_id" name="class_id" class="form-control form-select" required>
                    <option value="">Select Class</option>
                    <?php foreach ($classes as $class): ?>
                        <option value="<?= $class['id'] ?>" <?= ($feeType['class_id'] ?? '') == $class['id'] ? 'selected' : '' ?>>
                            <?= htmlspecialchars($class['class_name']) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div class="form-group">
                <label for="amount" class="form-label">Amount *</label>
                <input type="number" id="amount" name="amount" class="form-control" required min="0.01" step="0.01" value="<?= $feeType['amount'] ?? '' ?>" placeholder="0.00">
            </div>

            <div class="form-group">
                <button type="submit" class="btn btn-primary-sms">
                    <i class="fas fa-save"></i> <?= $feeType ? 'Update Fee Type' : 'Create Fee Type' ?>
                </button>
                <a href="<?= APP_URL ?>/index.php?c=fees&a=feeTypes" class="btn btn-outline">
                    <i class="fas fa-times"></i> Cancel
                </a>
            </div>
        </form>
    </div>
</div>
