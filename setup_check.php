<?php
/**
 * QRForge Database Setup Verification
 * This page helps verify that the database is properly configured
 */
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QRForge - Database Setup Check</title>
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #f8f6f0 0%, #f0f0f0 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
        }
        
        h1 {
            color: #1a1a1a;
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5rem;
        }
        
        .status-card {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #7c9885;
        }
        
        .status-success {
            border-left-color: #28a745;
            background: #d4edda;
        }
        
        .status-error {
            border-left-color: #dc3545;
            background: #f8d7da;
        }
        
        .status-warning {
            border-left-color: #ffc107;
            background: #fff3cd;
        }
        
        .status-info {
            border-left-color: #17a2b8;
            background: #d1ecf1;
        }
        
        .status-title {
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 1.1rem;
        }
        
        .status-content {
            color: #4a4a4a;
            line-height: 1.6;
        }
        
        .check-button {
            background: linear-gradient(135deg, #7c9885, #d4a574);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 1.1rem;
            cursor: pointer;
            margin: 20px auto;
            display: block;
            transition: all 0.3s ease;
        }
        
        .check-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(124, 152, 133, 0.3);
        }
        
        .loading {
            text-align: center;
            padding: 20px;
        }
        
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #7c9885;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .hidden {
            display: none;
        }
        
        .code-block {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 4px;
            padding: 15px;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
            overflow-x: auto;
            margin: 10px 0;
        }
        
        .step {
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #7c9885;
        }
        
        .step-number {
            background: #7c9885;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 15px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>QRForge Database Setup Check</h1>
        
        <div class="status-card status-info">
            <div class="status-title">📊 Database Status Check</div>
            <div class="status-content">
                This page will help you verify that your QRForge database is properly configured and ready to use.
                Click the button below to run a comprehensive check of your database setup.
            </div>
        </div>
        
        <button class="check-button" onclick="checkDatabaseStatus()">
            🔍 Check Database Status
        </button>
        
        <div id="loading" class="loading hidden">
            <div class="spinner"></div>
            <p>Checking database status...</p>
        </div>
        
        <div id="results"></div>
        
        <div id="setup-instructions" class="hidden">
            <h2>📋 Database Setup Instructions</h2>
            
            <div class="step">
                <span class="step-number">1</span>
                <strong>Start XAMPP Services</strong>
                <p>Open XAMPP Control Panel and start both Apache and MySQL services.</p>
            </div>
            
            <div class="step">
                <span class="step-number">2</span>
                <strong>Access phpMyAdmin</strong>
                <p>Open your browser and go to: <a href="http://localhost/phpmyadmin" target="_blank">http://localhost/phpmyadmin</a></p>
                <p>Login with username: <strong>root</strong> and leave password empty (XAMPP default)</p>
            </div>
            
            <div class="step">
                <span class="step-number">3</span>
                <strong>Create Database</strong>
                <p>Click the "Databases" tab, enter database name: <strong>qrforge</strong>, then click "Create"</p>
            </div>
            
            <div class="step">
                <span class="step-number">4</span>
                <strong>Import Database Schema</strong>
                <p>Click on the "qrforge" database, then click "Import" tab.</p>
                <p>Upload and import the <strong>config/database.sql</strong> file.</p>
            </div>
            
            <div class="step">
                <span class="step-number">5</span>
                <strong>Verify Installation</strong>
                <p>You should see 6 tables created in your database:</p>
                <ul>
                    <li>qr_codes</li>
                    <li>user_settings</li>
                    <li>batch_jobs</li>
                    <li>analytics</li>
                    <li>style_presets</li>
                </ul>
            </div>
            
            <div class="step">
                <span class="step-number">6</span>
                <strong>Alternative: Command Line Import</strong>
                <p>You can also import the database using command line:</p>
                <div class="code-block">
                    mysql -u root -p < config/database.sql
                </div>
                <p>(Enter password when prompted - leave empty for XAMPP default)</p>
            </div>
            
            <h3>🔧 Configuration Options</h3>
            
            <div class="status-card status-info">
                <div class="status-title">MySQL (Default)</div>
                <div class="status-content">
                    <strong>Database:</strong> qrforge<br>
                    <strong>Host:</strong> localhost<br>
                    <strong>Port:</strong> 3306<br>
                    <strong>Username:</strong> root<br>
                    <strong>Password:</strong> (empty)<br>
                    <br>
                    Perfect for XAMPP installations and production use.
                </div>
            </div>
            
            <div class="status-card status-info">
                <div class="status-title">SQLite (Alternative)</div>
                <div class="status-content">
                    <strong>Database File:</strong> config/qrforge.db<br>
                    <strong>Zero Configuration:</strong> No server required<br>
                    <br>
                    Great for development, testing, or simple deployments.
                    <br><br>
                    To use SQLite, edit <strong>config/config.php</strong> and change:
                    <div class="code-block">
                        'type' => 'sqlite'
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        async function checkDatabaseStatus() {
            // Show loading
            document.getElementById('loading').classList.remove('hidden');
            document.getElementById('results').innerHTML = '';
            document.getElementById('setup-instructions').classList.add('hidden');
            
            try {
                const response = await fetch('config/database_status.php');
                const result = await response.json();
                
                // Hide loading
                document.getElementById('loading').classList.add('hidden');
                
                // Display results
                displayResults(result);
                
            } catch (error) {
                // Hide loading
                document.getElementById('loading').classList.add('hidden');
                
                // Show error
                document.getElementById('results').innerHTML = `
                    <div class="status-card status-error">
                        <div class="status-title">❌ Connection Error</div>
                        <div class="status-content">
                            Failed to connect to the database. Please check your XAMPP services and database configuration.
                            <br><br>
                            <strong>Error:</strong> ${error.message}
                        </div>
                    </div>
                `;
                
                // Show setup instructions
                document.getElementById('setup-instructions').classList.remove('hidden');
            }
        }
        
        function displayResults(result) {
            let html = '';
            
            if (result.success) {
                // Database connection successful
                html += `
                    <div class="status-card status-success">
                        <div class="status-title">✅ Database Connection Successful</div>
                        <div class="status-content">
                            <strong>Database Type:</strong> ${result.database_type}<br>
                            <strong>Connection Status:</strong> Connected<br>
                            <strong>Style Presets:</strong> ${result.style_presets} presets loaded<br>
                            <strong>Recent Activity:</strong> ${result.recent_activity.length} QR codes generated in last day
                        </div>
                    </div>
                `;
                
                // Show connection details
                if (result.connection_status && result.connection_status.connected) {
                    html += `
                        <div class="status-card status-info">
                            <div class="status-title">📈 Connection Details</div>
                            <div class="status-content">
                                <strong>Tables:</strong> ${result.connection_status.tables.join(', ')}<br>
                                <strong>QR Statistics (7 days):</strong> ${result.connection_status.qr_statistics ? result.connection_status.qr_statistics.length : 0} records<br>
                                <strong>Batch Statistics (7 days):</strong> ${result.connection_status.batch_statistics ? result.connection_status.batch_statistics.length : 0} records
                            </div>
                        </div>
                    `;
                }
                
                html += `
                    <div class="status-card status-success">
                        <div class="status-title">🎉 Setup Complete</div>
                        <div class="status-content">
                            Your QRForge database is properly configured and ready to use!
                            You can now generate QR codes with full database tracking and analytics.
                        </div>
                    </div>
                `;
                
            } else {
                // Database connection failed
                html += `
                    <div class="status-card status-error">
                        <div class="status-title">❌ Database Connection Failed</div>
                        <div class="status-content">
                            <strong>Error:</strong> ${result.error}<br>
                            <strong>Details:</strong> ${result.details || 'No additional details available'}
                            <br><br>
                            Please follow the setup instructions below to configure your database.
                        </div>
                    </div>
                `;
                
                // Show setup instructions
                document.getElementById('setup-instructions').classList.remove('hidden');
            }
            
            document.getElementById('results').innerHTML = html;
        }
    </script>
</body>
</html>