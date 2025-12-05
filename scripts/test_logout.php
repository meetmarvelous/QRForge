<?php
// Mock session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$_SESSION['admin_logged_in'] = true;

// Mock GET request
$_GET['action'] = 'logout';

// Mock header function to capture redirect
function header($str) {
    echo "Header called: $str\n";
}

// Capture output
ob_start();

try {
    require __DIR__ . '/../admin/auth.php';
    $output = ob_get_clean();
    
    if (session_status() === PHP_SESSION_NONE || empty($_SESSION['admin_logged_in'])) {
        echo "Session destroyed successfully.\n";
    } else {
        echo "Warning: Session might still be active.\n";
    }
    
} catch (Throwable $e) {
    ob_end_clean();
    echo "Error: " . $e->getMessage() . "\n";
}
?>
