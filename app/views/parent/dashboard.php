<div class="d-flex justify-between align-center mb-5">
    <h1>Parent Dashboard</h1>
    <div>
        <span class="text-muted">Welcome, <?= htmlspecialchars($parent['name']) ?>!</span>
    </div>
</div>

<!-- Statistics Widgets -->
<div class="widget-container">
    <div class="sms-stat-card">
        <div class="stat-icon primary">
            <i class="fas fa-child"></i>
        </div>
        <div class="stat-content">
            <h3><?= $stats['total_children'] ?></h3>
            <p>My Children</p>
        </div>
    </div>
    
    <div class="sms-stat-card">
        <div class="stat-icon warning">
            <i class="fas fa-clock"></i>
        </div>
        <div class="stat-content">
            <h3><?= $stats['pending_applications'] ?></h3>
            <p>Pending Applications</p>
        </div>
    </div>
    
    <div class="sms-stat-card">
        <div class="stat-icon info">
            <i class="fas fa-dollar-sign"></i>
        </div>
        <div class="stat-content">
            <h3>$<?= number_format($stats['outstanding_fees'], 2) ?></h3>
            <p>Outstanding Fees</p>
        </div>
    </div>
    
    <div class="sms-stat-card">
        <div class="stat-icon success">
            <i class="fas fa-bell"></i>
        </div>
        <div class="stat-content">
            <h3><?= $stats['notifications'] ?></h3>
            <p>Notifications</p>
        </div>
    </div>
</div>

<!-- Children Overview -->
<div class="sms-card">
    <div class="card-header d-flex justify-between align-center">
        <h2 class="card-title">My Children</h2>
        <a href="<?= APP_URL ?>/index.php?c=parent&a=addChild" class="btn btn-primary-sms">
            <i class="fas fa-plus"></i> Add Child
        </a>
    </div>
    <div class="card-body">
        <?php if (empty($children)): ?>
            <div style="text-align: center; padding: var(--spacing-8);">
                <i class="fas fa-child" style="font-size: 48px; color: var(--color-text-muted); margin-bottom: var(--spacing-4);"></i>
                <p class="text-muted">No children registered yet.</p>
                <a href="<?= APP_URL ?>/index.php?c=parent&a=addChild" class="btn btn-primary-sms">
                    <i class="fas fa-plus"></i> Add Your First Child
                </a>
            </div>
        <?php else: ?>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--spacing-4);">
                <?php foreach ($children as $child): ?>
                    <div class="sms-card" style="margin-bottom: 0;">
                        <div style="display: flex; align-items: center; gap: var(--spacing-4);">
                            <div style="width: 60px; height: 60px; border-radius: 50%; background: var(--color-primary-light); display: flex; align-items: center; justify-content: center; color: white; font-size: 24px;">
                                <i class="fas fa-user"></i>
                            </div>
                            <div style="flex: 1;">
                                <h3 style="margin-bottom: var(--spacing-1); font-size: var(--font-size-md);">
                                    <?= htmlspecialchars($child['full_name']) ?>
                                </h3>
                                <p class="text-muted" style="font-size: var(--font-size-sm); margin-bottom: var(--spacing-2);">
                                    <?= ucfirst($child['gender']) ?> • <?= date('M d, Y', strtotime($child['date_of_birth'])) ?>
                                </p>
                                <?php if ($child['admission_status']): ?>
                                    <?php if ($child['admission_status'] === 'pending'): ?>
                                        <span class="badge badge-warning">Application Pending</span>
                                    <?php elseif ($child['admission_status'] === 'approved'): ?>
                                        <span class="badge badge-success">Enrolled</span>
                                    <?php else: ?>
                                        <span class="badge badge-danger">Application Rejected</span>
                                    <?php endif; ?>
                                <?php else: ?>
                                    <a href="<?= APP_URL ?>/index.php?c=parent&a=applyForAdmission&child_id=<?= $child['id'] ?>" class="btn btn-outline" style="padding: var(--spacing-2) var(--spacing-3); font-size: var(--font-size-sm);">
                                        <i class="fas fa-file-alt"></i> Apply for Admission
                                    </a>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>
</div>

<!-- Quick Actions -->
<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">Quick Actions</h2>
    </div>
    <div class="card-body">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-4);">
            <a href="<?= APP_URL ?>/index.php?c=parent&a=children" class="btn btn-primary-sms">
                <i class="fas fa-child"></i> Manage Children
            </a>
            <a href="<?= APP_URL ?>/index.php?c=parent&a=applications" class="btn btn-secondary">
                <i class="fas fa-file-alt"></i> View Applications
            </a>
            <a href="<?= APP_URL ?>/index.php?c=parent&a=fees" class="btn btn-success">
                <i class="fas fa-money-bill"></i> Pay Fees
            </a>
            <a href="<?= APP_URL ?>/index.php?c=parent&a=messages" class="btn btn-outline">
                <i class="fas fa-envelope"></i> Messages
            </a>
        </div>
    </div>
</div>
