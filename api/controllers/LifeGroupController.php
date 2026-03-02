<?php
// api/controllers/LifeGroupController.php - Controller for life groups management

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../core/MultipartFormParser.php';
require_once __DIR__ . '/../models/LifeGroupModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../helpers/SlugHelper.php';
require_once __DIR__ . '/../utils/life_group_uploads.php';

class LifeGroupController {
    private $pdo;
    private $lifeGroupModel;
    private $userLogModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->lifeGroupModel = new LifeGroupModel($pdo);
        $this->userLogModel = new UserLogModel($pdo);
    }

    /**
     * Get all life groups (admin only)
     */
    public function index() {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            $lifeGroups = $this->lifeGroupModel->findAll();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $lifeGroups,
                'message' => 'Life groups retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving life groups: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Create a new life group (admin only)
     */
    public function store() {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Use simple approach like TestimonialController
            $data = $_POST ?: json_decode(file_get_contents('php://input'), true);
            
            // Debug logging
            error_log("Received data: " . print_r($data, true));
            
            // Validate required fields
            if (empty($data['title'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Title is required'
                ]);
                return;
            }
            
            // Auto-generate slug from title (only if title is provided)
            if (isset($data['title']) && !empty($data['title'])) {
                $generatedSlug = generateSlug($data['title']);
                $data['slug'] = ensureUniqueSlug($this->pdo, $generatedSlug, 'life_groups', 'slug');
            }
            
            // Set default values (only for fields that exist in the table)
            if (!isset($data['is_active'])) {
                $data['is_active'] = 1;
            }
            
            // Handle banner upload if present (only if there are actual files)
            $bannerData = null;
            if (!empty($_FILES['banner']) && $_FILES['banner']['error'] === UPLOAD_ERR_OK) {
                $bannerData = uploadLifeGroupBanner($_FILES['banner']);
                $data['banner'] = $bannerData['original'];
            }
            
            // Filter data to only include fillable fields
            $fillableFields = ['title', 'slug', 'description', 'banner', 'link', 'is_active'];
            $filteredData = [];
            foreach ($fillableFields as $field) {
                if (isset($data[$field])) {
                    $filteredData[$field] = $data[$field];
                }
            }
            
            // Create life group
            $lifeGroupId = $this->lifeGroupModel->create($filteredData);
            
            if ($lifeGroupId) {
                // Get the created life group data
                $createdLifeGroup = $this->lifeGroupModel->findById($lifeGroupId);
                
                // Log the action
                $this->logAction('life_group_created', "Created life group: {$data['title']}", [
                    'life_group_id' => $lifeGroupId,
                    'slug' => $data['slug'],
                    'title' => $data['title'],
                    'banner_uploaded' => $bannerData ? true : false
                ]);
                
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'data' => $createdLifeGroup,
                    'message' => 'Life group created successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to create life group'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating life group: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get a specific life group (public)
     */
    public function show($id) {
        try {
            $lifeGroup = $this->lifeGroupModel->findById($id);
            
            if (!$lifeGroup) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Life group not found'
                ]);
                return;
            }
            
            // If life group is not active, only admins can view it
            if (!$lifeGroup['is_active']) {
                try {
                    RoleMiddleware::requireAdmin($this->pdo);
                } catch (Exception $e) {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Life group not found'
                    ]);
                    return;
                }
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $lifeGroup,
                'message' => 'Life group retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving life group: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get life group by slug (public)
     */
    public function showBySlug($slug) {
        try {
            $lifeGroup = $this->lifeGroupModel->getLifeGroupBySlug($slug);
            
            if ($lifeGroup === null) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Life group not found'
                ]);
                return;
            }
            
            // If life group is not active, only admins can view it
            if (!$lifeGroup['is_active']) {
                try {
                    RoleMiddleware::requireAdmin($this->pdo);
                } catch (Exception $e) {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Life group not found'
                    ]);
                    return;
                }
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $lifeGroup,
                'message' => 'Life group retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving life group: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update a life group (admin only)
     */
    public function update($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Check if life group exists
            $existingLifeGroup = $this->lifeGroupModel->findById($id);
            if (!$existingLifeGroup) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Life group not found'
                ]);
                return;
            }
            
            // Handle multipart form data or JSON data for PUT/PATCH requests
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
            
            // Handle slug generation if title changed
            if (isset($data['title']) && $data['title'] !== $existingLifeGroup['title']) {
                $generatedSlug = generateSlug($data['title']);
                $data['slug'] = ensureUniqueSlug($this->pdo, $generatedSlug, 'life_groups', 'slug', $id);
            }
            
            // Handle banner upload if present
            $bannerData = null;
            if (!empty($_FILES['banner']) && $_FILES['banner']['error'] === UPLOAD_ERR_OK) {
                try {
                    $bannerData = uploadLifeGroupBanner($_FILES['banner']);
                    $data['banner'] = $bannerData['original'];
                } catch (Exception $e) {
                    // Log the error and continue without banner update
                    error_log('Error uploading life group banner: ' . $e->getMessage());
                    // Don't fail the entire update if banner upload fails
                }
            } else {
                // Preserve existing banner if no new banner is uploaded
                $data['banner'] = $existingLifeGroup['banner'];
            }
            
            // Ensure all fields are included in the update (even null values)
            // Convert null strings to actual null for database
            foreach ($data as $key => $value) {
                if ($value === 'null' || $value === '') {
                    $data[$key] = null;
                }
            }
            
            $result = $this->lifeGroupModel->updateLifeGroup($id, $data);
            
            if ($result) {
                // Get the updated life group data
                $updatedLifeGroup = $this->lifeGroupModel->findById($id);
                
                // Log the action
                $this->logAction('life_group_updated', "Updated life group: {$existingLifeGroup['title']}", [
                    'life_group_id' => $id,
                    'title' => $data['title'] ?? $existingLifeGroup['title']
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => $updatedLifeGroup,
                    'message' => 'Life group updated successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to update life group'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating life group: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete a life group (admin only)
     */
    public function destroy($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Check if life group exists
            $lifeGroup = $this->lifeGroupModel->findById($id);
            if (!$lifeGroup) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Life group not found'
                ]);
                return;
            }
            
            // Delete life group
            $this->lifeGroupModel->delete($id);
            
            // Log the action
            $this->logAction('life_group_deleted', "Deleted life group: {$lifeGroup['title']}", [
                'life_group_id' => $id,
                'title' => $lifeGroup['title']
            ]);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Life group deleted successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting life group: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get active life groups (public)
     */
    public function getActive() {
        try {
            $lifeGroups = $this->lifeGroupModel->getActiveLifeGroups();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $lifeGroups,
                'message' => 'Active life groups retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving active life groups: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Search life groups (public)
     */
    public function search() {
        try {
            $query = $_GET['q'] ?? '';
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : null;
            
            if (empty($query)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Search query is required'
                ]);
                return;
            }
            
            $lifeGroups = $this->lifeGroupModel->searchLifeGroups($query, $limit);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $lifeGroups,
                'message' => 'Search results retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error searching life groups: ' . $e->getMessage()
            ]);
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
            // Log error silently to avoid breaking the main operation
            error_log('Error logging action: ' . $e->getMessage());
        }
    }

    /**
     * Get authentication token from request
     */
    private function getAuthToken() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $matches[1];
        }
        
        return null;
    }
}
?> 