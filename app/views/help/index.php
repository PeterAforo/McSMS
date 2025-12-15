<?php
// Helper function for module colors - defined at the top
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
<div class="help-center">
    <!-- Hero Section -->
    <div class="help-hero">
        <div class="help-hero-content">
            <h1><i class="fas fa-question-circle"></i> Help Center</h1>
            <p>Learn how to use each module in the system and understand how they work together</p>
            
            <!-- Search Box -->
            <form action="<?= APP_URL ?>/index.php" method="GET" class="help-search-form">
                <input type="hidden" name="c" value="help">
                <input type="hidden" name="a" value="search">
                <div class="help-search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" name="q" placeholder="Search for help topics..." class="help-search-input">
                    <button type="submit" class="help-search-btn">Search</button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Quick Links for Current Role -->
    <div class="help-section">
        <h2><i class="fas fa-bolt"></i> Quick Actions for <?= ucfirst($userType) ?></h2>
        <div class="quick-links-grid">
            <?php foreach ($quickLinks as $link): ?>
            <a href="<?= $link['url'] ?>" class="quick-link-card">
                <div class="quick-link-icon">
                    <i class="<?= $link['icon'] ?>"></i>
                </div>
                <span><?= $link['label'] ?></span>
            </a>
            <?php endforeach; ?>
        </div>
    </div>
    
    <!-- Modules Relevant to User -->
    <div class="help-section">
        <h2><i class="fas fa-th-large"></i> Modules Available to You</h2>
        <p class="section-subtitle">These are the modules you can access based on your role</p>
        <div class="modules-grid">
            <?php foreach ($relevantModules as $id => $module): ?>
            <a href="<?= APP_URL ?>/index.php?c=help&a=module&id=<?= $id ?>" class="module-card">
                <div class="module-icon" style="background: <?= getModuleColor($module['category']) ?>">
                    <i class="<?= $module['icon'] ?>"></i>
                </div>
                <div class="module-info">
                    <h3><?= $module['name'] ?></h3>
                    <p><?= substr($module['description'], 0, 80) ?>...</p>
                    <span class="module-category"><?= $module['category'] ?></span>
                </div>
                <div class="module-arrow">
                    <i class="fas fa-chevron-right"></i>
                </div>
            </a>
            <?php endforeach; ?>
        </div>
    </div>
    
    <!-- All Modules by Category -->
    <div class="help-section">
        <h2><i class="fas fa-layer-group"></i> All System Modules</h2>
        <p class="section-subtitle">Complete list of all modules organized by category</p>
        
        <?php
        $categories = [];
        foreach ($modules as $id => $module) {
            $categories[$module['category']][$id] = $module;
        }
        ?>
        
        <?php foreach ($categories as $category => $categoryModules): ?>
        <div class="category-section">
            <h3 class="category-title">
                <span class="category-badge" style="background: <?= getModuleColor($category) ?>"><?= $category ?></span>
            </h3>
            <div class="category-modules">
                <?php foreach ($categoryModules as $id => $module): ?>
                <a href="<?= APP_URL ?>/index.php?c=help&a=module&id=<?= $id ?>" class="category-module-item">
                    <i class="<?= $module['icon'] ?>"></i>
                    <span><?= $module['name'] ?></span>
                    <?php if (in_array($userType, $module['roles'])): ?>
                    <span class="access-badge">You have access</span>
                    <?php endif; ?>
                </a>
                <?php endforeach; ?>
            </div>
        </div>
        <?php endforeach; ?>
    </div>
    
    <!-- Workflow Section -->
    <div class="help-section">
        <h2><i class="fas fa-project-diagram"></i> Common Workflows</h2>
        <p class="section-subtitle">Understand how different modules work together</p>
        <div class="workflow-cards">
            <a href="<?= APP_URL ?>/index.php?c=help&a=workflow&id=admission_enrollment" class="workflow-card">
                <div class="workflow-icon"><i class="fas fa-user-plus"></i></div>
                <h4>Admission to Enrollment</h4>
                <p>Complete process from application to student enrollment</p>
            </a>
            <a href="<?= APP_URL ?>/index.php?c=help&a=workflow&id=term_enrollment" class="workflow-card">
                <div class="workflow-icon"><i class="fas fa-redo"></i></div>
                <h4>Term Re-enrollment</h4>
                <p>How to enroll existing students for new terms</p>
            </a>
            <a href="<?= APP_URL ?>/index.php?c=help&a=workflow&id=grade_entry" class="workflow-card">
                <div class="workflow-icon"><i class="fas fa-edit"></i></div>
                <h4>Grade Entry Process</h4>
                <p>How grades are entered and results published</p>
            </a>
            <a href="<?= APP_URL ?>/index.php?c=help&a=workflow&id=fee_collection" class="workflow-card">
                <div class="workflow-icon"><i class="fas fa-hand-holding-usd"></i></div>
                <h4>Fee Collection</h4>
                <p>From fee structure setup to payment collection</p>
            </a>
        </div>
        <div class="text-center mt-3">
            <a href="<?= APP_URL ?>/index.php?c=help&a=interactions" class="btn btn-outline">
                <i class="fas fa-project-diagram"></i> View All Module Interactions
            </a>
        </div>
    </div>
    
    <!-- Help Resources -->
    <div class="help-section">
        <h2><i class="fas fa-life-ring"></i> Need More Help?</h2>
        <div class="help-resources">
            <a href="<?= APP_URL ?>/index.php?c=help&a=faq" class="help-resource-card">
                <i class="fas fa-question-circle"></i>
                <h4>FAQ</h4>
                <p>Frequently asked questions</p>
            </a>
            <a href="<?= APP_URL ?>/index.php?c=help&a=roleGuide" class="help-resource-card">
                <i class="fas fa-user-tag"></i>
                <h4>Role Guide</h4>
                <p>What each user role can do</p>
            </a>
            <a href="<?= APP_URL ?>/index.php?c=help&a=interactions" class="help-resource-card">
                <i class="fas fa-sitemap"></i>
                <h4>System Map</h4>
                <p>How modules connect</p>
            </a>
        </div>
    </div>
