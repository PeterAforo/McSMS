<div class="mb-5">
    <h1>My Classes</h1>
    <p class="text-muted">Select a class to take attendance or enter grades</p>
</div>

<div class="widget-container">
    <?php if (empty($classes)): ?>
        <div class="sms-card">
            <div class="card-body" style="text-align: center; padding: var(--spacing-8);">
                <i class="fas fa-chalkboard" style="font-size: 48px; color: var(--color-text-muted); margin-bottom: var(--spacing-4);"></i>
                <p class="text-muted">No classes assigned yet.</p>
            </div>
        </div>
    <?php else: ?>
        <?php foreach ($classes as $class): ?>
            <div class="sms-card">
                <div class="card-header">
                    <h3><?= htmlspecialchars($class['class_name']) ?></h3>
                    <p class="text-muted"><?= ucfirst($class['level']) ?></p>
                </div>
                <div class="card-body">
                    <div style="display: flex; gap: var(--spacing-3); flex-wrap: wrap;">
                        <a href="<?= APP_URL ?>/index.php?c=teacher&a=attendance&class_id=<?= $class['id'] ?>&date=<?= date('Y-m-d') ?>" class="btn btn-primary-sms" style="flex: 1; min-width: 150px;">
                            <i class="fas fa-clipboard-check"></i> Take Attendance
                        </a>
                        <a href="<?= APP_URL ?>/index.php?c=teacher&a=grades&class_id=<?= $class['id'] ?>&subject_id=1" class="btn btn-success" style="flex: 1; min-width: 150px;">
                            <i class="fas fa-graduation-cap"></i> Enter Grades
                        </a>
                    </div>
                </div>
            </div>
        <?php endforeach; ?>
    <?php endif; ?>
</div>
