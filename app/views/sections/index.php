<div class="d-flex justify-between align-center mb-5">
    <h1>Sections Management</h1>
    <a href="<?= APP_URL ?>/index.php?c=sections&a=create" class="btn btn-primary-sms">
        <i class="fas fa-plus"></i> Add Section
    </a>
</div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">All Sections</h2>
    </div>
    <div class="card-body">
        <?php if (empty($sections)): ?>
            <div style="text-align: center; padding: var(--spacing-8);">
                <i class="fas fa-layer-group" style="font-size: 48px; color: var(--color-text-muted); margin-bottom: var(--spacing-4);"></i>
                <p class="text-muted">No sections created yet.</p>
                <a href="<?= APP_URL ?>/index.php?c=sections&a=create" class="btn btn-primary-sms">
                    <i class="fas fa-plus"></i> Create First Section
                </a>
            </div>
        <?php else: ?>
            <table class="sms-table" id="sectionsTable">
                <thead>
                    <tr>
                        <th>Section Name</th>
                        <th>Class</th>
                        <th>Level</th>
                        <th>Capacity</th>
                        <th>Students</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php 
                    $currentClass = null;
                    foreach ($sections as $section): 
                        $studentCount = (new Section())->getStudentCount($section['id']);
                    ?>
                        <?php if ($currentClass !== $section['class_name']): ?>
                            <?php $currentClass = $section['class_name']; ?>
                            <tr style="background: var(--color-surface); font-weight: var(--font-weight-medium);">
                                <td colspan="6">
                                    <i class="fas fa-school"></i> <?= htmlspecialchars($section['class_name']) ?> (<?= htmlspecialchars($section['level']) ?>)
                                </td>
                            </tr>
                        <?php endif; ?>
                        <tr>
                            <td style="padding-left: var(--spacing-6);">
                                <strong><?= htmlspecialchars($section['section_name']) ?></strong>
                            </td>
                            <td><?= htmlspecialchars($section['class_name']) ?></td>
                            <td>
                                <span class="badge badge-info"><?= htmlspecialchars($section['level']) ?></span>
                            </td>
                            <td>
                                <?php if ($section['capacity']): ?>
                                    <?= $section['capacity'] ?> students
                                <?php else: ?>
                                    <span class="text-muted">No limit</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <span class="badge badge-primary"><?= $studentCount ?> students</span>
                                <?php if ($section['capacity'] && $studentCount >= $section['capacity']): ?>
                                    <span class="badge badge-danger">Full</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <a href="<?= APP_URL ?>/index.php?c=sections&a=edit&id=<?= $section['id'] ?>" class="btn btn-primary-sms" style="padding: var(--spacing-2) var(--spacing-3); font-size: var(--font-size-sm);">
                                    <i class="fas fa-edit"></i> Edit
                                </a>
                                <?php if ($studentCount == 0): ?>
                                    <a href="<?= APP_URL ?>/index.php?c=sections&a=delete&id=<?= $section['id'] ?>" class="btn btn-danger" style="padding: var(--spacing-2) var(--spacing-3); font-size: var(--font-size-sm);" onclick="return confirm('Are you sure you want to delete this section?')">
                                        <i class="fas fa-trash"></i> Delete
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

<script>
$(document).ready(function() {
    <?php if (!empty($sections)): ?>
    $('#sectionsTable').DataTable({
        order: [[1, 'asc'], [0, 'asc']],
        pageLength: 25
    });
    <?php endif; ?>
});
</script>
