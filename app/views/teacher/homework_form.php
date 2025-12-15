<div class="mb-5">
    <h1><?= $homework ? 'Edit Homework' : 'Create New Homework' ?></h1>
</div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">Homework Details</h2>
    </div>
    <div class="card-body">
        <form action="<?= APP_URL ?>/index.php?c=teacher&a=storeHomework" method="POST" data-validate>
            <?php if ($homework): ?>
                <input type="hidden" name="homework_id" value="<?= $homework['id'] ?>">
            <?php endif; ?>
            
            <div class="form-group">
                <label for="title" class="form-label">Title *</label>
                <input type="text" id="title" name="title" class="form-control" required value="<?= htmlspecialchars($homework['title'] ?? '') ?>" placeholder="e.g., Math Assignment Chapter 5">
            </div>

            <div class="form-group">
                <label for="class_id" class="form-label">Class *</label>
                <select id="class_id" name="class_id" class="form-control form-select" required>
                    <option value="">Select Class</option>
                    <?php foreach ($classes as $class): ?>
                        <option value="<?= $class['id'] ?>" <?= ($homework['class_id'] ?? '') == $class['id'] ? 'selected' : '' ?>>
                            <?= htmlspecialchars($class['class_name']) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div class="form-group">
                <label for="subject_id" class="form-label">Subject *</label>
                <select id="subject_id" name="subject_id" class="form-control form-select" required>
                    <option value="">Select Subject</option>
                    <?php foreach ($subjects as $subject): ?>
                        <option value="<?= $subject['id'] ?>" <?= ($homework['subject_id'] ?? '') == $subject['id'] ? 'selected' : '' ?>>
                            <?= htmlspecialchars($subject['subject_name']) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div class="form-group">
                <label for="description" class="form-label">Description *</label>
                <textarea id="description" name="description" class="form-control" rows="5" required placeholder="Enter homework instructions and details"><?= htmlspecialchars($homework['description'] ?? '') ?></textarea>
            </div>

            <div class="form-group">
                <label for="due_date" class="form-label">Due Date *</label>
                <input type="date" id="due_date" name="due_date" class="form-control" required value="<?= $homework['due_date'] ?? '' ?>" min="<?= date('Y-m-d') ?>">
            </div>

            <div class="form-group">
                <button type="submit" class="btn btn-primary-sms">
                    <i class="fas fa-save"></i> <?= $homework ? 'Update Homework' : 'Create Homework' ?>
                </button>
                <a href="<?= APP_URL ?>/index.php?c=teacher&a=homework" class="btn btn-outline">
                    <i class="fas fa-times"></i> Cancel
                </a>
            </div>
        </form>
    </div>
</div>
