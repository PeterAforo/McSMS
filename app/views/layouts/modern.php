<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $pageTitle ?? APP_NAME ?></title>
    <!-- Google Fonts - Inter -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- DataTables CSS -->
    <link rel="stylesheet" href="https://cdn.datatables.net/1.13.4/css/jquery.dataTables.min.css">
    <!-- Original CSS -->
    <link rel="stylesheet" href="<?= ASSETS_URL ?>/css/style.css?v=<?= time() ?>">
    <!-- Modern Dashboard CSS -->
    <link rel="stylesheet" href="<?= ASSETS_URL ?>/css/modern-dashboard.css?v=<?= time() ?>">
</head>
<body>
    <!-- Sidebar -->
    <div class="sidebar">
        <div class="sidebar-header">
            <div class="sidebar-logo">
                <i class="fas fa-graduation-cap"></i>
            </div>
            <div>
                <div class="sidebar-title">Army Public</div>
                <div class="sidebar-subtitle">School Jammu</div>
            </div>
        </div>

        <!-- MAIN Section -->
        <div class="sidebar-section">
            <div class="sidebar-section-title">MAIN</div>
            <ul class="sidebar-nav">
                <li class="sidebar-nav-item">
                    <a href="<?= APP_URL ?>/index.php?c=admin&a=dashboard" class="sidebar-nav-link active">
                        <i class="fas fa-th-large sidebar-nav-icon"></i>
                        <span>Dashboard</span>
                    </a>
                </li>
            </ul>
        </div>

        <!-- ADMINISTRATION Section -->
        <div class="sidebar-section">
            <div class="sidebar-section-title">ADMINISTRATION</div>
            <ul class="sidebar-nav">
                <li class="sidebar-nav-item">
                    <a href="<?= APP_URL ?>/index.php?c=admin&a=users" class="sidebar-nav-link">
                        <i class="fas fa-users sidebar-nav-icon"></i>
                        <span>Users</span>
                    </a>
                </li>
                <li class="sidebar-nav-item">
                    <a href="<?= APP_URL ?>/index.php?c=admissions&a=pending" class="sidebar-nav-link">
                        <i class="fas fa-user-graduate sidebar-nav-icon"></i>
                        <span>Admissions</span>
                    </a>
                </li>
            </ul>
        </div>

        <!-- ACADEMICS Section -->
        <div class="sidebar-section">
            <div class="sidebar-section-title">ACADEMICS</div>
            <ul class="sidebar-nav">
                <li class="sidebar-nav-item">
                    <a href="<?= APP_URL ?>/index.php?c=classes" class="sidebar-nav-link">
                        <i class="fas fa-school sidebar-nav-icon"></i>
                        <span>Classes</span>
                    </a>
                </li>
                <li class="sidebar-nav-item">
                    <a href="<?= APP_URL ?>/index.php?c=sections" class="sidebar-nav-link">
                        <i class="fas fa-layer-group sidebar-nav-icon"></i>
                        <span>Sections</span>
                    </a>
                </li>
                <li class="sidebar-nav-item">
                    <a href="<?= APP_URL ?>/index.php?c=subjects" class="sidebar-nav-link">
                        <i class="fas fa-book sidebar-nav-icon"></i>
                        <span>Subjects</span>
                    </a>
                </li>
                <li class="sidebar-nav-item">
                    <a href="<?= APP_URL ?>/index.php?c=terms" class="sidebar-nav-link">
                        <i class="fas fa-calendar-alt sidebar-nav-icon"></i>
                        <span>Academic Terms</span>
                    </a>
                </li>
            </ul>
        </div>

        <!-- FINANCE Section -->
        <div class="sidebar-section">
            <div class="sidebar-section-title">FINANCE</div>
            <ul class="sidebar-nav">
                <li class="sidebar-nav-item">
                    <a href="<?= APP_URL ?>/index.php?c=feeStructure" class="sidebar-nav-link">
                        <i class="fas fa-money-bill-wave sidebar-nav-icon"></i>
                        <span>Fee Structure</span>
                    </a>
                </li>
                <li class="sidebar-nav-item">
                    <a href="<?= APP_URL ?>/index.php?c=fees&a=dashboard" class="sidebar-nav-link">
                        <i class="fas fa-dollar-sign sidebar-nav-icon"></i>
                        <span>Finance Dashboard</span>
                    </a>
                </li>
                <li class="sidebar-nav-item">
                    <a href="<?= APP_URL ?>/index.php?c=fees&a=pendingInvoices" class="sidebar-nav-link">
                        <i class="fas fa-clock sidebar-nav-icon"></i>
                        <span>Pending Invoices</span>
                    </a>
                </li>
            </ul>
        </div>

        <!-- SETTINGS Section -->
        <div class="sidebar-section">
            <div class="sidebar-section-title">SYSTEM</div>
            <ul class="sidebar-nav">
                <li class="sidebar-nav-item">
                    <a href="<?= APP_URL ?>/index.php?c=admin&a=settings" class="sidebar-nav-link">
                        <i class="fas fa-cog sidebar-nav-icon"></i>
                        <span>Settings</span>
                    </a>
                </li>
                <li class="sidebar-nav-item">
                    <a href="<?= APP_URL ?>/index.php?c=help&a=index" class="sidebar-nav-link">
                        <i class="fas fa-question-circle sidebar-nav-icon"></i>
                        <span>Help Center</span>
                    </a>
                </li>
            </ul>
        </div>
    </div>

    <!-- Main Content Area -->
    <?= $content ?>

    <!-- Scripts -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.4/js/jquery.dataTables.min.js"></script>
    <script src="<?= ASSETS_URL ?>/js/main.js"></script>
</body>
</html>
