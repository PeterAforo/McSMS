<div class="mb-5">
    <h1><?= $service ? 'Edit Optional Service' : 'Create Optional Service' ?></h1>
</div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">Service Information</h2>
    </div>
    <div class="card-body">
        <form action="<?= APP_URL ?>/index.php?c=fees&a=storeService" method="POST" data-validate>
            <?php if ($service): ?>
                <input type="hidden" name="service_id" value="<?= $service['id'] ?>">
            <?php endif; ?>
            
            <div class="form-group">
                <label for="service_name" class="form-label">Service Name *</label>
                <input type="text" id="service_name" name="service_name" class="form-control" required value="<?= htmlspecialchars($service['service_name'] ?? '') ?>" placeholder="e.g., School Bus, Lunch Program">
            </div>

            <div class="form-group">
                <label for="amount" class="form-label">Amount *</label>
                <input type="number" id="amount" name="amount" class="form-control" required min="0.01" step="0.01" value="<?= $service['amount'] ?? '' ?>" placeholder="0.00">
            </div>

            <div class="form-group">
                <label for="description" class="form-label">Description</label>
                <textarea id="description" name="description" class="form-control" rows="3" placeholder="Enter service description (optional)"><?= htmlspecialchars($service['description'] ?? '') ?></textarea>
            </div>

            <div class="form-group">
                <button type="submit" class="btn btn-primary-sms">
                    <i class="fas fa-save"></i> <?= $service ? 'Update Service' : 'Create Service' ?>
                </button>
                <a href="<?= APP_URL ?>/index.php?c=fees&a=optionalServices" class="btn btn-outline">
                    <i class="fas fa-times"></i> Cancel
                </a>
            </div>
        </form>
    </div>
</div>
