<?php
// api/middlewares/Middleware.php - Base middleware class

abstract class Middleware
{
    protected $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    abstract public function handle();

    protected function getAuthorizationHeader()
    {
        $headers = getallheaders();
        return $headers['Authorization'] ?? null;
    }

    protected function extractToken($authHeader)
    {
        if (!$authHeader) return null;
        return str_replace('Bearer ', '', $authHeader);
    }

    protected function decodeJWT($token)
    {
        try {
            $parts = explode('.', $token);
            if (count($parts) !== 3) return null;
            return json_decode(base64_decode($parts[1]), true);
        } catch (Exception $e) {
            return null;
        }
    }

    protected function sendErrorResponse($message, $code = 401)
    {
        http_response_code($code);
        echo json_encode(['error' => $message], JSON_PRETTY_PRINT);
        exit();
    }

    protected function getCurrentUser()
    {
        $authHeader = $this->getAuthorizationHeader();
        if (!$authHeader) return null;
        $token = $this->extractToken($authHeader);
        if (!$token) return null;

        require_once __DIR__ . '/../models/UserSessionModel.php';
        $sessionModel = new UserSessionModel($this->pdo);
        $session = $sessionModel->findActiveSession($token);
        if (!$session) return null;

        $userType = $session['user_type'] ?? 'customer';

        if ($userType === 'admin') {
            require_once __DIR__ . '/../models/AdminModel.php';
            $model = new AdminModel($this->pdo);
        } else {
            require_once __DIR__ . '/../models/UserModel.php';
            $model = new UserModel($this->pdo);
        }

        $user = $model->findById($session['user_id']);
        if (!$user || $user['status'] !== 'active') return null;

        if ($userType === 'admin') {
            require_once __DIR__ . '/../models/RoleModel.php';
            $roleModel = new RoleModel($this->pdo);
            $role = $roleModel->findById($user['role_id']);
            $user['role'] = $role ? $role['name'] : 'staff';
        } else {
            $user['role'] = 'customer';
        }

        $user['user_type'] = $userType;
        return $user;
    }
}
