# QRForge Installation Guide

QRForge is designed to be easily deployable on any standard PHP hosting environment (Apache/Nginx + MySQL/MariaDB).

## Requirements

- **PHP**: 7.4 or higher
- **Database**: MySQL 5.7+ or MariaDB 10.2+ (or SQLite for testing)
- **Extensions**: `gd`, `pdo`, `pdo_mysql`, `json`, `zip`

## Installation Steps

1.  **Upload Files**: Upload all files to your web server's public directory (e.g., `public_html`).
2.  **Set Permissions**: Ensure the `cache` directory is writable by the web server.
    ```bash
    chmod 777 cache
    ```
3.  **Database Setup**:
    - Create a new database (e.g., `qrforge`).
    - Import the `config/database.sql` file into your database.
    - *Note: If using XAMPP, you can use the `setup_check.php` page for guidance.*

4.  **Configuration**:
    - Edit `config/config.php`.
    - Update the database credentials:
        ```php
        'mysql' => [
            'host' => 'localhost',
            'database' => 'your_database_name',
            'username' => 'your_username',
            'password' => 'your_password',
            // ...
        ],
        ```
    - *Note: The application URL is auto-detected, so you typically don't need to change the `url` setting.*

## Automated Cleanup

To prevent the server from filling up with QR code images, the system includes an automated cleanup feature.

### Option 1: Cron Job (Recommended)
Set up a cron job to run the cleanup script every hour:

```bash
0 * * * * php /path/to/your/site/scripts/cleanup.php
```

### Option 2: Auto-Trigger (Fallback)
The system automatically attempts to clean up old files (older than 1 hour) with a 1% probability on every generation request. This ensures cleanup happens even without a cron job, though a cron job is more reliable for high-traffic sites.

## Troubleshooting

- **Images not showing?** Check `cache` directory permissions.
- **Database error?** Verify credentials in `config/config.php` and ensure the database schema was imported correctly.
- **Run Setup Check**: Navigate to `/setup_check.php` in your browser to verify the environment.
