<div class="mb-5">
    <h1>Take Attendance</h1>
    <p class="text-muted"><?= htmlspecialchars($class['class_name']) ?> - <?= date('F d, Y', strtotime($date)) ?></p>
</div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">Mark Attendance</h2>
    </div>
    <div class="card-body">
        <form action="<?= APP_URL ?>/index.php?c=teacher&a=storeAttendance" method="POST">
            <input type="hidden" name="date" value="<?= $date ?>">
            <input type="hidden" name="class_id" value="<?= $class['id'] ?>">
            
            <?php if (empty($students)): ?>
                <p class="text-muted">No students in this class.</p>
            <?php else: ?>
                <table class="sms-table">
                    <thead>
                        <tr>
                            <th>Student Name</th>
                            <th>Gender</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($students as $student): ?>
                            <?php $currentStatus = $existingAttendance[$student['id']] ?? 'present'; ?>
                            <tr>
                                <td><?= htmlspecialchars($student['full_name']) ?></td>
                                <td><?= ucfirst($student['gender']) ?></td>
                                <td>
                                    <select name="attendance[<?= $student['id'] ?>]" class="form-control form-select" style="width: auto;">
                                        <option value="present" <?= $currentStatus === 'present' ? 'selected' : '' ?>>Present</option>
                                        <option value="absent" <?= $currentStatus === 'absent' ? 'selected' : '' ?>>Absent</option>
                                        <option value="late" <?= $currentStatus === 'late' ? 'selected' : '' ?>>Late</option>
                                    </select>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
                
                <div class="form-group" style="margin-top: var(--spacing-5);">
                    <button type="submit" class="btn btn-primary-sms">
                        <i class="fas fa-save"></i> Save Attendance
                    </button>
                    <a href="<?= APP_URL ?>/index.php?c=teacher&a=myClasses" class="btn btn-outline">
                        <i class="fas fa-arrow-left"></i> Back to Classes
                    </a>
                </div>
            <?php endif; ?>
        </form>
    </div>
</div>
