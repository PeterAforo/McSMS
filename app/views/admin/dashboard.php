<div class="d-flex justify-between align-center mb-5">
    <h1>Admin Dashboard</h1>
    <div>
        <span class="text-muted">Welcome back, <?= htmlspecialchars($_SESSION['user_name']) ?>!</span>
    </div>
</div>

<!-- Statistics Widgets -->
<div class="widget-container">
    <div class="sms-stat-card">
        <div class="stat-icon primary">
            <i class="fas fa-user-graduate"></i>
        </div>
        <div class="stat-content">
            <h3><?= $stats['total_students'] ?></h3>
            <p>Total Students</p>
        </div>
    </div>
    
    <div class="sms-stat-card">
        <div class="stat-icon success">
            <i class="fas fa-chalkboard-teacher"></i>
        </div>
        <div class="stat-content">
            <h3><?= $stats['total_teachers'] ?></h3>
            <p>Total Teachers</p>
        </div>
    </div>
    
    <div class="sms-stat-card">
        <div class="stat-icon info">
            <i class="fas fa-users"></i>
        </div>
        <div class="stat-content">
            <h3><?= $stats['total_parents'] ?></h3>
            <p>Total Parents</p>
        </div>
    </div>
    
    <div class="sms-stat-card">
        <div class="stat-icon warning">
            <i class="fas fa-clipboard-list"></i>
        </div>
        <div class="stat-content">
            <h3><?= $stats['pending_admissions'] ?></h3>
            <p>Pending Admissions</p>
        </div>
    </div>
</div>

<!-- Quick Actions -->
<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">Quick Actions</h2>
    </div>
    <div class="card-body">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-4);">
            <a href="<?= APP_URL ?>/index.php?c=admin&a=users" class="btn btn-primary-sms">
                <i class="fas fa-user-plus"></i> Manage Users
            </a>
            <a href="<?= APP_URL ?>/index.php?c=academic&a=classes" class="btn btn-secondary">
                <i class="fas fa-school"></i> Manage Classes
            </a>
            <a href="<?= APP_URL ?>/index.php?c=admissions&a=dashboard" class="btn btn-success">
                <i class="fas fa-user-check"></i> Review Admissions
            </a>
            <a href="<?= APP_URL ?>/index.php?c=fees&a=dashboard" class="btn btn-outline">
                <i class="fas fa-dollar-sign"></i> Finance
            </a>
        </div>
    </div>
</div>

<!-- Recent Activity -->
<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">System Overview</h2>
    </div>
    <div class="card-body">
        <p>Welcome to the School Management System admin dashboard. Use the sidebar to navigate through different modules.</p>
        
        <div style="margin-top: var(--spacing-5);">
            <h3 style="font-size: var(--font-size-md); margin-bottom: var(--spacing-3);">System Status</h3>
            <div style="display: flex; gap: var(--spacing-4); flex-wrap: wrap;">
                <div>
                    <span class="badge badge-success">System Online</span>
                </div>
                <div>
                    <span class="badge badge-primary">Database Connected</span>
                </div>
                <div>
                    <span class="badge badge-success">All Services Running</span>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .widget-container {
        margin-bottom: var(--spacing-6);
    }
</style>
