<?php
// api/core/Seeder.php - Simple seeder runner

class Seeder {
    public static function run() {
        global $pdo;
        
        // Check for command arguments
        global $argv;
        $command = isset($argv[2]) ? $argv[2] : 'seed';
        
        switch ($command) {
            case 'seed':
            default:
                self::executeSeeders();
                break;
        }
    }
    
    private static function executeSeeders() {
        global $pdo;

        // Run PHP seeders
        $seederDir = __DIR__ . '/../database/seeders/';
        $phpFiles = glob($seederDir . '*.php');
        
        if (empty($phpFiles)) {
            self::logSeeder("No seed files found in $seederDir");
            return;
        }
        
        foreach ($phpFiles as $file) {
            $seederName = basename($file, '.php');
            self::logSeeder("Running seeder: $seederName");
            
            // Get classes before including the file
            $classesBefore = get_declared_classes();
            
            require_once $file;
            
            // Get classes after including the file
            $classesAfter = get_declared_classes();
            
            // Find new classes (the ones that were added)
            $newClasses = array_diff($classesAfter, $classesBefore);
            $seederClass = null;
            
            foreach ($newClasses as $class) {
                // Look for both "Seed" and "Seeder" classes
                if (strpos($class, 'Seed') !== false) {
                    $seederClass = $class;
                    break;
                }
            }
            
            if ($seederClass) {
                $seeder = new $seederClass($pdo);
                try {
                    $seeder->run();
                    self::logSeeder("Seeder completed: $seederName");
                } catch (Exception $e) {
                    self::logSeeder("Error running seeder $seederName: " . $e->getMessage());
                }
            } else {
                self::logSeeder("No seeder class found in $seederName");
            }
        }
    }
    
    private static function logSeeder($message) {
        $logDir = __DIR__ . '/../storage/logs/';
        $logFile = $logDir . 'upoui.log';
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        $timestamp = date('Y-m-d H:i:s');
        file_put_contents($logFile, "[$timestamp] SEEDER: $message\n", FILE_APPEND);
        echo "$message\n"; // Also echo to terminal
    }
}
?> 