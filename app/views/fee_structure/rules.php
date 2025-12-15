<div class="d-flex justify-between align-center mb-5">
    <h1>Fee Rules (Class-Based Pricing)</h1>
    <a href="<?= APP_URL ?>/index.php?c=feeStructure&a=editRule" class="btn btn-primary-sms">
        <i class="fas fa-plus"></i> Add Fee Rule
    </a>
</div>

<!-- Bulk Set Rules -->
<div class="sms-card mb-5">
    <div class="card-header" style="background: var(--color-primary); color: white;">
        <h2 class="card-title" style="color: white;">
            <i class="fas fa-magic"></i> Quick Setup: Set Fees for a Class
        </h2>
    </div>
    <div class="card-body">
        <form action="<?= APP_URL ?>/index.php?c=feeStructure&a=bulkSetRules" method="POST">
            <div class="form-group">
                <label for="class_id" class="form-label">Select Class *</label>
                <select id="class_id" name="class_id" class="form-control form-select" required>
                    <option value="">Choose a class...</option>
                    <?php foreach ($classes as $class): ?>
                        <option value="<?= $class['id'] ?>"><?= htmlspecialchars($class['class_name']) ?> (<?= htmlspecialchars($class['level']) ?>)</option>
                    <?php endforeach; ?>
                </select>
            </div>
            
            <div id="feeInputs" style="display: none; margin-top: var(--spacing-lg);">
                <h4 style="margin-bottom: var(--spacing-md);">Set Fee Amounts:</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--spacing-md);">
                    <?php foreach ($items as $item): ?>
                        <div class="form-group">
                            <label class="form-label">
                                <?= htmlspecialchars($item['fee_name']) ?>
                                <span class="badge badge-<?= $item['is_optional'] ? 'warning' : 'success' ?>" style="margin-left: var(--spacing-2);">
                                    <?= $item['is_optional'] ? 'Optional' : 'Mandatory' ?>
                                </span>
                            </label>
                            <input type="number" name="rules[<?= $item['id'] ?>]" class="form-control" placeholder="Amount" min="0" step="0.01">
                            <small class="form-text"><?= htmlspecialchars($item['group_name']) ?> - <?= ucfirst($item['frequency']) ?></small>
                        </div>
                    <?php endforeach; ?>
                </div>
                
                <button type="submit" class="btn btn-success" style="margin-top: var(--spacing-lg);">
                    <i class="fas fa-save"></i> Save All Fee Rules
                </button>
            </div>
        </form>
    </div>
</div>

<!-- Existing Rules -->
<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">All Fee Rules</h2>
    </div>
    <div class="card-body">
        <?php if (empty($rules)): ?>
            <div style="text-align: center; padding: var(--spacing-8);">
                <i class="fas fa-dollar-sign" style="font-size: 48px; color: var(--color-text-muted); margin-bottom: var(--spacing-4);"></i>
                <p class="text-muted">No fee rules created yet. Use the quick setup above to get started!</p>
            </div>
        <?php else: ?>
            <table class="sms-table" id="rulesTable">
                <thead>
                    <tr>
                        <th>Fee Item</th>
                        <th>Group</th>
                        <th>Class</th>
                        <th>Term</th>
                        <th>Amount</th>
                        <th>Type</th>
                        <th>Frequency</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($rules as $rule): ?>
                        <tr>
                            <td><strong><?= htmlspecialchars($rule['fee_name']) ?></strong></td>
                            <td><?= htmlspecialchars($rule['group_name']) ?></td>
                            <td><?= htmlspecialchars($rule['class_name']) ?></td>
                            <td><?= $rule['term_name'] ? htmlspecialchars($rule['term_name']) : '<span class="text-muted">All Terms</span>' ?></td>
                            <td><strong><?= formatCurrency($rule['amount']) ?></strong></td>
                            <td>
                                <span class="badge badge-<?= $rule['is_optional'] ? 'warning' : 'success' ?>">
                                    <?= $rule['is_optional'] ? 'Optional' : 'Mandatory' ?>
                                </span>
                            </td>
                            <td><?= ucfirst($rule['frequency']) ?></td>
                            <td>
                                <a href="<?= APP_URL ?>/index.php?c=feeStructure&a=editRule&id=<?= $rule['id'] ?>" class="btn btn-primary-sms" style="padding: var(--spacing-2) var(--spacing-3); font-size: var(--font-size-sm);">
                                    <i class="fas fa-edit"></i> Edit
                                </a>
                                <a href="<?= APP_URL ?>/index.php?c=feeStructure&a=deleteRule&id=<?= $rule['id'] ?>" class="btn btn-danger" style="padding: var(--spacing-2) var(--spacing-3); font-size: var(--font-size-sm);" onclick="return confirm('Delete this fee rule?')">
                                    <i class="fas fa-trash"></i> Delete
                                </a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</div>

<script>
$(document).ready(function() {
    // Show fee inputs when class is selected
    $('#class_id').change(function() {
        if ($(this).val()) {
            $('#feeInputs').slideDown();
        } else {
            $('#feeInputs').slideUp();
        }
    });
    
    <?php if (!empty($rules)): ?>
    $('#rulesTable').DataTable({
        order: [[2, 'asc'], [0, 'asc']],
        pageLength: 25
    });
    <?php endif; ?>
});
</script>
