<div class="help-workflow-detail">
    <!-- Breadcrumb -->
    <div class="help-breadcrumb">
        <a href="<?= APP_URL ?>/index.php?c=help&a=index"><i class="fas fa-home"></i> Help Center</a>
        <i class="fas fa-chevron-right"></i>
        <a href="<?= APP_URL ?>/index.php?c=help&a=interactions">Module Interactions</a>
        <i class="fas fa-chevron-right"></i>
        <span><?= $workflow['name'] ?></span>
    </div>
    
    <!-- Workflow Header -->
    <div class="workflow-header-section">
        <div class="workflow-icon-large">
            <i class="<?= $workflow['icon'] ?>"></i>
        </div>
        <h1><?= $workflow['name'] ?></h1>
        <p><?= $workflow['description'] ?></p>
        <div class="workflow-modules-involved">
            <span class="label">Modules Involved:</span>
            <?php foreach ($workflow['modules'] as $modId): ?>
            <?php if (isset($allModules[$modId])): ?>
            <a href="<?= APP_URL ?>/index.php?c=help&a=module&id=<?= $modId ?>" class="module-badge">
                <i class="<?= $allModules[$modId]['icon'] ?>"></i>
                <?= $allModules[$modId]['name'] ?>
            </a>
            <?php endif; ?>
            <?php endforeach; ?>
        </div>
    </div>
    
    <!-- Workflow Steps -->
    <div class="workflow-steps-section">
        <h2><i class="fas fa-list-ol"></i> Step-by-Step Process</h2>
        
        <div class="workflow-timeline">
            <?php foreach ($workflow['steps'] as $index => $step): ?>
            <div class="timeline-step">
                <div class="step-connector">
                    <div class="step-number"><?= $index + 1 ?></div>
                    <?php if ($index < count($workflow['steps']) - 1): ?>
                    <div class="connector-line"></div>
                    <?php endif; ?>
                </div>
                <div class="step-card">
                    <div class="step-header">
                        <h3><?= $step['title'] ?></h3>
                        <div class="step-meta">
                            <?php if (isset($allModules[$step['module']])): ?>
                            <span class="step-module">
                                <i class="<?= $allModules[$step['module']]['icon'] ?>"></i>
                                <?= $allModules[$step['module']]['name'] ?>
                            </span>
                            <?php endif; ?>
                            <span class="step-role">
                                <i class="fas fa-user"></i>
                                <?= ucfirst($step['role']) ?>
                            </span>
                        </div>
                    </div>
                    <p class="step-description"><?= $step['description'] ?></p>
                    <?php if (!empty($step['actions'])): ?>
                    <div class="step-actions">
                        <span class="actions-label">Actions:</span>
                        <ul>
                            <?php foreach ($step['actions'] as $action): ?>
                            <li><i class="fas fa-check"></i> <?= $action ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                    <?php endif; ?>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    </div>
    
    <!-- Visual Flow Diagram -->
    <div class="flow-diagram-section">
        <h2><i class="fas fa-project-diagram"></i> Visual Flow</h2>
        <div class="flow-diagram">
            <?php foreach ($workflow['steps'] as $index => $step): ?>
            <div class="flow-node">
                <div class="flow-node-content <?= $step['role'] === 'system' ? 'system-node' : '' ?>">
                    <div class="node-role"><?= ucfirst($step['role']) ?></div>
                    <div class="node-title"><?= $step['title'] ?></div>
                </div>
                <?php if ($index < count($workflow['steps']) - 1): ?>
                <div class="flow-arrow"><i class="fas fa-arrow-down"></i></div>
                <?php endif; ?>
            </div>
            <?php endforeach; ?>
        </div>
    </div>
    
    <!-- Related Workflows -->
    <div class="related-workflows-section">
        <h2><i class="fas fa-link"></i> Related Workflows</h2>
        <div class="related-workflows-grid">
            <?php 
            $otherWorkflows = [
                'admission_enrollment' => ['name' => 'Admission to Enrollment', 'icon' => 'fas fa-user-plus'],
                'term_enrollment' => ['name' => 'Term Re-enrollment', 'icon' => 'fas fa-redo'],
                'grade_entry' => ['name' => 'Grade Entry Process', 'icon' => 'fas fa-edit'],
                'fee_collection' => ['name' => 'Fee Collection', 'icon' => 'fas fa-hand-holding-usd'],
                'attendance_tracking' => ['name' => 'Daily Attendance', 'icon' => 'fas fa-calendar-check']
            ];
            foreach ($otherWorkflows as $wfId => $wf): 
                if ($wfId !== $workflowId):
            ?>
            <a href="<?= APP_URL ?>/index.php?c=help&a=workflow&id=<?= $wfId ?>" class="related-workflow-card">
                <i class="<?= $wf['icon'] ?>"></i>
                <span><?= $wf['name'] ?></span>
            </a>
            <?php endif; endforeach; ?>
        </div>
    </div>
    
    <!-- Navigation -->
    <div class="workflow-navigation">
        <a href="<?= APP_URL ?>/index.php?c=help&a=interactions" class="nav-btn">
            <i class="fas fa-arrow-left"></i> Back to Interactions
        </a>
        <a href="<?= APP_URL ?>/index.php?c=help&a=index" class="nav-btn nav-btn-primary">
            Help Center <i class="fas fa-home"></i>
        </a>
    </div>
