<?php
// Mock session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$_SESSION['admin_logged_in'] = true;

// Mock server variables
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['HTTP_HOST'] = 'localhost';
$_SERVER['PHP_SELF'] = '/admin/index.php';

// Capture output
ob_start();

try {
    require __DIR__ . '/../admin/index.php';
    $output = ob_get_clean();
    echo "Dashboard loaded successfully.\n";
    
    // Check for specific content to verify variables are working
    if (strpos($output, 'Total QR Codes') !== false) {
        echo "Stats displayed correctly.\n";
    } else {
        echo "Warning: Stats label not found.\n";
    }
    
    if (strpos($output, 'Connected') !== false) {
        echo "Database status displayed correctly.\n";
    } else {
        echo "Warning: Database status not found.\n";
    }
    
} catch (Throwable $e) {
    ob_end_clean();
    echo "Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . " on line " . $e->getLine() . "\n";
}
?>
