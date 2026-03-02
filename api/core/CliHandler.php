<?php
// api/core/CliHandler.php - CLI command handler

class CliHandler
{
    public static function handle()
    {
        global $argv;

        if (!isset($argv[1])) {
            return false; // Not a CLI command
        }

        // Show help if requested
        if ($argv[1] === '--help' || $argv[1] === '-h') {
            require_once __DIR__ . '/../helpers/HelpSystem.php';
            
            // Check if specific command help is requested
            if (isset($argv[2])) {
                HelpSystem::showCommandHelp($argv[2]);
            } else {
                HelpSystem::showHelp();
            }
            exit();
        }

        // Load database connection first
        require_once __DIR__ . '/../database/connection.php';

        // Ensure $pdo is available globally
        global $pdo;
        if (!$pdo) {
            require_once __DIR__ . '/../helpers/HelpSystem.php';
            HelpSystem::showError("Database connection failed");
            exit(1);
        }

        // Add database connection check command
        if ($argv[1] === '--db:check') {
            require_once __DIR__ . '/../helpers/HelpSystem.php';
            try {
                $stmt = $pdo->query("SELECT 1");
                if ($stmt) {
                    HelpSystem::showSuccess("Database connection successful!");
                } else {
                    HelpSystem::showError("Database connection failed (query error)");
                }
            } catch (Exception $e) {
                HelpSystem::showError("Database connection failed: " . $e->getMessage());
            }
            exit();
        }

        switch ($argv[1]) {
            case '--migrate':
                require_once __DIR__ . '/Migrator.php';
                Migrator::run();
                exit();

            case '--seed':
                require_once __DIR__ . '/Seeder.php';
                Seeder::run();
                exit();

            case '--migrate:seed':
                require_once __DIR__ . '/Migrator.php';
                require_once __DIR__ . '/Seeder.php';
                Migrator::run();
                Seeder::run();
                exit();

            case '--seed:admin':
                self::seedAdmin();
                exit();

            case '--seed:essential':
                self::seedEssential();
                exit();

            case '--clear:data':
                self::clearData();
                exit();

            case '--clear':
                self::clearDatabase();
                exit();

            case '--fresh':
                self::freshDatabase();
                exit();

            case '--fix-permissions':
                self::fixUploadPermissions();
                exit();

            case (preg_match('/^--email(:\S+)?$/', $argv[1]) ? $argv[1] : false):
                self::handleEmailCommand($argv[1]);
                exit();

            default:
                require_once __DIR__ . '/../helpers/HelpSystem.php';
                HelpSystem::showError("Unknown command: {$argv[1]}");
                exit(1);
        }
    }

    public static function seedAdmin()
    {
        global $pdo;
        require_once __DIR__ . '/../helpers/HelpSystem.php';

        HelpSystem::showSuccess("Seeding admin user only...");

        try {
            // Run only role and user seeders
            require_once __DIR__ . '/../database/seeders/role_seeder.php';
            require_once __DIR__ . '/../database/seeders/user_seeder.php';
            
            $roleSeeder = new RoleSeeder($pdo);
            $roleSeeder->run();
            
            $userSeeder = new UserSeeder($pdo);
            $userSeeder->run();
            
            HelpSystem::showSuccess("Admin user seeded successfully!");
            echo "\n📋 Admin Login Credentials:\n";
            echo "📧 Email: admin@church.com\n";
            echo "🔑 Password: admin123\n";
            
        } catch (Exception $e) {
            HelpSystem::showError("Error seeding admin: " . $e->getMessage());
        }
    }

