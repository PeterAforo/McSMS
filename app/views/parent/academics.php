<div class="mb-5">
    <h1>Academic Performance</h1>
    <p class="text-muted"><?= htmlspecialchars($child['full_name']) ?> - <?= $child['class_name'] ? htmlspecialchars($child['class_name']) . ' (' . htmlspecialchars($child['section_name']) . ')' : 'Not Enrolled' ?></p>
</div>

<?php if (!$child['student_id']): ?>
    <div class="sms-card">
        <div class="card-body" style="text-align: center; padding: var(--spacing-8);">
            <i class="fas fa-graduation-cap" style="font-size: 48px; color: var(--color-text-muted); margin-bottom: var(--spacing-4);"></i>
            <h3>Not Yet Enrolled</h3>
            <p class="text-muted">This child has not been enrolled as a student yet. Academic records will appear here once enrollment is complete.</p>
            <a href="<?= APP_URL ?>/index.php?c=parent&a=children" class="btn btn-primary-sms">
                <i class="fas fa-arrow-left"></i> Back to Children
            </a>
        </div>
    </div>
<?php else: ?>

    <!-- Attendance Summary -->
    <div class="sms-card mb-5">
        <div class="card-header">
            <h2 class="card-title">Attendance Summary</h2>
        </div>
        <div class="card-body">
            <?php if ($attendance && $attendance['total_days'] > 0): ?>
                <div class="widget-container">
                    <div class="sms-stat-card">
                        <div class="stat-icon info">
                            <i class="fas fa-calendar"></i>
                        </div>
                        <div class="stat-content">
                            <h3><?= $attendance['total_days'] ?></h3>
                            <p>Total Days</p>
                        </div>
                    </div>
                    
                    <div class="sms-stat-card">
                        <div class="stat-icon success">
                            <i class="fas fa-check"></i>
                        </div>
                        <div class="stat-content">
                            <h3><?= $attendance['present'] ?></h3>
                            <p>Present</p>
                        </div>
                    </div>
                    
                    <div class="sms-stat-card">
                        <div class="stat-icon" style="background-color: var(--color-error);">
                            <i class="fas fa-times"></i>
                        </div>
                        <div class="stat-content">
                            <h3><?= $attendance['absent'] ?></h3>
                            <p>Absent</p>
                        </div>
                    </div>
                    
                    <div class="sms-stat-card">
                        <div class="stat-icon warning">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-content">
                            <h3><?= $attendance['late'] ?></h3>
                            <p>Late</p>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: var(--spacing-4);">
                    <p><strong>Attendance Rate:</strong> 
                        <?php 
                        $rate = ($attendance['present'] / $attendance['total_days']) * 100;
                        $color = $rate >= 90 ? 'var(--color-success)' : ($rate >= 75 ? 'var(--color-warning)' : 'var(--color-error)');
                        ?>
                        <span style="color: <?= $color ?>; font-size: var(--font-size-lg); font-weight: var(--font-weight-bold);">
                            <?= number_format($rate, 1) ?>%
                        </span>
                    </p>
                </div>
            <?php else: ?>
                <p class="text-muted">No attendance records yet.</p>
            <?php endif; ?>
        </div>
    </div>

    <!-- Academic Results -->
    <div class="sms-card">
        <div class="card-header">
            <h2 class="card-title">Academic Results</h2>
        </div>
        <div class="card-body">
            <?php if (empty($results)): ?>
                <p class="text-muted">No academic results yet. Results will appear here once grades are entered by teachers.</p>
            <?php else: ?>
                <?php
                // Group results by term
                $resultsByTerm = [];
                foreach ($results as $result) {
                    $resultsByTerm[$result['term_name']][] = $result;
                }
                ?>
                
                <?php foreach ($resultsByTerm as $termName => $termResults): ?>
                    <h3 style="margin-top: var(--spacing-5); margin-bottom: var(--spacing-3); color: var(--color-primary);">
                        <?= htmlspecialchars($termName) ?>
                    </h3>
                    
                    <table class="sms-table">
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th>CA Score (40)</th>
                                <th>Exam Score (60)</th>
                                <th>Total (100)</th>
                                <th>Grade</th>
                                <th>Remark</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php 
                            $totalScore = 0;
                            $subjectCount = 0;
                            foreach ($termResults as $result): 
                                $totalScore += $result['total'];
                                $subjectCount++;
                                
                                // Determine remark color
                                $remarkColor = 'var(--color-success)';
                                $remark = 'Excellent';
                                if ($result['total'] < 50) {
                                    $remarkColor = 'var(--color-error)';
                                    $remark = 'Needs Improvement';
                                } elseif ($result['total'] < 70) {
                                    $remarkColor = 'var(--color-warning)';
                                    $remark = 'Good';
                                } elseif ($result['total'] < 80) {
                                    $remark = 'Very Good';
                                }
                            ?>
                                <tr>
                                    <td><?= htmlspecialchars($result['subject_name']) ?></td>
                                    <td><?= number_format($result['ca_score'], 1) ?></td>
                                    <td><?= number_format($result['exam_score'], 1) ?></td>
                                    <td><strong><?= number_format($result['total'], 1) ?></strong></td>
                                    <td>
                                        <span class="badge" style="background: <?= $remarkColor ?>; color: white;">
                                            <?= htmlspecialchars($result['grade']) ?>
                                        </span>
                                    </td>
                                    <td style="color: <?= $remarkColor ?>;"><?= $remark ?></td>
                                </tr>
                            <?php endforeach; ?>
                            <tr style="background: var(--color-surface); font-weight: var(--font-weight-bold);">
                                <td colspan="3">Average</td>
                                <td><?= number_format($totalScore / $subjectCount, 1) ?></td>
                                <td colspan="2"></td>
                            </tr>
                        </tbody>
                    </table>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>

    <div style="margin-top: var(--spacing-5);">
        <a href="<?= APP_URL ?>/index.php?c=parent&a=children" class="btn btn-outline">
            <i class="fas fa-arrow-left"></i> Back to Children
        </a>
    </div>

<?php endif; ?>
