<?php
/**
 * QRForge SQLite Database Alternative
 * For users who prefer file-based database instead of MySQL
 */

class QRDatabaseSQLite {
    private $pdo;
    private $database_file;
    
    public function __construct($database_file = 'config/qrforge.db') {
        $this->database_file = $database_file;
        
        try {
            // Create directory if it doesn't exist
            $dir = dirname($database_file);
            if (!file_exists($dir)) {
                mkdir($dir, 0777, true);
            }
            
            // Connect to SQLite database
            $this->pdo = new PDO("sqlite:" . $database_file);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            
            // Create tables if they don't exist
            $this->initializeDatabase();
            
        } catch (PDOException $e) {
            error_log("SQLite database connection failed: " . $e->getMessage());
            throw new Exception("SQLite database connection failed");
        }
    }
    
    /**
     * Initialize database with required tables
     */
    private function initializeDatabase() {
        // Create qr_codes table
        $sql = "CREATE TABLE IF NOT EXISTS qr_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            file_path TEXT NOT NULL,
            data_type TEXT NOT NULL,
            original_data TEXT NOT NULL,
            generated_data TEXT NOT NULL,
            size INTEGER DEFAULT 200,
            fg_color TEXT DEFAULT '#000000',
            bg_color TEXT DEFAULT '#ffffff',
            format TEXT DEFAULT 'png',
            ecc_level TEXT DEFAULT 'M',
            logo_path TEXT DEFAULT NULL,
            template TEXT DEFAULT 'classic',
            dot_style TEXT DEFAULT 'square',
            corner_style TEXT DEFAULT 'square',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME DEFAULT NULL,
            access_count INTEGER DEFAULT 0,
            ip_address TEXT DEFAULT NULL,
            user_agent TEXT DEFAULT NULL
        )";
        
        $this->pdo->exec($sql);
        
        // Create user_settings table
        $sql = "CREATE TABLE IF NOT EXISTS user_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            default_size INTEGER DEFAULT 200,
            default_format TEXT DEFAULT 'png',
            default_ecc TEXT DEFAULT 'M',
            default_fg_color TEXT DEFAULT '#000000',
            default_bg_color TEXT DEFAULT '#ffffff',
            default_template TEXT DEFAULT 'classic',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )";
        
        $this->pdo->exec($sql);
        
        // Create batch_jobs table
        $sql = "CREATE TABLE IF NOT EXISTS batch_jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id TEXT NOT NULL UNIQUE,
            filename TEXT NOT NULL,
            original_filename TEXT NOT NULL,
            total_items INTEGER NOT NULL,
            processed_items INTEGER DEFAULT 0,
            failed_items INTEGER DEFAULT 0,
            status TEXT DEFAULT 'pending',
            settings TEXT DEFAULT NULL,
            zip_file TEXT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            started_at DATETIME DEFAULT NULL,
            completed_at DATETIME DEFAULT NULL,
            ip_address TEXT DEFAULT NULL
        )";
        
        $this->pdo->exec($sql);
        
        // Create analytics table
        $sql = "CREATE TABLE IF NOT EXISTS analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            qr_id INTEGER DEFAULT NULL,
            event_type TEXT NOT NULL,
            data_type TEXT DEFAULT NULL,
            size INTEGER DEFAULT NULL,
            format TEXT DEFAULT NULL,
            processing_time REAL DEFAULT NULL,
            ip_address TEXT DEFAULT NULL,
            user_agent TEXT DEFAULT NULL,
            referrer TEXT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (qr_id) REFERENCES qr_codes(id) ON DELETE SET NULL
        )";
        
        $this->pdo->exec($sql);
        
        // Create style_presets table
        $sql = "CREATE TABLE IF NOT EXISTS style_presets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT DEFAULT NULL,
            settings TEXT NOT NULL,
            is_default BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )";
        
        $this->pdo->exec($sql);
        
        // Insert default presets
        $this->insertDefaultPresets();
    }
    
    /**
     * Insert default style presets
     */
    private function insertDefaultPresets() {
        $count = $this->pdo->query("SELECT COUNT(*) FROM style_presets")->fetchColumn();
        
        if ($count == 0) {
            $presets = [
                ['Classic', 'Traditional black and white QR code', '{"fgColor": "#000000", "bgColor": "#ffffff", "dotStyle": "square", "cornerStyle": "square"}', 1],
                ['Modern', 'Sage green with rounded dots', '{"fgColor": "#7c9885", "bgColor": "#f8f6f0", "dotStyle": "rounded", "cornerStyle": "circle"}', 0],
                ['Elegant', 'Dark gray with circular dots', '{"fgColor": "#4a4a4a", "bgColor": "#f8f6f0", "dotStyle": "circle", "cornerStyle": "square"}', 0],
                ['Vibrant', 'Coral color with dot corners', '{"fgColor": "#d4a574", "bgColor": "#ffffff", "dotStyle": "square", "cornerStyle": "dot"}', 0]
            ];
            
            $sql = "INSERT INTO style_presets (name, description, settings, is_default) VALUES (?, ?, ?, ?)";
            $stmt = $this->pdo->prepare($sql);
            
            foreach ($presets as $preset) {
                $stmt->execute($preset);
            }
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
        $sql = "SELECT * FROM qr_codes WHERE id = ? AND (expires_at IS NULL OR expires_at > datetime('now'))";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get QR code by filename
     */
    public function getQRCodeByFilename($filename) {
        $sql = "SELECT * FROM qr_codes WHERE filename = ? AND (expires_at IS NULL OR expires_at > datetime('now'))";
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
        $sql = "SELECT * FROM style_presets WHERE is_default = 1 LIMIT 1";
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
            $sql1 = "DELETE FROM qr_codes WHERE created_at < datetime('now', '-$days_old days')";
            $stmt1 = $this->pdo->prepare($sql1);
            $stmt1->execute();
            $deleted_qr = $stmt1->rowCount();
            
            // Delete old batch jobs
            $sql2 = "DELETE FROM batch_jobs WHERE created_at < datetime('now', '-$days_old days')";
            $stmt2 = $this->pdo->prepare($sql2);
            $stmt2->execute();
            $deleted_jobs = $stmt2->rowCount();
            
            // Delete old analytics
            $sql3 = "DELETE FROM analytics WHERE created_at < datetime('now', '-$days_old days')";
            $stmt3 = $this->pdo->prepare($sql3);
            $stmt3->execute();
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
            'file' => $this->database_file,
            'connected' => $this->isConnected(),
            'tables' => $this->getTableList()
        ];
    }
    
    /**
     * Get list of tables
     */
    private function getTableList() {
        $sql = "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'";
        $stmt = $this->pdo->query($sql);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
}
?>