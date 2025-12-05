<?php
require_once 'auth.php';
requireLogin();

// Include database factory
require_once '../config/database_factory.php';
foreach ($qr_stats as $stat) {
    $total_qr += $stat['total_generated'];
}

// Get Cache Size
$cacheDir = '../cache';
$cacheSize = 0;
$cacheCount = 0;
if (is_dir($cacheDir)) {
    $files = scandir($cacheDir);
    foreach ($files as $file) {
        if ($file !== '.' && $file !== '..') {
            $cacheSize += filesize($cacheDir . '/' . $file);
            $cacheCount++;
        }
    }
}
$cacheSizeMB = round($cacheSize / 1048576, 2);

include 'includes/header.php';
?>

<?php if ($message): ?>
    <div class="card" style="background: #d4edda; color: #155724; border: 1px solid #c3e6cb;">
        <?php echo htmlspecialchars($message); ?>
    </div>
<?php endif; ?>

<h1>Dashboard</h1>

<div class="stats-grid">
    <div class="stat-card">
        <div class="stat-label">Total QR Codes (7 Days)</div>
        <div class="stat-value"><?php echo $total_qr; ?></div>
    </div>
    <div class="stat-card">
        <div class="stat-label">Cache Files</div>
        <div class="stat-value"><?php echo $cacheCount; ?></div>
        <div class="stat-label"><?php echo $cacheSizeMB; ?> MB</div>
    </div>
    <div class="stat-card">
        <div class="stat-label">Database Status</div>
        <div class="stat-value" style="font-size: 24px; color: <?php echo $stats['connected'] ? '#28a745' : '#dc3545'; ?>">
            <?php echo $stats['connected'] ? 'Connected' : 'Error'; ?>
        </div>
        <div class="stat-label"><?php echo ucfirst($stats['type'] ?? 'Unknown'); ?></div>
    </div>
</div>

<div class="card">
    <div class="card-title">System Actions</div>
    <p>Manually trigger the cleanup process to remove old QR code files from the cache.</p>
    <form method="POST">
        <input type="hidden" name="action" value="cleanup">
        <button type="submit" class="btn btn-primary">Run Cleanup Now</button>
    </form>
</div>

<div class="card">
    <div class="card-title">Recent Activity (Last 7 Days)</div>
    <?php if (empty($qr_stats)): ?>
        <p>No recent activity found.</p>
    <?php else: ?>
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Generated</th>
                    <th>Format</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($qr_stats as $stat): ?>
                <tr>
                    <td><?php echo htmlspecialchars($stat['date']); ?></td>
                    <td><?php echo htmlspecialchars($stat['data_type']); ?></td>
                    <td><?php echo htmlspecialchars($stat['total_generated']); ?></td>
                    <td><?php echo htmlspecialchars($stat['format']); ?></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>
</div>

<?php include 'includes/footer.php'; ?>
