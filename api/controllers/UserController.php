<?php
// api/controllers/UserController.php - Controller for user operations

require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../models/RoleModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../utils/profile_uploads.php';

class UserController {
    private $userModel;
    private $roleModel;
    private $logModel;

    public function __construct($pdo) {
        $this->userModel = new UserModel($pdo);
        $this->roleModel = new RoleModel($pdo);
        $this->logModel = new UserLogModel($pdo);
    }

    public function index() {
        try {
            // Require authentication
            require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
            global $pdo;
            AuthMiddleware::requireAuth($pdo);
            
            ob_clean();
            
            $users = $this->userModel->findAll();
            
            // Add role information to each user
            foreach ($users as &$user) {
                unset($user['password']); // Hide password
                if (isset($user['role_id'])) {
                    $role = $this->roleModel->findById($user['role_id']);
                    $user['role'] = $role ? $role['name'] : null;
                }
            }
            
            echo json_encode($users, JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function store() {
        try {
            ob_clean();
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (!isset($data['name']) || !isset($data['email']) || !isset($data['password'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Name, email, and password are required'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Validate password length
            if (strlen($data['password']) < 8) {
                http_response_code(400);
                echo json_encode(['error' => 'Password must be at least 8 characters long'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Check if email already exists
            $existingUser = $this->userModel->findByEmail($data['email']);
            if ($existingUser) {
                http_response_code(400);
                echo json_encode(['error' => 'Email already exists'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Store the provided password for email
            $providedPassword = $data['password'];
            
            // Hash the provided password
            $data['password'] = password_hash($providedPassword, PASSWORD_DEFAULT);
            
            // Set default role if not provided
            if (!isset($data['role_id'])) {
                $data['role_id'] = 3; // Default to elder role
            }
            
            // Set default status
            if (!isset($data['status'])) {
                $data['status'] = 'active';
            }
            
            $id = $this->userModel->create($data);
            
            // Log user creation
            $this->logModel->logAction($id, 'user_created', 'New user created', $data);
            
            // Send welcome email with provided password
            try {
                require_once __DIR__ . '/../core/EmailService.php';
                $emailService = new EmailService();
                
                // Get login URL from environment or use default
                $loginUrl = $_ENV['FRONTEND_URL'] ?? 'http://localhost:8000/auth/login';
                
                // Send the welcome email with provided password
                $emailSent = $emailService->sendUserCreatedEmail(
                    $data['email'],
                    $data['name'],
                    $data['email'],
                    $providedPassword,
                    $loginUrl
                );
                
                if ($emailSent) {
                    error_log("Welcome email sent successfully to: " . $data['email']);
                } else {
                    error_log("Failed to send welcome email to: " . $data['email']);
                }
            } catch (Exception $emailError) {
                error_log("Email error: " . $emailError->getMessage());
                // Don't fail the user creation if email fails
            }
            
            http_response_code(201);
            echo json_encode([
                'id' => $id, 
                'message' => 'User created successfully. Welcome email sent with login credentials.',
                'email_sent' => true,
                'email' => $data['email']
            ], JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    /**
     * Generate a secure random password
     */
    private function generateSecurePassword() {
        // Generate a 12-character password with mixed case, numbers, and symbols
        $length = 12;
        $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        $password = '';
        
        // Ensure at least one of each type
        $password .= 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[random_int(0, 25)]; // Uppercase
        $password .= 'abcdefghijklmnopqrstuvwxyz'[random_int(0, 25)]; // Lowercase
        $password .= '0123456789'[random_int(0, 9)]; // Number
        $password .= '!@#$%^&*'[random_int(0, 7)]; // Symbol
        
        // Fill the rest with random characters
        for ($i = 4; $i < $length; $i++) {
            $password .= $chars[random_int(0, strlen($chars) - 1)];
        }
        
        // Shuffle the password to make it more random
        return str_shuffle($password);
    }

    public function show($id) {
        try {
            ob_clean();
            
            $user = $this->userModel->findById($id);
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            unset($user['password']); // Hide password
            
            // Add role information
            if (isset($user['role_id'])) {
                $role = $this->roleModel->findById($user['role_id']);
                $user['role'] = $role ? $role['name'] : null;
            }
            
            echo json_encode($user, JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function update($id) {
        try {
            ob_clean();
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Check if user exists
            $existingUser = $this->userModel->findById($id);
            if (!$existingUser) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Check email uniqueness if email is being updated
            if (isset($data['email']) && $data['email'] !== $existingUser['email']) {
                $emailExists = $this->userModel->findByEmail($data['email']);
                if ($emailExists) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Email already exists'], JSON_PRETTY_PRINT);
                    return;
                }
            }
            
            // Track what changes were made
            $changes = [];
            $oldEmail = $existingUser['email'];
            
            if (isset($data['name']) && $data['name'] !== $existingUser['name']) {
                $changes[] = 'Name changed from "' . $existingUser['name'] . '" to "' . $data['name'] . '"';
            }
            
            if (isset($data['email']) && $data['email'] !== $existingUser['email']) {
                $changes[] = 'Email address changed from "' . $existingUser['email'] . '" to "' . $data['email'] . '"';
            }
            
            if (isset($data['role_id']) && $data['role_id'] != $existingUser['role_id']) {
                // Get role names for comparison
                $oldRole = $this->roleModel->findById($existingUser['role_id']);
                $newRole = $this->roleModel->findById($data['role_id']);
                $oldRoleName = $oldRole ? $oldRole['name'] : 'Unknown';
                $newRoleName = $newRole ? $newRole['name'] : 'Unknown';
                $changes[] = 'Role changed from "' . $oldRoleName . '" to "' . $newRoleName . '"';
            }
            
            if (isset($data['status']) && $data['status'] !== $existingUser['status']) {
                $statusChange = $data['status'] === 'active' ? 'activated' : 'deactivated';
                $changes[] = 'Account was ' . $statusChange;
            }
            
            // Hash password if provided
            if (isset($data['password'])) {
                // Validate password length
                if (strlen($data['password']) < 8) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Password must be at least 8 characters long'], JSON_PRETTY_PRINT);
                    return;
                }
                
                $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
                $changes[] = 'Password was updated';
            }
            
            $result = $this->userModel->update($id, $data);
            
            if ($result) {
                // Log user update
                $this->logModel->logAction($id, 'user_updated', 'User updated', $data);
                
                // Send email notification if there were changes
                if (!empty($changes)) {
                    try {
                        require_once __DIR__ . '/../core/EmailService.php';
                        $emailService = new EmailService();
                        
                        // Determine which email to send to (old or new)
                        $notificationEmail = isset($data['email']) ? $data['email'] : $existingUser['email'];
                        
                        // Send account update notification
                        $emailSent = $emailService->sendAccountUpdateEmail(
                            $notificationEmail,
                            $data['name'] ?? $existingUser['name'],
                            $changes,
                            $existingUser['email'] // Include old email for reference
                        );
                        
                        if ($emailSent) {
                            error_log("Account update notification sent successfully to: " . $notificationEmail);
                        } else {
                            error_log("Failed to send account update notification to: " . $notificationEmail);
                        }
                    } catch (Exception $emailError) {
                        error_log("Email error: " . $emailError->getMessage());
                        // Don't fail the update if email fails
                    }
                }
                
                echo json_encode([
                    'message' => 'User updated successfully',
                    'changes_made' => $changes,
                    'notification_sent' => !empty($changes)
                ], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update user'], JSON_PRETTY_PRINT);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function destroy($id) {
        try {
            ob_clean();
            
            // Check if user exists
            $user = $this->userModel->findById($id);
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Log user deletion BEFORE deleting the user
            UserLogModel::logAction($id, 'user_deleted', 'User deleted', ['user_id' => $id]);
            
            $result = $this->userModel->delete($id);
            
            if ($result) {
                echo json_encode(['message' => 'User deleted successfully'], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to delete user'], JSON_PRETTY_PRINT);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function profile($id) {
        try {
            ob_clean();
            
            $user = $this->userModel->findById($id);
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            unset($user['password']); // Hide password
            
            // Add role information
            if (isset($user['role_id'])) {
                $role = $this->roleModel->findById($user['role_id']);
                $user['role'] = $role ? $role['name'] : null;
            }
            
            echo json_encode($user, JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function updateProfile($id) {
        try {
            ob_clean();
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Check if user exists
            $existingUser = $this->userModel->findById($id);
            if (!$existingUser) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Remove sensitive fields that shouldn't be updated via profile
            unset($data['role_id']);
            unset($data['status']);
            
            // Check email uniqueness if email is being updated
            if (isset($data['email']) && $data['email'] !== $existingUser['email']) {
                $emailExists = $this->userModel->findByEmail($data['email']);
                if ($emailExists) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Email already exists'], JSON_PRETTY_PRINT);
                    return;
                }
            }
            
            // Hash password if provided
            if (isset($data['password'])) {
                $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
            }
            
            $result = $this->userModel->update($id, $data);
            
            if ($result) {
                // Log profile update
                $this->logModel->logAction($id, 'profile_updated', 'Profile updated', $data);
                
                echo json_encode(['message' => 'Profile updated successfully'], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update profile'], JSON_PRETTY_PRINT);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function changePassword($id) {
        try {
            ob_clean();
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (!isset($data['current_password']) || !isset($data['new_password']) || !isset($data['confirm_password'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Current password, new password, and confirm password are required'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Check if new password and confirm password match
            if ($data['new_password'] !== $data['confirm_password']) {
                http_response_code(400);
                echo json_encode(['error' => 'New password and confirm password do not match'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Validate new password length
            if (strlen($data['new_password']) < 8) {
                http_response_code(400);
                echo json_encode(['error' => 'New password must be at least 8 characters long'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Check if user exists
            $user = $this->userModel->findById($id);
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Verify current password
            if (!password_verify($data['current_password'], $user['password'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Current password is incorrect'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Hash new password
            $newPasswordHash = password_hash($data['new_password'], PASSWORD_DEFAULT);
            
            // Update password and mark as changed
            $updateData = [
                'password' => $newPasswordHash,
                'password_changed' => true
            ];
            
            $result = $this->userModel->update($id, $updateData);
            
            if ($result) {
                // Log password change
                $this->logModel->logAction($id, 'password_changed', 'Password changed by user', ['user_id' => $id]);
                
                echo json_encode([
                    'message' => 'Password changed successfully',
                    'password_changed' => true
                ], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to change password'], JSON_PRETTY_PRINT);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function resendWelcomeEmail($id) {
        try {
            ob_clean();
            
            // Check if user exists
            $user = $this->userModel->findById($id);
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Generate new password
            $newPassword = $this->generateSecurePassword();
            
            // Update user with new password
            $updateData = [
                'password' => password_hash($newPassword, PASSWORD_DEFAULT),
                'password_changed' => false // Reset to require password change
            ];
            
            $result = $this->userModel->update($id, $updateData);
            
            if (!$result) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update user password'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Send new welcome email
            try {
                require_once __DIR__ . '/../core/EmailService.php';
                $emailService = new EmailService();
                
                // Get login URL from environment or use default
                $loginUrl = $_ENV['FRONTEND_URL'] ?? 'http://localhost:8000/auth/login';
                
                // Send the welcome email with new password
                $emailSent = $emailService->sendUserCreatedEmail(
                    $user['email'],
                    $user['name'],
                    $user['email'],
                    $newPassword,
                    $loginUrl
                );
                
                if ($emailSent) {
                    error_log("New welcome email sent successfully to: " . $user['email']);
                    
                    // Log the action
                    $this->logModel->logAction($id, 'welcome_email_resent', 'Welcome email resent with new password', ['user_id' => $id]);
                    
                    echo json_encode([
                        'message' => 'New welcome email sent successfully',
                        'email_sent' => true,
                        'email' => $user['email']
                    ], JSON_PRETTY_PRINT);
                } else {
                    error_log("Failed to send new welcome email to: " . $user['email']);
                    http_response_code(500);
                    echo json_encode(['error' => 'Failed to send welcome email'], JSON_PRETTY_PRINT);
                }
            } catch (Exception $emailError) {
                error_log("Email error: " . $emailError->getMessage());
                http_response_code(500);
                echo json_encode(['error' => 'Failed to send welcome email'], JSON_PRETTY_PRINT);
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function uploadProfileImage($id) {
        try {
            ob_clean();
            
            // Check if user exists
            $user = $this->userModel->findById($id);
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Check if file was uploaded
            if (!isset($_FILES['profile_image']) || $_FILES['profile_image']['error'] === UPLOAD_ERR_NO_FILE) {
                http_response_code(400);
                echo json_encode(['error' => 'No profile image file provided'], JSON_PRETTY_PRINT);
                return;
            }
            
            // Handle file upload
            $uploadResult = uploadProfileImage($_FILES['profile_image']);
            
            if (!$uploadResult['success']) {
                http_response_code(400);
                echo json_encode(['error' => $uploadResult['message']], JSON_PRETTY_PRINT);
                return;
            }
            
            // Delete old profile image if it exists
            if (!empty($user['profile_image']) && file_exists($user['profile_image'])) {
                deleteProfileImage($user['profile_image']);
            }
            
            // Update user with new profile image path
            $updateData = [
                'profile_image' => $uploadResult['filepath']
            ];
            
            $result = $this->userModel->update($id, $updateData);
            
            if ($result) {
                // Log profile image update
                $this->logModel->logAction($id, 'profile_image_updated', 'Profile image updated', [
                    'user_id' => $id,
                    'old_image' => $user['profile_image'] ?? null,
                    'new_image' => $uploadResult['filepath']
                ]);
                
                echo json_encode([
                    'message' => 'Profile image uploaded successfully',
                    'image_url' => $uploadResult['filepath'],
                    'thumbnails' => $uploadResult['thumbnails'] ?? [],
                    'filepath' => $uploadResult['filepath']
                ], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update profile image'], JSON_PRETTY_PRINT);
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }
}
?> 