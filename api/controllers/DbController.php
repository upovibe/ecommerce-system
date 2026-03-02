<?php
// api/controllers/DbController.php
class DbController {
    public function test() {
        require_once __DIR__ . '/../database/connection.php';
        global $pdo;
        try {
            // Get database configuration
            $config = require __DIR__ . '/../config/app_config.php';
            $dbConfig = $config['db'];
            
            // Test simple query to verify connection
            $pdo->query("SELECT 1");
            
            echo json_encode([
                'success' => true,
                'message' => 'Database connection successful',
                'config' => [
                    'host' => $dbConfig['host'],
                    'database' => $dbConfig['name'],
                    'user' => $dbConfig['user']
                ]
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'error' => 'Database connection failed: ' . $e->getMessage()
            ]);
        }
    }

    public function check() {
        require_once __DIR__ . '/../database/connection.php';
        global $pdo;
        try {
            // Check if at least one table exists
            $stmt = $pdo->query("SHOW TABLES");
            $tables = $stmt->fetchAll(PDO::FETCH_NUM);
            if (!$tables) {
                echo json_encode(['success' => false, 'error' => 'No tables found in database.']);
                return;
            }
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    public function fresh() {
        $output = [];
        $result = 0;
        $phpPath = PHP_BINARY;
        $indexPath = realpath(__DIR__ . '/../index.php');
        if (!$indexPath || !file_exists($indexPath)) {
            echo json_encode([
                'success' => false,
                'error' => "Index file not found at $indexPath"
            ]);
            return;
        }
        $cmd = escapeshellarg($phpPath) . ' ' . escapeshellarg($indexPath) . ' --fresh 2>&1';
        exec($cmd, $output, $result);
        echo json_encode([
            'success' => $result === 0,
            'output' => implode("\n", $output)
        ]);
    }
} 