<?php
// Central app configuration for database and email
return [
    'db' => [
        'host' => 'localhost', // Change to your DB host
        'name' => '4555497_ecommerce', // Change to your DB name
        'user' => 'root',      // Change to your DB user
        'pass' => '',
        // 'user' => '4555497_ecommerce',      // Change to your DB user
        // 'pass' => '',        // Change to your DB password
    ],
    'mail' => [
        'host' => 'mboxhosting.com',
        'port' => isset($_SERVER['HTTP_HOST']) && $_SERVER['HTTP_HOST'] === 'church.ntubedglobal.com' ? 25 : 465,
        'encryption' => isset($_SERVER['HTTP_HOST']) && $_SERVER['HTTP_HOST'] === 'church.ntubedglobal.com' ? 'none' : 'ssl',
        'username' => 'info@piwcfranklincitytn.org',
        'password' => 'Piwc@FC2025',
        'from_address' => 'info@piwcfranklincitytn.org',
        'from_name' => 'PIWC-FC',
    ],
    'paystack' => [
        'secret_key' => 'sk_test_2fce1f3cb5afe10c9245611c792e0ff557ec6f90',
        'public_key' => 'pk_test_241d946866cc647b13f3263c8ee149ea844aa995',
        'api_url' => 'https://api.paystack.co',
    ],
    'client_url' => (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://" . ($_SERVER['HTTP_HOST'] ?? 'localhost:8002'),
    'api_url' => (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://" . ($_SERVER['HTTP_HOST'] ?? 'localhost:8002') . "/api",
    'app_url' => (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://" . ($_SERVER['HTTP_HOST'] ?? 'localhost:8002'),

]; 

// cd ecommerce-system; php -S localhost:8002         # Run server

// cd ecommerce-system; php api/index.php --help       # Show help

// cd ecommerce-system; php api/index.php --fresh    # Drop tables, create tables, add default data

// cd ecommerce-system; php api/index.php --migrate    # Create tables

// cd ecommerce-system; php api/index.php --seed       # Add default data

// cd ecommerce-system; php api/index.php --seed:admin   # Create only the admin user account

// cd ecommerce-system; php api/index.php --seed:essential   # Create essential system components

// cd ecommerce-system; php api/index.php --clear:data   # Remove all data from tables

// cd ecommerce-system; php api/index.php --email:test@example.com   # Test email
