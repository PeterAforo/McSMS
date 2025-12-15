<div class="d-flex justify-between align-center mb-5">
    <h1>My Children</h1>
    <a href="<?= APP_URL ?>/index.php?c=parent&a=addChild" class="btn btn-primary-sms">
        <i class="fas fa-plus"></i> Add Child
    </a>
</div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">Children List</h2>
    </div>
    <div class="card-body">
        <?php if (empty($children)): ?>
            <div style="text-align: center; padding: var(--spacing-8);">
                <i class="fas fa-child" style="font-size: 48px; color: var(--color-text-muted); margin-bottom: var(--spacing-4);"></i>
                <p class="text-muted">No children registered yet.</p>
                <a href="<?= APP_URL ?>/index.php?c=parent&a=addChild" class="btn btn-primary-sms">
                    <i class="fas fa-plus"></i> Add Your First Child
                </a>
            </div>
        <?php else: ?>
            <table class="sms-table">
                <thead>
                    <tr>
                        <th>Full Name</th>
                        <th>Gender</th>
                        <th>Date of Birth</th>
                        <th>Age</th>
                        <th>Previous School</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($children as $child): ?>
                        <tr>
                            <td><?= htmlspecialchars($child['full_name']) ?></td>
                            <td><?= ucfirst($child['gender']) ?></td>
                            <td><?= date('M d, Y', strtotime($child['date_of_birth'])) ?></td>
                            <td>
                                <?php
                                $dob = new DateTime($child['date_of_birth']);
                                $now = new DateTime();
                                $age = $now->diff($dob)->y;
                                echo $age . ' years';
                                ?>
                            </td>
                            <td><?= htmlspecialchars($child['previous_school'] ?? 'N/A') ?></td>
                            <td>
                                <?php if ($child['admission_status']): ?>
                                    <?php if ($child['admission_status'] === 'pending'): ?>
                                        <span class="badge badge-warning">Application Pending</span>
                                    <?php elseif ($child['admission_status'] === 'approved'): ?>
                                        <span class="badge badge-success">Enrolled</span>
                                    <?php else: ?>
                                        <span class="badge badge-danger">Rejected</span>
                                    <?php endif; ?>
                                <?php else: ?>
                                    <span class="badge" style="background: #ccc; color: #666;">Not Applied</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php if ($child['admission_status'] === 'approved'): ?>
                                    <a href="<?= APP_URL ?>/index.php?c=parent&a=enrollForTerm&student_id=<?= $child['student_id'] ?>" class="btn btn-success" style="padding: var(--spacing-2) var(--spacing-3); font-size: var(--font-size-sm); margin-right: var(--spacing-2);">
                                        <i class="fas fa-calendar-check"></i> Enroll for Term
                                    </a>
                                    <a href="<?= APP_URL ?>/index.php?c=parent&a=academics&child_id=<?= $child['id'] ?>" class="btn btn-primary-sms" style="padding: var(--spacing-2) var(--spacing-3); font-size: var(--font-size-sm);">
                                        <i class="fas fa-graduation-cap"></i> Academics
                                    </a>
                                <?php elseif (!$child['admission_status'] || $child['admission_status'] === 'rejected'): ?>
                                    <a href="<?= APP_URL ?>/index.php?c=parent&a=applyForAdmission&child_id=<?= $child['id'] ?>" class="btn btn-primary-sms" style="padding: var(--spacing-2) var(--spacing-3); font-size: var(--font-size-sm);">
                                        <i class="fas fa-file-alt"></i> Apply
                                    </a>
                                <?php endif; ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</div>
