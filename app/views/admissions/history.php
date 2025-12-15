<div class="mb-5">
    <h1>Application History</h1>
    <p class="text-muted">All processed applications</p>
</div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">Processed Applications</h2>
    </div>
    <div class="card-body">
        <?php if (empty($applications)): ?>
            <p class="text-muted">No processed applications yet.</p>
        <?php else: ?>
            <table class="sms-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Child Name</th>
                        <th>Parent</th>
                        <th>Class</th>
                        <th>Status</th>
                        <th>Processed By</th>
                        <th>Date</th>
                        <th>Remarks</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($applications as $app): ?>
                        <tr>
                            <td>#<?= str_pad($app['id'], 5, '0', STR_PAD_LEFT) ?></td>
                            <td><?= htmlspecialchars($app['child_name']) ?></td>
                            <td><?= htmlspecialchars($app['parent_name']) ?></td>
                            <td><?= htmlspecialchars($app['class_name']) ?></td>
                            <td>
                                <?php if ($app['status'] === 'approved'): ?>
                                    <span class="badge badge-success">Approved</span>
                                <?php else: ?>
                                    <span class="badge badge-danger">Rejected</span>
                                <?php endif; ?>
                            </td>
                            <td><?= htmlspecialchars($app['processed_by_name'] ?? 'N/A') ?></td>
                            <td><?= date('M d, Y', strtotime($app['created_at'])) ?></td>
                            <td><?= htmlspecialchars($app['remarks'] ?? '-') ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</div>
