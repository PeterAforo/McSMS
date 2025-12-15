<?php include APP_PATH . '/views/partials/topbar.php'; ?>
<!-- Main Content -->
<div class="main-content">
    <!-- Page Header -->
    <div class="page-header">
        <div>
            <h1 class="page-title">Fee Structure Management</h1>
            <div class="page-breadcrumb">
                <a href="<?= APP_URL ?>/index.php?c=admin&a=dashboard">Dashboard</a>
                <i class="fas fa-chevron-right"></i>
                <span>Fee Structure</span>
            </div>
        </div>
    </div>
    <p class="text-muted">Manage fee groups, items, and class-based pricing rules</p>

    <!-- Stats Cards -->
    <div class="overview-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: var(--spacing-xxl);">
        <div class="stat-card">
            <div class="stat-icon" style="background: #E3F2FD; color: #2196F3;">
                <i class="fas fa-layer-group"></i>
            <i class="fas fa-layer-group"></i>
        </div>
        <div class="stat-content">
            <p>Fee Groups</p>
            <h3><?= $stats['total_groups'] ?></h3>
        </div>
    </div>
    
    <div class="stat-card">
        <div class="stat-icon" style="background: #F3E5F5; color: #9C27B0;">
            <i class="fas fa-list"></i>
        </div>
        <div class="stat-content">
            <p>Total Fee Items</p>
            <h3><?= $stats['total_items'] ?></h3>
        </div>
    </div>
    
    <div class="stat-card">
        <div class="stat-icon" style="background: #E8F5E9; color: #4CAF50;">
            <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-content">
            <p>Mandatory Fees</p>
            <h3><?= $stats['mandatory_items'] ?></h3>
        </div>
    </div>
    
    <div class="stat-card">
        <div class="stat-icon" style="background: #FFF3E0; color: #FF9800;">
            <i class="fas fa-plus-circle"></i>
        </div>
        <div class="stat-content">
            <p>Optional Fees</p>
            <h3><?= $stats['optional_items'] ?></h3>
        </div>
    </div>
</div>

<!-- Quick Actions -->
<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">Quick Actions</h2>
    </div>
    <div class="card-body">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--spacing-lg);">
            <a href="<?= APP_URL ?>/index.php?c=feeStructure&a=groups" class="btn btn-primary-sms" style="padding: var(--spacing-4); display: flex; align-items: center; gap: var(--spacing-3); text-decoration: none;">
                <i class="fas fa-layer-group" style="font-size: 24px;"></i>
                <div style="text-align: left;">
                    <div style="font-weight: var(--font-weight-semibold);">Fee Groups</div>
                    <div style="font-size: var(--font-size-sm); opacity: 0.9;">Manage fee categories</div>
                </div>
            </a>
            
            <a href="<?= APP_URL ?>/index.php?c=feeStructure&a=items" class="btn btn-success" style="padding: var(--spacing-4); display: flex; align-items: center; gap: var(--spacing-3); text-decoration: none;">
                <i class="fas fa-list" style="font-size: 24px;"></i>
                <div style="text-align: left;">
                    <div style="font-weight: var(--font-weight-semibold);">Fee Items</div>
                    <div style="font-size: var(--font-size-sm); opacity: 0.9;">Manage individual fees</div>
                </div>
            </a>
            
            <a href="<?= APP_URL ?>/index.php?c=feeStructure&a=rules" class="btn" style="background: #9C27B0; color: white; padding: var(--spacing-4); display: flex; align-items: center; gap: var(--spacing-3); text-decoration: none;">
                <i class="fas fa-dollar-sign" style="font-size: 24px;"></i>
                <div style="text-align: left;">
                    <div style="font-weight: var(--font-weight-semibold);">Fee Rules</div>
                    <div style="font-size: var(--font-size-sm); opacity: 0.9;">Set class-based pricing</div>
                </div>
            </a>
        </div>
    </div>
</div>

<!-- Information -->
<div class="sms-card" style="margin-top: var(--spacing-xl);">
    <div class="card-header">
        <h2 class="card-title">How It Works</h2>
    </div>
    <div class="card-body">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--spacing-xl);">
            <div>
                <h4 style="color: var(--color-primary); margin-bottom: var(--spacing-md);">
                    <i class="fas fa-layer-group"></i> 1. Fee Groups
                </h4>
                <p class="text-muted">Categories like Tuition, ICT, PTA, Activities, Transport, etc. Organize your fees logically.</p>
            </div>
            
            <div>
                <h4 style="color: var(--color-success); margin-bottom: var(--spacing-md);">
                    <i class="fas fa-list"></i> 2. Fee Items
                </h4>
                <p class="text-muted">Individual fees like "Grade 1 Tuition", "ICT Fee". Mark as mandatory or optional.</p>
            </div>
            
            <div>
                <h4 style="color: #9C27B0; margin-bottom: var(--spacing-md);">
                    <i class="fas fa-dollar-sign"></i> 3. Fee Rules
                </h4>
                <p class="text-muted">Set different amounts for each class. Grade 1 tuition ≠ Grade 10 tuition.</p>
            </div>
        </div>
    </div>
</div>

</div><!-- End main-content -->
