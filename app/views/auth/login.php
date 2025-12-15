<div class="auth-header">
    <div class="auth-logo">
        <i class="fas fa-graduation-cap"></i>
    </div>
    <h1 class="auth-title">Welcome Back</h1>
    <p class="auth-subtitle">Sign in to your account</p>
</div>

<form action="<?= APP_URL ?>/index.php?c=auth&a=doLogin" method="POST" data-validate>
    <div class="form-group">
        <label for="email" class="form-label">Email Address</label>
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
        <label for="password" class="form-label">Password</label>
        <input 
            type="password" 
            id="password" 
            name="password" 
            class="form-control" 
            placeholder="Enter your password"
            required
        >
    </div>

    <div class="form-group">
        <button type="submit" class="btn btn-primary-sms" style="width: 100%;">
            <i class="fas fa-sign-in-alt"></i> Sign In
        </button>
    </div>
</form>

<div style="text-align: center; margin-top: var(--spacing-5);">
    <p class="text-muted">Don't have an account?</p>
    <a href="<?= APP_URL ?>/index.php?c=auth&a=register" class="btn btn-outline">
        <i class="fas fa-user-plus"></i> Register as Parent
    </a>
</div>

<style>
    .form-group:last-of-type {
        margin-bottom: var(--spacing-3);
    }
</style>
