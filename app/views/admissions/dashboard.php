<div class="d-flex justify-between align-center mb-5">
    <h1>Admissions Dashboard</h1>
</div>

<!-- Statistics Widgets -->
<div class="widget-container">
    <div class="sms-stat-card">
        <div class="stat-icon warning">
            <i class="fas fa-clock"></i>
        </div>
        <div class="stat-content">
            <h3><?= $stats['pending'] ?></h3>
            <p>Pending Applications</p>
        </div>
    </div>
    
    <div class="sms-stat-card">
        <div class="stat-icon success">
            <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-content">
            <h3><?= $stats['approved'] ?></h3>
            <p>Approved</p>
        </div>
    </div>
    
    <div class="sms-stat-card">
        <div class="stat-icon" style="background-color: var(--color-error);">
            <i class="fas fa-times-circle"></i>
        </div>
        <div class="stat-content">
            <h3><?= $stats['rejected'] ?></h3>
            <p>Rejected</p>
        </div>
    </div>
    
    <div class="sms-stat-card">
        <div class="stat-icon info">
            <i class="fas fa-file-alt"></i>
        </div>
        <div class="stat-content">
            <h3><?= $stats['total'] ?></h3>
            <p>Total Applications</p>
        </div>
    </div>
</div>

<!-- Recent Applications -->
<div class="sms-card">
    <div class="card-header d-flex justify-between align-center">
        <h2 class="card-title">Recent Pending Applications</h2>
        <a href="<?= APP_URL ?>/index.php?c=admissions&a=pending" class="btn btn-primary-sms">
            View All
        </a>
    </div>
    <div class="card-body">
        <?php if (empty($applications)): ?>
            <p class="text-muted">No pending applications.</p>
        <?php else: ?>
            <table class="sms-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Child Name</th>
                        <th>Parent</th>
                        <th>Class</th>
                        <th>Submitted</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($applications as $app): ?>
                        <tr>
                            <td>#<?= str_pad($app['id'], 5, '0', STR_PAD_LEFT) ?></td>
                            <td><?= htmlspecialchars($app['child_name']) ?></td>
                            <td><?= htmlspecialchars($app['parent_name']) ?></td>
                            <td><?= htmlspecialchars($app['class_name']) ?></td>
                            <td><?= date('M d, Y', strtotime($app['created_at'])) ?></td>
                            <td>
                                <a href="<?= APP_URL ?>/index.php?c=admissions&a=view&id=<?= $app['id'] ?>" class="btn btn-primary-sms" style="padding: var(--spacing-2) var(--spacing-3); font-size: var(--font-size-sm);">
                                    <i class="fas fa-eye"></i> Review
                                </a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</div>