    public static function seedEssential()
    {
        global $pdo;
        require_once __DIR__ . '/../helpers/HelpSystem.php';

        HelpSystem::showSuccess("Seeding essential system components...");

        try {
            require_once __DIR__ . '/../database/seeders/essential_seeder.php';
            
            $essentialSeeder = new EssentialSeeder($pdo);
            $essentialSeeder->run();
            
            HelpSystem::showSuccess("Essential system components seeded successfully!");
            echo "\n📋 Admin Login Credentials:\n";
            echo "📧 Email: admin@church.com\n";
            echo "🔑 Password: admin123\n";
            
        } catch (Exception $e) {
            HelpSystem::showError("Error seeding essential: " . $e->getMessage());
        }
    }

    public static function clearData()
    {
        global $pdo;
        require_once __DIR__ . '/../helpers/HelpSystem.php';

        HelpSystem::showWarning("Clearing all data from database tables...");
        echo "⚠️  This will delete ALL records but keep table structure!\n";

        try {
            // Get all table names
            $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
            
            if (empty($tables)) {
                HelpSystem::showError("No tables found in database");
                return;
            }

            // Disable foreign key checks temporarily
            $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

            $clearedCount = 0;
            foreach ($tables as $table) {
                try {
                    $stmt = $pdo->prepare("TRUNCATE TABLE `$table`");
                    $stmt->execute();
                    echo "✅ Cleared table: $table\n";
                    $clearedCount++;
                } catch (Exception $e) {
                    try {
                        $stmt = $pdo->prepare("DELETE FROM `$table`");
                        $stmt->execute();
                        echo "✅ Cleared table: $table (using DELETE)\n";
                        $clearedCount++;
                    } catch (Exception $e2) {
                        echo "❌ Failed to clear table: $table\n";
                    }
                }
            }

            // Re-enable foreign key checks
            $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

            HelpSystem::showSuccess("Data clearing completed!");
            echo "📊 Cleared $clearedCount out of " . count($tables) . " tables\n";

        } catch (Exception $e) {
            $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
            HelpSystem::showError("Error clearing data: " . $e->getMessage());
        }
    }

