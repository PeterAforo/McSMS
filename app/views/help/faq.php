<div class="help-faq">
    <!-- Breadcrumb -->
    <div class="help-breadcrumb">
        <a href="<?= APP_URL ?>/index.php?c=help&a=index"><i class="fas fa-home"></i> Help Center</a>
        <i class="fas fa-chevron-right"></i>
        <span>FAQ</span>
    </div>
    
    <!-- Header -->
    <div class="faq-header">
        <h1><i class="fas fa-question-circle"></i> Frequently Asked Questions</h1>
        <p>Find answers to common questions about using the school management system</p>
    </div>
    
    <!-- FAQ Categories -->
    <div class="faq-content">
        <?php foreach ($faqs as $category): ?>
        <div class="faq-category">
            <h2 class="category-title">
                <i class="fas fa-folder"></i>
                <?= $category['category'] ?>
            </h2>
            <div class="faq-list">
                <?php foreach ($category['questions'] as $index => $qa): ?>
                <div class="faq-item">
                    <button class="faq-question" onclick="toggleFaq(this)">
                        <span class="question-text">
                            <i class="fas fa-question-circle"></i>
                            <?= $qa['q'] ?>
                        </span>
                        <i class="fas fa-chevron-down faq-toggle"></i>
                    </button>
                    <div class="faq-answer">
                        <p><?= $qa['a'] ?></p>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
        <?php endforeach; ?>
    </div>
    
    <!-- Still Need Help -->
    <div class="still-need-help">
        <div class="help-icon">
            <i class="fas fa-life-ring"></i>
        </div>
        <h3>Still Need Help?</h3>
        <p>Can't find what you're looking for? Here are some other resources:</p>
        <div class="help-options">
            <a href="<?= APP_URL ?>/index.php?c=help&a=index" class="help-option">
                <i class="fas fa-book"></i>
                <span>Browse Help Center</span>
            </a>
            <a href="<?= APP_URL ?>/index.php?c=help&a=roleGuide" class="help-option">
                <i class="fas fa-user-tag"></i>
                <span>View Role Guide</span>
            </a>
            <a href="<?= APP_URL ?>/index.php?c=help&a=interactions" class="help-option">
                <i class="fas fa-project-diagram"></i>
                <span>Module Interactions</span>
            </a>
        </div>
    </div>
</div>

<script>
function toggleFaq(button) {
    const faqItem = button.parentElement;
    const isOpen = faqItem.classList.contains('open');
    
    // Close all other FAQs
    document.querySelectorAll('.faq-item.open').forEach(item => {
        item.classList.remove('open');
    });
    
    // Toggle current FAQ
    if (!isOpen) {
        faqItem.classList.add('open');
    }
}
</script>

<style>
.help-faq {
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

.faq-header {
    text-align: center;
    margin-bottom: 40px;
}

.faq-header h1 {
    font-size: 2rem;
    color: #1e293b;
    margin-bottom: 10px;
}

.faq-header h1 i {
    color: #6366f1;
}

.faq-header p {
    color: #64748b;
}

/* FAQ Categories */
.faq-category {
    margin-bottom: 30px;
}

.category-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1.25rem;
    color: #1e293b;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 2px solid #e2e8f0;
}

.category-title i {
    color: #6366f1;
}

/* FAQ Items */
.faq-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.faq-item {
    background: white;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
    transition: all 0.3s;
}

.faq-item:hover {
    border-color: #6366f1;
}

.faq-item.open {
    border-color: #6366f1;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.faq-question {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 20px;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    font-size: 1rem;
    color: #1e293b;
    font-weight: 500;
}

.question-text {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex: 1;
}

.question-text i {
    color: #6366f1;
    margin-top: 3px;
    flex-shrink: 0;
}

.faq-toggle {
    color: #94a3b8;
    transition: transform 0.3s;
    flex-shrink: 0;
}

.faq-item.open .faq-toggle {
    transform: rotate(180deg);
    color: #6366f1;
}

.faq-answer {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease-out;
}

.faq-item.open .faq-answer {
    max-height: 500px;
}

.faq-answer p {
    padding: 0 20px 20px 52px;
    margin: 0;
    color: #64748b;
    line-height: 1.7;
}

/* Still Need Help */
.still-need-help {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border-radius: 16px;
    padding: 40px;
    text-align: center;
    color: white;
    margin-top: 40px;
}

.help-icon {
    width: 70px;
    height: 70px;
    background: rgba(255,255,255,0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    margin: 0 auto 20px;
}

.still-need-help h3 {
    font-size: 1.5rem;
    margin-bottom: 10px;
}

.still-need-help p {
    opacity: 0.9;
    margin-bottom: 25px;
}

.help-options {
    display: flex;
    justify-content: center;
    gap: 15px;
    flex-wrap: wrap;
}

.help-option {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: rgba(255,255,255,0.2);
    border-radius: 8px;
    color: white;
    text-decoration: none;
    font-weight: 500;
    transition: background 0.3s;
}

.help-option:hover {
    background: rgba(255,255,255,0.3);
}

@media (max-width: 768px) {
    .faq-answer p {
        padding-left: 20px;
    }
    
    .help-options {
        flex-direction: column;
    }
    
    .help-option {
        justify-content: center;
    }
}
</style>
