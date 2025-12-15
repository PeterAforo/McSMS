<div class="mb-5">
    <h1><?= $subject ? 'Edit Subject' : 'Create New Subject' ?></h1>
</div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">Subject Information</h2>
    </div>
    <div class="card-body">
        <form action="<?= APP_URL ?>/index.php?c=academic&a=storeSubject" method="POST" data-validate>
            <?php if ($subject): ?>
                <input type="hidden" name="subject_id" value="<?= $subject['id'] ?>">
            <?php endif; ?>
            
            <div class="form-group">
                <label for="subject_name" class="form-label">Subject Name *</label>
                <input type="text" id="subject_name" name="subject_name" class="form-control" required value="<?= htmlspecialchars($subject['subject_name'] ?? '') ?>" placeholder="e.g., Mathematics, English, Science">
            </div>

            <div class="form-group">
                <label for="level" class="form-label">Level *</label>
                <select id="level" name="level" class="form-control form-select" required>
                    <option value="">Select Level</option>
                    <option value="creche" <?= ($subject['level'] ?? '') === 'creche' ? 'selected' : '' ?>>Creche</option>
                    <option value="nursery" <?= ($subject['level'] ?? '') === 'nursery' ? 'selected' : '' ?>>Nursery</option>
                    <option value="primary" <?= ($subject['level'] ?? '') === 'primary' ? 'selected' : '' ?>>Primary</option>
                    <option value="secondary" <?= ($subject['level'] ?? '') === 'secondary' ? 'selected' : '' ?>>Secondary</option>
                </select>
            </div>

            <div class="form-group">
                <button type="submit" class="btn btn-primary-sms">
                    <i class="fas fa-save"></i> <?= $subject ? 'Update Subject' : 'Create Subject' ?>
                </button>
                <a href="<?= APP_URL ?>/index.php?c=academic&a=subjects" class="btn btn-outline">
                    <i class="fas fa-times"></i> Cancel
                </a>
            </div>
        </form>
    </div>
</div>