    public static function clearDatabase()
    {
        global $pdo;
        require_once __DIR__ . '/../helpers/HelpSystem.php';

        HelpSystem::showWarning("Clearing database...");

        try {
            // Get all table names
            $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);

            if (empty($tables)) {
                HelpSystem::showSuccess("Database is already empty");
                return;
            }

            // Disable foreign key checks
            $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');

            // Drop all tables
            foreach ($tables as $table) {
                $pdo->exec("DROP TABLE IF EXISTS `$table`");
                echo "🗑️  Dropped table: $table\n";
            }

            // Re-enable foreign key checks
            $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');

            HelpSystem::showSuccess("Database cleared successfully!");
        } catch (Exception $e) {
            HelpSystem::showError("Error clearing database: " . $e->getMessage());
        }
    }

    public static function freshDatabase()
    {
        require_once __DIR__ . '/../helpers/HelpSystem.php';
        
        HelpSystem::showSuccess("Creating fresh database...");

        // Clear first
        self::clearDatabase();

        // Then migrate and seed
        require_once __DIR__ . '/Migrator.php';
        require_once __DIR__ . '/Seeder.php';

        echo "\n📦 Running migrations...\n";
        Migrator::run();

        echo "\n🌱 Running seeders...\n";
        Seeder::run();

        HelpSystem::showSuccess("Fresh database created successfully!");
    }

    private static function handleEmailCommand($command) {
        // Load Emailer
        require_once __DIR__ . '/Emailer.php';
        require_once __DIR__ . '/../helpers/HelpSystem.php';
        
        // Parse email from command - REQUIRED
        if (!preg_match('/^--email:(.+)$/', $command, $matches)) {
            HelpSystem::showError("Email address is required!");
            echo "Usage: php api/index.php --email:user@example.com\n";
            echo "Example: php api/index.php --email:test@gmail.com\n";
            return;
        }
        
        $emailAddress = trim($matches[1]);
        
        // Test email sending
        Emailer::test($emailAddress);
    }

    public static function fixUploadPermissions()
    {
        require_once __DIR__ . '/../helpers/HelpSystem.php';
        
        HelpSystem::showSuccess("Church System - Upload Permission Fixer");
        echo "==========================================\n\n";
        
        $uploadsDir = __DIR__ . '/../uploads';
        $pagesDir = $uploadsDir . '/pages'; // Reference directory (known to work)
        
        echo "🔍 Checking all upload directories...\n";
        
        // Get all directories in uploads folder
        $uploadDirs = [];
        if (is_dir($uploadsDir)) {
            $iterator = new DirectoryIterator($uploadsDir);
            foreach ($iterator as $fileinfo) {
                if ($fileinfo->isDir() && !$fileinfo->isDot()) {
                    $uploadDirs[] = $fileinfo->getFilename();
                }
            }
        }
        
        echo "📁 Found upload directories: " . implode(', ', $uploadDirs) . "\n\n";
        
        // Check if pages directory exists (our reference)
        if (!is_dir($pagesDir)) {
            HelpSystem::showError("Reference pages directory not found: $pagesDir");
            exit(1);
        }
        
        // Get pages directory permissions (our reference)
        $pagesPerms = fileperms($pagesDir);
        $pagesOctal = substr(sprintf('%o', $pagesPerms), -4);
        echo "📋 Using pages directory as reference with permissions: $pagesOctal\n\n";
        
        $fixedDirs = 0;
        $totalFiles = 0;
        
        // Fix permissions for each upload directory
        foreach ($uploadDirs as $dirName) {
            $currentDir = $uploadsDir . '/' . $dirName;
            
            echo "=== Processing: $dirName ===\n";
            
            // Get current directory permissions
            $currentPerms = fileperms($currentDir);
            $currentOctal = substr(sprintf('%o', $currentPerms), -4);
            
            echo "Current permissions: $currentOctal\n";
            
            if ($currentOctal !== $pagesOctal) {
                echo "🔧 Fixing directory permissions...\n";
                if (chmod($currentDir, $pagesPerms)) {
                    echo "✅ Updated directory permissions to $pagesOctal\n";
                    $fixedDirs++;
                } else {
                    echo "❌ Failed to update directory permissions\n";
                }
            } else {
                echo "✅ Directory permissions already correct\n";
            }
            
            // Fix file permissions in this directory
            if (is_dir($currentDir)) {
                $dirFiles = 0;
                $dirFixed = 0;
                
                $iterator = new RecursiveIteratorIterator(
                    new RecursiveDirectoryIterator($currentDir),
                    RecursiveIteratorIterator::SELF_FIRST
                );
                
                foreach ($iterator as $file) {
                    if ($file->isFile()) {
                        $dirFiles++;
                        
                        // Set file permissions to 644 (readable by all, writable by owner)
                        if (chmod($file->getPathname(), 0644)) {
                            $dirFixed++;
                        } else {
                            echo "❌ Failed to fix: " . $file->getFilename() . "\n";
                        }
                    }
                }
                
                echo "📄 Fixed permissions for $dirFixed/$dirFiles files\n";
                $totalFiles += $dirFixed;
            }
            
            echo "\n";
        }
        
        echo "=== SUMMARY ===\n";
        echo "🔧 Fixed $fixedDirs directories\n";
        echo "📄 Fixed $totalFiles files\n";
        
        // Final verification
        echo "\n=== FINAL VERIFICATION ===\n";
        foreach ($uploadDirs as $dirName) {
            $currentDir = $uploadsDir . '/' . $dirName;
            $currentPerms = fileperms($currentDir);
            $currentOctal = substr(sprintf('%o', $currentPerms), -4);
            
            $status = ($currentOctal === $pagesOctal) ? "✅" : "❌";
            echo "$status $dirName: $currentOctal\n";
        }
        
        echo "\n";
        HelpSystem::showSuccess("ALL UPLOAD DIRECTORIES PROCESSED!");
        echo "Permission fixing complete.\n";
    }
}
