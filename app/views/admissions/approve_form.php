<div class="mb-5">
    <h1>Approve Application</h1>
    <p class="text-muted">Application #<?= str_pad($application['id'], 5, '0', STR_PAD_LEFT) ?> - <?= htmlspecialchars($child['full_name']) ?></p>
</div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">Assign Class & Section</h2>
    </div>
    <div class="card-body">
        <form action="<?= APP_URL ?>/index.php?c=admissions&a=doApprove" method="POST" data-validate>
            <input type="hidden" name="application_id" value="<?= $application['id'] ?>">
            
            <div class="form-group">
                <label for="class_id" class="form-label">Class *</label>
                <select id="class_id" name="class_id" class="form-control form-select" required>
                    <option value="<?= $class['id'] ?>" selected><?= htmlspecialchars($class['class_name']) ?></option>
                </select>
            </div>

            <div class="form-group">
                <label for="section_id" class="form-label">Section *</label>
                <?php if (empty($class['sections'])): ?>
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <strong>No sections available!</strong> Please create sections for this class first.
                        <br><br>
                        <a href="<?= APP_URL ?>/index.php?c=sections&a=create" class="btn btn-primary-sms" style="margin-top: var(--spacing-2);">
                            <i class="fas fa-plus"></i> Create Section
                        </a>
                        <a href="http://localhost/McSMS/add_default_sections.php" class="btn btn-success" style="margin-top: var(--spacing-2);" target="_blank">
                            <i class="fas fa-magic"></i> Auto-Create Default Sections
                        </a>
                    </div>
                    <select id="section_id" name="section_id" class="form-control form-select" required disabled>
                        <option value="">No sections available</option>
                    </select>
                <?php else: ?>
                    <select id="section_id" name="section_id" class="form-control form-select" required>
                        <?php foreach ($class['sections'] as $section): ?>
                            <option value="<?= $section['id'] ?>"><?= htmlspecialchars($section['section_name']) ?></option>
                        <?php endforeach; ?>
                    </select>
                <?php endif; ?>
            </div>

            <div class="form-group">
                <label for="remarks" class="form-label">Remarks (Optional)</label>
                <textarea id="remarks" name="remarks" class="form-control" rows="3" placeholder="Enter any remarks"></textarea>
            </div>

            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                <strong>Note:</strong> Approving this application will automatically generate a student ID and enroll the student.
            </div>

            <div class="form-group">
                <button type="submit" class="btn btn-success">
                    <i class="fas fa-check"></i> Approve & Enroll
                </button>
                <a href="<?= APP_URL ?>/index.php?c=admissions&a=view&id=<?= $application['id'] ?>" class="btn btn-outline">
                    <i class="fas fa-arrow-left"></i> Back
                </a>
            </div>
        </form>
    </div>
</div>
