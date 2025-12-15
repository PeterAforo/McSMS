<div class="d-flex justify-between align-center mb-5">
    <h1>Fee Types Management</h1>
    <a href="<?= APP_URL ?>/index.php?c=fees&a=createFeeType" class="btn btn-primary-sms">
        <i class="fas fa-plus"></i> Add Fee Type
    </a>
</div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">All Fee Types</h2>
    </div>
    <div class="card-body">
        <?php if (empty($feeTypes)): ?>
            <div style="text-align: center; padding: var(--spacing-8);">
                <i class="fas fa-tags" style="font-size: 48px; color: var(--color-text-muted); margin-bottom: var(--spacing-4);"></i>
                <p class="text-muted">No fee types configured yet.</p>
                <a href="<?= APP_URL ?>/index.php?c=fees&a=createFeeType" class="btn btn-primary-sms">
                    <i class="fas fa-plus"></i> Add Your First Fee Type
                </a>
            </div>
        <?php else: ?>
            <table class="sms-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Fee Name</th>
                        <th>Class</th>
                        <th>Amount</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($feeTypes as $fee): ?>
                        <tr>
                            <td><?= $fee['id'] ?></td>
                            <td><?= htmlspecialchars($fee['fee_name']) ?></td>
                            <td><?= htmlspecialchars($fee['class_name']) ?></td>
                            <td><?= formatCurrency($fee['amount']) ?></td>
                            <td>
                                <a href="<?= APP_URL ?>/index.php?c=fees&a=editFeeType&id=<?= $fee['id'] ?>" class="btn btn-primary-sms" style="padding: var(--spacing-2) var(--spacing-3); font-size: var(--font-size-sm);">
                                    <i class="fas fa-edit"></i> Edit
                                </a>
                                <a href="<?= APP_URL ?>/index.php?c=fees&a=deleteFeeType&id=<?= $fee['id'] ?>" class="btn" style="padding: var(--spacing-2) var(--spacing-3); font-size: var(--font-size-sm); background: var(--color-error); color: white;" onclick="return confirm('Are you sure you want to delete this fee type?')">
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
