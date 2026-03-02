<?php
// api/config/cors.php - CORS configuration

// Load client URL from central config
$config = require __DIR__ . '/app_config.php';
$clientUrl = $config['client_url'];

return [
    // Allowed origins (domains that can access the API)
    'allowed_origins' => [
        $clientUrl,
    ],
    
    // Allowed HTTP methods
    'allowed_methods' => [
        'GET',
        'POST', 
        'PUT',
        'DELETE',
        'OPTIONS'
    ],
    
    // Allowed headers
    'allowed_headers' => [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-API-Key',
        'Accept'
    ],
    
    // Exposed headers (headers that browsers can access)
    'exposed_headers' => [
        'X-RateLimit-Remaining',
        'X-RateLimit-Limit'
    ],
    
    // Max age for preflight requests (in seconds)
    'max_age' => 86400, // 24 hours
    
    // Whether to allow credentials (cookies, authorization headers)
    'allow_credentials' => true,
    
    // Default origin if request origin is not in allowed list
    'default_origin' => $clientUrl
]; 