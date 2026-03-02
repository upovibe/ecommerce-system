<?php
// api/controllers/NewsController.php - Controller for news management

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../core/MultipartFormParser.php';
require_once __DIR__ . '/../models/NewsModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../helpers/SlugHelper.php';
require_once __DIR__ . '/../utils/news_uploads.php';

class NewsController {
    private $pdo;
    private $newsModel;
    private $userLogModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->newsModel = new NewsModel($pdo);
        $this->userLogModel = new UserLogModel($pdo);
    }

    /**
     * Get all news (admin only)
     */
    public function index() {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            $news = $this->newsModel->findAll();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $news,
                'message' => 'News retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving news: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Create a new news (admin only)
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
            
            // Auto-generate slug from title (only if title is provided)
            if (isset($data['title']) && !empty($data['title'])) {
                $generatedSlug = generateSlug($data['title']);
                $data['slug'] = ensureUniqueSlug($this->pdo, $generatedSlug, 'news', 'slug');
            }
            
            // Set default values (only for fields that exist in the table)
            if (!isset($data['is_active'])) {
                $data['is_active'] = 1;
            }
            
            // Handle banner upload if present
            $bannerData = null;
            if (!empty($_FILES['banner']) && $_FILES['banner']['error'] === UPLOAD_ERR_OK) {
                $bannerData = uploadNewsBanner($_FILES['banner']);
                $data['banner_image'] = $bannerData['original'];
            }
            
            // Create news
            $newsId = $this->newsModel->create($data);
            
            if ($newsId) {
                // Get the created news data
                $createdNews = $this->newsModel->findById($newsId);
                
                // Log the action
                $this->logAction('news_created', "Created news: {$data['title']}", [
                    'news_id' => $newsId,
                    'slug' => $data['slug'],
                    'title' => $data['title'],
                    'banner_uploaded' => $bannerData ? true : false
                ]);
                
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'data' => $createdNews,
                    'message' => 'News created successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to create news'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating news: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get a specific news (public)
     */
    public function show($id) {
        try {
            $news = $this->newsModel->findById($id);
            
            if (!$news) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'News not found'
                ]);
                return;
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $news,
                'message' => 'News retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving news: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get news by slug (public)
     */
    public function showBySlug($slug) {
        try {
            $news = $this->newsModel->findBySlugInstance($slug);
            
            if (!$news) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'News not found'
                ]);
                return;
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $news,
                'message' => 'News retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving news: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update news (admin only)
     */
    public function update($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Check if news exists
            $existingNews = $this->newsModel->findById($id);
            if (!$existingNews) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'News not found'
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
            
            // Auto-generate slug from title ONLY if title is being updated and is different
            if (isset($data['title']) && !empty($data['title']) && $data['title'] !== $existingNews['title']) {
                $generatedSlug = generateSlug($data['title']);
                $data['slug'] = ensureUniqueSlug($this->pdo, $generatedSlug, 'news', 'slug', $id);
            } else {
                // If title hasn't changed, remove slug from data to prevent update
                unset($data['slug']);
            }
            
            // Handle banner upload if present
            $bannerData = null;
            if (!empty($_FILES['banner']) && $_FILES['banner']['error'] === UPLOAD_ERR_OK) {
                try {
                    $bannerData = uploadNewsBanner($_FILES['banner']);
                    $data['banner_image'] = $bannerData['original'];
                } catch (Exception $e) {
                    // Log the error and continue without banner update
                    error_log('Error uploading news banner: ' . $e->getMessage());
                    // Don't fail the entire update if banner upload fails
                }
            }
            
            // Update news
            $success = $this->newsModel->update($id, $data);
            
            if ($success) {
                // Get the updated news data
                $updatedNews = $this->newsModel->findById($id);
                
                // Log the action
                $this->logAction('news_updated', "Updated news: {$existingNews['title']}", [
                    'news_id' => $id,
                    'old_title' => $existingNews['title'],
                    'new_title' => $data['title'] ?? $existingNews['title'],
                    'banner_updated' => $bannerData ? true : false
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => $updatedNews,
                    'message' => 'News updated successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to update news'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating news: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete news (admin only)
     */
    public function destroy($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Check if news exists
            $existingNews = $this->newsModel->findById($id);
            if (!$existingNews) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'News not found'
                ]);
                return;
            }
            
            // Delete banner image if it exists
            if (!empty($existingNews['banner_image'])) {
                deleteNewsBanner($existingNews['banner_image']);
            }
            
            // Delete news
            $success = $this->newsModel->delete($id);
            
            if ($success) {
                // Log the action
                $this->logAction('news_deleted', "Deleted news: {$existingNews['title']}", [
                    'news_id' => $id,
                    'title' => $existingNews['title'],
                    'slug' => $existingNews['slug']
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'News deleted successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to delete news'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting news: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get active news (public)
     */
    public function getActive() {
        try {
            $news = $this->newsModel->getActiveNews();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $news,
                'message' => 'Active news retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving active news: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get recent news (public)
     */
    public function getRecent() {
        try {
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : null;
            $news = $this->newsModel->getRecentNews($limit);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $news,
                'message' => 'Recent news retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving recent news: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Search news (public)
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
            
            $news = $this->newsModel->searchNews($query, $limit);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $news,
                'message' => 'News search completed successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error searching news: ' . $e->getMessage()
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