<?php
// api/middlewares/AuthMiddleware.php - Authentication middleware

require_once __DIR__ . '/Middleware.php';

class AuthMiddleware extends Middleware {
    
    public function handle() {
        $user = $this->getCurrentUser();
        
        if (!$user) {
            $this->sendErrorResponse('Authentication required');
        }
        
        // Store user in global scope for controllers to access
        global $currentUser;
        $currentUser = $user;
        
        return true;
    }
    
    // Static method for easy use in controllers
    public static function requireAuth($pdo) {
        $middleware = new self($pdo);
        return $middleware->handle();
    }
}
?> 