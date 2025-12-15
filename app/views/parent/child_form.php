<div class="mb-5">
    <h1><?= $child ? 'Edit Child' : 'Add New Child' ?></h1>
    <p class="text-muted">Fill in the information below to register your child.</p>
</div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">Child Information</h2>
    </div>
    <div class="card-body">
        <form action="<?= APP_URL ?>/index.php?c=parent&a=storeChild" method="POST" enctype="multipart/form-data" data-validate>
            
            <div class="form-group">
                <label for="full_name" class="form-label">Full Name *</label>
                <input 
                    type="text" 
                    id="full_name" 
                    name="full_name" 
                    class="form-control" 
                    placeholder="Enter child's full name"
                    required
                    value="<?= Session::old('full_name', $child['full_name'] ?? '') ?>"
                >
            </div>

            <div class="form-group">
                <label for="gender" class="form-label">Gender *</label>
                <select id="gender" name="gender" class="form-control form-select" required>
                    <option value="">Select gender</option>
                    <option value="male" <?= Session::old('gender', $child['gender'] ?? '') === 'male' ? 'selected' : '' ?>>Male</option>
                    <option value="female" <?= Session::old('gender', $child['gender'] ?? '') === 'female' ? 'selected' : '' ?>>Female</option>
                </select>
            </div>

            <div class="form-group">
                <label for="date_of_birth" class="form-label">Date of Birth *</label>
                <input 
                    type="date" 
                    id="date_of_birth" 
                    name="date_of_birth" 
                    class="form-control" 
                    required
                    value="<?= Session::old('date_of_birth', $child['date_of_birth'] ?? '') ?>"
                    max="<?= date('Y-m-d') ?>"
                >
            </div>

            <div class="form-group">
                <label for="previous_school" class="form-label">Previous School</label>
                <input 
                    type="text" 
                    id="previous_school" 
                    name="previous_school" 
                    class="form-control" 
                    placeholder="Enter previous school name (if any)"
                    value="<?= Session::old('previous_school', $child['previous_school'] ?? '') ?>"
                >
            </div>

            <div class="form-group">
                <label for="photo" class="form-label">Child Photo</label>
                <input 
                    type="file" 
                    id="photo" 
                    name="photo" 
                    class="form-control" 
                    accept="image/*"
                >
                <small class="text-muted">Accepted formats: JPG, PNG, GIF (Max 2MB)</small>
            </div>

            <div class="form-group">
                <button type="submit" class="btn btn-primary-sms">
                    <i class="fas fa-save"></i> <?= $child ? 'Update Child' : 'Add Child' ?>
                </button>
                <a href="<?= APP_URL ?>/index.php?c=parent&a=children" class="btn btn-outline">
                    <i class="fas fa-times"></i> Cancel
                </a>
            </div>
        </form>
    </div>
</div>

<?php Session::clearOldInput(); ?>
