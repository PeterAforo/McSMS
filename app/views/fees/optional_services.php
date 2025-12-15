<div class="d-flex justify-between align-center mb-5">
    <h1>Optional Services</h1>
    <a href="<?= APP_URL ?>/index.php?c=fees&a=createService" class="btn btn-primary-sms">
        <i class="fas fa-plus"></i> Add Service
    </a>
</div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">All Optional Services</h2>
    </div>
    <div class="card-body">
        <?php if (empty($services)): ?>
            <div style="text-align: center; padding: var(--spacing-8);">
                <i class="fas fa-plus-circle" style="font-size: 48px; color: var(--color-text-muted); margin-bottom: var(--spacing-4);"></i>
                <p class="text-muted">No optional services configured yet.</p>
                <a href="<?= APP_URL ?>/index.php?c=fees&a=createService" class="btn btn-primary-sms">
                    <i class="fas fa-plus"></i> Add Your First Service
                </a>
            </div>
        <?php else: ?>
            <table class="sms-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Service Name</th>
                        <th>Amount</th>
                        <th>Description</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($services as $service): ?>
                        <tr>
                            <td><?= $service['id'] ?></td>
                            <td><?= htmlspecialchars($service['service_name']) ?></td>
                            <td><?= formatCurrency($service['amount']) ?></td>
                            <td><?= htmlspecialchars($service['description'] ?? 'N/A') ?></td>
                            <td>
                                <a href="<?= APP_URL ?>/index.php?c=fees&a=editService&id=<?= $service['id'] ?>" class="btn btn-primary-sms" style="padding: var(--spacing-2) var(--spacing-3); font-size: var(--font-size-sm);">
                                    <i class="fas fa-edit"></i> Edit
                                </a>
                                <a href="<?= APP_URL ?>/index.php?c=fees&a=deleteService&id=<?= $service['id'] ?>" class="btn" style="padding: var(--spacing-2) var(--spacing-3); font-size: var(--font-size-sm); background: var(--color-error); color: white;" onclick="return confirm('Are you sure you want to delete this service?')">
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
