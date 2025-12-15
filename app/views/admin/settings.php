<div class="d-flex justify-between align-center mb-5">
    <h1>System Settings</h1>
</div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">School Information</h2>
    </div>
    <div class="card-body">
        <form method="POST" action="<?= APP_URL ?>/index.php?c=admin&a=updateSettings">
            <div class="form-group">
                <label for="school_name" class="form-label">School Name</label>
                <input 
                    type="text" 
                    id="school_name" 
                    name="school_name" 
                    class="form-control" 
                    value="<?= htmlspecialchars($settings['school_name'] ?? 'School Management System') ?>"
                >
            </div>
            
            <div class="form-group">
                <label for="school_email" class="form-label">School Email</label>
                <input 
                    type="email" 
                    id="school_email" 
                    name="school_email" 
                    class="form-control" 
                    value="<?= htmlspecialchars($settings['school_email'] ?? '') ?>"
                >
            </div>
            
            <div class="form-group">
                <label for="school_phone" class="form-label">School Phone</label>
                <input 
                    type="tel" 
                    id="school_phone" 
                    name="school_phone" 
                    class="form-control" 
                    value="<?= htmlspecialchars($settings['school_phone'] ?? '') ?>"
                >
            </div>
            
            <div class="form-group">
                <label for="school_address" class="form-label">School Address</label>
                <textarea 
                    id="school_address" 
                    name="school_address" 
                    class="form-control" 
                    rows="3"
                ><?= htmlspecialchars($settings['school_address'] ?? '') ?></textarea>
            </div>
            
            <div class="form-group">
                <label for="currency_symbol" class="form-label">Currency Symbol</label>
                <input 
                    type="text" 
                    id="currency_symbol" 
                    name="currency_symbol" 
                    class="form-control" 
                    value="<?= htmlspecialchars($settings['currency_symbol'] ?? '$') ?>"
                    style="max-width: 100px;"
                >
            </div>
            
            <div class="form-group">
                <button type="submit" class="btn btn-primary-sms">
                    <i class="fas fa-save"></i> Save Settings
                </button>
            </div>
        </form>
    </div>
</div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">System Information</h2>
    </div>
    <div class="card-body">
        <table style="width: 100%;">
            <tr>
                <td style="padding: var(--spacing-2); font-weight: var(--font-weight-medium);">PHP Version:</td>
                <td style="padding: var(--spacing-2);"><?= phpversion() ?></td>
            </tr>
            <tr>
                <td style="padding: var(--spacing-2); font-weight: var(--font-weight-medium);">Application Version:</td>
                <td style="padding: var(--spacing-2);"><?= APP_VERSION ?></td>
            </tr>
            <tr>
                <td style="padding: var(--spacing-2); font-weight: var(--font-weight-medium);">Database:</td>
                <td style="padding: var(--spacing-2);">MySQL (<?= DB_NAME ?>)</td>
            </tr>
        </table>
    </div>
</div>
