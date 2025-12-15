<div class="d-flex justify-between align-center mb-5">
    <h1>Pending Applications</h1>
</div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">Applications Awaiting Review</h2>
    </div>
    <div class="card-body">
        <?php if (empty($applications)): ?>
            <div style="text-align: center; padding: var(--spacing-8);">
                <i class="fas fa-inbox" style="font-size: 48px; color: var(--color-text-muted); margin-bottom: var(--spacing-4);"></i>
                <p class="text-muted">No pending applications at the moment.</p>
            </div>
        <?php else: ?>
            <table class="sms-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Child Name</th>
                        <th>Gender</th>
                        <th>Age</th>
                        <th>Parent</th>
                        <th>Email</th>
                        <th>Preferred Class</th>
                        <th>Submitted</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($applications as $app): ?>
                        <tr>
                            <td>#<?= str_pad($app['id'], 5, '0', STR_PAD_LEFT) ?></td>
                            <td><?= htmlspecialchars($app['child_name']) ?></td>
                            <td><?= ucfirst($app['gender']) ?></td>
                            <td>
                                <?php
                                $dob = new DateTime($app['date_of_birth']);
                                $now = new DateTime();
                                $age = $now->diff($dob)->y;
                                echo $age . ' years';
                                ?>
                            </td>
                            <td><?= htmlspecialchars($app['parent_name']) ?></td>
                            <td><?= htmlspecialchars($app['parent_email']) ?></td>
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
