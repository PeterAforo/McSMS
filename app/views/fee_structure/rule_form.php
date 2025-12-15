<div class="mb-5">
    <h1><?= isset($rule) ? 'Edit' : 'Add' ?> Fee Rule</h1>
</div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">Rule Details</h2>
    </div>
    <div class="card-body">
        <form action="<?= APP_URL ?>/index.php?c=feeStructure&a=saveRule" method="POST">
            <?php if (isset($rule)): ?>
                <input type="hidden" name="id" value="<?= $rule['id'] ?>">
            <?php endif; ?>
            
            <div class="form-group">
                <label for="fee_item_id" class="form-label">Fee Item *</label>
                <select id="fee_item_id" name="fee_item_id" class="form-control form-select" required>
                    <option value="">Select fee item...</option>
                    <?php foreach ($items as $item): ?>
                        <option value="<?= $item['id'] ?>" <?= (isset($rule) && $rule['fee_item_id'] == $item['id']) ? 'selected' : '' ?>>
                            <?= htmlspecialchars($item['name']) ?> (<?= htmlspecialchars($item['group_name']) ?>)
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            
            <div class="form-group">
                <label for="class_id" class="form-label">Class *</label>
                <select id="class_id" name="class_id" class="form-control form-select" required>
                    <option value="">Select class...</option>
                    <?php foreach ($classes as $class): ?>
                        <option value="<?= $class['id'] ?>" <?= (isset($rule) && $rule['class_id'] == $class['id']) ? 'selected' : '' ?>>
                            <?= htmlspecialchars($class['class_name']) ?> (<?= htmlspecialchars($class['level']) ?>)
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            
            <div class="form-group">
                <label for="term_id" class="form-label">Term (Optional - leave blank for all terms)</label>
                <select id="term_id" name="term_id" class="form-control form-select">
                    <option value="">All Terms</option>
                    <?php foreach ($terms as $term): ?>
                        <option value="<?= $term['id'] ?>" <?= (isset($rule) && $rule['term_id'] == $term['id']) ? 'selected' : '' ?>>
                            <?= htmlspecialchars($term['term_name']) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            
            <div class="form-group">
                <label for="amount" class="form-label">Amount (GH₵) *</label>
                <input type="number" id="amount" name="amount" class="form-control" step="0.01" min="0" 
                       value="<?= isset($rule) ? $rule['amount'] : '' ?>" required>
            </div>
            
            <div style="display: flex; gap: var(--spacing-3); margin-top: var(--spacing-lg);">
                <button type="submit" class="btn btn-success">
                    <i class="fas fa-save"></i> Save Rule
                </button>
                <a href="<?= APP_URL ?>/index.php?c=feeStructure&a=rules" class="btn btn-outline">
                    <i class="fas fa-times"></i> Cancel
                </a>
            </div>
        </form>
    </div>
</div>
