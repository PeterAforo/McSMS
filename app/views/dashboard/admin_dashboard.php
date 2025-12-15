<!-- Topbar -->
<div class="topbar">
    <div class="topbar-search">
        <i class="fas fa-search topbar-search-icon"></i>
        <input type="text" class="topbar-search-input" placeholder="Search Students, Staff, Events....">
    </div>
    <div class="topbar-actions">
        <button class="topbar-icon-btn">
            <i class="fas fa-bell"></i>
            <span class="topbar-badge">3</span>
        </button>
        <button class="topbar-icon-btn">
            <i class="fas fa-envelope"></i>
            <span class="topbar-badge">5</span>
        </button>
        <div class="topbar-profile">
            <img src="<?= ASSETS_URL ?>/images/default-avatar.png" alt="Profile" class="topbar-avatar">
            <div>
                <div class="topbar-profile-name"><?= $_SESSION['user_name'] ?? 'Admin User' ?></div>
                <div class="topbar-profile-email"><?= $_SESSION['user_email'] ?? 'admin@school.com' ?></div>
            </div>
            <i class="fas fa-chevron-down"></i>
        </div>
    </div>
</div>

<!-- Main Content -->
<div class="main-content">
    <!-- Page Header -->
    <div class="page-header">
        <h1>Overview</h1>
    </div>

    <!-- Overview Stats Cards -->
    <div class="overview-grid">
        <div class="stat-card">
            <div class="stat-icon students">
                <i class="fas fa-user-graduate"></i>
            </div>
            <div class="stat-content">
                <p>Students</p>
                <h3>2000</h3>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon teachers">
                <i class="fas fa-chalkboard-teacher"></i>
            </div>
            <div class="stat-content">
                <p>Teachers</p>
                <h3>120</h3>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon parents">
                <i class="fas fa-users"></i>
            </div>
            <div class="stat-content">
                <p>Parents</p>
                <h3>2115</h3>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon staff">
                <i class="fas fa-user-tie"></i>
            </div>
            <div class="stat-content">
                <p>Staff</p>
                <h3>82</h3>
            </div>
        </div>
    </div>

    <!-- Dashboard Section -->
    <div class="dashboard-section">
        <div class="dashboard-header">
            <h2>Dashboard</h2>
            <select class="class-selector">
                <option>Class 9</option>
                <option>Class 10</option>
                <option>Class 11</option>
                <option>Class 12</option>
            </select>
        </div>

        <div class="dashboard-grid">
            <!-- Left Column - Charts and Stats -->
            <div class="dashboard-main">
                <!-- Tab Bar -->
                <div class="tab-bar">
                    <button class="tab-btn">Admissions</button>
                    <button class="tab-btn">Fees</button>
                    <button class="tab-btn">Syllabus</button>
                    <button class="tab-btn active">Results</button>
                    <button class="tab-btn">Transport</button>
                    <button class="tab-btn">Finance</button>
                </div>

                <!-- Performance Chart -->
                <div class="chart-container">
                    <h3 class="chart-title">Students Performance</h3>
                    <div class="performance-chart">
                        <div class="chart-bars">
                            <div class="chart-bar-group">
                                <div class="chart-bar" style="height: 95%;">
                                    <span class="bar-value">95%</span>
                                </div>
                                <span class="bar-label">Class A</span>
                            </div>
                            <div class="chart-bar-group">
                                <div class="chart-bar" style="height: 88%;">
                                    <span class="bar-value">88%</span>
                                </div>
                                <span class="bar-label">Class B</span>
                            </div>
                            <div class="chart-bar-group">
                                <div class="chart-bar" style="height: 70%;">
                                    <span class="bar-value">70%</span>
                                </div>
                                <span class="bar-label">Class C</span>
                            </div>
                            <div class="chart-bar-group">
                                <div class="chart-bar" style="height: 82%;">
                                    <span class="bar-value">82%</span>
                                </div>
                                <span class="bar-label">Class D</span>
                            </div>
                            <div class="chart-bar-group">
                                <div class="chart-bar" style="height: 98%;">
                                    <span class="bar-value">98%</span>
                                </div>
                                <span class="bar-label">Class E</span>
                            </div>
                        </div>
                        <div class="chart-legend">
                            <div class="legend-item">
                                <span class="legend-dot passed"></span> Passed
                            </div>
                            <div class="legend-item">
                                <span class="legend-dot failed"></span> Failed
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Top Achievers and Players -->
                <div class="achievers-grid">
                    <div class="achievers-section">
                        <h3>Top Achievers</h3>
                        <div class="achiever-list">
                            <div class="achiever-item">
                                <img src="<?= ASSETS_URL ?>/images/avatar1.png" alt="Student" class="achiever-avatar">
                                <span class="achiever-name">Madhiha Sharma</span>
                                <img src="<?= ASSETS_URL ?>/images/medal-gold.png" alt="Medal" class="achiever-medal">
                            </div>
                            <div class="achiever-item">
                                <img src="<?= ASSETS_URL ?>/images/avatar2.png" alt="Student" class="achiever-avatar">
                                <span class="achiever-name">Rahul Gupta</span>
                                <img src="<?= ASSETS_URL ?>/images/medal-silver.png" alt="Medal" class="achiever-medal">
                            </div>
                        </div>
                    </div>

                    <div class="achievers-section">
                        <h3>Top Players</h3>
                        <div class="achiever-list">
                            <div class="achiever-item">
                                <img src="<?= ASSETS_URL ?>/images/avatar3.png" alt="Student" class="achiever-avatar">
                                <span class="achiever-name">Madhiha Sharma</span>
                                <img src="<?= ASSETS_URL ?>/images/medal-gold.png" alt="Medal" class="achiever-medal">
                            </div>
                            <div class="achiever-item">
                                <img src="<?= ASSETS_URL ?>/images/avatar4.png" alt="Student" class="achiever-avatar">
                                <span class="achiever-name">Rahul Gupta</span>
                                <img src="<?= ASSETS_URL ?>/images/medal-silver.png" alt="Medal" class="achiever-medal">
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Column - Upcoming Events -->
            <div class="dashboard-sidebar">
                <h3>Upcoming Events</h3>
                
                <div class="event-card">
                    <div class="event-date">
                        <div class="event-date-day">6</div>
                        <div class="event-date-month">Feb</div>
                    </div>
                    <div class="event-content">
                        <div class="event-meta">
                            <span class="event-day">Tuesday</span>
                            <span class="event-badge today">Today</span>
                        </div>
                        <div class="event-title">School President Elections</div>
                        <div class="event-time">
                            <i class="far fa-clock"></i> 11:00 Am - 12:30 Pm
                        </div>
                    </div>
                </div>

                <div class="event-card">
                    <div class="event-date">
                        <div class="event-date-day">9</div>
                        <div class="event-date-month">Feb</div>
                    </div>
                    <div class="event-content">
                        <div class="event-meta">
                            <span class="event-day">Tuesday</span>
                            <span class="event-badge upcoming">in 3 days</span>
                        </div>
                        <div class="event-title">Special Guest Lecture</div>
                        <div class="event-time">
                            <i class="far fa-clock"></i> 11:00 Am - 12:30 Pm
                        </div>
                    </div>
                </div>

                <div class="event-card">
                    <div class="event-date">
                        <div class="event-date-day">9</div>
                        <div class="event-date-month">Feb</div>
                    </div>
                    <div class="event-content">
                        <div class="event-meta">
                            <span class="event-day">Tuesday</span>
                            <span class="event-badge upcoming">in 3 days</span>
                        </div>
                        <div class="event-title">Webinar on Career Trends for Class 11</div>
                        <div class="event-time">
                            <i class="far fa-clock"></i> 01:00 Am - 02:30 Pm
                        </div>
                    </div>
                </div>

                <a href="#" class="view-more-link">
                    View More <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        </div>
    </div>
