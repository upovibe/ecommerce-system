<?php
// api/controllers/VideoGalleryController.php - Controller for video gallery management

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../models/VideoGalleryModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../helpers/SlugHelper.php';

class VideoGalleryController {
    private $pdo;
    private $videoGalleryModel;
    private $userLogModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->videoGalleryModel = new VideoGalleryModel($pdo);
        $this->userLogModel = new UserLogModel($pdo);
    }

    /**
     * Get all video galleries (admin only)
     */
    public function index() {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            $videoGalleries = $this->videoGalleryModel->findAll();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $videoGalleries,
                'message' => 'Video galleries retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving video galleries: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Create a new video gallery (admin only)
     */
    public function store() {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (!isset($data['name']) || empty($data['name'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Gallery name is required'
                ]);
                return;
            }
            
            // Auto-generate slug from name
            $generatedSlug = generateSlug($data['name']);
            $data['slug'] = ensureUniqueSlug($this->pdo, $generatedSlug, 'video_galleries', 'slug');
            
            // Set default values
            if (!isset($data['is_active'])) {
                $data['is_active'] = 1;
            }
            
            // Handle video links if present
            if (isset($data['video_links']) && is_array($data['video_links'])) {
                // Filter out empty links
                $data['video_links'] = array_filter($data['video_links'], function($link) {
                    return !empty(trim($link));
                });
            } else {
                $data['video_links'] = [];
            }
            
            // Create video gallery
            $videoGalleryId = $this->videoGalleryModel->create($data);
            
            if ($videoGalleryId) {
                // Get the created video gallery data
                $createdVideoGallery = $this->videoGalleryModel->findById($videoGalleryId);
                
                // Log the action
                $this->logAction('video_gallery_created', "Created video gallery: {$data['name']}", [
                    'video_gallery_id' => $videoGalleryId,
                    'slug' => $data['slug'],
                    'name' => $data['name'],
                    'video_links_count' => count($data['video_links'])
                ]);
                
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'data' => $createdVideoGallery,
                    'message' => 'Video gallery created successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to create video gallery'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating video gallery: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get a specific video gallery (public)
     */
    public function show($id) {
        try {
            $videoGallery = $this->videoGalleryModel->findById($id);
            
            if (!$videoGallery) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Video gallery not found'
                ]);
                return;
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $videoGallery,
                'message' => 'Video gallery retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving video gallery: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get video gallery by slug (public)
     */
    public function showBySlug($slug) {
        try {
            $videoGallery = $this->videoGalleryModel->findBySlugInstance($slug);
            
            if (!$videoGallery) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Video gallery not found'
                ]);
                return;
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $videoGallery,
                'message' => 'Video gallery retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving video gallery: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update video gallery (admin only)
     */
    public function update($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Handle multipart form data or JSON data for PUT requests
            $data = [];
            $content_type = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
            $rawData = file_get_contents('php://input');

            if (strpos($content_type, 'multipart/form-data') !== false) {
                // Use standard PHP $_POST for multipart data (PUT requests)
                $data = $_POST;
            } else {
                // Fall back to JSON
                $data = json_decode($rawData, true) ?? [];
            }
            
            // Auto-generate slug from name (only if name is provided and changed)
            if (isset($data['name']) && !empty($data['name'])) {
                $generatedSlug = generateSlug($data['name']);
                $data['slug'] = ensureUniqueSlug($this->pdo, $generatedSlug, 'video_galleries', 'slug', $id);
            }
            
            // Handle video links if present
            if (isset($data['video_links']) && is_array($data['video_links'])) {
                // Filter out empty links
                $data['video_links'] = array_filter($data['video_links'], function($link) {
                    return !empty(trim($link));
                });
            }
            
            // Update video gallery
            $success = $this->videoGalleryModel->update($id, $data);
            
            if ($success) {
                // Get the updated video gallery data
                $updatedVideoGallery = $this->videoGalleryModel->findById($id);
                
                // Log the action
                $this->logAction('video_gallery_updated', "Updated video gallery: {$data['name']}", [
                    'video_gallery_id' => $id,
                    'slug' => $data['slug'] ?? null,
                    'name' => $data['name'] ?? null,
                    'video_links_count' => isset($data['video_links']) ? count($data['video_links']) : null
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => $updatedVideoGallery,
                    'message' => 'Video gallery updated successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to update video gallery'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating video gallery: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete video gallery (admin only)
     */
    public function destroy($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Get video gallery data before deletion for logging
            $videoGallery = $this->videoGalleryModel->findById($id);
            
            if (!$videoGallery) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Video gallery not found'
                ]);
                return;
            }
            
            // Delete video gallery
            $success = $this->videoGalleryModel->delete($id);
            
            if ($success) {
                // Log the action
                $this->logAction('video_gallery_deleted', "Deleted video gallery: {$videoGallery['name']}", [
                    'video_gallery_id' => $id,
                    'slug' => $videoGallery['slug'],
                    'name' => $videoGallery['name']
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Video gallery deleted successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to delete video gallery'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting video gallery: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get active video galleries (public)
     */
    public function getActive() {
        try {
            $videoGalleries = $this->videoGalleryModel->getActiveVideoGalleries();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $videoGalleries,
                'message' => 'Active video galleries retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving active video galleries: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get recent video galleries (public)
     */
    public function getRecent() {
        try {
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : null;
            $videoGalleries = $this->videoGalleryModel->getRecentVideoGalleries($limit);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $videoGalleries,
                'message' => 'Recent video galleries retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving recent video galleries: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Remove video link from video gallery (admin only)
     */
    public function removeVideoLink($videoGalleryId, $videoIndex) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            $videoGallery = $this->videoGalleryModel->findById($videoGalleryId);
            
            if (!$videoGallery) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Video gallery not found'
                ]);
                return;
            }
            
            $videoLinks = $videoGallery['video_links'] ?? [];
            
            if (!is_array($videoLinks) || $videoIndex < 0 || $videoIndex >= count($videoLinks)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid video index'
                ]);
                return;
            }
            
            // Remove the video link at the specified index
            array_splice($videoLinks, $videoIndex, 1);
            
            // Update the video gallery
            $success = $this->videoGalleryModel->updateVideoGallery($videoGalleryId, [
                'video_links' => $videoLinks
            ]);
            
            if ($success) {
                // Get the updated video gallery data
                $updatedVideoGallery = $this->videoGalleryModel->findById($videoGalleryId);
                
                // Log the action
                $this->logAction('video_link_removed', "Removed video link from gallery: {$videoGallery['name']}", [
                    'video_gallery_id' => $videoGalleryId,
                    'video_index' => $videoIndex,
                    'remaining_videos' => count($videoLinks)
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => $updatedVideoGallery,
                    'message' => 'Video link removed successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to remove video link'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error removing video link: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Search video galleries (public)
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
            
            $videoGalleries = $this->videoGalleryModel->searchVideoGalleries($query, $limit);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $videoGalleries,
                'message' => 'Video galleries search completed successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error searching video galleries: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Log user actions
     */
    private function logAction($action, $description = null, $metadata = null) {
        try {
            $token = $this->getAuthToken();
            if ($token) {
                $this->userLogModel->logAction($token, $action, $description, $metadata);
            }
        } catch (Exception $e) {
            // Don't fail the main operation if logging fails
            error_log('Failed to log action: ' . $e->getMessage());
        }
    }

    /**
     * Get authentication token from request headers
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