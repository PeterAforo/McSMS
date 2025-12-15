<div class="help-module-detail">
    <!-- Breadcrumb -->
    <div class="help-breadcrumb">
        <a href="<?= APP_URL ?>/index.php?c=help&a=index"><i class="fas fa-home"></i> Help Center</a>
        <i class="fas fa-chevron-right"></i>
        <span><?= $module['name'] ?></span>
    </div>
    
    <!-- Module Header -->
    <div class="module-header" style="background: <?= getModuleColor($module['category']) ?>">
        <div class="module-header-icon">
            <i class="<?= $module['icon'] ?>"></i>
        </div>
        <div class="module-header-info">
            <span class="module-category-badge"><?= $module['category'] ?></span>
            <h1><?= $module['name'] ?></h1>
            <p><?= $module['description'] ?></p>
            <div class="module-roles">
                <span class="roles-label">Available to:</span>
                <?php foreach ($module['roles'] as $role): ?>
                <span class="role-tag"><?= ucfirst($role) ?></span>
                <?php endforeach; ?>
            </div>
        </div>
    </div>
    
    <div class="module-content">
        <!-- Features Section -->
        <div class="content-section">
            <h2><i class="fas fa-star"></i> Key Features</h2>
            <div class="features-list">
                <?php foreach ($module['features'] as $feature): ?>
                <div class="feature-item">
                    <i class="fas fa-check-circle"></i>
                    <span><?= $feature ?></span>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
        
        <!-- How to Use Section -->
        <div class="content-section">
            <h2><i class="fas fa-book-open"></i> How to Use This Module</h2>
            <div class="steps-timeline">
                <?php foreach ($module['howToUse'] as $index => $step): ?>
                <div class="step-item">
                    <div class="step-number"><?= $index + 1 ?></div>
                    <div class="step-content">
                        <h4><?= $step['step'] ?></h4>
                        <p><?= $step['detail'] ?></p>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
        
        <!-- Tips Section -->
        <div class="content-section">
            <h2><i class="fas fa-lightbulb"></i> Tips & Best Practices</h2>
            <div class="tips-grid">
                <?php foreach ($module['tips'] as $tip): ?>
                <div class="tip-card">
                    <i class="fas fa-lightbulb"></i>
                    <p><?= $tip ?></p>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
        
        <!-- Related Modules Section -->
        <?php if (!empty($relatedModules)): ?>
        <div class="content-section">
            <h2><i class="fas fa-link"></i> Related Modules</h2>
            <p class="section-desc">This module interacts with the following modules:</p>
            <div class="related-modules-grid">
                <?php foreach ($relatedModules as $relId => $relModule): ?>
                <a href="<?= APP_URL ?>/index.php?c=help&a=module&id=<?= $relId ?>" class="related-module-card">
                    <div class="related-icon" style="background: <?= getModuleColor($relModule['category']) ?>">
                        <i class="<?= $relModule['icon'] ?>"></i>
                    </div>
                    <div class="related-info">
                        <h4><?= $relModule['name'] ?></h4>
                        <span><?= $relModule['category'] ?></span>
                    </div>
                    <i class="fas fa-arrow-right"></i>
                </a>
                <?php endforeach; ?>
            </div>
        </div>
        <?php endif; ?>
        
        <!-- Module Interaction Diagram -->
        <div class="content-section">
            <h2><i class="fas fa-project-diagram"></i> How This Module Connects</h2>
            <div class="interaction-diagram">
                <div class="diagram-center">
                    <div class="diagram-main-module" style="background: <?= getModuleColor($module['category']) ?>">
                        <i class="<?= $module['icon'] ?>"></i>
                        <span><?= $module['name'] ?></span>
                    </div>
                </div>
                <?php if (!empty($relatedModules)): ?>
                <div class="diagram-connections">
                    <?php foreach ($relatedModules as $relId => $relModule): ?>
                    <div class="diagram-connected-module">
                        <div class="connection-line"></div>
                        <a href="<?= APP_URL ?>/index.php?c=help&a=module&id=<?= $relId ?>" class="connected-module-box" style="border-color: <?= getModuleColor($relModule['category']) ?>">
                            <i class="<?= $relModule['icon'] ?>" style="color: <?= getModuleColor($relModule['category']) ?>"></i>
                            <span><?= $relModule['name'] ?></span>
                        </a>
                    </div>
                    <?php endforeach; ?>
                </div>
                <?php endif; ?>
            </div>
        </div>
        
        <!-- Navigation -->
        <div class="module-navigation">
            <a href="<?= APP_URL ?>/index.php?c=help&a=index" class="nav-btn">
                <i class="fas fa-arrow-left"></i> Back to Help Center
            </a>
            <a href="<?= APP_URL ?>/index.php?c=help&a=interactions" class="nav-btn nav-btn-primary">
                View All Interactions <i class="fas fa-project-diagram"></i>
            </a>
        </div>
    </div>
</div>

<?php
function getModuleColor($category) {
    $colors = [
        'Main' => '#6366f1',
        'Administration' => '#8b5cf6',
        'Academics' => '#06b6d4',
        'Finance' => '#10b981',
        'Teacher Tools' => '#f59e0b',
        'Parent Portal' => '#ec4899',
        'System' => '#64748b'
    ];
    return $colors[$category] ?? '#6366f1';
}
?>

<style>
.help-module-detail {
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
}

.help-breadcrumb {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    font-size: 0.9rem;
}

.help-breadcrumb a {
    color: #6366f1;
    text-decoration: none;
}

