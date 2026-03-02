<?php
// api/controllers/SettingController.php - Controller for settings management

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../utils/settings_uploads.php';
require_once __DIR__ . '/../models/SettingModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../core/MultipartFormParser.php';

class SettingController {
    private $pdo;
    private $settingModel;
    private $userLogModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->settingModel = new SettingModel($pdo);
        $this->userLogModel = new UserLogModel($pdo);
    }

    /**
     * Get all settings (admin only)
     */
    public function index() {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            $settings = $this->settingModel->findAll();
            
            // Decode array settings for all settings
            $settings = array_map([$this, 'decodeArraySetting'], $settings);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $settings,
                'message' => 'Settings retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving settings: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Create a new setting (admin only)
     */
    public function store() {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Handle both JSON and multipart form data
            $data = [];
            if ($_SERVER['CONTENT_TYPE'] && strpos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') !== false) {
                // Handle multipart form data
                $data = $_POST;
                
                // Handle file upload if present
                if (isset($_FILES['setting_value']) && $_FILES['setting_value']['error'] !== UPLOAD_ERR_NO_FILE) {
                    $uploadResult = $this->handleFileUpload($_FILES['setting_value'], $data['category'] ?? 'general');
                    if ($uploadResult['success']) {
                        $data['setting_value'] = $uploadResult['filepath'];
                    } else {
                        http_response_code(400);
                        echo json_encode([
                            'success' => false,
                            'message' => $uploadResult['message']
                        ]);
                        return;
                    }
                }
            } else {
                // Handle JSON data
                $data = json_decode(file_get_contents('php://input'), true);
            }
            
            // Validate required fields
            if (empty($data['setting_key'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Setting key is required'
                ]);
                return;
            }
            
            // Check if setting key already exists
            $existingSetting = $this->settingModel->findByKey($data['setting_key']);
            if ($existingSetting) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Setting with this key already exists'
                ]);
                return;
            }
            
            // Sanitize is_active to be a boolean integer
            if (isset($data['is_active'])) {
                $data['is_active'] = filter_var($data['is_active'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
            }
            
            // Handle array type settings - encode as JSON
            if (isset($data['setting_type']) && $data['setting_type'] === 'array' && isset($data['setting_value'])) {
                if (is_array($data['setting_value'])) {
                    $data['setting_value'] = json_encode($data['setting_value']);
                } elseif (is_string($data['setting_value'])) {
                    // If it's already a JSON string, validate it
                    $decoded = json_decode($data['setting_value'], true);
                    if (json_last_error() !== JSON_ERROR_NONE) {
                        http_response_code(400);
                        echo json_encode([
                            'success' => false,
                            'message' => 'Invalid JSON format for array setting'
                        ]);
                        return;
                    }
                }
            }
            
            $settingId = $this->settingModel->create($data);
            
            // Get the created setting to return full data
            $createdSetting = $this->settingModel->findById($settingId);
            if ($createdSetting) {
                // Decode array settings
                $createdSetting = $this->decodeArraySetting($createdSetting);
            }
            
            // Log the action
            $this->logAction('setting_created', "Created setting: {$data['setting_key']}", [
                'setting_id' => $settingId,
                'setting_key' => $data['setting_key'],
                'category' => $data['category'] ?? 'general'
            ]);
            
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'data' => $createdSetting,
                'message' => 'Setting created successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating setting: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get a specific setting (admin only)
     */
    public function show($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            $setting = $this->settingModel->findById($id);
            
            if (!$setting) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Setting not found'
                ]);
                return;
            }
            
            // Decode array settings
            $setting = $this->decodeArraySetting($setting);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $setting,
                'message' => 'Setting retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving setting: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get setting by key (public for some settings)
     */
    public function showByKey($key) {
        try {
            $setting = $this->settingModel->findByKey($key);
            
            if (!$setting) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Setting not found'
                ]);
                return;
            }
            
            // If setting is not active, only admins can view it
            if (!$setting['is_active']) {
                try {
                    RoleMiddleware::requireAdmin($this->pdo);
                } catch (Exception $e) {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Setting not found'
                    ]);
                    return;
                }
            }
            
            // Decode array settings
            $setting = $this->decodeArraySetting($setting);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $setting,
                'message' => 'Setting retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving setting: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update a setting (admin only)
     */
    public function update($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);

            // Handle multipart/form-data for PUT requests
            $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
            if (strpos($contentType, 'multipart/form-data') !== false && $_SERVER['REQUEST_METHOD'] === 'PUT') {
                $rawData = file_get_contents('php://input');
                MultipartFormParser::processRequest($rawData, $contentType);
            }
            
            // Handle both JSON and multipart form data
            $data = [];
            if (strpos($contentType, 'multipart/form-data') !== false) {
                // Handle multipart form data
                $data = $_POST;
                
                // Handle file upload if present
                if (isset($_FILES['setting_value']) && $_FILES['setting_value']['error'] !== UPLOAD_ERR_NO_FILE) {
                    $uploadResult = $this->handleFileUpload($_FILES['setting_value'], $data['category'] ?? 'general');
                    if ($uploadResult['success']) {
                        $data['setting_value'] = $uploadResult['filepath'];
                    } else {
                        http_response_code(400);
                        echo json_encode([
                            'success' => false,
                            'message' => $uploadResult['message']
                        ]);
                        return;
                    }
                }
            } else {
                // Handle JSON data
                $data = json_decode(file_get_contents('php://input'), true);
            }
            
            // Check if setting exists
            $existingSetting = $this->settingModel->findById($id);
            if (!$existingSetting) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Setting not found'
                ]);
                return;
            }
            
            // If setting_key is being updated, check for uniqueness
            if (isset($data['setting_key']) && $data['setting_key'] !== $existingSetting['setting_key']) {
                $duplicateSetting = $this->settingModel->findByKey($data['setting_key']);
                if ($duplicateSetting) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Setting with this key already exists'
                    ]);
                    return;
                }
            }

            // Sanitize is_active to be a boolean integer
            if (isset($data['is_active'])) {
                $data['is_active'] = filter_var($data['is_active'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
            }
            
            // Handle array type settings - encode as JSON
            if (isset($data['setting_type']) && $data['setting_type'] === 'array' && isset($data['setting_value'])) {
                if (is_array($data['setting_value'])) {
                    $data['setting_value'] = json_encode($data['setting_value']);
                } elseif (is_string($data['setting_value'])) {
                    // If it's already a JSON string, validate it
                    $decoded = json_decode($data['setting_value'], true);
                    if (json_last_error() !== JSON_ERROR_NONE) {
                        http_response_code(400);
                        echo json_encode([
                            'success' => false,
                            'message' => 'Invalid JSON format for array setting'
                        ]);
                        return;
                    }
                }
            }

            // Delete old file if new file is uploaded and setting type is file/image
            if (isset($_FILES['setting_value']) && in_array($existingSetting['setting_type'], ['file', 'image'])) {
                if ($existingSetting['setting_value']) {
                    deleteSettingFile($existingSetting['setting_value']);
                }
            }

            $result = $this->settingModel->update($id, $data);
            
            if ($result) {
                // Get the updated setting to return full data
                $updatedSetting = $this->settingModel->findById($id);
                if ($updatedSetting) {
                    // Decode array settings
                    $updatedSetting = $this->decodeArraySetting($updatedSetting);
                }
                
                // Log the action
                $this->logAction('setting_updated', "Updated setting: {$existingSetting['setting_key']}", [
                    'setting_id' => $id,
                    'setting_key' => $existingSetting['setting_key'],
                    'category' => $existingSetting['category']
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => $updatedSetting,
                    'message' => 'Setting updated successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error updating setting'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating setting: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete a setting (admin only)
     */
    public function destroy($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Check if setting exists
            $existingSetting = $this->settingModel->findById($id);
            if (!$existingSetting) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Setting not found'
                ]);
                return;
            }
            
            // Delete associated file if setting type is file/image
            if (in_array($existingSetting['setting_type'], ['file', 'image']) && $existingSetting['setting_value']) {
                deleteSettingFile($existingSetting['setting_value']);
            }
            
            $result = $this->settingModel->delete($id);
            
            if ($result) {
                // Log the action
                $this->logAction('setting_deleted', "Deleted setting: {$existingSetting['setting_key']}", [
                    'setting_id' => $id,
                    'setting_key' => $existingSetting['setting_key'],
                    'category' => $existingSetting['category']
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Setting deleted successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error deleting setting'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting setting: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get settings by category (admin only)
     */
    public function getByCategory($category) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            $settings = $this->settingModel->getByCategory($category);
            
            // Decode array settings for all settings
            $settings = array_map([$this, 'decodeArraySetting'], $settings);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $settings,
                'message' => 'Settings retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving settings: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get theme settings (public)
     */
    public function getThemeSettings() {
        try {
            $settings = $this->settingModel->getThemeSettings();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $settings,
                'message' => 'Theme settings retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving theme settings: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get contact settings (public)
     */
    public function getContactSettings() {
        try {
            $settings = $this->settingModel->getContactSettings();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $settings,
                'message' => 'Contact settings retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving contact settings: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get social media settings (public)
     */
    public function getSocialSettings() {
        try {
            $settings = $this->settingModel->getSocialSettings();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $settings,
                'message' => 'Social media settings retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving social media settings: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get map settings (public)
     */
    public function getMapSettings() {
        try {
            $settings = $this->settingModel->getMapSettings();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $settings,
                'message' => 'Map settings retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving map settings: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get all settings as key-value array (public)
     */
    public function getAllAsArray() {
        try {
            $settings = $this->settingModel->getAllAsArray();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $settings,
                'message' => 'Settings retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving settings: ' . $e->getMessage()
            ]);
        }
    }



    /**
     * Log user action
     * @param string $action Action name
     * @param string $description Action description
     * @param array $metadata Additional metadata
     */
    private function logAction($action, $description = null, $metadata = null) {
        try {
            // Get current user from session
            $token = $this->getAuthToken();
            if ($token) {
                $userSessionModel = new UserSessionModel($this->pdo);
                $session = $userSessionModel->findActiveSession($token);
                if ($session) {
                    UserLogModel::logAction($session['user_id'], $action, $description, $metadata);
                }
            }
        } catch (Exception $e) {
            // Don't fail the main operation if logging fails
            error_log("Failed to log action: " . $e->getMessage());
        }
    }

    /**
     * Get auth token from headers
     * @return string|null
     */
    private function getAuthToken() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $matches[1];
        }
        
        return null;
    }



    /**
     * Get upload statistics (admin only)
     */
    public function getUploadStats() {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Get upload directory stats
            $uploadDir = 'uploads/';
            $stats = [];
            
            if (is_dir($uploadDir)) {
                $stats['total_files'] = 0;
                $stats['total_size'] = 0;
                $stats['directories'] = [];
                
                $iterator = new RecursiveIteratorIterator(
                    new RecursiveDirectoryIterator($uploadDir, RecursiveDirectoryIterator::SKIP_DOTS)
                );
                
                foreach ($iterator as $file) {
                    if ($file->isFile()) {
                        $stats['total_files']++;
                        $stats['total_size'] += $file->getSize();
                        
                        $relativePath = str_replace($uploadDir, '', $file->getPathname());
                        $directory = dirname($relativePath);
                        
                        if (!isset($stats['directories'][$directory])) {
                            $stats['directories'][$directory] = [
                                'files' => 0,
                                'size' => 0
                            ];
                        }
                        
                        $stats['directories'][$directory]['files']++;
                        $stats['directories'][$directory]['size'] += $file->getSize();
                    }
                }
                
                $stats['total_size_formatted'] = $this->formatFileSize($stats['total_size']);
                
                foreach ($stats['directories'] as $dir => &$dirStats) {
                    $dirStats['size_formatted'] = $this->formatFileSize($dirStats['size']);
                }
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $stats,
                'message' => 'Upload statistics retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving upload statistics: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Handle file upload for settings
     * @param array $file Uploaded file array
     * @param string $category Setting category
     * @return array Upload result
     */
    private function handleFileUpload($file, $category = 'general') {
        try {
            // Upload file using the existing upload function
            $uploadResult = uploadSettingFile($file);
            
            if ($uploadResult['success']) {
                return [
                    'success' => true,
                    'filepath' => $uploadResult['filepath'],
                    'url' => $uploadResult['url'],
                    'thumbnails' => $uploadResult['thumbnails'] ?? null
                ];
            } else {
                return [
                    'success' => false,
                    'message' => $uploadResult['message']
                ];
            }
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error uploading file: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Format file size
     */
    private function formatFileSize($bytes) {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        
        $bytes /= pow(1024, $pow);
        
        return round($bytes, 2) . ' ' . $units[$pow];
    }

    /**
     * Decode array settings from the database.
     * This is necessary because the setting_value column in the database is JSON.
     * @param array $setting The setting data from the database.
     * @return array The decoded setting data.
     */
    private function decodeArraySetting($setting) {
        if ($setting['setting_type'] === 'array' && $setting['setting_value']) {
            $decoded = json_decode($setting['setting_value'], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return array_merge($setting, ['setting_value' => $decoded]);
            }
        }
        return $setting;
    }
}
?>