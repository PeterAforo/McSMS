<div class="d-flex justify-between align-center mb-5">
    <h1>Fee Groups</h1>
</div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">All Fee Groups</h2>
    </div>
    <div class="card-body">
        <?php if (empty($groups)): ?>
            <div style="text-align: center; padding: var(--spacing-8);">
                <i class="fas fa-layer-group" style="font-size: 48px; color: var(--color-text-muted); margin-bottom: var(--spacing-4);"></i>
                <p class="text-muted">No fee groups found.</p>
            </div>
        <?php else: ?>
            <div style="display: grid; gap: var(--spacing-lg);">
                <?php foreach ($groups as $group): ?>
                    <div class="sms-card" style="border-left: 4px solid var(--color-primary);">
                        <div class="card-body">
                            <div style="display: flex; justify-content: space-between; align-items: start;">
                                <div style="flex: 1;">
                                    <h3 style="margin-bottom: var(--spacing-2);">
                                        <i class="fas fa-layer-group" style="color: var(--color-primary);"></i>
                                        <?= htmlspecialchars($group['name']) ?>
                                    </h3>
                                    <?php if ($group['description']): ?>
                                        <p class="text-muted" style="margin-bottom: var(--spacing-3);">
                                            <?= htmlspecialchars($group['description']) ?>
                                        </p>
                                    <?php endif; ?>
                                    
                                    <?php if (!empty($group['items'])): ?>
                                        <div style="margin-top: var(--spacing-3);">
                                            <strong>Fee Items (<?= count($group['items']) ?>):</strong>
                                            <div style="display: flex; flex-wrap: wrap; gap: var(--spacing-2); margin-top: var(--spacing-2);">
                                                <?php foreach ($group['items'] as $item): ?>
                                                    <span class="badge badge-<?= $item['is_optional'] ? 'warning' : 'success' ?>">
                                                        <?= htmlspecialchars($item['name']) ?>
                                                    </span>
                                                <?php endforeach; ?>
                                            </div>
                                        </div>
                                    <?php else: ?>
                                        <p class="text-muted" style="margin-top: var(--spacing-2);">
                                            <i class="fas fa-info-circle"></i> No fee items in this group yet.
                                        </p>
                                    <?php endif; ?>
                                </div>
                                
                                <div style="text-align: right;">
                                    <span class="badge badge-info">Order: <?= $group['display_order'] ?></span>
                                </div>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>
</div>

<div class="alert alert-info" style="margin-top: var(--spacing-xl);">
    <i class="fas fa-info-circle"></i>
    <strong>Note:</strong> Fee groups are pre-configured categories. To add fee items to these groups, go to the <a href="<?= APP_URL ?>/index.php?c=feeStructure&a=items">Fee Items</a> page.
</div>
