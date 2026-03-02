<?php
// api/core/CorsHandler.php - CORS header handler

class CorsHandler {
    private $config;
    
    public function __construct() {
        $this->config = require __DIR__ . '/../config/cors.php';
    }
    
    /**
     * Set CORS headers based on configuration
     */
    public function setHeaders() {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        // If no origin (like cURL/Postman), allow it
        if (empty($origin)) {
            header("Access-Control-Allow-Origin: {$this->config['default_origin']}");
        }
        // Check if origin is allowed
        elseif (in_array($origin, $this->config['allowed_origins'])) {
            header("Access-Control-Allow-Origin: $origin");
        } else {
            // BLOCK unauthorized origins
            header("Access-Control-Allow-Origin: null");
            header('HTTP/1.1 403 Forbidden');
            echo json_encode(['error' => 'CORS: Origin not allowed']);
            exit();
        }
        
        // Set other CORS headers
        header('Access-Control-Allow-Methods: ' . implode(', ', $this->config['allowed_methods']));
        header('Access-Control-Allow-Headers: ' . implode(', ', $this->config['allowed_headers']));
        header('Access-Control-Expose-Headers: ' . implode(', ', $this->config['exposed_headers']));
        header('Access-Control-Max-Age: ' . $this->config['max_age']);
        
        if ($this->config['allow_credentials']) {
            header('Access-Control-Allow-Credentials: true');
        }
    }
    
    /**
     * Handle preflight OPTIONS request
     */
    public function handlePreflight() {
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            $this->setHeaders();
            http_response_code(200);
            exit();
        }
    }
    
    /**
     * Check if origin is allowed
     */
    public function isOriginAllowed($origin) {
        return in_array($origin, $this->config['allowed_origins']);
    }
    
    /**
     * Get allowed origins for debugging
     */
    public function getAllowedOrigins() {
        return $this->config['allowed_origins'];
    }
} 