<?php
// api/config/security.php - Security configuration

return [
    // Security headers
    'headers' => [
        'X-Content-Type-Options' => 'nosniff',
        'X-Frame-Options' => 'DENY',
        'X-XSS-Protection' => '1; mode=block',
        'Referrer-Policy' => 'strict-origin-when-cross-origin',
        'Strict-Transport-Security' => 'max-age=31536000; includeSubDomains' // HTTPS only in production
    ],
    
    // Allowed HTTP methods
    'allowed_methods' => [
        'GET',
        'POST',
        'PUT',
        'DELETE',
        'OPTIONS'
    ],
    
    // URI validation patterns
    'uri_validation' => [
        'pattern' => '/^[a-zA-Z0-9\/\-_]+$/',
        'max_length' => 255
    ],
    
    // Error handling
    'error_handling' => [
        'show_details' => false, // Set to true for development
        'log_errors' => true,
        'default_message' => 'Something went wrong'
    ],
    
    // Rate limiting (basic)
    'rate_limiting' => [
        'enabled' => false, // Set to true to enable
        'max_requests' => 100,
        'window_minutes' => 1
    ],
    
    // Request validation
    'request_validation' => [
        'max_body_size' => '10MB',
        'allowed_content_types' => [
            'application/json',
            'application/x-www-form-urlencoded',
            'multipart/form-data'
        ]
    ]
]; 