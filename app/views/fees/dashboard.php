<?php include APP_PATH . '/views/partials/topbar.php'; ?>

<!-- Main Content -->
<div class="main-content">
    <!-- Page Header -->
    <div class="page-header">
        <div>
            <h1 class="page-title">Finance Dashboard</h1>
            <div class="page-breadcrumb">
                <a href="<?= APP_URL ?>/index.php?c=admin&a=dashboard">Dashboard</a>
                <i class="fas fa-chevron-right"></i>
                <span>Finance</span>
            </div>
        </div>
    </div>

<!-- Statistics Widgets -->
<div class="widget-container">
    <div class="sms-stat-card">
        <div class="stat-icon success">
            <i class="fas fa-dollar-sign"></i>
        </div>
        <div class="stat-content">
            <h3><?= formatCurrency($stats['total_revenue']) ?></h3>
            <p>Total Revenue</p>
        </div>
    </div>
    
    <div class="sms-stat-card">
        <div class="stat-icon warning">
            <i class="fas fa-clock"></i>
        </div>
        <div class="stat-content">
            <h3><?= formatCurrency($stats['pending_payments']) ?></h3>
            <p>Pending Payments</p>
        </div>
    </div>
    
    <div class="sms-stat-card">
        <div class="stat-icon info">
            <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-content">
            <h3><?= $stats['paid_invoices'] ?></h3>
            <p>Paid Invoices</p>
        </div>
    </div>
    
    <div class="sms-stat-card">
        <div class="stat-icon" style="background-color: var(--color-error);">
            <i class="fas fa-exclamation-circle"></i>
        </div>
        <div class="stat-content">
            <h3><?= $stats['unpaid_invoices'] ?></h3>
            <p>Unpaid Invoices</p>
        </div>
    </div>
</div>

<!-- Quick Actions -->
<div class="sms-card mb-5">
    <div class="card-header">
        <h2 class="card-title">Quick Actions</h2>
    </div>
    <div class="card-body">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-4);">
            <a href="<?= APP_URL ?>/index.php?c=fees&a=invoices" class="btn btn-primary-sms">
                <i class="fas fa-file-invoice"></i> View Invoices
            </a>
            <a href="<?= APP_URL ?>/index.php?c=fees&a=feeTypes" class="btn btn-success">
                <i class="fas fa-tags"></i> Manage Fee Types
            </a>
            <a href="<?= APP_URL ?>/index.php?c=fees&a=optionalServices" class="btn btn-info">
                <i class="fas fa-plus-circle"></i> Optional Services
            </a>
            <a href="<?= APP_URL ?>/index.php?c=reports&a=index" class="btn btn-secondary">
                <i class="fas fa-chart-bar"></i> Financial Reports
            </a>
        </div>
    </div>
</div>

<!-- Revenue Overview -->
<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">Revenue Overview</h2>
    </div>
    <div class="card-body">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--spacing-5);">
            <div>
                <h4 style="color: var(--color-text-muted); margin-bottom: var(--spacing-2);">Total Collected</h4>
                <p style="font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--color-success);">
                    <?= formatCurrency($stats['total_revenue']) ?>
                </p>
            </div>
            <div>
                <h4 style="color: var(--color-text-muted); margin-bottom: var(--spacing-2);">Outstanding Balance</h4>
                <p style="font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--color-warning);">
                    <?= formatCurrency($stats['pending_payments']) ?>
                </p>
            </div>
            <div>
                <h4 style="color: var(--color-text-muted); margin-bottom: var(--spacing-2);">Collection Rate</h4>
                <p style="font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--color-info);">
                    <?php 
                    $total = $stats['total_revenue'] + $stats['pending_payments'];
                    $rate = $total > 0 ? ($stats['total_revenue'] / $total) * 100 : 0;
                    echo number_format($rate, 1) . '%';
                    ?>
                </p>
            </div>
        </div>
    </div>
</div>

</div><!-- End main-content -->
