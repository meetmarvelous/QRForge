<?php
/**
 * QRForge Configuration File
 * Switch between MySQL and SQLite database backends
 */

return [
    // Database Configuration
    'database' => [
        // Choose database type: 'mysql' or 'sqlite'
        'type' => 'mysql',
        
        // MySQL Configuration (for XAMPP)
        'mysql' => [
            'host' => 'localhost',
            'port' => 3306,
            'database' => 'qrforge',
            'username' => 'root',
            'password' => '',
            'charset' => 'utf8mb4'
        ],
        
        // SQLite Configuration
        'sqlite' => [
            'file' => 'config/qrforge.db'
        ]
    ],
    
    // Application Settings
    'app' => [
        'name' => 'QRForge',
        'version' => '1.0.0',
        'url' => (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]" . dirname($_SERVER['PHP_SELF']),
        'debug' => true,
        'timezone' => 'UTC'
    ],
    
    // QR Code Settings
    'qr' => [
        'default_size' => 200,
        'default_format' => 'png',
        'default_ecc' => 'M',
        'default_fg_color' => '#000000',
        'default_bg_color' => '#ffffff',
        'max_size' => 1000,
        'min_size' => 100,
        'cache_dir' => 'cache',
        'cleanup_days' => 30 // Deprecated in favor of security.cleanup_interval
    ],
    
    // Batch Processing Settings
    'batch' => [
        'max_items' => 1000,
        'max_file_size' => 10485760, // 10MB
        'supported_formats' => ['csv'],
        'zip_compression' => true
    ],
    
    // Security Settings
    'security' => [
        'rate_limit' => 100, // requests per minute
        'max_requests_per_hour' => 1000,
        'cleanup_interval' => 3600 // 1 hour in seconds
    ],
    
    // Analytics Settings
    'analytics' => [
        'track_generations' => true,
        'track_downloads' => true,
        'track_views' => true,
        'track_batch_jobs' => true,
        'retention_days' => 90
    ]
];
?>