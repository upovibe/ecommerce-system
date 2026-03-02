<?php
// api/middlewares/AuthMiddleware.php

require_once __DIR__ . '/Middleware.php';

class AuthMiddleware extends Middleware
{
    public function handle()
    {
        $user = $this->getCurrentUser();
        if (!$user) {
            $this->sendErrorResponse('Unauthorized access');
        }
        return $user;
    }

    public static function requireAuth($pdo)
    {
        $middleware = new self($pdo);
        return $middleware->handle();
    }
}
