<?php
/**
 * QRForge Cleanup Script
 * Run this script periodically to clean up old QR codes and data
 */

require_once 'database_factory.php';

// Set time limit for long-running operations
set_time_limit(300); // 5 minutes

// Prevent web access
if (PHP_SAPI !== 'cli') {
    die("This script must be run from the command line\n");
}

echo "QRForge Cleanup Script\n";
echo "======================\n\n";

try {
    $factory = DatabaseFactory::getInstance();
    $db = $factory->getDatabase();
    
    echo "Database Type: " . $factory->getDatabaseType() . "\n";
    echo "Connection Status: " . ($db->isConnected() ? "Connected" : "Failed") . "\n\n";
    
    if (!$db->isConnected()) {
        die("Database connection failed. Cannot proceed with cleanup.\n");
    }
    
    // Get current statistics
    echo "Before Cleanup:\n";
    echo "---------------\n";
    
    $stats = $factory->getStatistics();
    if ($stats['connected']) {
        $qr_stats = $db->getQRStatistics(30);
        $batch_stats = $db->getBatchStatistics(30);
        
        echo "Total QR codes in last 30 days: " . count($qr_stats) . "\n";
        echo "Total batch jobs in last 30 days: " . count($batch_stats) . "\n";
        echo "Database tables: " . count($stats['tables']) . "\n";
        echo "Tables: " . implode(', ', $stats['tables']) . "\n\n";
    }
    
    // Cleanup old QR codes (default 30 days)
    echo "Cleaning up old QR codes...\n";
    $cleanup_result = $factory->cleanup(30);
    
    if ($cleanup_result) {
        echo "✓ Cleanup completed successfully:\n";
        echo "  - QR codes deleted: " . $cleanup_result['qr_codes'] . "\n";
        echo "  - Batch jobs deleted: " . $cleanup_result['batch_jobs'] . "\n";
        echo "  - Analytics records deleted: " . $cleanup_result['analytics'] . "\n";
        echo "  - Total records cleaned: " . $cleanup_result['total'] . "\n\n";
    } else {
        echo "✗ Cleanup failed or no records to clean\n\n";
    }
    
    // Clean up expired files in cache directory
    echo "Cleaning up cache directory...\n";
    $cache_dir = 'cache';
    $deleted_files = 0;
    $total_size = 0;
    
    if (is_dir($cache_dir)) {
        $files = scandir($cache_dir);
        $current_time = time();
        $expiration_time = 30 * 24 * 60 * 60; // 30 days in seconds
        
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') continue;
            
            $file_path = $cache_dir . '/' . $file;
            if (is_file($file_path)) {
                $file_age = $current_time - filemtime($file_path);
                
                if ($file_age > $expiration_time) {
                    $file_size = filesize($file_path);
                    if (unlink($file_path)) {
                        $deleted_files++;
                        $total_size += $file_size;
                    }
                }
            }
        }
    }
    
    echo "✓ Cache cleanup completed:\n";
    echo "  - Files deleted: $deleted_files\n";
    echo "  - Space freed: " . $this->formatBytes($total_size) . "\n\n";
    
    // Clean up batch directory
    echo "Cleaning up batch directory...\n";
    $batch_dir = 'cache/batch';
    $deleted_batch_files = 0;
    $batch_size = 0;
    
    if (is_dir($batch_dir)) {
        $files = scandir($batch_dir);
        
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') continue;
            
            $file_path = $batch_dir . '/' . $file;
            if (is_file($file_path)) {
                $file_age = $current_time - filemtime($file_path);
                
                if ($file_age > $expiration_time) {
                    $file_size = filesize($file_path);
                    if (unlink($file_path)) {
                        $deleted_batch_files++;
                        $batch_size += $file_size;
                    }
                }
            }
        }
    }
    
    echo "✓ Batch directory cleanup completed:\n";
    echo "  - Files deleted: $deleted_batch_files\n";
    echo "  - Space freed: " . $this->formatBytes($batch_size) . "\n\n";
    
    // Get final statistics
    echo "After Cleanup:\n";
    echo "--------------\n";
    
    $final_stats = $factory->getStatistics();
    if ($final_stats['connected']) {
        $final_qr_stats = $db->getQRStatistics(30);
        $final_batch_stats = $db->getBatchStatistics(30);
        
        echo "Total QR codes in last 30 days: " . count($final_qr_stats) . "\n";
        echo "Total batch jobs in last 30 days: " . count($final_batch_stats) . "\n";
        echo "Total space freed: " . $this->formatBytes($total_size + $batch_size) . "\n\n";
    }
    
    echo "Cleanup completed successfully!\n";
    echo "================================\n\n";
    
    // Recommend next cleanup time
    echo "Next recommended cleanup: " . date('Y-m-d H:i:s', strtotime('+7 days')) . "\n";
    echo "You can set up a cron job to run this script weekly:\n";
    echo "0 2 * * 0 /usr/bin/php 