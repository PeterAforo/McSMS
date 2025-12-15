<div class="help-search-results">
    <!-- Breadcrumb -->
    <div class="help-breadcrumb">
        <a href="<?= APP_URL ?>/index.php?c=help&a=index"><i class="fas fa-home"></i> Help Center</a>
        <i class="fas fa-chevron-right"></i>
        <span>Search Results</span>
    </div>
    
    <!-- Search Header -->
    <div class="search-header">
        <h1><i class="fas fa-search"></i> Search Results</h1>
        <?php if (!empty($query)): ?>
        <p>Showing results for "<strong><?= htmlspecialchars($query) ?></strong>"</p>
        <?php endif; ?>
        
        <!-- Search Box -->
        <form action="<?= APP_URL ?>/index.php" method="GET" class="search-form">
            <input type="hidden" name="c" value="help">
            <input type="hidden" name="a" value="search">
            <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" name="q" value="<?= htmlspecialchars($query) ?>" placeholder="Search for help topics..." class="search-input">
                <button type="submit" class="search-btn">Search</button>
            </div>
        </form>
    </div>
    
    <!-- Results -->
    <div class="results-section">
        <?php if (empty($query)): ?>
        <div class="no-query">
            <i class="fas fa-search"></i>
            <h3>Enter a search term</h3>
            <p>Type something in the search box above to find help topics</p>
        </div>
        <?php elseif (empty($results)): ?>
        <div class="no-results">
            <i class="fas fa-exclamation-circle"></i>
            <h3>No results found</h3>
            <p>We couldn't find any help topics matching "<?= htmlspecialchars($query) ?>"</p>
            <div class="suggestions">
                <h4>Suggestions:</h4>
                <ul>
                    <li>Check your spelling</li>
                    <li>Try more general keywords</li>
                    <li>Try different keywords</li>
                </ul>
            </div>
            <a href="<?= APP_URL ?>/index.php?c=help&a=index" class="btn-back">
                <i class="fas fa-arrow-left"></i> Browse Help Center
            </a>
        </div>
        <?php else: ?>
        <div class="results-count">
            Found <strong><?= count($results) ?></strong> result<?= count($results) !== 1 ? 's' : '' ?>
        </div>
        
        <div class="results-list">
            <?php foreach ($results as $result): ?>
            <a href="<?= $result['url'] ?>" class="result-card">
                <div class="result-icon <?= $result['type'] ?>">
                    <i class="<?= $result['icon'] ?>"></i>
                </div>
                <div class="result-content">
                    <div class="result-type"><?= ucfirst($result['type']) ?></div>
                    <h3><?= $result['title'] ?></h3>
                    <p><?= $result['description'] ?></p>
                </div>
                <div class="result-arrow">
                    <i class="fas fa-chevron-right"></i>
                </div>
            </a>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>
    </div>
    
    <!-- Quick Links -->
    <div class="quick-links-section">
        <h2>Popular Topics</h2>
        <div class="quick-links">
            <a href="<?= APP_URL ?>/index.php?c=help&a=module&id=admissions" class="quick-link">
                <i class="fas fa-user-graduate"></i> Admissions
            </a>
            <a href="<?= APP_URL ?>/index.php?c=help&a=module&id=fees" class="quick-link">
                <i class="fas fa-dollar-sign"></i> Fees & Payments
            </a>
            <a href="<?= APP_URL ?>/index.php?c=help&a=module&id=attendance" class="quick-link">
                <i class="fas fa-clipboard-check"></i> Attendance
            </a>
            <a href="<?= APP_URL ?>/index.php?c=help&a=module&id=results" class="quick-link">
                <i class="fas fa-graduation-cap"></i> Grades & Results
            </a>
            <a href="<?= APP_URL ?>/index.php?c=help&a=workflow&id=admission_enrollment" class="quick-link">
                <i class="fas fa-stream"></i> Enrollment Process
            </a>
            <a href="<?= APP_URL ?>/index.php?c=help&a=faq" class="quick-link">
                <i class="fas fa-question-circle"></i> FAQ
            </a>
        </div>
    </div>
</div>

<style>
.help-search-results {
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

.help-breadcrumb i.fa-chevron-right {
    color: #94a3b8;
    font-size: 0.7rem;
}

.search-header {
    text-align: center;
    margin-bottom: 40px;
}

.search-header h1 {
    font-size: 2rem;
    color: #1e293b;
    margin-bottom: 10px;
}

.search-header h1 i {
    color: #6366f1;
}

.search-header p {
    color: #64748b;
    margin-bottom: 25px;
}

.search-form {
    max-width: 600px;
    margin: 0 auto;
}

.search-box {
    display: flex;
    align-items: center;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 50px;
    padding: 5px 5px 5px 20px;
    transition: border-color 0.3s;
}

.search-box:focus-within {
    border-color: #6366f1;
}

.search-box > i {
    color: #94a3b8;
    margin-right: 10px;
}

.search-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 1rem;
    padding: 10px 0;
    color: #1e293b;
}

.search-btn {
    background: #6366f1;
    color: white;
    border: none;
    padding: 12px 25px;
    border-radius: 50px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.3s;
}

.search-btn:hover {
    background: #4f46e5;
}

/* Results */
.results-section {
    margin-bottom: 40px;
}

.results-count {
    color: #64748b;
    margin-bottom: 20px;
}

.results-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.result-card {
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

.result-card:hover {
    border-color: #6366f1;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
    transform: translateX(5px);
}

.result-icon {
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

.result-icon.module {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
}

.result-icon.workflow {
    background: linear-gradient(135deg, #10b981, #06b6d4);
}

.result-content {
    flex: 1;
}

.result-type {
    font-size: 0.75rem;
    color: #6366f1;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 5px;
}

.result-content h3 {
    font-size: 1.1rem;
    margin-bottom: 5px;
}

.result-content p {
    color: #64748b;
    font-size: 0.9rem;
    margin: 0;
}

.result-arrow {
    color: #94a3b8;
}

/* No Results */
.no-query, .no-results {
    text-align: center;
    padding: 60px 20px;
    background: white;
    border-radius: 16px;
}

.no-query i, .no-results i {
    font-size: 4rem;
    color: #e2e8f0;
    margin-bottom: 20px;
}

.no-query h3, .no-results h3 {
    font-size: 1.5rem;
    color: #1e293b;
    margin-bottom: 10px;
}

.no-query p, .no-results p {
    color: #64748b;
}

.suggestions {
    margin: 25px 0;
    text-align: left;
    max-width: 300px;
    margin-left: auto;
    margin-right: auto;
}

.suggestions h4 {
    color: #1e293b;
    margin-bottom: 10px;
}

.suggestions ul {
    color: #64748b;
    padding-left: 20px;
}

.suggestions li {
    margin-bottom: 5px;
}

.btn-back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: #6366f1;
    color: white;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    transition: background 0.3s;
}

.btn-back:hover {
    background: #4f46e5;
}

/* Quick Links */
.quick-links-section {
    background: white;
    border-radius: 16px;
    padding: 30px;
}

.quick-links-section h2 {
    font-size: 1.25rem;
    color: #1e293b;
    margin-bottom: 20px;
}

.quick-links {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
}

.quick-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 15px;
    background: #f8fafc;
    border-radius: 8px;
    text-decoration: none;
    color: #1e293b;
    transition: all 0.3s;
}

.quick-link:hover {
    background: #eef2ff;
    color: #6366f1;
}

.quick-link i {
    color: #6366f1;
}
</style>
