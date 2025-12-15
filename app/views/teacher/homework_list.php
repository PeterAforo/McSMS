<div class="d-flex justify-between align-center mb-5">
    <h1>Homework Management</h1>
    <a href="<?= APP_URL ?>/index.php?c=teacher&a=createHomework" class="btn btn-primary-sms">
        <i class="fas fa-plus"></i> Create New Homework
    </a>
</div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">All Homework</h2>
    </div>
    <div class="card-body">
        <?php if (empty($homeworkList)): ?>
            <div style="text-align: center; padding: var(--spacing-8);">
                <i class="fas fa-book" style="font-size: 48px; color: var(--color-text-muted); margin-bottom: var(--spacing-4);"></i>
                <p class="text-muted">No homework assigned yet.</p>
                <a href="<?= APP_URL ?>/index.php?c=teacher&a=createHomework" class="btn btn-primary-sms">
                    <i class="fas fa-plus"></i> Create Your First Homework
                </a>
            </div>
        <?php else: ?>
            <table class="sms-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Class</th>
                        <th>Subject</th>
                        <th>Due Date</th>
                        <th>Submissions</th>
                        <th>Created</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($homeworkList as $hw): ?>
                        <tr>
                            <td><?= htmlspecialchars($hw['title']) ?></td>
                            <td><?= htmlspecialchars($hw['class_name']) ?></td>
                            <td><?= htmlspecialchars($hw['subject_name']) ?></td>
                            <td><?= date('M d, Y', strtotime($hw['due_date'])) ?></td>
                            <td><?= $hw['submission_count'] ?></td>
                            <td><?= date('M d, Y', strtotime($hw['created_at'])) ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</div>
