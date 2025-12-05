<?php
require_once 'auth.php';
require_once '../config/config.php';
require_once '../config/database_factory.php';

$db = DatabaseFactory::getInstance()->getDatabase();
$cache_dir = '../' . (defined('QR_CACHE_DIR') ? QR_CACHE_DIR : 'cache/');
$message = '';
$error = '';

// Handle deletion
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_file'])) {
    $file_to_delete = basename($_POST['delete_file']);
    $file_path = $cache_dir . $file_to_delete;
    
    if (file_exists($file_path) && is_file($file_path)) {
        if (unlink($file_path)) {
            $db->logAdminAction('delete_cache', "Deleted file: $file_to_delete");
            $message = "File '$file_to_delete' deleted successfully.";
        } else {
            $error = "Failed to delete '$file_to_delete'. Check permissions.";
        }
    } else {
        $error = "File not found.";
    }
}

// Get files
$files = [];
if (is_dir($cache_dir)) {
    $scanned_files = scandir($cache_dir);
    foreach ($scanned_files as $file) {
        if ($file !== '.' && $file !== '..' && $file !== '.gitkeep' && $file !== 'index.php') {
            $path = $cache_dir . $file;
            $files[] = [
                'name' => $file,
                'size' => filesize($path),
                'date' => filemtime($path)
            ];
        }
    }
}

// Sort by date desc
usort($files, function($a, $b) {
    return $b['date'] - $a['date'];
});

$page_title = 'Cache Manager';
require_once 'includes/header.php';
?>

<div class="row mb-4">
    <div class="col-12">
        <?php if ($message): ?>
            <div class="alert alert-success"><?php echo htmlspecialchars($message); ?></div>
        <?php endif; ?>
        <?php if ($error): ?>
            <div class="alert alert-danger"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>
        
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">QR Code Cache</h5>
                <span class="badge bg-primary"><?php echo count($files); ?> files</span>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped table-hover align-middle">
                        <thead>
                            <tr>
                                <th>Preview</th>
                                <th>Filename</th>
                                <th>Size</th>
                                <th>Created</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (empty($files)): ?>
                                <tr>
                                    <td colspan="5" class="text-center">Cache is empty.</td>
                                </tr>
                            <?php else: ?>
                                <?php foreach ($files as $file): ?>
                                    <tr>
                                        <td>
                                            <?php if (preg_match('/\.(png|jpg|jpeg|gif|svg)$/i', $file['name'])): ?>
                                                <img src="../cache/<?php echo htmlspecialchars($file['name']); ?>" alt="QR" style="width: 40px; height: 40px; object-fit: contain; border: 1px solid #ddd; border-radius: 4px;">
                                            <?php else: ?>
                                                <span class="badge bg-secondary">N/A</span>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <a href="../cache/<?php echo htmlspecialchars($file['name']); ?>" target="_blank" class="text-decoration-none">
                                                <?php echo htmlspecialchars($file['name']); ?>
                                            </a>
                                        </td>
                                        <td><?php echo round($file['size'] / 1024, 2); ?> KB</td>
                                        <td><?php echo date('Y-m-d H:i:s', $file['date']); ?></td>
                                        <td>
                                            <form method="POST" onsubmit="return confirm('Are you sure you want to delete this file?');">
                                                <input type="hidden" name="delete_file" value="<?php echo htmlspecialchars($file['name']); ?>">
                                                <button type="submit" class="btn btn-sm btn-danger">Delete</button>
                                            </form>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<?php require_once 'includes/footer.php'; ?>
