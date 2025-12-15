<div class="auth-header">
    <div class="auth-logo">
        <i class="fas fa-user-plus"></i>
    </div>
    <h1 class="auth-title">Parent Registration</h1>
    <p class="auth-subtitle">Create your account to get started</p>
</div>

<form action="<?= APP_URL ?>/index.php?c=auth&a=doRegister" method="POST" data-validate>
    <div class="form-group">
        <label for="name" class="form-label">Full Name *</label>
        <input 
            type="text" 
            id="name" 
            name="name" 
            class="form-control" 
            placeholder="Enter your full name"
            required
            value="<?= Session::old('name') ?>"
        >
    </div>

    <div class="form-group">
        <label for="email" class="form-label">Email Address *</label>
        <input 
            type="email" 
            id="email" 
            name="email" 
            class="form-control" 
            placeholder="Enter your email"
            required
            value="<?= Session::old('email') ?>"
        >
    </div>

    <div class="form-group">
        <label for="phone" class="form-label">Phone Number</label>
        <input 
            type="tel" 
            id="phone" 
            name="phone" 
            class="form-control" 
            placeholder="Enter your phone number"
            value="<?= Session::old('phone') ?>"
        >
    </div>

    <div class="form-group">
        <label for="address" class="form-label">Address</label>
        <textarea 
            id="address" 
            name="address" 
            class="form-control" 
            rows="2"
            placeholder="Enter your address"
        ><?= Session::old('address') ?></textarea>
    </div>

    <div class="form-group">
        <label for="occupation" class="form-label">Occupation</label>
        <input 
            type="text" 
            id="occupation" 
            name="occupation" 
            class="form-control" 
            placeholder="Enter your occupation"
            value="<?= Session::old('occupation') ?>"
        >
    </div>

    <div class="form-group">
        <label for="password" class="form-label">Password *</label>
        <input 
            type="password" 
            id="password" 
            name="password" 
            class="form-control" 
            placeholder="Create a password (min. 6 characters)"
            required
            minlength="6"
        >
    </div>

    <div class="form-group">
        <label for="confirm_password" class="form-label">Confirm Password *</label>
        <input 
            type="password" 
            id="confirm_password" 
            name="confirm_password" 
            class="form-control" 
            placeholder="Confirm your password"
            required
        >
    </div>

    <div class="form-group">
        <button type="submit" class="btn btn-primary-sms" style="width: 100%;">
            <i class="fas fa-user-plus"></i> Create Account
        </button>
    </div>
</form>

<div style="text-align: center; margin-top: var(--spacing-4);">
    <p class="text-muted">Already have an account?</p>
    <a href="<?= APP_URL ?>/index.php?c=auth&a=login" class="btn btn-outline">
        <i class="fas fa-sign-in-alt"></i> Sign In
    </a>
</div>

<?php Session::clearOldInput(); ?>
