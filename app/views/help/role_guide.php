<div class="help-role-guide">
    <!-- Breadcrumb -->
    <div class="help-breadcrumb">
        <a href="<?= APP_URL ?>/index.php?c=help&a=index"><i class="fas fa-home"></i> Help Center</a>
        <i class="fas fa-chevron-right"></i>
        <span>Role Guide</span>
    </div>
    
    <!-- Header -->
    <div class="role-guide-header">
        <h1><i class="fas fa-user-tag"></i> Role Guide</h1>
        <p>Understand what each user role can do in the system</p>
    </div>
    
    <!-- Role Selector -->
    <div class="role-selector">
        <?php foreach ($allRoles as $rId => $r): ?>
        <a href="<?= APP_URL ?>/index.php?c=help&a=roleGuide&role=<?= $rId ?>" 
           class="role-tab <?= $rId === $roleId ? 'active' : '' ?>">
            <i class="<?= $r['icon'] ?>"></i>
            <span><?= $r['name'] ?></span>
        </a>
        <?php endforeach; ?>
    </div>
    
    <!-- Selected Role Details -->
    <div class="role-details">
        <div class="role-header" style="background: <?= getRoleColor($roleId) ?>">
            <div class="role-icon">
                <i class="<?= $role['icon'] ?>"></i>
            </div>
            <div class="role-info">
                <h2><?= $role['name'] ?></h2>
                <p><?= $role['description'] ?></p>
            </div>
        </div>
        
        <div class="role-content">
            <!-- Responsibilities -->
            <div class="role-section">
                <h3><i class="fas fa-tasks"></i> Key Responsibilities</h3>
                <div class="responsibilities-list">
                    <?php foreach ($role['responsibilities'] as $resp): ?>
                    <div class="responsibility-item">
                        <i class="fas fa-check-circle"></i>
                        <span><?= $resp ?></span>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
            
            <!-- Accessible Modules -->
            <div class="role-section">
                <h3><i class="fas fa-th-large"></i> Accessible Modules</h3>
                <p class="section-desc">As a <?= $role['name'] ?>, you have access to these modules:</p>
                <div class="modules-grid">
                    <?php foreach ($role['accessibleModules'] as $modId): ?>
                    <?php if (isset($allModules[$modId])): ?>
                    <a href="<?= APP_URL ?>/index.php?c=help&a=module&id=<?= $modId ?>" class="module-access-card">
                        <div class="module-icon" style="background: <?= getModuleColor($allModules[$modId]['category']) ?>">
                            <i class="<?= $allModules[$modId]['icon'] ?>"></i>
                        </div>
                        <div class="module-details">
                            <h4><?= $allModules[$modId]['name'] ?></h4>
                            <span><?= $allModules[$modId]['category'] ?></span>
                        </div>
                        <i class="fas fa-chevron-right"></i>
                    </a>
                    <?php endif; ?>
                    <?php endforeach; ?>
                </div>
            </div>
            
            <!-- Quick Start Guide -->
            <div class="role-section">
                <h3><i class="fas fa-rocket"></i> Quick Start Guide</h3>
                <?php
                $quickStarts = [
                    'admin' => [
                        ['title' => 'Set up your school', 'desc' => 'Go to Settings and configure school name, logo, and basic information.', 'link' => 'admin&a=settings'],
                        ['title' => 'Create academic structure', 'desc' => 'Set up classes, sections, and subjects under Academics menu.', 'link' => 'classes'],
                        ['title' => 'Configure fees', 'desc' => 'Set up fee types and fee groups in Fee Structure.', 'link' => 'feeStructure'],
                        ['title' => 'Add staff users', 'desc' => 'Create accounts for teachers, finance, and admissions staff.', 'link' => 'admin&a=users']
                    ],
                    'teacher' => [
                        ['title' => 'View your classes', 'desc' => 'Go to My Classes to see the classes assigned to you.', 'link' => 'teacher&a=myClasses'],
                        ['title' => 'Take attendance', 'desc' => 'Select a class and mark daily attendance for students.', 'link' => 'teacher&a=myClasses'],
                        ['title' => 'Enter grades', 'desc' => 'Enter CA scores and exam scores for your subjects.', 'link' => 'teacher&a=myClasses'],
                        ['title' => 'Assign homework', 'desc' => 'Create homework assignments for your classes.', 'link' => 'teacher&a=homework']
                    ],
                    'parent' => [
                        ['title' => 'View your children', 'desc' => 'Go to My Children to see enrolled children and their details.', 'link' => 'parent&a=children'],
                        ['title' => 'Apply for admission', 'desc' => 'Submit a new admission application for a child.', 'link' => 'parent&a=newApplication'],
                        ['title' => 'Pay fees', 'desc' => 'View and pay outstanding invoices in Fees & Payments.', 'link' => 'parent&a=fees'],
                        ['title' => 'Track progress', 'desc' => 'View attendance, grades, and homework for your children.', 'link' => 'parent&a=children']
                    ],
                    'finance' => [
                        ['title' => 'Review pending invoices', 'desc' => 'Check and approve enrollment invoices submitted by parents.', 'link' => 'fees&a=pendingInvoices'],
                        ['title' => 'Manage fee structure', 'desc' => 'Configure fee types, groups, and installment plans.', 'link' => 'feeStructure'],
                        ['title' => 'Record payments', 'desc' => 'Record manual payments received at the office.', 'link' => 'fees&a=dashboard'],
                        ['title' => 'Generate reports', 'desc' => 'Create collection and outstanding fee reports.', 'link' => 'fees&a=dashboard']
                    ],
                    'admissions' => [
                        ['title' => 'Review applications', 'desc' => 'Check pending admission applications.', 'link' => 'admissions&a=pending'],
                        ['title' => 'Verify documents', 'desc' => 'Review uploaded documents for each application.', 'link' => 'admissions&a=pending'],
                        ['title' => 'Approve admissions', 'desc' => 'Approve applications and assign students to classes.', 'link' => 'admissions&a=pending'],
                        ['title' => 'View history', 'desc' => 'See all processed applications.', 'link' => 'admissions&a=history']
                    ]
                ];
                $steps = $quickStarts[$roleId] ?? $quickStarts['parent'];
                ?>
                <div class="quick-start-steps">
                    <?php foreach ($steps as $index => $step): ?>
                    <div class="quick-start-step">
                        <div class="step-number"><?= $index + 1 ?></div>
                        <div class="step-content">
                            <h4><?= $step['title'] ?></h4>
                            <p><?= $step['desc'] ?></p>
                            <a href="<?= APP_URL ?>/index.php?c=<?= $step['link'] ?>" class="step-link">
                                Go there <i class="fas fa-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>
    </div>
    
    <!-- All Roles Comparison -->
    <div class="roles-comparison">
        <h2><i class="fas fa-users"></i> All Roles Overview</h2>
        <div class="comparison-table-wrapper">
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Module</th>
                        <?php foreach ($allRoles as $rId => $r): ?>
                        <th><i class="<?= $r['icon'] ?>"></i> <?= $r['name'] ?></th>
                        <?php endforeach; ?>
                    </tr>
                </thead>
                <tbody>
                    <?php 
                    $allModuleIds = ['dashboard', 'users', 'admissions', 'classes', 'sections', 'subjects', 'terms', 'fee_structure', 'fees', 'attendance', 'results', 'homework', 'children', 'settings', 'reports'];
                    foreach ($allModuleIds as $modId): 
                        if (isset($allModules[$modId])):
                    ?>
                    <tr>
                        <td>
                            <i class="<?= $allModules[$modId]['icon'] ?>"></i>
                            <?= $allModules[$modId]['name'] ?>
                        </td>
                        <?php foreach ($allRoles as $rId => $r): ?>
                        <td class="access-cell">
                            <?php if (in_array($modId, $r['accessibleModules'])): ?>
                            <i class="fas fa-check-circle access-yes"></i>
                            <?php else: ?>
                            <i class="fas fa-times-circle access-no"></i>
                            <?php endif; ?>
                        </td>
                        <?php endforeach; ?>
                    </tr>
                    <?php endif; endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<?php
