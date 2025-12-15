<div class="mb-5">
    <h1>Admission Applications</h1>
    <p class="text-muted">Track the status of your children's admission applications</p>
</div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">Application History</h2>
    </div>
    <div class="card-body">
        <?php if (empty($applications)): ?>
            <div style="text-align: center; padding: var(--spacing-8);">
                <i class="fas fa-file-alt" style="font-size: 48px; color: var(--color-text-muted); margin-bottom: var(--spacing-4);"></i>
                <p class="text-muted">No applications submitted yet.</p>
                <a href="<?= APP_URL ?>/index.php?c=parent&a=children" class="btn btn-primary-sms">
                    <i class="fas fa-child"></i> View Children
                </a>
            </div>
        <?php else: ?>
            <table class="sms-table">
                <thead>
                    <tr>
                        <th>Application ID</th>
                        <th>Child Name</th>
                        <th>Gender</th>
                        <th>Age</th>
                        <th>Preferred Class</th>
                        <th>Status</th>
                        <th>Submitted</th>
                        <th>Remarks</th>
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
                            <td><?= htmlspecialchars($app['class_name']) ?></td>
                            <td>
                                <?php if ($app['status'] === 'pending'): ?>
                                    <span class="badge badge-warning">
                                        <i class="fas fa-clock"></i> Pending Review
                                    </span>
                                <?php elseif ($app['status'] === 'approved'): ?>
                                    <span class="badge badge-success">
                                        <i class="fas fa-check"></i> Approved
                                    </span>
                                <?php else: ?>
                                    <span class="badge badge-danger">
                                        <i class="fas fa-times"></i> Rejected
                                    </span>
                                <?php endif; ?>
                            </td>
                            <td><?= date('M d, Y', strtotime($app['created_at'])) ?></td>
                            <td>
                                <?php if ($app['remarks']): ?>
                                    <span class="text-muted"><?= htmlspecialchars($app['remarks']) ?></span>
                                <?php else: ?>
                                    <span class="text-muted">-</span>
                                <?php endif; ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</div>
