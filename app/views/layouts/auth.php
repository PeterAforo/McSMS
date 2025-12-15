<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= APP_NAME ?> - Authentication</title>
    <link rel="stylesheet" href="<?= ASSETS_URL ?>/css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .auth-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
        }
        .auth-card {
            background: var(--color-surface);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-xl);
            padding: var(--spacing-8);
            width: 100%;
            max-width: 450px;
        }
        .auth-header {
            text-align: center;
            margin-bottom: var(--spacing-6);
        }
        .auth-logo {
            font-size: var(--font-size-xxl);
            color: var(--color-primary);
            margin-bottom: var(--spacing-3);
        }
        .auth-title {
            font-size: var(--font-size-xl);
            color: var(--color-text-primary);
            margin-bottom: var(--spacing-2);
        }
        .auth-subtitle {
            color: var(--color-text-muted);
            font-size: var(--font-size-sm);
        }
    </style>
</head>
<body>
    <div class="auth-container">
        <div class="auth-card">
            <?= $content ?>
        </div>
    </div>
</body>
</html>
