<?php
// api/middlewares/RoleMiddleware.php

require_once __DIR__ . '/Middleware.php';

class RoleMiddleware extends Middleware
{
    public function handle()
    {
        return $this->getCurrentUser();
    }

    public static function requireAdmin($pdo)
    {
        $middleware = new self($pdo);
        $user = $middleware->getCurrentUser();

        if (!$user || $user['user_type'] !== 'admin' || $user['role'] !== 'admin') {
            $middleware->sendErrorResponse('Forbidden: Admin access only', 403);
        }

        return $user;
    }

    public static function requireStaff($pdo)
    {
        $middleware = new self($pdo);
        $user = $middleware->getCurrentUser();

        // Admin or Staff roles are allowed if they are in the admins table
        if (!$user || $user['user_type'] !== 'admin') {
            $middleware->sendErrorResponse('Forbidden: Staff access required', 403);
        }

        return $user;
    }
}
