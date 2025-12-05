-- QRForge Database Schema
-- Database: qrforge
-- Compatible with MySQL/MariaDB for XAMPP

CREATE DATABASE IF NOT EXISTS qrforge;
USE qrforge;

-- Main QR codes table
CREATE TABLE IF NOT EXISTS qr_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    original_data TEXT NOT NULL,
    generated_data TEXT NOT NULL,
    size INT DEFAULT 200,
    fg_color VARCHAR(7) DEFAULT '#000000',
    bg_color VARCHAR(7) DEFAULT '#ffffff',
    format VARCHAR(10) DEFAULT 'png',
    ecc_level VARCHAR(1) DEFAULT 'M',
    logo_path VARCHAR(500) DEFAULT NULL,
    template VARCHAR(50) DEFAULT 'classic',
    dot_style VARCHAR(20) DEFAULT 'square',
    corner_style VARCHAR(20) DEFAULT 'square',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL DEFAULT NULL,
    access_count INT DEFAULT 0,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    INDEX idx_data_type (data_type),
    INDEX idx_created_at (created_at),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User settings table (for future user management)
CREATE TABLE IF NOT EXISTS user_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    default_size INT DEFAULT 200,
    default_format VARCHAR(10) DEFAULT 'png',
    default_ecc VARCHAR(1) DEFAULT 'M',
    default_fg_color VARCHAR(7) DEFAULT '#000000',
    default_bg_color VARCHAR(7) DEFAULT '#ffffff',
    default_template VARCHAR(50) DEFAULT 'classic',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_session_id (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Batch processing jobs table
CREATE TABLE IF NOT EXISTS batch_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id VARCHAR(100) NOT NULL UNIQUE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    total_items INT NOT NULL,
    processed_items INT DEFAULT 0,
    failed_items INT DEFAULT 0,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    settings JSON DEFAULT NULL,
    zip_file VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL DEFAULT NULL,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    INDEX idx_job_id (job_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Analytics and usage tracking
CREATE TABLE IF NOT EXISTS analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    qr_id INT DEFAULT NULL,
    event_type ENUM('generate', 'download', 'view', 'batch_start', 'batch_complete') NOT NULL,
    data_type VARCHAR(50) DEFAULT NULL,
    size INT DEFAULT NULL,
    format VARCHAR(10) DEFAULT NULL,
    processing_time FLOAT DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    referrer VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (qr_id) REFERENCES qr_codes(id) ON DELETE SET NULL,
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at),
    INDEX idx_ip_address (ip_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Style presets table
CREATE TABLE IF NOT EXISTS style_presets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,
    settings JSON NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_is_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default style presets
INSERT INTO style_presets (name, description, settings, is_default) VALUES
('Classic', 'Traditional black and white QR code', 
'{"fgColor": "#000000", "bgColor": "#ffffff", "dotStyle": "square", "cornerStyle": "square"}', TRUE),

('Modern', 'Sage green with rounded dots', 
'{"fgColor": "#7c9885", "bgColor": "#f8f6f0", "dotStyle": "rounded", "cornerStyle": "circle"}', FALSE),

('Elegant', 'Dark gray with circular dots', 
'{"fgColor": "#4a4a4a", "bgColor": "#f8f6f0", "dotStyle": "circle", "cornerStyle": "square"}', FALSE),

('Vibrant', 'Coral color with dot corners', 
'{"fgColor": "#d4a574", "bgColor": "#ffffff", "dotStyle": "square", "cornerStyle": "dot"}', FALSE),

('Corporate', 'Professional blue theme', 
'{"fgColor": "#2563eb", "bgColor": "#ffffff", "dotStyle": "rounded", "cornerStyle": "square"}', FALSE),

('Minimalist', 'Clean black and white', 
'{"fgColor": "#000000", "bgColor": "#ffffff", "dotStyle": "square", "cornerStyle": "square"}', FALSE);

-- Create a view for QR code statistics
CREATE VIEW qr_statistics AS
SELECT 
    DATE(created_at) as date,
    data_type,
    COUNT(*) as total_generated,
    SUM(access_count) as total_accessed,
    AVG(size) as avg_size,
    format,
    template
FROM qr_codes 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at), data_type, format, template;

-- Create a view for batch job statistics
CREATE VIEW batch_statistics AS
SELECT 
    DATE(created_at) as date,
    status,
    COUNT(*) as total_jobs,
    SUM(total_items) as total_items_processed,
    AVG(processed_items) as avg_items_per_job,
    AVG(TIMESTAMPDIFF(SECOND, started_at, completed_at)) as avg_processing_time
FROM batch_jobs 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at), status;

-- Stored procedure for cleanup
DELIMITER //
CREATE PROCEDURE cleanup_old_qr_codes(IN days_old INT)
BEGIN
    DELETE FROM qr_codes WHERE created_at < DATE_SUB(NOW(), INTERVAL days_old DAY);
    DELETE FROM batch_jobs WHERE created_at < DATE_SUB(NOW(), INTERVAL days_old DAY);
    DELETE FROM analytics WHERE created_at < DATE_SUB(NOW(), INTERVAL days_old DAY);
END//
DELIMITER ;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON qrforge.* TO 'root'@'localhost';
-- FLUSH PRIVILEGES;

-- Display success message
SELECT 'QRForge database setup completed successfully!' as message;
SHOW TABLES FROM qrforge;

-- Admin Logs Table
CREATE TABLE IF NOT EXISTS admin_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);