</div>

<style>
/* Additional Dashboard-Specific Styles */
.page-header {
    margin-bottom: var(--spacing-xl);
}

.page-header h1 {
    font-size: var(--font-size-xxl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
}

.dashboard-section {
    margin-top: var(--spacing-xxl);
}

.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-xl);
}

.dashboard-header h2 {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
}

.class-selector {
    padding: 10px 20px;
    border: 2px solid var(--color-border-light);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-md);
    background: white;
    cursor: pointer;
}

.dashboard-grid {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: var(--spacing-xl);
}

.dashboard-main {
    background: var(--color-card-bg);
    border-radius: var(--radius-md);
    padding: var(--spacing-xl);
    box-shadow: var(--shadow-card);
}

.dashboard-sidebar {
    background: var(--color-card-bg);
    border-radius: var(--radius-md);
    padding: var(--spacing-xl);
    box-shadow: var(--shadow-card);
}

.dashboard-sidebar h3 {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--spacing-lg);
}

/* Performance Chart */
.performance-chart {
    margin-top: var(--spacing-xl);
}

.chart-bars {
    display: flex;
    justify-content: space-around;
    align-items: flex-end;
    height: 250px;
    padding: var(--spacing-lg);
    border-bottom: 2px solid var(--color-border-light);
}

.chart-bar-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
}

.chart-bar {
    width: 60px;
    background: var(--color-accent);
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    position: relative;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: var(--spacing-sm);
}

.bar-value {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
}

.bar-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin-top: var(--spacing-sm);
}

.chart-legend {
    display: flex;
    justify-content: center;
    gap: var(--spacing-xl);
    margin-top: var(--spacing-lg);
}

.legend-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--font-size-sm);
}

.legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
}

.legend-dot.passed {
    background: var(--color-accent);
}

.legend-dot.failed {
    background: #E0E0E0;
}

/* Achievers Section */
.achievers-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-xl);
    margin-top: var(--spacing-xl);
}

.achievers-section h3 {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
    margin-bottom: var(--spacing-lg);
}

.achiever-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
}

.achiever-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    background: var(--color-background);
    border-radius: var(--radius-sm);
}

.achiever-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
}

.achiever-name {
    flex: 1;
    font-size: var(--font-size-md);
    color: var(--color-text-primary);
}

.achiever-medal {
    width: 30px;
    height: 30px;
}

/* Event Cards */
.event-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-xs);
}

.event-day {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    font-weight: var(--font-weight-medium);
}

.view-more-link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-lg);
    color: var(--color-primary);
    text-decoration: none;
    font-weight: var(--font-weight-medium);
}

.view-more-link:hover {
    color: var(--color-primary-light);
}

@media (max-width: 1200px) {
    .dashboard-grid {
        grid-template-columns: 1fr;
    }
    
    .achievers-grid {
        grid-template-columns: 1fr;
    }
}
</style>
