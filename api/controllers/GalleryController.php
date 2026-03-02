<?php
// api/controllers/GalleryController.php - Controller for gallery management

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../core/MultipartFormParser.php';
require_once __DIR__ . '/../models/GalleryModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../helpers/SlugHelper.php';
require_once __DIR__ . '/../utils/gallery_uploads.php';

class GalleryController {
    private $pdo;
    private $galleryModel;
    private $userLogModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->galleryModel = new GalleryModel($pdo);
        $this->userLogModel = new UserLogModel($pdo);
    }

    /**
     * Get all galleries (admin only)
     */
    public function index() {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            $galleries = $this->galleryModel->findAll();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $galleries,
                'message' => 'Galleries retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving galleries: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Create a new gallery (admin only)
     */
    public function store() {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Handle multipart form data or JSON data for POST requests
            $data = [];
            $content_type = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
            $rawData = file_get_contents('php://input');

            if (strpos($content_type, 'multipart/form-data') !== false) {
                // Use standard PHP $_POST and $_FILES for multipart data (POST requests)
                $data = $_POST;
                // $_FILES is already available globally
            } else {
                // Fall back to JSON
                $data = json_decode($rawData, true) ?? [];
            }
            
            // Auto-generate slug from name (only if name is provided)
            if (isset($data['name']) && !empty($data['name'])) {
                $generatedSlug = generateSlug($data['name']);
                $data['slug'] = ensureUniqueSlug($this->pdo, $generatedSlug, 'galleries', 'slug');
            }
            
            // Set default values (only for fields that exist in the table)
            if (!isset($data['is_active'])) {
                $data['is_active'] = 1;
            }
            

            
            // Handle image uploads if present
            $uploadedImages = [];
            if (!empty($_FILES['images'])) {
                try {
                    // Use the uploadGalleryImages function which handles multiple files properly
                    $uploadedImages = uploadGalleryImages($_FILES['images']);
                } catch (Exception $e) {
                    // Don't fail the entire creation if image upload fails
                    $uploadedImages = [];
                }
            }
            
            if (!empty($uploadedImages)) {
                $data['images'] = $uploadedImages;
            } else {
                $data['images'] = [];
            }
            
            // Create gallery
            $galleryId = $this->galleryModel->create($data);
            
            if ($galleryId) {
                // Get the created gallery data
                $createdGallery = $this->galleryModel->findById($galleryId);
                
                // Log the action
                $this->logAction('gallery_created', "Created gallery: {$data['name']}", [
                    'gallery_id' => $galleryId,
                    'slug' => $data['slug'],
                    'name' => $data['name'],
                    'images_uploaded' => count($uploadedImages)
                ]);
                
                // Get image info safely
                $imageInfo = getGalleryImageInfo($uploadedImages);
                
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'id' => $galleryId,
                        'slug' => $data['slug'],
                        'name' => $data['name'],
                        'description' => $data['description'],
                        'is_active' => $data['is_active'],
                        'images' => $uploadedImages,
                        'image_urls' => $imageInfo
                    ],
                    'message' => 'Gallery created successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to create gallery'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating gallery: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get a specific gallery (public)
     */
    public function show($id) {
        try {
            $gallery = $this->galleryModel->findById($id);
            
            if (!$gallery) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Gallery not found'
                ]);
                return;
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $gallery,
                'message' => 'Gallery retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving gallery: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get gallery by slug (public)
     */
    public function showBySlug($slug) {
        try {
            $gallery = $this->galleryModel->findBySlugInstance($slug);
            
            if (!$gallery) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Gallery not found'
                ]);
                return;
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $gallery,
                'message' => 'Gallery retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving gallery: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update gallery (admin only)
     */
    public function update($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Check if gallery exists
            $existingGallery = $this->galleryModel->findById($id);
            if (!$existingGallery) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Gallery not found'
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
            
            // Auto-generate slug from name if name is being updated
            if (isset($data['name']) && !empty($data['name']) && $data['name'] !== $existingGallery['name']) {
                $generatedSlug = generateSlug($data['name']);
                $data['slug'] = ensureUniqueSlug($this->pdo, $generatedSlug, 'galleries', 'slug', $id);
            }
            
            // Handle image uploads if present
            $uploadedImages = [];
            
            // Check for images with array notation
            $imagesKey = 'images[]';
            if (!empty($_FILES[$imagesKey])) {
                try {
                    // Use the uploadGalleryImages function which handles multiple files properly
                    $uploadedImages = uploadGalleryImages($_FILES[$imagesKey]);
                    
                    // Combine with existing images
                    $existingImages = $existingGallery['images'] ?: [];
                    $data['images'] = array_merge($existingImages, $uploadedImages);
                } catch (Exception $e) {
                    // Don't fail the entire update if image upload fails
                    $data['images'] = $existingGallery['images'] ?: [];
                }
            } else {
                // Preserve existing images if no new images are uploaded
                $data['images'] = $existingGallery['images'] ?: [];
            }
            
            // Update gallery
            $result = $this->galleryModel->update($id, $data);
            
            if ($result) {
                // Get the updated gallery data
                $updatedGallery = $this->galleryModel->findById($id);
                
                // Log the action
                $this->logAction('gallery_updated', "Updated gallery: {$existingGallery['name']}", [
                    'gallery_id' => $id,
                    'slug' => $data['slug'] ?? $existingGallery['slug'],
                    'name' => $data['name'] ?? $existingGallery['name'],
                    'images_added' => count($uploadedImages)
                ]);
                
                // Get image info for the new images
                $newImageInfo = getGalleryImageInfo($uploadedImages);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => $updatedGallery,
                    'message' => 'Gallery updated successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to update gallery'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating gallery: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete gallery (admin only)
     */
    public function destroy($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Check if gallery exists
            $existingGallery = $this->galleryModel->findById($id);
            if (!$existingGallery) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Gallery not found'
                ]);
                return;
            }
            
            // Delete associated images
            if (!empty($existingGallery['images'])) {
                deleteGalleryImages($existingGallery['images']);
            }
            
            // Delete gallery
            $result = $this->galleryModel->delete($id);
            
            if ($result) {
                // Log the action
                $this->logAction('gallery_deleted', "Deleted gallery: {$existingGallery['name']}", [
                    'gallery_id' => $id,
                    'slug' => $existingGallery['slug'],
                    'name' => $existingGallery['name'],
                    'images_deleted' => count($existingGallery['images'] ?: [])
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Gallery deleted successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to delete gallery'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting gallery: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get active galleries (public)
     */
    public function getActive() {
        try {
            $galleries = $this->galleryModel->getActiveGalleries();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $galleries,
                'message' => 'Active galleries retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving active galleries: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get recent galleries (public)
     */
    public function getRecent() {
        try {
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
            $galleries = $this->galleryModel->getRecentGalleries($limit);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $galleries,
                'message' => 'Recent galleries retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving recent galleries: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Remove a single image from gallery (admin only)
     */
    public function removeImage($galleryId, $imageIndex) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Check if gallery exists
            $existingGallery = $this->galleryModel->findById($galleryId);
            if (!$existingGallery) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Gallery not found'
                ]);
                return;
            }
            
            // Get current images array
            $images = $existingGallery['images'] ?: [];
            
            // Validate image index
            if (!is_numeric($imageIndex) || $imageIndex < 0 || $imageIndex >= count($images)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid image index'
                ]);
                return;
            }
            
            // Get the image to remove
            $imageToRemove = $images[$imageIndex];
            
            // Remove the image from the array
            array_splice($images, $imageIndex, 1);
            
            // Delete the image file and thumbnails
            deleteGalleryImages([$imageToRemove]);
            
            // Update the gallery with the new images array
            $updateData = ['images' => $images];
            $result = $this->galleryModel->update($galleryId, $updateData);
            
            if ($result) {
                // Get the updated gallery data
                $updatedGallery = $this->galleryModel->findById($galleryId);
                
                // Log the action
                $this->logAction('gallery_image_removed', "Removed image from gallery: {$existingGallery['name']}", [
                    'gallery_id' => $galleryId,
                    'image_removed' => $imageToRemove,
                    'remaining_images' => count($images)
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => $updatedGallery,
                    'message' => 'Image removed successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to remove image'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error removing image: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Search galleries (public)
     */
    public function search() {
        try {
            $query = $_GET['q'] ?? '';
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
            
            if (empty($query)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Search query is required'
                ]);
                return;
            }
            
            $galleries = $this->galleryModel->searchGalleries($query, $limit);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $galleries,
                'message' => 'Gallery search completed successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error searching galleries: ' . $e->getMessage()
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
            // Log error but don't fail the main operation
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