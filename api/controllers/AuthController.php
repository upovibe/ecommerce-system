<?php
// api/controllers/AuthController.php - Controller for authentication operations

require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../models/UserSessionModel.php';
require_once __DIR__ . '/../models/PasswordResetModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../core/EmailService.php';
// REMOVE: require_once __DIR__ . '/../config/load_env.php';

class AuthController {
    private $userModel;
    private $sessionModel;
    private $passwordResetModel;
    private $logModel;
    private $emailService;
    private $config;

    public function __construct($pdo) {
        $this->userModel = new UserModel($pdo);
        $this->sessionModel = new UserSessionModel($pdo);
        $this->passwordResetModel = new PasswordResetModel($pdo);
        $this->logModel = new UserLogModel($pdo);
        $this->emailService = new EmailService();
        // Use config from app_config.php
        $this->config = require __DIR__ . '/../config/app_config.php';
    }

    public function login() {
        try {
            ob_clean();
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['email']) || !isset($data['password'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Email and password are required'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Find user by email
            $user = $this->userModel->findByEmail($data['email']);
            if (!$user) {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid credentials'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Check if user is active
            if ($user['status'] !== 'active') {
                http_response_code(401);
                echo json_encode(['error' => 'Account is inactive'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Check if user needs to change password (first login within 24 hours)
            $requiresPasswordChange = !$user['password_changed'];
            $accountAge = time() - strtotime($user['created_at']);
            $isWithin24Hours = $accountAge <= 86400; // 24 hours in seconds
            
            // If user hasn't changed password and account is older than 24 hours, deny access
            if ($requiresPasswordChange && !$isWithin24Hours) {
                http_response_code(401);
                echo json_encode(['error' => 'Account activation expired. Please contact administrator for a new password.'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Verify password
            if (!password_verify($data['password'], $user['password'])) {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid credentials'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Generate JWT token
            $token = $this->generateJWT($user);
            
            // Store session
            $sessionData = [
                'user_id' => $user['id'],
                'token' => $token,
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
                'ip_address' => $this->getRealIpAddress(),
                'expires_at' => date('Y-m-d H:i:s', strtotime('+24 hours'))
            ];
            
            $this->sessionModel->create($sessionData);
            
            // Log login action
            $this->logModel->logAction($user['id'], 'login', 'User logged in successfully');
            
            // Check if user needs to change password
            $requiresPasswordChange = !$user['password_changed'];
            
            // Return user data with token
            unset($user['password']);
            $user['token'] = $token;
            $user['requires_password_change'] = $requiresPasswordChange;
            
            echo json_encode([
                'message' => 'Login successful',
                'user' => $user,
                'requires_password_change' => $requiresPasswordChange
            ], JSON_PRETTY_PRINT);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function logout() {
        try {
            ob_clean();
            
            $headers = getallheaders();
            $token = $headers['Authorization'] ?? null;
            
            if (!$token) {
                http_response_code(401);
                echo json_encode(['error' => 'No token provided'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Remove "Bearer " prefix
            $token = str_replace('Bearer ', '', $token);
            
            // Find and delete session
            $session = $this->sessionModel->findByToken($token);
            if ($session) {
                $this->sessionModel->delete($session['id']);
                $this->logModel->logAction($session['user_id'], 'logout', 'User logged out');
            }
            
            echo json_encode(['message' => 'Logout successful'], JSON_PRETTY_PRINT);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function refresh() {
        try {
            ob_clean();
            
            $headers = getallheaders();
            $token = $headers['Authorization'] ?? null;
            
            if (!$token) {
                http_response_code(401);
                echo json_encode(['error' => 'No token provided'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Remove "Bearer " prefix
            $token = str_replace('Bearer ', '', $token);
            
            // Find active session
            $session = $this->sessionModel->findActiveSession($token);
            if (!$session) {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid or expired token'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Get user data
            $user = $this->userModel->findById($session['user_id']);
            if (!$user || $user['status'] !== 'active') {
                http_response_code(401);
                echo json_encode(['error' => 'User not found or inactive'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Generate new token
            $newToken = $this->generateJWT($user);
            
            // Update session
            $this->sessionModel->update($session['id'], [
                'token' => $newToken,
                'expires_at' => date('Y-m-d H:i:s', strtotime('+24 hours'))
            ]);
            
            unset($user['password']);
            $user['token'] = $newToken;
            
            echo json_encode([
                'message' => 'Token refreshed',
                'user' => $user
            ], JSON_PRETTY_PRINT);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function forgotPassword() {
        try {
            ob_clean();
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['email'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Email is required'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Check if user exists
            $user = $this->userModel->findByEmail($data['email']);
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Generate reset token
            $token = bin2hex(random_bytes(32));
            
            // Delete existing resets for this email
            $this->passwordResetModel->deleteByEmail($data['email']);
            
            // Create new reset record
            $resetData = [
                'email' => $data['email'],
                'token' => $token,
                'expires_at' => date('Y-m-d H:i:s', strtotime('+1 hour'))
            ];
            
            $this->passwordResetModel->create($resetData);
            
            // Send email with reset link
            $clientUrl = $this->config['client_url'] ?? 'http://localhost:8000';
            $resetUrl = $clientUrl . '/reset-password?token=' . $token;
            $emailSent = $this->emailService->sendPasswordResetEmail($data['email'], $resetUrl);
            
            if (!$emailSent) {
                // Log the error but don't expose it to the user
                error_log('Failed to send password reset email to: ' . $data['email']);
            }
            
            echo json_encode([
                'message' => 'Password reset link sent to email',
                'email_sent' => $emailSent
            ], JSON_PRETTY_PRINT);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function resetPassword() {
        try {
            ob_clean();
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['token']) || !isset($data['password'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Token and new password are required'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Find active reset
            $reset = $this->passwordResetModel->findActiveReset($data['token']);
            if (!$reset) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid or expired reset token'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Find user
            $user = $this->userModel->findByEmail($reset['email']);
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Update password
            $this->userModel->update($user['id'], [
                'password' => password_hash($data['password'], PASSWORD_DEFAULT)
            ]);
            
            // Delete reset record
            $this->passwordResetModel->delete($reset['id']);
            
            // Revoke all sessions for user
            $this->sessionModel->revokeUserSessions($user['id']);
            
            // Log password reset
            $this->logModel->logAction($user['id'], 'password_reset', 'Password reset successfully');
            
            echo json_encode(['message' => 'Password reset successful'], JSON_PRETTY_PRINT);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }



    private function generateJWT($user) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'user_id' => $user['id'],
            'email' => $user['email'],
            'role_id' => $user['role_id'],
            'iat' => time(),
            'exp' => time() + (24 * 60 * 60) // 24 hours
        ]);
        
        $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, 'your-secret-key', true);
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }
    
    /**
     * Get real IP address
     */
    private function getRealIpAddress() {
        // Check for forwarded IP addresses
        $ipKeys = [
            'HTTP_CF_CONNECTING_IP', // Cloudflare
            'HTTP_CLIENT_IP',        // Client IP
            'HTTP_X_FORWARDED_FOR',  // Forwarded IP
            'HTTP_X_FORWARDED',      // Forwarded IP
            'HTTP_X_CLUSTER_CLIENT_IP', // Cluster client IP
            'HTTP_FORWARDED_FOR',    // Forwarded for
            'HTTP_FORWARDED',        // Forwarded
            'REMOTE_ADDR'            // Direct IP
        ];
        
        foreach ($ipKeys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                foreach (explode(',', $_SERVER[$key]) as $ip) {
                    $ip = trim($ip);
                    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                        return $ip;
                    }
                }
            }
        }
        
        // Fallback to REMOTE_ADDR
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
}
?> 