.help-breadcrumb a:hover {
    text-decoration: underline;
}

.help-breadcrumb i.fa-chevron-right {
    color: #94a3b8;
    font-size: 0.7rem;
}

.help-breadcrumb span {
    color: #64748b;
}

.module-header {
    display: flex;
    align-items: center;
    gap: 25px;
    padding: 30px;
    border-radius: 16px;
    color: white;
    margin-bottom: 30px;
}

.module-header-icon {
    width: 80px;
    height: 80px;
    background: rgba(255,255,255,0.2);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    flex-shrink: 0;
}

.module-header-info {
    flex: 1;
}

.module-category-badge {
    display: inline-block;
    background: rgba(255,255,255,0.2);
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    margin-bottom: 10px;
}

.module-header h1 {
    font-size: 1.75rem;
    margin-bottom: 8px;
}

.module-header p {
    opacity: 0.9;
    margin-bottom: 15px;
}

.module-roles {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.roles-label {
    opacity: 0.8;
    font-size: 0.9rem;
}

.role-tag {
    background: rgba(255,255,255,0.2);
    padding: 4px 10px;
    border-radius: 15px;
    font-size: 0.8rem;
}

.module-content {
    background: white;
    border-radius: 16px;
    padding: 30px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.content-section {
    margin-bottom: 40px;
}

.content-section:last-child {
    margin-bottom: 0;
}

.content-section h2 {
    font-size: 1.25rem;
    color: #1e293b;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding-bottom: 10px;
    border-bottom: 2px solid #f1f5f9;
}

.content-section h2 i {
    color: #6366f1;
}

.section-desc {
    color: #64748b;
    margin-bottom: 15px;
}

/* Features List */
.features-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 12px;
}

.feature-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 15px;
    background: #f8fafc;
    border-radius: 8px;
}

.feature-item i {
    color: #10b981;
    margin-top: 3px;
}

/* Steps Timeline */
.steps-timeline {
    position: relative;
    padding-left: 30px;
}

.steps-timeline::before {
    content: '';
    position: absolute;
    left: 15px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #e2e8f0;
}

.step-item {
    position: relative;
    display: flex;
    gap: 20px;
    margin-bottom: 25px;
}

.step-item:last-child {
    margin-bottom: 0;
}

.step-number {
    position: absolute;
    left: -30px;
    width: 30px;
    height: 30px;
    background: #6366f1;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.9rem;
    z-index: 1;
}

.step-content {
    flex: 1;
    padding: 15px 20px;
    background: #f8fafc;
    border-radius: 10px;
    border-left: 3px solid #6366f1;
}

.step-content h4 {
    color: #1e293b;
    margin-bottom: 5px;
}

.step-content p {
    color: #64748b;
    margin: 0;
    font-size: 0.95rem;
}

/* Tips Grid */
.tips-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
}

.tip-card {
    display: flex;
    gap: 12px;
    padding: 15px;
    background: #fef3c7;
    border-radius: 10px;
    border-left: 3px solid #f59e0b;
}

.tip-card i {
    color: #f59e0b;
    font-size: 1.2rem;
    flex-shrink: 0;
}

.tip-card p {
    margin: 0;
    color: #92400e;
    font-size: 0.95rem;
}

/* Related Modules */
.related-modules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
}

.related-module-card {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px;
    background: #f8fafc;
    border-radius: 10px;
    text-decoration: none;
    color: #1e293b;
    transition: all 0.3s;
}

.related-module-card:hover {
    background: #f1f5f9;
    transform: translateX(5px);
}

.related-icon {
    width: 45px;
    height: 45px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}

.related-info {
    flex: 1;
}

.related-info h4 {
    margin: 0 0 3px 0;
    font-size: 1rem;
}

.related-info span {
    font-size: 0.8rem;
    color: #64748b;
}

.related-module-card .fa-arrow-right {
    color: #94a3b8;
}

/* Interaction Diagram */
.interaction-diagram {
    padding: 30px;
    background: #f8fafc;
    border-radius: 12px;
    text-align: center;
}

.diagram-center {
    margin-bottom: 30px;
}

.diagram-main-module {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 25px 40px;
    border-radius: 15px;
    color: white;
}

.diagram-main-module i {
    font-size: 2rem;
}

.diagram-main-module span {
    font-weight: 600;
}

.diagram-connections {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 20px;
}

.diagram-connected-module {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.connection-line {
    width: 2px;
    height: 30px;
    background: #cbd5e1;
    margin-bottom: 10px;
}

.connected-module-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 15px 25px;
    background: white;
    border: 2px solid;
    border-radius: 10px;
    text-decoration: none;
    color: #1e293b;
    transition: all 0.3s;
}

.connected-module-box:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.connected-module-box i {
    font-size: 1.5rem;
}

.connected-module-box span {
    font-size: 0.9rem;
}

/* Navigation */
.module-navigation {
    display: flex;
    justify-content: space-between;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #e2e8f0;
}

.nav-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.3s;
    color: #64748b;
    background: #f1f5f9;
}

.nav-btn:hover {
    background: #e2e8f0;
    color: #1e293b;
}

.nav-btn-primary {
    background: #6366f1;
    color: white;
}

.nav-btn-primary:hover {
    background: #4f46e5;
    color: white;
}

@media (max-width: 768px) {
    .module-header {
        flex-direction: column;
        text-align: center;
    }
    
    .module-roles {
        justify-content: center;
    }
    
    .module-navigation {
        flex-direction: column;
        gap: 10px;
    }
    
    .nav-btn {
        justify-content: center;
    }
}
</style>
