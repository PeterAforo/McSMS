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
    <!-- Navbar -->
    <nav class="navbar-sms">
        <div class="navbar-brand">
            <i class="fas fa-graduation-cap"></i> <?= APP_NAME ?>
        </div>
        <div class="navbar-menu">
            <a href="<?= APP_URL ?>/index.php?c=<?= $_SESSION['user_type'] ?? 'auth' ?>&a=dashboard" class="navbar-link">
                <i class="fas fa-home"></i> Dashboard
            </a>
            
            <?php if (isset($_SESSION['user_type'])): ?>
                <?php if ($_SESSION['user_type'] === 'admin'): ?>
                    <a href="<?= APP_URL ?>/index.php?c=admin&a=users" class="navbar-link">
                        <i class="fas fa-users"></i> Users
                    </a>
                    <a href="<?= APP_URL ?>/index.php?c=admissions&a=pending" class="navbar-link">
                        <i class="fas fa-file-alt"></i> Admissions
                    </a>
                    <a href="<?= APP_URL ?>/index.php?c=academic&a=classes" class="navbar-link">
                        <i class="fas fa-school"></i> Academic
                    </a>
                    <a href="<?= APP_URL ?>/index.php?c=fees&a=dashboard" class="navbar-link">
                        <i class="fas fa-dollar-sign"></i> Finance
                    </a>
                <?php elseif ($_SESSION['user_type'] === 'teacher'): ?>
                    <a href="<?= APP_URL ?>/index.php?c=teacher&a=myClasses" class="navbar-link">
                        <i class="fas fa-chalkboard"></i> My Classes
                    </a>
                    <a href="<?= APP_URL ?>/index.php?c=teacher&a=homework" class="navbar-link">
                        <i class="fas fa-book"></i> Homework
                    </a>
                <?php elseif ($_SESSION['user_type'] === 'parent'): ?>
                    <a href="<?= APP_URL ?>/index.php?c=parent&a=children" class="navbar-link">
                        <i class="fas fa-child"></i> Children
                    </a>
                    <a href="<?= APP_URL ?>/index.php?c=parent&a=applications" class="navbar-link">
                        <i class="fas fa-file-alt"></i> Applications
                    </a>
                    <a href="<?= APP_URL ?>/index.php?c=parent&a=fees" class="navbar-link">
                        <i class="fas fa-money-bill"></i> Fees
                    </a>
                <?php elseif ($_SESSION['user_type'] === 'admissions'): ?>
                    <a href="<?= APP_URL ?>/index.php?c=admissions&a=pending" class="navbar-link">
                        <i class="fas fa-clock"></i> Pending
                    </a>
                    <a href="<?= APP_URL ?>/index.php?c=admissions&a=history" class="navbar-link">
                        <i class="fas fa-history"></i> History
                    </a>
                <?php elseif ($_SESSION['user_type'] === 'finance'): ?>
                    <a href="<?= APP_URL ?>/index.php?c=fees&a=invoices" class="navbar-link">
                        <i class="fas fa-file-invoice"></i> Invoices
                    </a>
                    <a href="<?= APP_URL ?>/index.php?c=fees&a=feeTypes" class="navbar-link">
                        <i class="fas fa-tags"></i> Fee Types
                    </a>
                <?php endif; ?>
            <?php endif; ?>
            
            <a href="<?= APP_URL ?>/index.php?c=help&a=index" class="navbar-link" title="Help Center">
                <i class="fas fa-question-circle"></i> Help
            </a>
            <div class="navbar-link">
                <i class="fas fa-user"></i> <?= $_SESSION['user_name'] ?? 'Guest' ?>
            </div>
            <a href="<?= APP_URL ?>/index.php?c=auth&a=logout" class="navbar-link">
                <i class="fas fa-sign-out-alt"></i> Logout
            </a>
        </div>
    </nav>

    <!-- Sidebar -->
    <?php if (isset($showSidebar) && $showSidebar): ?>
    <aside class="sidebar-sms">
        <ul class="sidebar-menu">
            <?php if (isset($sidebarItems) && is_array($sidebarItems)): ?>
                <?php foreach ($sidebarItems as $item): ?>
                    <li class="sidebar-item">
                        <a href="<?= $item['url'] ?>" class="sidebar-link <?= $item['active'] ?? '' ?>">
                            <i class="sidebar-icon <?= $item['icon'] ?>"></i>
                            <span><?= $item['label'] ?></span>
                        </a>
                    </li>
                <?php endforeach; ?>
            <?php endif; ?>
        </ul>
    </aside>
    <?php endif; ?>

    <!-- Main Content -->
    <main class="<?= isset($showSidebar) && $showSidebar ? 'main-content' : 'main-content-full' ?>">
        <?php if (Session::hasFlash('success')): ?>
            <?php $flash = Session::getFlash('success'); ?>
            <div class="alert alert-success">
                <i class="fas fa-check-circle"></i> <?= $flash['message'] ?>
            </div>
        <?php endif; ?>

        <?php if (Session::hasFlash('error')): ?>
            <?php $flash = Session::getFlash('error'); ?>
            <div class="alert alert-error">
                <i class="fas fa-exclamation-circle"></i> <?= $flash['message'] ?>
            </div>
        <?php endif; ?>

        <?php if (Session::hasFlash('warning')): ?>
            <?php $flash = Session::getFlash('warning'); ?>
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i> <?= $flash['message'] ?>
            </div>
        <?php endif; ?>

        <?php if (Session::hasFlash('info')): ?>
            <?php $flash = Session::getFlash('info'); ?>
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i> <?= $flash['message'] ?>
            </div>
        <?php endif; ?>

        <?= $content ?>
    </main>

    <script src="<?= ASSETS_URL ?>/js/main.js"></script>
</body>
</html>
