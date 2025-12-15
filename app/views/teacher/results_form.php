<div class="mb-5">
    <h1>Enter Grades</h1>
    <p class="text-muted">Class ID: <?= $classId ?> | Subject ID: <?= $subjectId ?> | Term ID: <?= $termId ?></p>
</div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">Student Grades</h2>
    </div>
    <div class="card-body">
        <form action="<?= APP_URL ?>/index.php?c=teacher&a=storeGrades" method="POST">
            <input type="hidden" name="subject_id" value="<?= $subjectId ?>">
            <input type="hidden" name="term_id" value="<?= $termId ?>">
            
            <?php if (empty($students)): ?>
                <p class="text-muted">No students in this class.</p>
            <?php else: ?>
                <table class="sms-table">
                    <thead>
                        <tr>
                            <th>Student Name</th>
                            <th>CA Score (40)</th>
                            <th>Exam Score (60)</th>
                            <th>Total (100)</th>
                            <th>Grade</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($students as $student): ?>
                            <?php 
                            $existing = $existingResults[$student['id']] ?? null;
                            $caScore = $existing['ca_score'] ?? '';
                            $examScore = $existing['exam_score'] ?? '';
                            $total = $existing['total'] ?? '';
                            $grade = $existing['grade'] ?? '';
                            ?>
                            <tr>
                                <td><?= htmlspecialchars($student['full_name']) ?></td>
                                <td>
                                    <input type="number" name="grades[<?= $student['id'] ?>][ca_score]" class="form-control" min="0" max="40" step="0.01" value="<?= $caScore ?>" style="width: 100px;">
                                </td>
                                <td>
                                    <input type="number" name="grades[<?= $student['id'] ?>][exam_score]" class="form-control" min="0" max="60" step="0.01" value="<?= $examScore ?>" style="width: 100px;">
                                </td>
                                <td><?= $total ?></td>
                                <td><?= $grade ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
                
                <div class="form-group" style="margin-top: var(--spacing-5);">
                    <button type="submit" class="btn btn-primary-sms">
                        <i class="fas fa-save"></i> Save Grades
                    </button>
                    <a href="<?= APP_URL ?>/index.php?c=teacher&a=myClasses" class="btn btn-outline">
                        <i class="fas fa-arrow-left"></i> Back to Classes
                    </a>
                </div>
            <?php endif; ?>
        </form>
    </div>
</div>
