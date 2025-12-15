<div class="mb-5">
    <h1><?= $invoice ? 'Edit Invoice' : 'Create Invoice' ?></h1>
</div>

<div class="sms-card">
    <div class="card-header">
        <h2 class="card-title">Invoice Information</h2>
    </div>
    <div class="card-body">
        <form action="<?= APP_URL ?>/index.php?c=fees&a=storeInvoice" method="POST" data-validate id="invoiceForm">
            <?php if ($invoice): ?>
                <input type="hidden" name="invoice_id" value="<?= $invoice['id'] ?>">
                <input type="hidden" name="student_id" value="<?= $invoice['student_id'] ?>">
            <?php endif; ?>
            
            <?php if (!$invoice): ?>
            <div class="form-group">
                <label for="student_id" class="form-label">Student *</label>
                <select id="student_id" name="student_id" class="form-control form-select" required>
                    <option value="">Select Student</option>
                    <?php foreach ($students as $student): ?>
                        <option value="<?= $student['id'] ?>">
                            <?= htmlspecialchars($student['full_name']) ?> 
                            (<?= htmlspecialchars($student['student_number']) ?>) - 
                            <?= htmlspecialchars($student['class_name']) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            <?php else: ?>
            <div class="form-group">
                <label class="form-label">Student</label>
                <p style="font-weight: var(--font-weight-medium);">
                    <?= htmlspecialchars($invoice['student_name']) ?> 
                    (<?= htmlspecialchars($invoice['student_number']) ?>)
                </p>
            </div>
            <?php endif; ?>

            <div class="form-group">
                <label for="term_id" class="form-label">Term *</label>
                <select id="term_id" name="term_id" class="form-control form-select" required>
                    <option value="">Select Term</option>
                    <?php foreach ($terms as $term): ?>
                        <option value="<?= $term['id'] ?>" <?= ($invoice['term_id'] ?? '') == $term['id'] ? 'selected' : '' ?>>
                            <?= htmlspecialchars($term['term_name']) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">Invoice Items *</label>
                <div id="invoice-items">
                    <?php if ($invoice && !empty($invoice['items'])): ?>
                        <?php foreach ($invoice['items'] as $index => $item): ?>
                            <div class="invoice-item" style="display: flex; gap: var(--spacing-3); margin-bottom: var(--spacing-3); align-items: center;">
                                <input type="text" name="items[<?= $index ?>][label]" class="form-control" placeholder="Item description" required value="<?= htmlspecialchars($item['label']) ?>" style="flex: 2;">
                                <input type="number" name="items[<?= $index ?>][amount]" class="form-control" placeholder="Amount" required min="0.01" step="0.01" value="<?= $item['amount'] ?>" style="flex: 1;">
                                <button type="button" class="btn" style="background: var(--color-error); color: white;" onclick="removeItem(this)">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <div class="invoice-item" style="display: flex; gap: var(--spacing-3); margin-bottom: var(--spacing-3); align-items: center;">
                            <input type="text" name="items[0][label]" class="form-control" placeholder="Item description" required style="flex: 2;">
                            <input type="number" name="items[0][amount]" class="form-control" placeholder="Amount" required min="0.01" step="0.01" style="flex: 1;">
                            <button type="button" class="btn" style="background: var(--color-error); color: white;" onclick="removeItem(this)">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    <?php endif; ?>
                </div>
                <button type="button" class="btn btn-secondary" onclick="addItem()" style="margin-top: var(--spacing-2);">
                    <i class="fas fa-plus"></i> Add Item
                </button>
            </div>

            <div class="form-group">
                <button type="submit" class="btn btn-primary-sms">
                    <i class="fas fa-save"></i> <?= $invoice ? 'Update Invoice' : 'Create Invoice' ?>
                </button>
                <a href="<?= APP_URL ?>/index.php?c=fees&a=invoices" class="btn btn-outline">
                    <i class="fas fa-times"></i> Cancel
                </a>
            </div>
        </form>
    </div>
</div>

<script>
let itemIndex = <?= $invoice && !empty($invoice['items']) ? count($invoice['items']) : 1 ?>;

function addItem() {
    const container = document.getElementById('invoice-items');
    const newItem = document.createElement('div');
    newItem.className = 'invoice-item';
    newItem.style.cssText = 'display: flex; gap: var(--spacing-3); margin-bottom: var(--spacing-3); align-items: center;';
    newItem.innerHTML = `
        <input type="text" name="items[${itemIndex}][label]" class="form-control" placeholder="Item description" required style="flex: 2;">
        <input type="number" name="items[${itemIndex}][amount]" class="form-control" placeholder="Amount" required min="0.01" step="0.01" style="flex: 1;">
        <button type="button" class="btn" style="background: var(--color-error); color: white;" onclick="removeItem(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(newItem);
    itemIndex++;
}

function removeItem(button) {
    const items = document.querySelectorAll('.invoice-item');
    if (items.length > 1) {
        button.closest('.invoice-item').remove();
    } else {
        alert('Invoice must have at least one item.');
    }
}
</script>
