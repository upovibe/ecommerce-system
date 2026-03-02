<?php
// api/core/Migrator.php - Core migration runner: supports models and SQL files

class Migrator {
    public static function run() {
        global $pdo;
        
        // Check for command arguments
        global $argv;
        $command = isset($argv[2]) ? $argv[2] : 'migrate';
        
        switch ($command) {
            case 'status':
                self::status();
                break;
            case 'rollback':
                $steps = isset($argv[3]) ? (int)$argv[3] : 1;
                self::rollback($steps);
                break;
            case 'migrate':
            default:
                self::executeMigrations();
                break;
        }
    }
    
    private static function executeMigrations() {
        global $pdo;

        // Existing Step 1: Migrations tracking table
        try {
            $pdo->exec('CREATE TABLE IF NOT EXISTS migrations (id INT AUTO_INCREMENT PRIMARY KEY, migration VARCHAR(255) UNIQUE, batch INT, executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)'); // Added batch for rollback grouping
            self::logMigration('Migrations tracking table ready.');
        } catch (PDOException $e) {
            self::logMigration('Error setting up migrations table: ' . $e->getMessage());
            die();
        }

        // Check if batch column exists and add it if not
        $columnCheck = $pdo->query("SHOW COLUMNS FROM migrations LIKE 'batch'")->rowCount();
        if ($columnCheck == 0) {
            $pdo->exec('ALTER TABLE migrations ADD COLUMN batch INT AFTER migration');
            self::logMigration('Added batch column to migrations table.');
        }

        // New Step: Run PHP migrations
        $migrationDir = __DIR__ . '/../database/migrations/';
        $phpFiles = glob($migrationDir . '*_*.php');
        usort($phpFiles, function($a, $b) { return strcmp(basename($a), basename($b)); }); // Sort by timestamp in filename
        $batch = (int) $pdo->query('SELECT MAX(batch) FROM migrations')->fetchColumn() + 1;
        foreach ($phpFiles as $file) {
            $migrationName = basename($file, '.php');
            // Check if already migrated
            $stmt = $pdo->prepare('SELECT * FROM migrations WHERE migration = ?');
            $stmt->execute([$migrationName]);
            if ($stmt->fetch()) {
                self::logMigration('Skipping already migrated PHP: ' . $migrationName);
                continue;
            }

            require_once $file;
            $class = 'Migration_' . str_replace(['_', '.php'], ['', ''], basename($file));
            $migration = new $class($pdo);
            try {
                $migration->up();
                $trackStmt = $pdo->prepare('INSERT INTO migrations (migration, batch) VALUES (?, ?)');
                $trackStmt->execute([$migrationName, $batch]);
                self::logMigration('PHP migration completed: ' . $migrationName);
            } catch (Exception $e) {
                self::logMigration('Error running PHP migration ' . $migrationName . ': ' . $e->getMessage());
            }
        }

        // Existing model and SQL steps here (unchanged)...
    }

    public static function status() {
        global $pdo;
        
        try {
            // Check if migrations table exists
            $pdo->exec('CREATE TABLE IF NOT EXISTS migrations (id INT AUTO_INCREMENT PRIMARY KEY, migration VARCHAR(255) UNIQUE, batch INT, executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
            
            // Get all migration files
            $migrationDir = __DIR__ . '/../database/migrations/';
            $phpFiles = glob($migrationDir . '*_*.php');
            usort($phpFiles, function($a, $b) { return strcmp(basename($a), basename($b)); });
            
            // Get executed migrations
            $executedMigrations = $pdo->query('SELECT migration, batch, executed_at FROM migrations ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
            $executedMigrationNames = array_column($executedMigrations, 'migration');
            
            echo "\n=== Migration Status ===\n";
            echo str_pad("Migration", 50) . str_pad("Status", 15) . str_pad("Batch", 8) . "Executed At\n";
            echo str_repeat("-", 100) . "\n";
            
            foreach ($phpFiles as $file) {
                $migrationName = basename($file, '.php');
                $status = in_array($migrationName, $executedMigrationNames) ? '✓ Ran' : '✗ Pending';
                $batch = '';
                $executedAt = '';
                
                if (in_array($migrationName, $executedMigrationNames)) {
                    foreach ($executedMigrations as $executed) {
                        if ($executed['migration'] === $migrationName) {
                            $batch = $executed['batch'];
                            $executedAt = $executed['executed_at'];
                            break;
                        }
                    }
                }
                
                echo str_pad($migrationName, 50) . 
                     str_pad($status, 15) . 
                     str_pad($batch, 8) . 
                     $executedAt . "\n";
            }
            
            // Summary
            $totalMigrations = count($phpFiles);
            $ranMigrations = count($executedMigrationNames);
            $pendingMigrations = $totalMigrations - $ranMigrations;
            
            echo "\n=== Summary ===\n";
            echo "Total migrations: $totalMigrations\n";
            echo "Ran: $ranMigrations\n";
            echo "Pending: $pendingMigrations\n";
            
            if ($pendingMigrations > 0) {
                echo "\nTo run pending migrations: php index.php --migrate\n";
            }
            
        } catch (Exception $e) {
            echo "Error checking migration status: " . $e->getMessage() . "\n";
        }
    }

    public static function rollback($steps = 1) {
        global $pdo;
        $lastBatch = $pdo->query('SELECT MAX(batch) FROM migrations')->fetchColumn();
        if (!$lastBatch) {
            self::logMigration('No migrations to rollback.');
            return;
        }
        $migrations = $pdo->query('SELECT migration FROM migrations WHERE batch = ' . $lastBatch . ' ORDER BY id DESC LIMIT ' . $steps)->fetchAll(PDO::FETCH_COLUMN);
        foreach ($migrations as $migrationName) {
            $file = __DIR__ . '/../database/migrations/' . $migrationName . '.php';
            if (!file_exists($file)) continue;
            require_once $file;
            $class = 'Migration_' . str_replace(['_', '.php'], ['', ''], $migrationName);
            $migration = new $class($pdo);
            try {
                $migration->down();
                $pdo->prepare('DELETE FROM migrations WHERE migration = ?')->execute([$migrationName]);
                self::logMigration('Rolled back: ' . $migrationName);
            } catch (Exception $e) {
                self::logMigration('Error rolling back ' . $migrationName . ': ' . $e->getMessage());
            }
        }
    }

    private static function logMigration($message) {
        $logDir = __DIR__ . '/../storage/logs/';
        $logFile = $logDir . 'upoui.log';
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        $timestamp = date('Y-m-d H:i:s');
        file_put_contents($logFile, "[$timestamp] $message\n", FILE_APPEND);
        echo "$message\n"; // Also echo to terminal
    }
}
?> 