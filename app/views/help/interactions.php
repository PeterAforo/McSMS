<div class="help-interactions">
    <!-- Breadcrumb -->
    <div class="help-breadcrumb">
        <a href="<?= APP_URL ?>/index.php?c=help&a=index"><i class="fas fa-home"></i> Help Center</a>
        <i class="fas fa-chevron-right"></i>
        <span>Module Interactions</span>
    </div>
    
    <!-- Header -->
    <div class="interactions-header">
        <h1><i class="fas fa-project-diagram"></i> Module Interactions</h1>
        <p>Understand how different modules in the system work together</p>
    </div>
    
    <!-- System Overview Diagram -->
    <div class="system-overview">
        <h2><i class="fas fa-sitemap"></i> System Architecture</h2>
        <div class="architecture-diagram">
            <div class="arch-layer">
                <div class="layer-label">User Portals</div>
                <div class="layer-modules">
                    <div class="arch-module portal-admin"><i class="fas fa-user-shield"></i><span>Admin</span></div>
                    <div class="arch-module portal-teacher"><i class="fas fa-chalkboard-teacher"></i><span>Teacher</span></div>
                    <div class="arch-module portal-parent"><i class="fas fa-user-friends"></i><span>Parent</span></div>
                    <div class="arch-module portal-finance"><i class="fas fa-calculator"></i><span>Finance</span></div>
                </div>
            </div>
            
            <div class="arch-connector"><i class="fas fa-arrows-alt-v"></i></div>
            
            <div class="arch-layer">
                <div class="layer-label">Core Modules</div>
                <div class="layer-modules core-modules">
                    <?php 
                    $coreModules = ['users', 'admissions', 'classes', 'fees', 'attendance', 'results'];
                    foreach ($coreModules as $modId): 
                        if (isset($modules[$modId])):
                    ?>
                    <a href="<?= APP_URL ?>/index.php?c=help&a=module&id=<?= $modId ?>" class="arch-module">
                        <i class="<?= $modules[$modId]['icon'] ?>"></i>
                        <span><?= $modules[$modId]['name'] ?></span>
                    </a>
                    <?php endif; endforeach; ?>
                </div>
            </div>
            
            <div class="arch-connector"><i class="fas fa-arrows-alt-v"></i></div>
            
            <div class="arch-layer">
                <div class="layer-label">Configuration</div>
                <div class="layer-modules config-modules">
                    <?php 
                    $configModules = ['sections', 'subjects', 'terms', 'fee_structure', 'settings'];
                    foreach ($configModules as $modId): 
                        if (isset($modules[$modId])):
                    ?>
                    <a href="<?= APP_URL ?>/index.php?c=help&a=module&id=<?= $modId ?>" class="arch-module">
                        <i class="<?= $modules[$modId]['icon'] ?>"></i>
                        <span><?= $modules[$modId]['name'] ?></span>
                    </a>
                    <?php endif; endforeach; ?>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Workflows Section -->
    <div class="workflows-section">
        <h2><i class="fas fa-stream"></i> Key Workflows</h2>
        <p class="section-desc">Click on any workflow to see the detailed step-by-step process</p>
        
        <div class="workflows-grid">
            <?php foreach ($workflows as $id => $workflow): ?>
            <a href="<?= APP_URL ?>/index.php?c=help&a=workflow&id=<?= $id ?>" class="workflow-card-large">
                <div class="workflow-header">
                    <div class="workflow-icon"><i class="<?= $workflow['icon'] ?>"></i></div>
                    <div class="workflow-title">
                        <h3><?= $workflow['name'] ?></h3>
                        <p><?= $workflow['description'] ?></p>
                    </div>
                </div>
                <div class="workflow-modules">
                    <span class="modules-label">Involves:</span>
                    <?php foreach (array_slice($workflow['modules'], 0, 4) as $modId): ?>
                    <?php if (isset($modules[$modId])): ?>
                    <span class="module-tag"><i class="<?= $modules[$modId]['icon'] ?>"></i> <?= $modules[$modId]['name'] ?></span>
                    <?php endif; ?>
                    <?php endforeach; ?>
                </div>
                <div class="workflow-steps-preview">
                    <?php foreach (array_slice($workflow['steps'], 0, 3) as $index => $step): ?>
                    <div class="step-preview">
                        <span class="step-num"><?= $index + 1 ?></span>
                        <span class="step-title"><?= $step['title'] ?></span>
                    </div>
                    <?php endforeach; ?>
                    <?php if (count($workflow['steps']) > 3): ?>
                    <div class="more-steps">+<?= count($workflow['steps']) - 3 ?> more steps</div>
                    <?php endif; ?>
                </div>
                <div class="workflow-cta">View Full Workflow <i class="fas fa-arrow-right"></i></div>
            </a>
            <?php endforeach; ?>
        </div>
    </div>
    
    <!-- Data Flow -->
    <div class="data-flow-section">
        <h2><i class="fas fa-exchange-alt"></i> Data Flow Between Modules</h2>
        <div class="data-flows">
            <div class="flow-item">
                <div class="flow-from"><i class="fas fa-user-graduate"></i> Admissions</div>
                <div class="flow-arrow"><i class="fas fa-long-arrow-alt-right"></i></div>
                <div class="flow-to"><i class="fas fa-users"></i> Users</div>
                <div class="flow-desc">Creates parent accounts</div>
            </div>
            <div class="flow-item">
                <div class="flow-from"><i class="fas fa-user-graduate"></i> Admissions</div>
                <div class="flow-arrow"><i class="fas fa-long-arrow-alt-right"></i></div>
                <div class="flow-to"><i class="fas fa-dollar-sign"></i> Finance</div>
                <div class="flow-desc">Generates enrollment invoices</div>
            </div>
            <div class="flow-item">
                <div class="flow-from"><i class="fas fa-money-bill-wave"></i> Fee Structure</div>
                <div class="flow-arrow"><i class="fas fa-long-arrow-alt-right"></i></div>
                <div class="flow-to"><i class="fas fa-dollar-sign"></i> Finance</div>
                <div class="flow-desc">Provides fee calculations</div>
            </div>
            <div class="flow-item">
                <div class="flow-from"><i class="fas fa-school"></i> Classes</div>
                <div class="flow-arrow"><i class="fas fa-long-arrow-alt-right"></i></div>
                <div class="flow-to"><i class="fas fa-clipboard-check"></i> Attendance</div>
                <div class="flow-desc">Provides student lists</div>
            </div>
            <div class="flow-item">
                <div class="flow-from"><i class="fas fa-book"></i> Subjects</div>
                <div class="flow-arrow"><i class="fas fa-long-arrow-alt-right"></i></div>
                <div class="flow-to"><i class="fas fa-graduation-cap"></i> Results</div>
                <div class="flow-desc">Defines gradeable subjects</div>
            </div>
        </div>
    </div>
    
    <!-- Setup Order -->
    <div class="setup-order-section">
        <h2><i class="fas fa-sort-numeric-down"></i> Recommended Setup Order</h2>
        <p class="section-desc">For new installations, set up modules in this order:</p>
        <div class="setup-steps">
            <div class="setup-step">
                <div class="setup-num">1</div>
                <div class="setup-content">
                    <h4>System Settings</h4>
                    <p>Configure school name, logo, and basic settings</p>
                </div>
            </div>
            <div class="setup-step">
                <div class="setup-num">2</div>
                <div class="setup-content">
                    <h4>Academic Terms</h4>
                    <p>Create academic year and terms</p>
                </div>
            </div>
            <div class="setup-step">
                <div class="setup-num">3</div>
                <div class="setup-content">
                    <h4>Classes & Sections</h4>
                    <p>Set up class levels and sections</p>
                </div>
            </div>
            <div class="setup-step">
                <div class="setup-num">4</div>
                <div class="setup-content">
                    <h4>Subjects</h4>
                    <p>Create subjects and assign to classes</p>
                </div>
            </div>
            <div class="setup-step">
                <div class="setup-num">5</div>
                <div class="setup-content">
                    <h4>Fee Structure</h4>
                    <p>Configure fee types, groups, and rules</p>
                </div>
            </div>
            <div class="setup-step">
                <div class="setup-num">6</div>
                <div class="setup-content">
                    <h4>Users</h4>
                    <p>Create staff accounts (teachers, finance, admissions)</p>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.help-interactions {
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

.interactions-header {
    text-align: center;
    margin-bottom: 40px;
}

.interactions-header h1 {
    font-size: 2rem;
    color: #1e293b;
    margin-bottom: 10px;
}

.interactions-header h1 i {
    color: #6366f1;
}

.interactions-header p {
    color: #64748b;
}

.system-overview, .workflows-section, .data-flow-section, .setup-order-section {
    background: white;
    border-radius: 16px;
    padding: 30px;
    margin-bottom: 30px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.system-overview h2, .workflows-section h2, .data-flow-section h2, .setup-order-section h2 {
    font-size: 1.25rem;
    color: #1e293b;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.system-overview h2 i, .workflows-section h2 i, .data-flow-section h2 i, .setup-order-section h2 i {
    color: #6366f1;
}

.section-desc {
    color: #64748b;
    margin-bottom: 20px;
}

/* Architecture Diagram */
.architecture-diagram {
    padding: 20px;
    background: #f8fafc;
    border-radius: 12px;
}

.arch-layer {
    margin-bottom: 10px;
}

.layer-label {
    text-align: center;
    font-size: 0.8rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 10px;
}

.layer-modules {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px;
}

.arch-module {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    padding: 15px 20px;
    background: white;
    border-radius: 10px;
    border: 2px solid #e2e8f0;
    text-decoration: none;
    color: #1e293b;
    transition: all 0.3s;
    min-width: 100px;
}

.arch-module:hover {
    border-color: #6366f1;
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.arch-module i {
    font-size: 1.5rem;
    color: #6366f1;
}

.arch-module span {
    font-size: 0.85rem;
    font-weight: 500;
}

.portal-admin { border-color: #8b5cf6; }
.portal-admin i { color: #8b5cf6; }
.portal-teacher { border-color: #f59e0b; }
.portal-teacher i { color: #f59e0b; }
.portal-parent { border-color: #ec4899; }
.portal-parent i { color: #ec4899; }
.portal-finance { border-color: #10b981; }
.portal-finance i { color: #10b981; }

.arch-connector {
    text-align: center;
    padding: 10px;
    color: #94a3b8;
}

/* Workflows Grid */
.workflows-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 20px;
}

.workflow-card-large {
    padding: 20px;
    background: #f8fafc;
    border-radius: 12px;
    border: 2px solid #e2e8f0;
    text-decoration: none;
    color: #1e293b;
    transition: all 0.3s;
}

.workflow-card-large:hover {
    border-color: #6366f1;
    box-shadow: 0 8px 20px rgba(99, 102, 241, 0.15);
}

.workflow-header {
    display: flex;
    gap: 15px;
    margin-bottom: 15px;
}

.workflow-icon {
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.25rem;
    flex-shrink: 0;
}

.workflow-title h3 {
    font-size: 1.1rem;
    margin-bottom: 5px;
}

.workflow-title p {
    font-size: 0.85rem;
    color: #64748b;
    margin: 0;
}

.workflow-modules {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-bottom: 15px;
}

.modules-label {
    font-size: 0.8rem;
    color: #64748b;
}

.module-tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    background: white;
    border-radius: 15px;
    font-size: 0.75rem;
    border: 1px solid #e2e8f0;
}

.module-tag i {
    color: #6366f1;
}

.workflow-steps-preview {
    margin-bottom: 15px;
}

.step-preview {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid #e2e8f0;
}

.step-preview:last-child {
    border-bottom: none;
}

.step-num {
    width: 22px;
    height: 22px;
    background: #6366f1;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 600;
}

.step-title {
    font-size: 0.9rem;
}

.more-steps {
    text-align: center;
    color: #64748b;
    font-size: 0.85rem;
    padding-top: 8px;
}

.workflow-cta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px;
    background: #6366f1;
    color: white;
    border-radius: 8px;
    font-weight: 500;
    font-size: 0.9rem;
}

/* Data Flows */
.data-flows {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.flow-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px;
    background: #f8fafc;
    border-radius: 10px;
    flex-wrap: wrap;
}

.flow-from, .flow-to {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 15px;
    background: white;
    border-radius: 8px;
    font-weight: 500;
}

.flow-from i, .flow-to i {
    color: #6366f1;
}

.flow-arrow {
    color: #10b981;
    font-size: 1.25rem;
}

.flow-desc {
    flex: 1;
    color: #64748b;
    font-size: 0.9rem;
    text-align: right;
}

/* Setup Steps */
.setup-steps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 15px;
}

.setup-step {
    display: flex;
    gap: 15px;
    padding: 20px;
    background: #f8fafc;
    border-radius: 10px;
    border-left: 4px solid #6366f1;
}

.setup-num {
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

.setup-content h4 {
    margin: 0 0 5px 0;
    color: #1e293b;
}

.setup-content p {
    margin: 0;
    color: #64748b;
    font-size: 0.9rem;
}

@media (max-width: 768px) {
    .flow-item {
        flex-direction: column;
        text-align: center;
    }
    
    .flow-desc {
        text-align: center;
    }
    
    .flow-arrow {
        transform: rotate(90deg);
    }
}
</style>
