<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Hardcoded credentials as requested
define('ADMIN_USER', 'admin');
define('ADMIN_PASS', 'admin');

// Function to check if user is logged in
function isAdminLoggedIn() {
    return isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
}

// Function to require login
function requireLogin() {
    if (!isAdminLoggedIn()) {
        header('Location: login.php');
        exit();
    }
}

// Handle Login
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'login') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';

    if ($username === ADMIN_USER && $password === ADMIN_PASS) {
        $_SESSION['admin_logged_in'] = true;
        
        // Log login
        require_once '../config/database_factory.php';
        $db = DatabaseFactory::getInstance()->getDatabase();
        $db->logAdminAction('login', 'Admin logged in successfully');
        
        header('Location: index.php');
        exit();
    } else {
        $error = "Invalid username or password";
    }
}

// Handle Logout
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    session_destroy();
    header('Location: login.php');
    exit();
}
?>
