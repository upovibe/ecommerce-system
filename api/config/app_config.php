<?php
// Central app configuration for database and email
return [
    'db' => [
        'host' => 'localhost', // Change to your DB host
        'name' => '4555497_church', // Change to your DB name
        'user' => 'root',      // Change to your DB user
        'pass' => '',          // Change to your DB password
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
    'client_url' => 'http://localhost:8081',
    'api_url' => 'http://localhost:8081/api',
    'app_url' => 'http://localhost:8081',
]; 

// cd church-system; php -S localhost:8081           # Run server

// cd church-system; php api/index.php --help       # Show help

// cd church-system; php api/index.php --fresh    # Drop tables, create tables, add default data

// cd church-system; php api/index.php --migrate    # Create tables

// cd church-system; php api/index.php --seed       # Add default data

// cd church-system; php api/index.php --seed:admin   # Create only the admin user account

// cd church-system; php api/index.php --seed:essential   # Create essential system components

// cd church-system; php api/index.php --clear:data   # Remove all data from tables

// cd church-system; php api/index.php --email:test@example.com   # Test email