<?php
/**
 * QRForge Database Connection and Helper Class
 * Handles all database operations with support for XAMPP default configuration
 */

class QRDatabase {
    private $pdo;
    private $host;
    private $dbname;
    private $username;
    private $password;
    private $port;
    
    public function __construct(
        $host = 'localhost', 
        $dbname = 'qrforge', 
        $username = 'root', 
        $password = '', 
        $port = 3306
    ) {
        $this->host = $host;
        $this->dbname = $dbname;
        $this->username = $username;
        $this->password = $password;
        $this->port = $port;
        
        try {
            $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
            $this->pdo = new PDO($dsn, $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            // Log error and provide fallback
            error_log("Database connection failed: " . $e->getMessage());
            throw new Exception("Database connection failed. Please check your database configuration.");
        }
    }
    
    /**
     * Save QR code metadata to database
     */
    public function saveQRCode($data) {
        $sql = "INSERT INTO qr_codes 
                (filename, file_path, data_type, original_data, generated_data, size, 
                 fg_color, bg_color, format, ecc_level, logo_path, template, dot_style, corner_style, 
                 ip_address, user_agent, expires_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $this->pdo->prepare($sql);
        
        // Calculate expiration date (30 days from now)
        $expires_at = date('Y-m-d H:i:s', strtotime('+30 days'));
        
        $stmt->execute([
            $data['filename'],
            $data['file_path'],
            $data['type'],
            json_encode($data['original_data']),
            $data['generated_data'],
            $data['size'],
            $data['fg_color'],
            $data['bg_color'],
            $data['format'],
            $data['ecc'],
            $data['logo_path'] ?? null,
            $data['template'] ?? 'classic',
            $data['dot_style'] ?? 'square',
            $data['corner_style'] ?? 'square',
            $this->getClientIP(),
            $this->getUserAgent(),
            $expires_at
        ]);
        
        return $this->pdo->lastInsertId();
    }
    
    /**
     * Get QR code by ID
     */
    public function getQRCode($id) {
        $sql = "SELECT * FROM qr_codes WHERE id = ? AND (expires_at IS NULL OR expires_at > NOW())";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get QR code by filename
     */
    public function getQRCodeByFilename($filename) {
        $sql = "SELECT * FROM qr_codes WHERE filename = ? AND (expires_at IS NULL OR expires_at > NOW())";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$filename]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Increment QR code access count
     */
    public function incrementAccessCount($id) {
        $sql = "UPDATE qr_codes SET access_count = access_count + 1 WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id]);
    }
    
    /**
     * Get user's default settings
     */
    public function getUserSettings($session_id) {
        $sql = "SELECT * FROM user_settings WHERE session_id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$session_id]);
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$settings) {
            // Create default settings
            return $this->createDefaultUserSettings($session_id);
        }
        
        return $settings;
    }
    
    /**
     * Create default user settings
     */
    private function createDefaultUserSettings($session_id) {
        $sql = "INSERT INTO user_settings (session_id) VALUES (?)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$session_id]);
        
        return [
            'id' => $this->pdo->lastInsertId(),
            'session_id' => $session_id,
            'default_size' => 200,
            'default_format' => 'png',
            'default_ecc' => 'M',
            'default_fg_color' => '#000000',
            'default_bg_color' => '#ffffff',
            'default_template' => 'classic'
        ];
    }
    
    /**
     * Update user settings
     */
    public function updateUserSettings($session_id, $settings) {
        $sql = "UPDATE user_settings SET 
                default_size = ?, default_format = ?, default_ecc = ?, 
                default_fg_color = ?, default_bg_color = ?, default_template = ?
                WHERE session_id = ?";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            $settings['default_size'] ?? 200,
            $settings['default_format'] ?? 'png',
            $settings['default_ecc'] ?? 'M',
            $settings['default_fg_color'] ?? '#000000',
            $settings['default_bg_color'] ?? '#ffffff',
            $settings['default_template'] ?? 'classic',
            $session_id
        ]);
        
        return $stmt->rowCount() > 0;
    }
    
