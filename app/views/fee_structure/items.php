<div class="d-flex justify-between align-center mb-5">
    <h1>Fee Items</h1>
</div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">All Fee Items</h2>
    </div>
    <div class="card-body">
        <?php if (empty($items)): ?>
            <div style="text-align: center; padding: var(--spacing-8);">
                <i class="fas fa-list" style="font-size: 48px; color: var(--color-text-muted); margin-bottom: var(--spacing-4);"></i>
                <p class="text-muted">No fee items found.</p>
            </div>
        <?php else: ?>
            <table class="sms-table" id="itemsTable">
                <thead>
                    <tr>
                        <th>Fee Item</th>
                        <th>Group</th>
                        <th>Frequency</th>
                        <th>Type</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    <?php 
                    $currentGroup = null;
                    foreach ($items as $item): 
                    ?>
                        <?php if ($currentGroup !== $item['group_name']): ?>
                            <?php $currentGroup = $item['group_name']; ?>
                            <tr style="background: var(--color-surface); font-weight: var(--font-weight-medium);">
                                <td colspan="5">
                                    <i class="fas fa-layer-group"></i> <?= htmlspecialchars($item['group_name']) ?>
                                </td>
                            </tr>
                        <?php endif; ?>
                        <tr>
                            <td style="padding-left: var(--spacing-6);">
                                <strong><?= htmlspecialchars($item['name']) ?></strong>
                            </td>
                            <td><?= htmlspecialchars($item['group_name']) ?></td>
                            <td>
                                <span class="badge badge-info"><?= ucfirst($item['frequency']) ?></span>
                            </td>
                            <td>
                                <span class="badge badge-<?= $item['is_optional'] ? 'warning' : 'success' ?>">
                                    <?= $item['is_optional'] ? 'Optional' : 'Mandatory' ?>
                                </span>
                            </td>
                            <td>
                                <?php if ($item['description']): ?>
                                    <small class="text-muted"><?= htmlspecialchars($item['description']) ?></small>
                                <?php else: ?>
                                    <span class="text-muted">-</span>
                                <?php endif; ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</div>

<div class="alert alert-info" style="margin-top: var(--spacing-xl);">
    <i class="fas fa-info-circle"></i>
    <strong>Next Step:</strong> Set pricing for these fee items by going to <a href="<?= APP_URL ?>/index.php?c=feeStructure&a=rules">Fee Rules</a>.
</div>

<script>
$(document).ready(function() {
    <?php if (!empty($items)): ?>
    $('#itemsTable').DataTable({
        order: [[1, 'asc'], [0, 'asc']],
        pageLength: 25
    });
    <?php endif; ?>
});
</script>
