<div class="d-flex justify-between align-center mb-5">
    <h1>Manage Classes</h1>
    <a href="<?= APP_URL ?>/index.php?c=academic&a=createClass" class="btn btn-primary-sms">
        <i class="fas fa-plus"></i> Add New Class
    </a>
</div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">All Classes</h2>
    </div>
    <div class="card-body">
        <?php if (empty($classes)): ?>
            <div style="text-align: center; padding: var(--spacing-8);">
                <i class="fas fa-school" style="font-size: 48px; color: var(--color-text-muted); margin-bottom: var(--spacing-4);"></i>
                <p class="text-muted">No classes found.</p>
                <a href="<?= APP_URL ?>/index.php?c=academic&a=createClass" class="btn btn-primary-sms">
                    <i class="fas fa-plus"></i> Add Your First Class
                </a>
            </div>
        <?php else: ?>
            <table class="sms-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Class Name</th>
                        <th>Level</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($classes as $class): ?>
                        <tr>
                            <td><?= $class['id'] ?></td>
                            <td><?= htmlspecialchars($class['class_name']) ?></td>
                            <td><?= ucfirst($class['level']) ?></td>
                            <td>
                                <a href="<?= APP_URL ?>/index.php?c=academic&a=editClass&id=<?= $class['id'] ?>" class="btn btn-primary-sms" style="padding: var(--spacing-2) var(--spacing-3); font-size: var(--font-size-sm);">
                                    <i class="fas fa-edit"></i> Edit
                                </a>
                                <a href="<?= APP_URL ?>/index.php?c=academic&a=deleteClass&id=<?= $class['id'] ?>" class="btn" style="padding: var(--spacing-2) var(--spacing-3); font-size: var(--font-size-sm); background: var(--color-error); color: white;" onclick="return confirm('Are you sure you want to delete this class?')">
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
