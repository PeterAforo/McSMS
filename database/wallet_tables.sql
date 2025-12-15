-- Wallet System Tables
-- Run this to add wallet functionality

-- Parent/User Wallets
CREATE TABLE IF NOT EXISTS wallets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Wallet Transaction History
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id INT NOT NULL,
    type ENUM('credit','debit') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description VARCHAR(255),
    reference VARCHAR(100),
    balance_before DECIMAL(10,2),
    balance_after DECIMAL(10,2),
    payment_method VARCHAR(50) DEFAULT NULL,
    invoice_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
    INDEX idx_wallet (wallet_id),
    INDEX idx_type (type),
    INDEX idx_reference (reference)
);
