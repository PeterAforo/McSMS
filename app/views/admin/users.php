<?php include APP_PATH . '/views/partials/topbar.php'; ?>

<!-- Main Content -->
<div class="main-content">
    <!-- Page Header -->
    <div class="page-header">
        <div>
            <h1 class="page-title">User Management</h1>
            <div class="page-breadcrumb">
                <a href="<?= APP_URL ?>/index.php?c=admin&a=dashboard">Dashboard</a>
                <i class="fas fa-chevron-right"></i>
                <span>Users</span>
            </div>
        </div>
        <div class="page-actions">
            <a href="<?= APP_URL ?>/index.php?c=admin&a=createUser" class="btn btn-primary-sms">
                <i class="fas fa-user-plus"></i> Add New User
            </a>
        </div>
    </div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">All Users</h2>
    </div>
    <div class="card-body">
        <?php if (empty($users)): ?>
            <p class="text-muted">No users found.</p>
        <?php else: ?>
            <table class="sms-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>User Type</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($users as $user): ?>
                        <tr>
                            <td><?= htmlspecialchars($user['id']) ?></td>
                            <td><?= htmlspecialchars($user['name']) ?></td>
                            <td><?= htmlspecialchars($user['email']) ?></td>
                            <td><?= htmlspecialchars($user['phone'] ?? 'N/A') ?></td>
                            <td>
                                <span class="badge badge-primary">
                                    <?= htmlspecialchars(ucfirst($user['user_type'])) ?>
                                </span>
                            </td>
                            <td>
                                <?php if ($user['status'] === 'active'): ?>
                                    <span class="badge badge-success">Active</span>
                                <?php else: ?>
                                    <span class="badge badge-danger">Inactive</span>
                                <?php endif; ?>
                            </td>
                            <td><?= date('M d, Y', strtotime($user['created_at'])) ?></td>
                            <td>
                                <a href="<?= APP_URL ?>/index.php?c=admin&a=editUser&id=<?= $user['id'] ?>" class="btn btn-outline" style="padding: var(--spacing-2) var(--spacing-3); font-size: var(--font-size-sm);">
                                    <i class="fas fa-edit"></i> Edit
                                </a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</div>

</div><!-- End main-content -->
