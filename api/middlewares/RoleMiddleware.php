<?php
// api/middlewares/RoleMiddleware.php - Role-based access control middleware

require_once __DIR__ . '/Middleware.php';
require_once __DIR__ . '/../models/RoleModel.php';

class RoleMiddleware extends Middleware {
    private $allowedRoles;
    
    public function __construct($pdo, $allowedRoles = []) {
        parent::__construct($pdo);
        $this->allowedRoles = is_array($allowedRoles) ? $allowedRoles : [$allowedRoles];
    }
    
    public function handle() {
        // First ensure user is authenticated
        $user = $this->getCurrentUser();
        
        if (!$user) {
            $this->sendErrorResponse('Authentication required');
        }
        
        // Get user's role
        $roleModel = new RoleModel($this->pdo);
        $userRole = $roleModel->findById($user['role_id']);
        
        if (!$userRole) {
            $this->sendErrorResponse('User role not found');
        }
        
        // Check if user's role is allowed
        if (!in_array($userRole['name'], $this->allowedRoles)) {
            $this->sendErrorResponse('Access denied. Insufficient permissions.', 403);
        }
        
        // Store user and role in global scope
        global $currentUser, $currentUserRole;
        $currentUser = $user;
        $currentUserRole = $userRole;
        
        return true;
    }
    
    // Static methods for common role checks
    public static function requireAdmin($pdo) {
        $middleware = new self($pdo, ['admin']);
        return $middleware->handle();
    }
    
    public static function requireTeacher($pdo) {
        $middleware = new self($pdo, ['admin', 'teacher']);
        return $middleware->handle();
    }
    
    public static function requireStudent($pdo) {
        $middleware = new self($pdo, ['admin', 'teacher', 'student']);
        return $middleware->handle();
    }
    
    public static function requireRoles($pdo, $roles) {
        $middleware = new self($pdo, $roles);
        return $middleware->handle();
    }
}
?> 