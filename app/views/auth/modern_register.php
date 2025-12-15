<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - <?= APP_NAME ?></title>
    <!-- Google Fonts - Raleway -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;600;700&display=swap" rel="stylesheet">
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Auth CSS -->
    <link rel="stylesheet" href="<?= ASSETS_URL ?>/css/auth.css">
</head>
<body>
    <div class="auth-container">
        <div class="auth-wrapper">
            <!-- Header -->
            <div class="auth-header">
                <h1>Create Account</h1>
                <p>Join our school management system</p>
            </div>

            <!-- Auth Card -->
            <div class="auth-card">
                <!-- Left Side - Form -->
                <div class="auth-form-side">
                    <!-- Tabs -->
                    <div class="auth-tabs">
                        <button class="auth-tab" onclick="window.location.href='<?= APP_URL ?>/index.php?c=auth&a=login'">Login</button>
                        <button class="auth-tab active" onclick="window.location.href='<?= APP_URL ?>/index.php?c=auth&a=register'">Register</button>
                    </div>

                    <!-- Form Content -->
                    <div class="auth-form-content">
                        <h2>Get Started!</h2>
                        <p>Create your account to continue</p>

                        <!-- Flash Messages -->
                        <?php if (isset($_SESSION['flash'])): ?>
                            <div class="auth-alert auth-alert-<?= $_SESSION['flash']['type'] ?>">
                                <i class="fas fa-<?= $_SESSION['flash']['type'] === 'success' ? 'check-circle' : 'exclamation-circle' ?>"></i>
                                <?= $_SESSION['flash']['message'] ?>
                            </div>
                            <?php unset($_SESSION['flash']); ?>
                        <?php endif; ?>

                        <!-- Register Form -->
                        <form action="<?= APP_URL ?>/index.php?c=auth&a=doRegister" method="POST">
                            <div class="auth-form-group">
                                <input type="text" name="name" class="auth-input" placeholder="Full Name" required autofocus>
                            </div>

                            <div class="auth-form-group">
                                <input type="email" name="email" class="auth-input" placeholder="Email address" required>
                            </div>

                            <div class="auth-form-group">
                                <input type="tel" name="phone" class="auth-input" placeholder="Phone number" required>
                            </div>

                            <div class="auth-form-group">
                                <input type="password" name="password" class="auth-input" placeholder="Password" required>
                            </div>

                            <div class="auth-form-group">
                                <input type="password" name="password_confirm" class="auth-input" placeholder="Confirm Password" required>
                            </div>

                            <div class="auth-checkbox-group">
                                <input type="checkbox" name="terms" id="terms" class="auth-checkbox" required>
                                <label for="terms" class="auth-checkbox-label">I agree to the terms and conditions</label>
                            </div>

                            <button type="submit" class="auth-submit-btn">
                                Create Account
                            </button>
                        </form>

                        <!-- Social Login -->
                        <div class="auth-social">
                            <p class="auth-social-text">Or sign up with</p>
                            <div class="auth-social-buttons">
                                <button class="auth-social-btn" title="Facebook">
                                    <i class="fab fa-facebook-f"></i>
                                </button>
                                <button class="auth-social-btn" title="Google">
                                    <i class="fab fa-google"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Toggle to Login -->
                        <div class="auth-toggle-text">
                            Already have an account? <a href="<?= APP_URL ?>/index.php?c=auth&a=login" class="auth-link">Sign in</a>
                        </div>
                    </div>
                </div>

                <!-- Right Side - Image -->
                <div class="auth-image-side">
                    <div class="auth-image-overlay">
                        <div class="auth-image-content">
                            <h3><?= APP_NAME ?></h3>
                            <p>Empowering education through technology</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
