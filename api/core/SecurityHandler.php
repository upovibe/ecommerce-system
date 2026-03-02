<?php
// api/core/SecurityHandler.php - Security handler

class SecurityHandler {
    private $config;
    
    public function __construct() {
        $this->config = require __DIR__ . '/../config/security.php';
    }
    
    /**
     * Set security headers
     */
    public function setSecurityHeaders() {
        foreach ($this->config['headers'] as $header => $value) {
            header("$header: $value");
        }
    }
    
    /**
     * Validate HTTP method
     */
    public function validateMethod($method) {
        if (!in_array($method, $this->config['allowed_methods'])) {
            $this->sendError(405, 'Method not allowed');
        }
    }
    
    /**
     * Validate and sanitize URI
     */
    public function validateUri($uri) {
        // Check URI length
        if (strlen($uri) > $this->config['uri_validation']['max_length']) {
            $this->sendError(400, 'URI too long');
        }
        
        // Check URI pattern
        if (!preg_match($this->config['uri_validation']['pattern'], $uri)) {
            $this->sendError(400, 'Invalid characters in URI');
        }
    }
    
    /**
     * Validate request
     */
    public function validateRequest() {
        // Check content type for POST/PUT requests
        if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT'])) {
            $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
            
            // Check if content type starts with any allowed type (for multipart/form-data; boundary=...)
            $isValid = false;
            foreach ($this->config['request_validation']['allowed_content_types'] as $allowedType) {
                if (strpos($contentType, $allowedType) === 0) {
                    $isValid = true;
                    break;
                }
            }
            
            if (!$isValid) {
                $this->sendError(400, 'Invalid content type: ' . $contentType);
            }
        }
    }
    
    /**
     * Handle errors with proper logging
     */
    public function handleError($error, $code = 500) {
        if ($this->config['error_handling']['log_errors']) {
            error_log("API Error [$code]: " . $error->getMessage());
        }
        
        $message = $this->config['error_handling']['show_details'] 
            ? $error->getMessage() 
            : $this->config['error_handling']['default_message'];
            
        $this->sendError($code, $message);
    }
    
    /**
     * Send error response
     */
    private function sendError($code, $message) {
        http_response_code($code);
        echo json_encode([
            'error' => $message
        ], JSON_PRETTY_PRINT);
        exit();
    }
    
    /**
     * Get security configuration
     */
    public function getConfig() {
        return $this->config;
    }
} 