<?php
/**
 * QRForge Cleanup Script
 * Deletes files in the cache directory older than the configured interval.
 * Can be run via cron job or included in other scripts.
 */

// Define base path if not defined
if (!defined('BASE_PATH')) {
    define('BASE_PATH', dirname(__DIR__));
}

// Load configuration
$config = require BASE_PATH . '/config/config.php';

// Get cleanup settings
$cacheDir = BASE_PATH . '/' . ($config['qr']['cache_dir'] ?? 'cache');
$cleanupSeconds = $config['security']['cleanup_interval'] ?? 3600; // Default to 1 hour

// Check if cache directory exists
if (!is_dir($cacheDir)) {
    // If running from CLI, output message
    if (php_sapi_name() === 'cli') {
        echo "Cache directory not found: $cacheDir\n";
    }
    return;
}

// Open directory
$dir = opendir($cacheDir);
$count = 0;
$now = time();

if ($dir) {
    while (($file = readdir($dir)) !== false) {
        // Skip dots and .gitkeep
        if ($file === '.' || $file === '..' || $file === '.gitkeep') {
            continue;
        }

        $filePath = $cacheDir . '/' . $file;
        
        // Check if file is older than cleanup interval
        if (is_file($filePath) && ($now - filemtime($filePath) >= $cleanupSeconds)) {
            if (unlink($filePath)) {
                $count++;
            }
        }
    }
    closedir($dir);
}

// Output result if running from CLI
if (php_sapi_name() === 'cli') {
    echo "Cleanup complete. Deleted $count files older than " . ($cleanupSeconds / 60) . " minutes.\n";
}
?>
