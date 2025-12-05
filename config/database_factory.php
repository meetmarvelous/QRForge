<?php
/**
 * QRForge Database Factory
 * Automatically loads the correct database class based on configuration
 */

require_once 'config.php';

class DatabaseFactory {
    private static $instance = null;
    private $database = null;
    
    private function __construct() {
        // Private constructor to prevent direct instantiation
    }
    
    /**
     * Get singleton instance
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Get database connection
     */
    public function getDatabase() {
        if ($this->database === null) {
            $config = require 'config.php';
            
            try {
                if ($config['database']['type'] === 'mysql') {
                    require_once 'database.php';
                    $mysql_config = $config['database']['mysql'];
                    $this->database = new QRDatabase(
                        $mysql_config['host'],
                        $mysql_config['database'],
                        $mysql_config['username'],
                        $mysql_config['password'],
                        $mysql_config['port']
                    );
                } else {
                    require_once 'database_sqlite.php';
                    $sqlite_config = $config['database']['sqlite'];
                    $this->database = new QRDatabaseSQLite($sqlite_config['file']);
                }
            } catch (Exception $e) {
                // Fallback to SQLite if MySQL fails
                error_log("Primary database connection failed, falling back to SQLite: " . $e->getMessage());
                require_once 'database_sqlite.php';
                $this->database = new QRDatabaseSQLite('config/qrforge_fallback.db');
            }
        }
        
        return $this->database;
    }
    
    /**
     * Get database type
     */
    public function getDatabaseType() {
        $config = require 'config.php';
        return $config['database']['type'];
    }
    
    /**
     * Test database connection
     */
    public function testConnection() {
        try {
            $db = $this->getDatabase();
            return $db->isConnected();
        } catch (Exception $e) {
            return false;
        }
    }
    
    /**
     * Get database statistics
     */
    public function getStatistics() {
        try {
            $db = $this->getDatabase();
            $stats = [
                'connected' => $db->isConnected(),
                'type' => $this->getDatabaseType(),
                'tables' => []
            ];
            
            if ($stats['connected']) {
                $stats['tables'] = $db->getTableList();
                $stats['qr_statistics'] = $db->getQRStatistics(7);
                $stats['batch_statistics'] = $db->getBatchStatistics(7);
            }
            
            return $stats;
        } catch (Exception $e) {
            return [
                'connected' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Cleanup old data
     */
    public function cleanup($days = 30) {
        try {
            $db = $this->getDatabase();
            return $db->cleanupOldQRCodes($days);
        } catch (Exception $e) {
            error_log("Cleanup failed: " . $e->getMessage());
            return false;
        }
    }
}

/**
 * Global helper function to get database instance
 */
function getDatabase() {
    return DatabaseFactory::getInstance()->getDatabase();
}

/**
 * Global helper function to test database connection
 */
function testDatabaseConnection() {
    return DatabaseFactory::getInstance()->testConnection();
}

/**
 * Global helper function to get database statistics
 */
function getDatabaseStatistics() {
    return DatabaseFactory::getInstance()->getStatistics();
}

/**
 * Global helper function to cleanup old data
 */
function cleanupDatabase($days = 30) {
    return DatabaseFactory::getInstance()->cleanup($days);
}
?>