</div>

<style>
/* Help Center Styles */
.help-center {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.help-hero {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border-radius: 16px;
    padding: 40px;
    color: white;
    margin-bottom: 30px;
}

.help-hero h1 {
    font-size: 2rem;
    margin-bottom: 10px;
}

.help-hero p {
    opacity: 0.9;
    margin-bottom: 25px;
}

.help-search-form {
    max-width: 600px;
}

.help-search-box {
    display: flex;
    align-items: center;
    background: white;
    border-radius: 50px;
    padding: 5px 5px 5px 20px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.help-search-box i {
    color: #94a3b8;
    margin-right: 10px;
}

.help-search-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 1rem;
    padding: 10px 0;
    color: #1e293b;
}

.help-search-btn {
    background: #6366f1;
    color: white;
    border: none;
    padding: 12px 25px;
    border-radius: 50px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.3s;
}

.help-search-btn:hover {
    background: #4f46e5;
}

.help-section {
    margin-bottom: 40px;
}

.help-section h2 {
    font-size: 1.5rem;
    color: #1e293b;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.help-section h2 i {
    color: #6366f1;
}

.section-subtitle {
    color: #64748b;
    margin-bottom: 20px;
}

/* Quick Links */
.quick-links-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
}

.quick-link-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 15px 20px;
    background: white;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    text-decoration: none;
    color: #1e293b;
    transition: all 0.3s;
}

.quick-link-card:hover {
    border-color: #6366f1;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
    transform: translateY(-2px);
}

.quick-link-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}

/* Module Cards */
.modules-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.module-card {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 20px;
    background: white;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    text-decoration: none;
    color: #1e293b;
    transition: all 0.3s;
}

.module-card:hover {
    border-color: #6366f1;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.module-icon {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.25rem;
    flex-shrink: 0;
}

.module-info {
    flex: 1;
}

.module-info h3 {
    font-size: 1.1rem;
    margin-bottom: 5px;
}

.module-info p {
    color: #64748b;
    font-size: 0.9rem;
    margin: 0;
}

.module-category {
    display: inline-block;
    font-size: 0.75rem;
    color: #6366f1;
    background: #eef2ff;
    padding: 2px 8px;
    border-radius: 4px;
    margin-top: 5px;
}

.module-arrow {
    color: #94a3b8;
}

/* Category Sections */
.category-section {
    margin-bottom: 25px;
}

.category-title {
    margin-bottom: 15px;
}

.category-badge {
    display: inline-block;
    padding: 6px 16px;
    border-radius: 20px;
    color: white;
    font-size: 0.9rem;
    font-weight: 600;
}

.category-modules {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 10px;
}

.category-module-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 15px;
    background: white;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    text-decoration: none;
    color: #1e293b;
    transition: all 0.2s;
}

.category-module-item:hover {
    background: #f8fafc;
    border-color: #6366f1;
}

.category-module-item i {
    color: #6366f1;
    width: 20px;
}

.access-badge {
    margin-left: auto;
    font-size: 0.7rem;
    color: #10b981;
    background: #d1fae5;
    padding: 2px 8px;
    border-radius: 10px;
}

/* Workflow Cards */
.workflow-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
}

.workflow-card {
    padding: 25px;
    background: white;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    text-decoration: none;
    color: #1e293b;
    transition: all 0.3s;
    text-align: center;
}

.workflow-card:hover {
    border-color: #6366f1;
    box-shadow: 0 8px 20px rgba(99, 102, 241, 0.15);
    transform: translateY(-3px);
}

.workflow-icon {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.5rem;
    margin: 0 auto 15px;
}

.workflow-card h4 {
    margin-bottom: 8px;
}

.workflow-card p {
    color: #64748b;
    font-size: 0.9rem;
    margin: 0;
}

/* Help Resources */
.help-resources {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
}

.help-resource-card {
    padding: 30px;
    background: white;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    text-decoration: none;
    color: #1e293b;
    text-align: center;
    transition: all 0.3s;
}

.help-resource-card:hover {
    border-color: #6366f1;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.help-resource-card i {
    font-size: 2.5rem;
    color: #6366f1;
    margin-bottom: 15px;
}

.help-resource-card h4 {
    margin-bottom: 5px;
}

.help-resource-card p {
    color: #64748b;
    font-size: 0.9rem;
    margin: 0;
}

.btn-outline {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border: 2px solid #6366f1;
    color: #6366f1;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s;
}

.btn-outline:hover {
    background: #6366f1;
    color: white;
}

.text-center {
    text-align: center;
}

.mt-3 {
    margin-top: 20px;
}
</style>
