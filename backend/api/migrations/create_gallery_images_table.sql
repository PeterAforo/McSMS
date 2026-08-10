-- Create gallery_images table for authentication page background images
CREATE TABLE IF NOT EXISTS gallery_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    page_assignment ENUM('login','register','forgot_password','any') DEFAULT 'any',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed existing gallery images
INSERT IGNORE INTO gallery_images (filename, page_assignment) VALUES
('1.jpg', 'any'),
('2.jpg', 'any'),
('3.jpg', 'any'),
('4.jpg', 'any'),
('5.jpg', 'any'),
('6.jpg', 'any'),
('7.jpg', 'any'),
('8.jpg', 'any');
