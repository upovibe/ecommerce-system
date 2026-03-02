<?php
// api/controllers/GiveController.php - Controller for give management

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../core/MultipartFormParser.php';
require_once __DIR__ . '/../models/GiveModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../utils/give_uploads.php';

class GiveController {
    private $pdo;
    private $giveModel;
    private $userLogModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->giveModel = new GiveModel($pdo);
        $this->userLogModel = new UserLogModel($pdo);
    }

    /**
     * Get all give entries (admin only)
     */
    public function index() {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            $giveEntries = $this->giveModel->findAll();
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $giveEntries, 'message' => 'Give entries retrieved successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error retrieving give entries: ' . $e->getMessage()]);
        }
    }

    /**
     * Create a new give entry (admin only)
     */
    public function store() {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Handle multipart form data or JSON data for PUT/PATCH requests
            $data = [];
            $content_type = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
            $rawData = file_get_contents('php://input');

            if (strpos($content_type, 'multipart/form-data') !== false) {
                // Use standard PHP $_POST and $_FILES for multipart data
                $data = $_POST;
                // $_FILES is already available globally
            } else {
                // Fall back to JSON
                $data = json_decode($rawData, true) ?? [];
            }
            
            // Set default values (only for fields that exist in the table)
            if (!isset($data['is_active'])) {
                $data['is_active'] = 1;
            }
            
            // Handle banner upload if present
            $bannerData = null;
            if (!empty($_FILES['banner']) && $_FILES['banner']['error'] === UPLOAD_ERR_OK) {
                $bannerData = uploadGiveBanner($_FILES['banner']);
                $data['image'] = $bannerData['original'];
            }
            
            // Handle links JSON encoding
            if (isset($data['links']) && is_array($data['links'])) {
                $data['links'] = json_encode($data['links']);
            }
            
            // Create give entry
            $giveId = $this->giveModel->create($data);
            
            if ($giveId) {
                // Get the created give data
                $createdGive = $this->giveModel->findById($giveId);
                
                // Log the action
                $this->logAction('give_created', "Created give entry: {$data['title']}", [
                    'give_id' => $giveId,
                    'title' => $data['title'],
                    'banner_uploaded' => $bannerData ? true : false
                ]);
                
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'data' => $createdGive,
                    'message' => 'Give entry created successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to create give entry'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating give entry: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get a specific give entry by ID (public)
     */
    public function show($id) {
        try {
            $giveEntry = $this->giveModel->findById($id);
            if (!$giveEntry) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Give entry not found']);
                return;
            }
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $giveEntry, 'message' => 'Give entry retrieved successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error retrieving give entry: ' . $e->getMessage()]);
        }
    }

    /**
     * Update a give entry (admin only)
     */
    public function update($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Check if give entry exists
            $existingGive = $this->giveModel->findById($id);
            if (!$existingGive) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Give entry not found'
                ]);
                return;
            }
            
            // Handle multipart form data or JSON data
            $data = [];
            $content_type = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
            $rawData = file_get_contents('php://input');

            if (strpos($content_type, 'multipart/form-data') !== false) {
                $parsed = MultipartFormParser::parse($rawData, $content_type);
                $data = $parsed['data'] ?? [];
                $_FILES = $parsed['files'] ?? [];
            } else {
                // Fall back to JSON
                $data = json_decode($rawData, true) ?? [];
            }
            
            // Handle banner upload if present
            $bannerData = null;
            if (!empty($_FILES['banner']) && $_FILES['banner']['error'] === UPLOAD_ERR_OK) {
                try {
                    $bannerData = uploadGiveBanner($_FILES['banner']);
                    $data['image'] = $bannerData['original'];
                } catch (Exception $e) {
                    // Log the error and continue without banner update
                    error_log('Error uploading give banner: ' . $e->getMessage());
                    // Don't fail the entire update if banner upload fails
                }
            }
            
            // Handle links JSON encoding
            if (isset($data['links']) && is_array($data['links'])) {
                $data['links'] = json_encode($data['links']);
            }
            
            // Update give entry
            $success = $this->giveModel->update($id, $data);
            
            if ($success) {
                // Get the updated give data
                $updatedGive = $this->giveModel->findById($id);
                
                // Log the action
                $this->logAction('give_updated', "Updated give entry: {$existingGive['title']}", [
                    'give_id' => $id,
                    'old_title' => $existingGive['title'],
                    'new_title' => $data['title'] ?? $existingGive['title'],
                    'banner_updated' => $bannerData ? true : false
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => $updatedGive,
                    'message' => 'Give entry updated successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to update give entry'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating give entry: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete a give entry (admin only)
     */
    public function destroy($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Check if give entry exists
            $existingGive = $this->giveModel->findById($id);
            if (!$existingGive) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Give entry not found'
                ]);
                return;
            }
            
            // Delete banner image if it exists
            if (!empty($existingGive['image'])) {
                deleteGiveBanner($existingGive['image']);
            }
            
            // Delete give entry
            $success = $this->giveModel->delete($id);
            
            if ($success) {
                // Log the action
                $this->logAction('give_deleted', "Deleted give entry: {$existingGive['title']}", [
                    'give_id' => $id,
                    'title' => $existingGive['title']
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Give entry deleted successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to delete give entry'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting give entry: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get active give entries (public endpoint)
     */
    public function getActive() {
        try {
            $giveEntries = $this->giveModel->getActiveGive();
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $giveEntries, 'message' => 'Active give entries retrieved successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error retrieving active give entries: ' . $e->getMessage()]);
        }
    }



    /**
     * Log user action
     */
    private function logAction($action, $description = null, $metadata = null) {
        try {
            $token = $this->getAuthToken();
            if ($token) {
                $this->userLogModel->logAction($token, $action, $description, $metadata);
            }
        } catch (Exception $e) {
            error_log('Error logging action: ' . $e->getMessage());
        }
    }

    /**
     * Get authentication token from request
     */
    private function getAuthToken() {
        $headers = getallheaders();
        
        // Check Authorization header
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                return $matches[1];
            }
        }
        
        // Check for token in query parameters
        if (isset($_GET['token'])) {
            return $_GET['token'];
        }
        
        // Check for token in POST data
        if (isset($_POST['token'])) {
            return $_POST['token'];
        }
        
        return null;
    }
}
?>
