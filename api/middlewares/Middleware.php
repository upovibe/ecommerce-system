<?php
// api/middlewares/Middleware.php - Base middleware class

abstract class Middleware {
    protected $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    abstract public function handle();
    
    protected function getAuthorizationHeader() {
        $headers = getallheaders();
        return $headers['Authorization'] ?? null;
    }
    
    protected function extractToken($authHeader) {
        if (!$authHeader) {
            return null;
        }
        
        // Remove "Bearer " prefix
        return str_replace('Bearer ', '', $authHeader);
    }
    
    protected function decodeJWT($token) {
        try {
            $parts = explode('.', $token);
            if (count($parts) !== 3) {
                return null;
            }
            
            $payload = json_decode(base64_decode($parts[1]), true);
            return $payload;
        } catch (Exception $e) {
            return null;
        }
    }
    
    protected function sendErrorResponse($message, $code = 401) {
        http_response_code($code);
        echo json_encode(['error' => $message], JSON_PRETTY_PRINT);
        exit();
    }
    
    protected function getCurrentUser() {
        $authHeader = $this->getAuthorizationHeader();
        
        if (!$authHeader) {
            return null;
        }
        
        $token = $this->extractToken($authHeader);
        
        if (!$token) {
            return null;
        }
        
        // Verify session exists and is active
        require_once __DIR__ . '/../models/UserSessionModel.php';
        $sessionModel = new UserSessionModel($this->pdo);
        $session = $sessionModel->findActiveSession($token);
        
        if (!$session) {
            return null;
        }
        
        // Get user data
        require_once __DIR__ . '/../models/UserModel.php';
        $userModel = new UserModel($this->pdo);
        $user = $userModel->findById($session['user_id']);
        
        if (!$user || $user['status'] !== 'active') {
            return null;
        }
        
        return $user;
    }
}
?> 