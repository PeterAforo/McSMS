<!-- Topbar -->
<div class="topbar">
    <div class="topbar-search">
        <i class="fas fa-search topbar-search-icon"></i>
        <input type="text" class="topbar-search-input" placeholder="Search Students, Staff, Events....">
    </div>
    <div class="topbar-actions">
        <button class="topbar-icon-btn">
            <i class="fas fa-bell"></i>
            <span class="topbar-badge">3</span>
        </button>
        <button class="topbar-icon-btn">
            <i class="fas fa-envelope"></i>
            <span class="topbar-badge">5</span>
        </button>
        <div class="topbar-profile">
            <?php 
            $initials = strtoupper(substr($_SESSION['user_name'] ?? 'A', 0, 1)) . strtoupper(substr($_SESSION['user_name'] ?? 'U', 1, 1));
            $avatarSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect fill='%233F51B5' width='40' height='40'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='18' font-family='Arial'%3E{$initials}%3C/text%3E%3C/svg%3E";
            ?>
            <img src="<?= ASSETS_URL ?>/images/default-avatar.png" alt="Profile" class="topbar-avatar" onerror="this.src='<?= $avatarSvg ?>'">
            <div>
                <div class="topbar-profile-name"><?= $_SESSION['user_name'] ?? 'User' ?></div>
                <div class="topbar-profile-email"><?= $_SESSION['user_email'] ?? 'user@school.com' ?></div>
            </div>
            <i class="fas fa-chevron-down"></i>
        </div>
    </div>
</div>
