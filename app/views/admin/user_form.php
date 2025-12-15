<div class="mb-5">
    <h1><?= $user ? 'Edit User' : 'Create New User' ?></h1>
</div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">User Information</h2>
    </div>
    <div class="card-body">
        <form action="<?= APP_URL ?>/index.php?c=admin&a=storeUser" method="POST" data-validate>
            <?php if ($user): ?>
                <input type="hidden" name="user_id" value="<?= $user['id'] ?>">
            <?php endif; ?>
            
            <div class="form-group">
                <label for="name" class="form-label">Full Name *</label>
                <input type="text" id="name" name="name" class="form-control" required value="<?= htmlspecialchars($user['name'] ?? '') ?>">
            </div>

            <div class="form-group">
                <label for="email" class="form-label">Email *</label>
                <input type="email" id="email" name="email" class="form-control" required value="<?= htmlspecialchars($user['email'] ?? '') ?>">
            </div>

            <div class="form-group">
                <label for="phone" class="form-label">Phone</label>
                <input type="tel" id="phone" name="phone" class="form-control" value="<?= htmlspecialchars($user['phone'] ?? '') ?>">
            </div>

            <div class="form-group">
                <label for="user_type" class="form-label">User Type *</label>
                <select id="user_type" name="user_type" class="form-control form-select" required>
                    <option value="">Select Type</option>
                    <option value="admin" <?= ($user['user_type'] ?? '') === 'admin' ? 'selected' : '' ?>>Admin</option>
                    <option value="teacher" <?= ($user['user_type'] ?? '') === 'teacher' ? 'selected' : '' ?>>Teacher</option>
                    <option value="finance" <?= ($user['user_type'] ?? '') === 'finance' ? 'selected' : '' ?>>Finance</option>
                    <option value="admissions" <?= ($user['user_type'] ?? '') === 'admissions' ? 'selected' : '' ?>>Admissions</option>
                    <option value="parent" <?= ($user['user_type'] ?? '') === 'parent' ? 'selected' : '' ?>>Parent</option>
                </select>
            </div>

            <div class="form-group">
                <label for="password" class="form-label">Password <?= $user ? '(Leave blank to keep current)' : '*' ?></label>
                <input type="password" id="password" name="password" class="form-control" <?= $user ? '' : 'required' ?> minlength="6">
                <small class="text-muted">Minimum 6 characters</small>
            </div>

            <div class="form-group">
                <label for="status" class="form-label">Status *</label>
                <select id="status" name="status" class="form-control form-select" required>
                    <option value="active" <?= ($user['status'] ?? 'active') === 'active' ? 'selected' : '' ?>>Active</option>
                    <option value="inactive" <?= ($user['status'] ?? '') === 'inactive' ? 'selected' : '' ?>>Inactive</option>
                </select>
            </div>

            <div class="form-group">
                <button type="submit" class="btn btn-primary-sms">
                    <i class="fas fa-save"></i> <?= $user ? 'Update User' : 'Create User' ?>
                </button>
                <a href="<?= APP_URL ?>/index.php?c=admin&a=users" class="btn btn-outline">
                    <i class="fas fa-times"></i> Cancel
                </a>
            </div>
        </form>
    </div>
</div>
