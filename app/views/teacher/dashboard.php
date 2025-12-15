<div class="d-flex justify-between align-center mb-5">
    <h1>Teacher Dashboard</h1>
</div>

<!-- Statistics Widgets -->
<div class="widget-container">
    <div class="sms-stat-card">
        <div class="stat-icon primary">
            <i class="fas fa-chalkboard"></i>
        </div>
        <div class="stat-content">
            <h3><?= $stats['my_classes'] ?></h3>
            <p>My Classes</p>
        </div>
    </div>
    
    <div class="sms-stat-card">
        <div class="stat-icon info">
            <i class="fas fa-users"></i>
        </div>
        <div class="stat-content">
            <h3><?= $stats['total_students'] ?></h3>
            <p>Total Students</p>
        </div>
    </div>
    
    <div class="sms-stat-card">
        <div class="stat-icon warning">
            <i class="fas fa-clipboard-check"></i>
        </div>
        <div class="stat-content">
            <h3><?= $stats['pending_grading'] ?></h3>
            <p>Pending Grading</p>
        </div>
    </div>
    
    <div class="sms-stat-card">
        <div class="stat-icon success">
            <i class="fas fa-book"></i>
        </div>
        <div class="stat-content">
            <h3><?= $stats['homework_assigned'] ?></h3>
            <p>Homework Assigned</p>
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
            <a href="<?= APP_URL ?>/index.php?c=teacher&a=myClasses" class="btn btn-primary-sms">
                <i class="fas fa-chalkboard"></i> View My Classes
            </a>
            <a href="<?= APP_URL ?>/index.php?c=teacher&a=homework" class="btn btn-success">
                <i class="fas fa-book"></i> Manage Homework
            </a>
            <a href="<?= APP_URL ?>/index.php?c=teacher&a=myClasses" class="btn btn-info">
                <i class="fas fa-clipboard-check"></i> Take Attendance
            </a>
            <a href="<?= APP_URL ?>/index.php?c=teacher&a=myClasses" class="btn btn-secondary">
                <i class="fas fa-graduation-cap"></i> Enter Grades
            </a>
        </div>
    </div>
</div>

<!-- Welcome Message -->
<div class="sms-card">
    <div class="card-body">
        <h3>Welcome, Teacher!</h3>
        <p class="text-muted">Use the navigation above to manage your classes, take attendance, enter grades, and assign homework.</p>
    </div>
</div>