</div>

<style>
.help-workflow-detail {
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
    flex-wrap: wrap;
}

.help-breadcrumb a {
    color: #6366f1;
    text-decoration: none;
}

.help-breadcrumb i.fa-chevron-right {
    color: #94a3b8;
    font-size: 0.7rem;
}

.workflow-header-section {
    text-align: center;
    padding: 40px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border-radius: 16px;
    color: white;
    margin-bottom: 30px;
}

.workflow-icon-large {
    width: 80px;
    height: 80px;
    background: rgba(255,255,255,0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    margin: 0 auto 20px;
}

.workflow-header-section h1 {
    font-size: 1.75rem;
    margin-bottom: 10px;
}

.workflow-header-section p {
    opacity: 0.9;
    margin-bottom: 20px;
}

.workflow-modules-involved {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
}

.workflow-modules-involved .label {
    opacity: 0.8;
}

.module-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: rgba(255,255,255,0.2);
    border-radius: 20px;
    color: white;
    text-decoration: none;
    font-size: 0.85rem;
    transition: background 0.3s;
}

.module-badge:hover {
    background: rgba(255,255,255,0.3);
}

.workflow-steps-section, .flow-diagram-section, .related-workflows-section {
    background: white;
    border-radius: 16px;
    padding: 30px;
    margin-bottom: 30px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.workflow-steps-section h2, .flow-diagram-section h2, .related-workflows-section h2 {
    font-size: 1.25rem;
    color: #1e293b;
    margin-bottom: 25px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.workflow-steps-section h2 i, .flow-diagram-section h2 i, .related-workflows-section h2 i {
    color: #6366f1;
}

/* Timeline */
.workflow-timeline {
    position: relative;
}

.timeline-step {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
}

.timeline-step:last-child {
    margin-bottom: 0;
}

.step-connector {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 40px;
    flex-shrink: 0;
}

.step-number {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1.1rem;
    z-index: 1;
}

.connector-line {
    width: 3px;
    flex: 1;
    background: linear-gradient(to bottom, #6366f1, #e2e8f0);
    margin-top: 5px;
}

.step-card {
    flex: 1;
    padding: 20px;
    background: #f8fafc;
    border-radius: 12px;
    border-left: 4px solid #6366f1;
}

.step-header {
    margin-bottom: 12px;
}

.step-header h3 {
    font-size: 1.1rem;
    color: #1e293b;
    margin-bottom: 8px;
}

.step-meta {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
}

.step-module, .step-role {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 0.85rem;
    color: #64748b;
}

.step-module i {
    color: #6366f1;
}

.step-role i {
    color: #10b981;
}

.step-description {
    color: #475569;
    margin-bottom: 15px;
    line-height: 1.6;
}

.step-actions {
    background: white;
    padding: 15px;
    border-radius: 8px;
}

.actions-label {
    font-size: 0.85rem;
    color: #64748b;
    font-weight: 600;
    display: block;
    margin-bottom: 10px;
}

.step-actions ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 8px;
}

.step-actions li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    color: #475569;
}

.step-actions li i {
    color: #10b981;
    font-size: 0.8rem;
}

/* Flow Diagram */
.flow-diagram {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    background: #f8fafc;
    border-radius: 12px;
}

.flow-node {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.flow-node-content {
    padding: 15px 30px;
    background: white;
    border: 2px solid #6366f1;
    border-radius: 10px;
    text-align: center;
    min-width: 200px;
}

.flow-node-content.system-node {
    background: #f0fdf4;
    border-color: #10b981;
}

.node-role {
    font-size: 0.75rem;
    color: #6366f1;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 5px;
}

.system-node .node-role {
    color: #10b981;
}

.node-title {
    font-weight: 600;
    color: #1e293b;
}

.flow-arrow {
    padding: 10px;
    color: #94a3b8;
}

/* Related Workflows */
.related-workflows-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
}

.related-workflow-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 15px 20px;
    background: #f8fafc;
    border-radius: 10px;
    text-decoration: none;
    color: #1e293b;
    transition: all 0.3s;
}

.related-workflow-card:hover {
    background: #eef2ff;
    transform: translateX(5px);
}

.related-workflow-card i {
    font-size: 1.25rem;
    color: #6366f1;
}

/* Navigation */
.workflow-navigation {
    display: flex;
    justify-content: space-between;
    gap: 15px;
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
    background: white;
    border: 1px solid #e2e8f0;
}

.nav-btn:hover {
    background: #f1f5f9;
    color: #1e293b;
}

.nav-btn-primary {
    background: #6366f1;
    color: white;
    border-color: #6366f1;
}

.nav-btn-primary:hover {
    background: #4f46e5;
    color: white;
}

@media (max-width: 768px) {
    .timeline-step {
        flex-direction: column;
    }
    
    .step-connector {
        flex-direction: row;
        width: 100%;
        margin-bottom: 10px;
    }
    
    .connector-line {
        display: none;
    }
    
    .workflow-navigation {
        flex-direction: column;
    }
}
</style>
