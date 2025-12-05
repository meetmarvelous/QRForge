<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/database_factory.php';

try {
    $db = DatabaseFactory::getInstance()->getDatabase();
    
    // Log a test action
    $success = $db->logAdminAction('test_verify', 'Verification test from script');
    echo "Log action result: " . ($success ? "Success" : "Failure") . "\n";
    
    // Retrieve logs
    $logs = $db->getAdminLogs(5);
    echo "Latest logs:\n";
    foreach ($logs as $log) {
        echo "[{$log['created_at']}] {$log['action']}: {$log['details']}\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