function getRoleColor($role) {
    $colors = [
        'admin' => '#8b5cf6',
        'teacher' => '#f59e0b',
        'parent' => '#ec4899',
        'finance' => '#10b981',
        'admissions' => '#06b6d4'
    ];
    return $colors[$role] ?? '#6366f1';
}

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
.help-role-guide {
    max-width: 1100px;
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

.help-breadcrumb i.fa-chevron-right {
    color: #94a3b8;
    font-size: 0.7rem;
}

.role-guide-header {
    text-align: center;
    margin-bottom: 30px;
}

.role-guide-header h1 {
    font-size: 2rem;
    color: #1e293b;
    margin-bottom: 10px;
}

.role-guide-header h1 i {
    color: #6366f1;
}

.role-guide-header p {
    color: #64748b;
}

/* Role Selector */
.role-selector {
    display: flex;
    gap: 10px;
    margin-bottom: 30px;
    overflow-x: auto;
    padding-bottom: 10px;
}

.role-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    text-decoration: none;
    color: #64748b;
    font-weight: 500;
    white-space: nowrap;
    transition: all 0.3s;
}

.role-tab:hover {
    border-color: #6366f1;
    color: #6366f1;
}

.role-tab.active {
    background: #6366f1;
    border-color: #6366f1;
    color: white;
}

