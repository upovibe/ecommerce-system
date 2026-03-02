<?php
// api/database/connection.php - Reusable DB connection

// Load config
$config = require __DIR__ . '/../config/app_config.php';
$dbConfig = $config['db'];

$host = $dbConfig['host'];
$db = $dbConfig['name'];
$user = $dbConfig['user'];
$pass = $dbConfig['pass'];

// Step 1: Connect without DB to check/create it
try {
    $tempPdo = new PDO("mysql:host=$host", $user, $pass);
    $tempPdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // Create DB if not exists
    $tempPdo->exec("CREATE DATABASE IF NOT EXISTS $db");
    $tempPdo = null; // Close temp connection
} catch (PDOException $e) {
    die(json_encode(['error' => 'DB Creation failed: ' . $e->getMessage()]));
}

// Step 2: Connect to the DB
try {
    global $pdo; // Declare as global
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['error' => 'DB Connection failed: ' . $e->getMessage()]));
}
?> 