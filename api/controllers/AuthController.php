<?php
// api/controllers/AuthController.php

require_once __DIR__ . '/../models/AdminModel.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../models/UserSessionModel.php';
require_once __DIR__ . '/../models/PasswordResetModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../core/EmailService.php';

class AuthController
{
    private $adminModel;
    private $userModel;
    private $sessionModel;
    private $passwordResetModel;
    private $logModel;
    private $emailService;
    private $config;

    public function __construct($pdo)
    {
        $this->adminModel = new AdminModel($pdo);
        $this->userModel = new UserModel($pdo);
        $this->sessionModel = new UserSessionModel($pdo);
        $this->passwordResetModel = new PasswordResetModel($pdo);
        $this->logModel = new UserLogModel($pdo);
        $this->emailService = new EmailService();
        $this->config = require __DIR__ . '/../config/app_config.php';
    }

    public function login()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            if (!isset($data['email']) || !isset($data['password'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Email and password are required']);
                return;
            }

            // Check admins table first
            $user = $this->adminModel->findByEmail($data['email']);
            $userType = 'admin';

            // If not in admins, check users (customers) table
            if (!$user) {
                $user = $this->userModel->findByEmail($data['email']);
                $userType = 'customer';
            }

            if (!$user) {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid credentials']);
                return;
            }

            if ($user['status'] !== 'active') {
                http_response_code(401);
                echo json_encode(['error' => 'Account is inactive']);
                return;
            }

            if (!password_verify($data['password'], $user['password'])) {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid credentials']);
                return;
            }

            // Get role name for admins
            if ($userType === 'admin') {
                require_once __DIR__ . '/../models/RoleModel.php';
                $roleModel = new RoleModel($this->adminModel->getPdo());
                $role = $roleModel->findById($user['role_id']);
                $user['role'] = $role ? $role['slug'] : 'staff';
            } else {
                $user['role'] = 'customer';
            }

            $user['user_type'] = $userType;
            $token = $this->generateJWT($user);

            $this->sessionModel->create([
                'user_id' => $user['id'],
                'user_type' => $userType, // We need to add this column to sessions too
                'token' => $token,
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
                'expires_at' => date('Y-m-d H:i:s', strtotime('+24 hours'))
            ]);

            $this->logModel->logAction($user['id'], 'login', "User ($userType) logged in successfully", ['user_type' => $userType]);

            unset($user['password']);
            $user['token'] = $token;

            echo json_encode([
                'message' => 'Login successful',
                'user' => $user
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    public function logout()
    {
        try {
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
            $token = $authHeader ? str_replace('Bearer ', '', $authHeader) : null;

            if ($token) {
                $session = $this->sessionModel->findByToken($token);
                if ($session) {
                    $this->sessionModel->revokeUserSessions($session['user_id'], $session['user_type']);
                    $this->logModel->logAction($session['user_id'], 'logout', 'User logged out', ['user_type' => $session['user_type']]);
                }
            }

            echo json_encode(['message' => 'Logout successful']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    public function register()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            $firstName = trim($data['first_name'] ?? '');
            $lastName = trim($data['last_name'] ?? '');
            $email = trim($data['email'] ?? '');
            $gender = $data['gender'] ?? null;
            $dob = $data['date_of_birth'] ?? null;
            $password = $data['password'] ?? null;

            if (!$firstName || !$lastName || !$email || !$password) {
                http_response_code(400);
                echo json_encode(['error' => 'First name, last name, email, and password are required']);
                return;
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid email address']);
                return;
            }

            $existing = $this->userModel->findByEmail($email);
            if ($existing) {
                http_response_code(400);
                echo json_encode(['error' => 'Email already registered']);
                return;
            }

            $name = trim($firstName . ' ' . $lastName);
            $code = str_pad(strval(random_int(0, 999999)), 6, '0', STR_PAD_LEFT);
            $expires = date('Y-m-d H:i:s', strtotime('+15 minutes'));

            $this->pdo->prepare("DELETE FROM email_verifications WHERE email = ? AND user_type = 'customer'")->execute([$email]);
            $stmt = $this->pdo->prepare("
                INSERT INTO email_verifications (user_id, user_type, email, code, payload, expires_at, created_at)
                VALUES (NULL, 'customer', ?, ?, ?, ?, NOW())
            ");
            $payload = json_encode([
                'name' => trim($firstName . ' ' . $lastName),
                'email' => $email,
                'password' => password_hash($password, PASSWORD_BCRYPT),
                'gender' => $gender,
                'date_of_birth' => $dob,
            ]);
            $stmt->execute([$email, $code, $payload, $expires]);

            $this->emailService->sendSignupVerificationCode($email, $name, $code);

            echo json_encode([
                'message' => 'Verification code sent. Please verify your email to complete registration.'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    public function verifyRegistration()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $email = trim($data['email'] ?? '');
            $code = trim($data['code'] ?? '');

            if (!$email || !$code) {
                http_response_code(400);
                echo json_encode(['error' => 'Email and code are required']);
                return;
            }

            $stmt = $this->pdo->prepare("
                SELECT * FROM email_verifications
                WHERE user_type = 'customer' AND email = ? AND code = ? AND expires_at > NOW()
                LIMIT 1
            ");
            $stmt->execute([$email, $code]);
            $verification = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$verification) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid or expired verification code']);
                return;
            }

            $payload = json_decode($verification['payload'] ?? '', true) ?: [];
            $existing = $this->userModel->findByEmail($email);
            if ($existing) {
                http_response_code(400);
                echo json_encode(['error' => 'Email already registered']);
                return;
            }

            $userId = $this->userModel->create([
                'name' => $payload['name'] ?? $email,
                'email' => $email,
                'password' => $payload['password'] ?? password_hash($code, PASSWORD_BCRYPT),
                'gender' => $payload['gender'] ?? null,
                'date_of_birth' => $payload['date_of_birth'] ?? null,
                'status' => 'active',
                'is_guest' => 0,
            ]);

            $this->pdo->prepare("DELETE FROM email_verifications WHERE id = ?")->execute([$verification['id']]);

            $user = $this->userModel->find($userId);
            $token = $this->generateJWT($user);
            $user['token'] = $token;
            echo json_encode(['message' => 'Email verified successfully', 'user' => $user, 'token' => $token]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    private function generateJWT($user)
    {
        $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
        $payload = base64_encode(json_encode([
            'user_id' => $user['id'],
            'email' => $user['email'],
            'user_type' => $user['user_type'],
            'role' => $user['role'] ?? null,
            'iat' => time(),
            'exp' => time() + (24 * 60 * 60)
        ]));
        $signature = hash_hmac('sha256', "$header.$payload", 'vast-secret-key', true);
        $base64Signature = base64_encode($signature);
        return "$header.$payload." . str_replace(['+', '/', '='], ['-', '_', ''], $base64Signature);
    }
}
