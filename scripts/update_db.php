<?php
// Mock server variables for CLI
$_SERVER['HTTP_HOST'] = 'localhost';
$_SERVER['PHP_SELF'] = '/scripts/update_db.php';
$_SERVER['REQUEST_METHOD'] = 'GET';

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/database_factory.php';

try {
    $db = DatabaseFactory::getInstance()->getDatabase();
    $pdo = $db->getPdo(); // We need direct PDO access or add a method to run arbitrary SQL
    
    // Since we don't have getPdo() public, let's use a raw connection or add a method.
    // Actually, let's just use the config to connect directly for this update script.
    
    $host = DB_HOST;
    $dbname = DB_NAME;
    $username = DB_USER;
    $password = DB_PASS;
    $port = DB_PORT;
    
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    
    $sql = "CREATE TABLE IF NOT EXISTS admin_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        action VARCHAR(50) NOT NULL,
        details TEXT,
        ip_address VARCHAR(45),
        user_agent VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    
    $pdo->exec($sql);
    echo "Table 'admin_logs' created successfully.";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
