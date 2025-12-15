-- Parent Wallets Table
CREATE TABLE IF NOT EXISTS parent_wallets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Wallet Transactions Table
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    type ENUM('credit', 'debit') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255),
    reference VARCHAR(100),
    balance_before DECIMAL(10, 2),
    balance_after DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_parent (parent_id),
    INDEX idx_type (type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment Transactions Table (for Hubtel integration)
CREATE TABLE IF NOT EXISTS payment_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_reference VARCHAR(100) NOT NULL UNIQUE,
    hubtel_reference VARCHAR(100),
    hubtel_transaction_id VARCHAR(100),
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    INDEX idx_client_ref (client_reference),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add wallet payment method to payments table if not exists
ALTER TABLE payments 
MODIFY COLUMN payment_method ENUM('cash', 'bank_transfer', 'mobile_money', 'cheque', 'hubtel', 'wallet') DEFAULT 'cash';

-- Insert sample wallet balance for testing
-- INSERT INTO parent_wallets (parent_id, balance) 
-- SELECT id, 5000.00 FROM users WHERE role = 'parent' LIMIT 1;