    /**
     * Create batch job
     */
    public function createBatchJob($job_data) {
        $sql = "INSERT INTO batch_jobs 
                (job_id, filename, original_filename, total_items, settings, ip_address) 
                VALUES (?, ?, ?, ?, ?, ?)";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            $job_data['job_id'],
            $job_data['filename'],
            $job_data['original_filename'],
            $job_data['total_items'],
            json_encode($job_data['settings']),
            $this->getClientIP()
        ]);
        
        return $this->pdo->lastInsertId();
    }
    
    /**
     * Update batch job status
     */
    public function updateBatchJob($job_id, $status, $processed = null, $failed = null, $zip_file = null) {
        $updates = ["status = ?"];
        $params = [$status];
        
        if ($processed !== null) {
            $updates[] = "processed_items = ?";
            $params[] = $processed;
        }
        
        if ($failed !== null) {
            $updates[] = "failed_items = ?";
            $params[] = $failed;
        }
        
        if ($zip_file !== null) {
            $updates[] = "zip_file = ?";
            $params[] = $zip_file;
        }
        
        if ($status === 'processing') {
            $updates[] = "started_at = NOW()";
        } elseif ($status === 'completed' || $status === 'failed') {
            $updates[] = "completed_at = NOW()";
        }
        
        $sql = "UPDATE batch_jobs SET " . implode(", ", $updates) . " WHERE job_id = ?";
        $params[] = $job_id;
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->rowCount() > 0;
    }
    
    /**
     * Get batch job by ID
     */
    public function getBatchJob($job_id) {
        $sql = "SELECT * FROM batch_jobs WHERE job_id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$job_id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Log analytics event
     */
    public function logAnalytics($event_data) {
        $sql = "INSERT INTO analytics 
                (qr_id, event_type, data_type, size, format, processing_time, 
                 ip_address, user_agent, referrer) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            $event_data['qr_id'] ?? null,
            $event_data['event_type'],
            $event_data['data_type'] ?? null,
            $event_data['size'] ?? null,
            $event_data['format'] ?? null,
            $event_data['processing_time'] ?? null,
            $this->getClientIP(),
            $this->getUserAgent(),
            $_SERVER['HTTP_REFERER'] ?? null
        ]);
        
        return $this->pdo->lastInsertId();
    }
    
    /**
     * Get style presets
     */
    public function getStylePresets() {
        $sql = "SELECT * FROM style_presets ORDER BY name";
        $stmt = $this->pdo->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get default style preset
     */
    public function getDefaultStylePreset() {
        $sql = "SELECT * FROM style_presets WHERE is_default = TRUE LIMIT 1";
        $stmt = $this->pdo->query($sql);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Cleanup old QR codes and related data
     */
    public function cleanupOldQRCodes($days_old = 30) {
        try {
            $this->pdo->beginTransaction();
            
            // Delete old QR codes
            $sql1 = "DELETE FROM qr_codes WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)";
            $stmt1 = $this->pdo->prepare($sql1);
            $stmt1->execute([$days_old]);
            $deleted_qr = $stmt1->rowCount();
            
            // Delete old batch jobs
            $sql2 = "DELETE FROM batch_jobs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)";
            $stmt2 = $this->pdo->prepare($sql2);
            $stmt2->execute([$days_old]);
            $deleted_jobs = $stmt2->rowCount();
            
            // Delete old analytics
            $sql3 = "DELETE FROM analytics WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)";
            $stmt3 = $this->pdo->prepare($sql3);
            $stmt3->execute([$days_old]);
            $deleted_analytics = $stmt3->rowCount();
            
            $this->pdo->commit();
            
            return [
                'qr_codes' => $deleted_qr,
                'batch_jobs' => $deleted_jobs,
                'analytics' => $deleted_analytics,
                'total' => $deleted_qr + $deleted_jobs + $deleted_analytics
            ];
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
    
    /**
     * Get QR code statistics
     */
    public function getQRStatistics($days = 30) {
        $sql = "SELECT 
                DATE(created_at) as date,
                data_type,
                COUNT(*) as total_generated,
                SUM(access_count) as total_accessed,
                AVG(size) as avg_size,
                format,
                template
                FROM qr_codes 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY DATE(created_at), data_type, format, template
                ORDER BY date DESC";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$days]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get batch job statistics
     */
    public function getBatchStatistics($days = 30) {
        $sql = "SELECT 
                DATE(created_at) as date,
                status,
                COUNT(*) as total_jobs,
                SUM(total_items) as total_items_processed,
                AVG(processed_items) as avg_items_per_job,
                AVG(TIMESTAMPDIFF(SECOND, started_at, completed_at)) as avg_processing_time
                FROM batch_jobs 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY DATE(created_at), status
                ORDER BY date DESC";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$days]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Helper function to get client IP address
     */
    private function getClientIP() {
        $ip_keys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
        foreach ($ip_keys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                foreach (explode(',', $_SERVER[$key]) as $ip) {
                    $ip = trim($ip);
                    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                        return $ip;
                    }
                }
            }
        }
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
    
    /**
     * Helper function to get user agent
     */
    private function getUserAgent() {
        return $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
        ]);
        
        return $this->pdo->lastInsertId();
    }
    
    /**
     * Get style presets
     */
    public function getStylePresets() {
        $sql = "SELECT * FROM style_presets ORDER BY name";
        $stmt = $this->pdo->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get default style preset
     */
    public function getDefaultStylePreset() {
        $sql = "SELECT * FROM style_presets WHERE is_default = TRUE LIMIT 1";
        $stmt = $this->pdo->query($sql);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Cleanup old QR codes and related data
     */
    public function cleanupOldQRCodes($days_old = 30) {
        try {
            $this->pdo->beginTransaction();
            
            // Delete old QR codes
            $sql1 = "DELETE FROM qr_codes WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)";
            $stmt1 = $this->pdo->prepare($sql1);
            $stmt1->execute([$days_old]);
            $deleted_qr = $stmt1->rowCount();
            
            // Delete old batch jobs
            $sql2 = "DELETE FROM batch_jobs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)";
            $stmt2 = $this->pdo->prepare($sql2);
            $stmt2->execute([$days_old]);
            $deleted_jobs = $stmt2->rowCount();
            
            // Delete old analytics
            $sql3 = "DELETE FROM analytics WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)";
            $stmt3 = $this->pdo->prepare($sql3);
            $stmt3->execute([$days_old]);
            $deleted_analytics = $stmt3->rowCount();
            
            $this->pdo->commit();
            
            return [
                'qr_codes' => $deleted_qr,
                'batch_jobs' => $deleted_jobs,
                'analytics' => $deleted_analytics,
                'total' => $deleted_qr + $deleted_jobs + $deleted_analytics
            ];
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
    
    /**
     * Get QR code statistics
     */
    public function getQRStatistics($days = 30) {
        $sql = "SELECT 
                DATE(created_at) as date,
                data_type,
                COUNT(*) as total_generated,
                SUM(access_count) as total_accessed,
                AVG(size) as avg_size,
                format,
                template
                FROM qr_codes 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY DATE(created_at), data_type, format, template
                ORDER BY date DESC";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$days]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get batch job statistics
     */
    public function getBatchStatistics($days = 30) {
        $sql = "SELECT 
                DATE(created_at) as date,
                status,
                COUNT(*) as total_jobs,
                SUM(total_items) as total_items_processed,
                AVG(processed_items) as avg_items_per_job,
                AVG(TIMESTAMPDIFF(SECOND, started_at, completed_at)) as avg_processing_time
                FROM batch_jobs 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY DATE(created_at), status
                ORDER BY date DESC";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$days]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Helper function to get client IP address
     */
    private function getClientIP() {
        $ip_keys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
        foreach ($ip_keys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                foreach (explode(',', $_SERVER[$key]) as $ip) {
                    $ip = trim($ip);
                    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                        return $ip;
                    }
                }
            }
        }
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
    
    /**
     * Helper function to get user agent
     */
    private function getUserAgent() {
        return $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
    }
    
    /**
     * Check database connection
     */
    public function isConnected() {
        try {
            $this->pdo->query("SELECT 1");
            return true;
        } catch (PDOException $e) {
            return false;
        }
    }
    
    /**
     * Get database info
     */
    public function getDatabaseInfo() {
        return [
            'host' => $this->host,
            'database' => $this->dbname,
            'connected' => $this->isConnected(),
            'tables' => $this->getTableList()
        ];
    }
    
    /**
     * Get list of tables
     */
    public function getTableList() {
        $sql = "SHOW TABLES";
        $stmt = $this->pdo->query($sql);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
    /**
     * Log admin action
     */
    public function logAdminAction($action, $details = null) {
        try {
            $sql = "INSERT INTO admin_logs (action, details, ip_address, user_agent) VALUES (?, ?, ?, ?)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $action,
                $details,
                $this->getClientIP(),
                $this->getUserAgent()
            ]);
            return true;
        } catch (Exception $e) {
            // Silently fail for logs to avoid breaking main functionality
            return false;
        }
    }

    /**
     * Get admin logs
     */
    public function getAdminLogs($limit = 50) {
        $sql = "SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(1, (int)$limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get PDO instance
     */
    public function getPdo() {
        return $this->pdo;
    }
}
?>
```