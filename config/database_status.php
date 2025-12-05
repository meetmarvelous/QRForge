<?php
header('Content-Type: application/json');

// Include database factory
require_once 'database_factory.php';

try {
    $factory = DatabaseFactory::getInstance();
    $db = $factory->getDatabase();
    
    // Get database statistics
    $stats = $factory->getStatistics();
    
    // Get database type
    $db_type = $factory->getDatabaseType();
    
    // Get recent QR codes
    $recent_qrs = $db->getQRStatistics(1);
    
    // Get style presets
    $presets = $db->getStylePresets();
    
    echo json_encode([
        'success' => true,
        'database_type' => $db_type,
        'connection_status' => $stats,
        'recent_activity' => $recent_qrs,
        'style_presets' => count($presets),
        'message' => 'Database status checked successfully'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Failed to check database status',
        'details' => $e->getMessage()
    ]);
}
?>