<div class="mb-5">
    <h1><?= $section ? 'Edit Section' : 'Create Section' ?></h1>
</div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">Section Details</h2>
    </div>
    <div class="card-body">
        <form action="<?= APP_URL ?>/index.php?c=sections&a=store" method="POST" data-validate>
            <?php if ($section): ?>
                <input type="hidden" name="id" value="<?= $section['id'] ?>">
            <?php endif; ?>
            
            <div class="form-group">
                <label for="class_id" class="form-label">Class *</label>
                <select id="class_id" name="class_id" class="form-control form-select" required>
                    <option value="">Select Class</option>
                    <?php 
                    $currentLevel = null;
                    foreach ($classes as $class): 
                        if ($currentLevel !== $class['level']):
                            if ($currentLevel !== null) echo '</optgroup>';
                            $currentLevel = $class['level'];
                            echo '<optgroup label="' . htmlspecialchars($class['level']) . '">';
                        endif;
                    ?>
                        <option value="<?= $class['id'] ?>" <?= $section && $section['class_id'] == $class['id'] ? 'selected' : '' ?>>
                            <?= htmlspecialchars($class['class_name']) ?>
                        </option>
                    <?php 
                    endforeach;
                    if ($currentLevel !== null) echo '</optgroup>';
                    ?>
                </select>
                <small class="form-text">Select the class this section belongs to</small>
            </div>
            
            <div class="form-group">
                <label for="section_name" class="form-label">Section Name *</label>
                <input type="text" id="section_name" name="section_name" class="form-control" 
                       value="<?= $section ? htmlspecialchars($section['section_name']) : '' ?>" 
                       required placeholder="e.g., A, B, Red, Blue">
                <small class="form-text">Common names: A, B, C or Red, Blue, Green</small>
            </div>
            
            <div class="form-group">
                <label for="capacity" class="form-label">Capacity (Optional)</label>
                <input type="number" id="capacity" name="capacity" class="form-control" 
                       value="<?= $section ? $section['capacity'] : '' ?>" 
                       min="1" placeholder="e.g., 30">
                <small class="form-text">Maximum number of students (leave empty for no limit)</small>
            </div>
            
            <div style="display: flex; gap: var(--spacing-3);">
                <button type="submit" class="btn btn-primary-sms">
                    <i class="fas fa-save"></i> <?= $section ? 'Update Section' : 'Create Section' ?>
                </button>
                <a href="<?= APP_URL ?>/index.php?c=sections" class="btn btn-outline">
                    <i class="fas fa-times"></i> Cancel
                </a>
            </div>
        </form>
    </div>
</div>
