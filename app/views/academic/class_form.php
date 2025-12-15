<div class="mb-5">
    <h1><?= $class ? 'Edit Class' : 'Create New Class' ?></h1>
</div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">Class Information</h2>
    </div>
    <div class="card-body">
        <form action="<?= APP_URL ?>/index.php?c=academic&a=storeClass" method="POST" data-validate>
            <?php if ($class): ?>
                <input type="hidden" name="class_id" value="<?= $class['id'] ?>">
            <?php endif; ?>
            
            <div class="form-group">
                <label for="class_name" class="form-label">Class Name *</label>
                <input type="text" id="class_name" name="class_name" class="form-control" required value="<?= htmlspecialchars($class['class_name'] ?? '') ?>" placeholder="e.g., Nursery 1, Grade 1, JSS 1">
            </div>

            <div class="form-group">
                <label for="level" class="form-label">Level *</label>
                <select id="level" name="level" class="form-control form-select" required>
                    <option value="">Select Level</option>
                    <option value="creche" <?= ($class['level'] ?? '') === 'creche' ? 'selected' : '' ?>>Creche</option>
                    <option value="nursery" <?= ($class['level'] ?? '') === 'nursery' ? 'selected' : '' ?>>Nursery</option>
                    <option value="primary" <?= ($class['level'] ?? '') === 'primary' ? 'selected' : '' ?>>Primary</option>
                    <option value="secondary" <?= ($class['level'] ?? '') === 'secondary' ? 'selected' : '' ?>>Secondary</option>
                </select>
            </div>

            <div class="form-group">
                <button type="submit" class="btn btn-primary-sms">
                    <i class="fas fa-save"></i> <?= $class ? 'Update Class' : 'Create Class' ?>
                </button>
                <a href="<?= APP_URL ?>/index.php?c=academic&a=classes" class="btn btn-outline">
                    <i class="fas fa-times"></i> Cancel
                </a>
            </div>
        </form>
    </div>
</div>
