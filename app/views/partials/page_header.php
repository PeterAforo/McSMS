<!-- Page Header -->
<div class="page-header">
    <div>
        <h1 class="page-title"><?= $pageTitle ?? 'Page Title' ?></h1>
        <?php if (isset($breadcrumbs)): ?>
            <div class="page-breadcrumb">
                <?php foreach ($breadcrumbs as $index => $crumb): ?>
                    <?php if ($index > 0): ?>
                        <i class="fas fa-chevron-right"></i>
                    <?php endif; ?>
                    <?php if (isset($crumb['url'])): ?>
                        <a href="<?= $crumb['url'] ?>"><?= $crumb['label'] ?></a>
                    <?php else: ?>
                        <span><?= $crumb['label'] ?></span>
                    <?php endif; ?>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>
    <?php if (isset($headerActions)): ?>
        <div class="page-actions">
            <?= $headerActions ?>
        </div>
    <?php endif; ?>
</div>