.role-tab i {
    font-size: 1.1rem;
}

/* Role Details */
.role-details {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    margin-bottom: 30px;
}

.role-header {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 30px;
    color: white;
}

.role-icon {
    width: 70px;
    height: 70px;
    background: rgba(255,255,255,0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
}

.role-info h2 {
    font-size: 1.5rem;
    margin-bottom: 5px;
}

.role-info p {
    opacity: 0.9;
    margin: 0;
}

.role-content {
    padding: 30px;
}

.role-section {
    margin-bottom: 35px;
}

.role-section:last-child {
    margin-bottom: 0;
}

.role-section h3 {
    font-size: 1.15rem;
    color: #1e293b;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.role-section h3 i {
    color: #6366f1;
}

.section-desc {
    color: #64748b;
    margin-bottom: 15px;
}

/* Responsibilities */
.responsibilities-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 12px;
}

.responsibility-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 15px;
    background: #f8fafc;
    border-radius: 8px;
}

.responsibility-item i {
    color: #10b981;
    margin-top: 3px;
}

/* Modules Grid */
.modules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
}

.module-access-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 15px;
    background: #f8fafc;
    border-radius: 10px;
    text-decoration: none;
    color: #1e293b;
    transition: all 0.3s;
}

.module-access-card:hover {
    background: #eef2ff;
    transform: translateX(5px);
}

.module-icon {
    width: 45px;
    height: 45px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
}

.module-details {
    flex: 1;
}

.module-details h4 {
    margin: 0 0 3px 0;
    font-size: 0.95rem;
}

.module-details span {
    font-size: 0.8rem;
    color: #64748b;
}

.module-access-card .fa-chevron-right {
    color: #94a3b8;
}

/* Quick Start */
.quick-start-steps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 15px;
}

.quick-start-step {
    display: flex;
    gap: 15px;
    padding: 20px;
    background: #f8fafc;
    border-radius: 12px;
    border-left: 4px solid #6366f1;
}

.quick-start-step .step-number {
    width: 35px;
    height: 35px;
    background: #6366f1;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    flex-shrink: 0;
}

.quick-start-step .step-content h4 {
    margin: 0 0 5px 0;
    color: #1e293b;
}

.quick-start-step .step-content p {
    margin: 0 0 10px 0;
    color: #64748b;
    font-size: 0.9rem;
}

.step-link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: #6366f1;
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;
}

.step-link:hover {
    text-decoration: underline;
}

/* Roles Comparison */
.roles-comparison {
    background: white;
    border-radius: 16px;
    padding: 30px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.roles-comparison h2 {
    font-size: 1.25rem;
    color: #1e293b;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.roles-comparison h2 i {
    color: #6366f1;
}

.comparison-table-wrapper {
    overflow-x: auto;
}

.comparison-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 700px;
}

.comparison-table th, .comparison-table td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
}

.comparison-table th {
    background: #f8fafc;
    font-weight: 600;
    color: #1e293b;
    font-size: 0.9rem;
}

.comparison-table th i {
    margin-right: 5px;
    color: #6366f1;
}

.comparison-table td {
    font-size: 0.9rem;
}

.comparison-table td i {
    margin-right: 8px;
    color: #6366f1;
}

.access-cell {
    text-align: center;
}

.access-yes {
    color: #10b981 !important;
    font-size: 1.1rem;
}

.access-no {
    color: #e2e8f0 !important;
    font-size: 1.1rem;
}

@media (max-width: 768px) {
    .role-header {
        flex-direction: column;
        text-align: center;
    }
    
    .role-selector {
        justify-content: flex-start;
    }
}
</style>
