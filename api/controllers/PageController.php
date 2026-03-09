<?php
// api/controllers/PageController.php - Controller for pages management

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../utils/page_uploads.php';
require_once __DIR__ . '/../core/MultipartFormParser.php';
require_once __DIR__ . '/../models/PageModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../helpers/SlugHelper.php';

class PageController
{
    private $pdo;
    private $pageModel;
    private $userLogModel;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
        $this->pageModel = new PageModel($pdo);
        $this->userLogModel = new UserLogModel($pdo);
    }

    /**
     * Get all pages (admin only)
     */
    public function index()
    {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);

            $pages = $this->pageModel->findAll();

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $pages,
                'message' => 'Pages retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving pages: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Create a new page (admin only)
     */
    public function store()
    {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);

            // Handle multipart form data first (for file uploads)
            if (!empty($_POST)) {
                $data = $_POST;
            } else {
                // Fall back to JSON if no form data
                $data = json_decode(file_get_contents('php://input'), true);
            }

            // Validate required fields
            if (empty($data['title'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Title is required'
                ]);
                return;
            }

            // Auto-generate slug from name only
            if (empty($data['name'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Name is required to generate slug'
                ]);
                return;
            }
            $generatedSlug = generateSlug($data['name']);
            $data['slug'] = ensureUniqueSlug($this->pdo, $generatedSlug, 'pages', 'slug');

            // Create page first to get the ID
            $pageId = $this->pageModel->create($data);

            // Handle banner upload if present
            $bannerPaths = [];
            $bannerFiles = $this->normalizeUploadedFiles('banner');
            if (!empty($bannerFiles)) {
                $bannerPaths = uploadPageBanners($bannerFiles);
            }

            if (!empty($bannerPaths)) {
                $this->pageModel->update($pageId, ['banner_image' => $bannerPaths]);
            }

            // Handle gallery images upload if present
            $galleryPaths = [];
            $imageFiles = $this->normalizeUploadedFiles('images');
            if (!empty($imageFiles)) {
                $galleryPaths = uploadPageBanners($imageFiles);
            }

            if (!empty($galleryPaths)) {
                $this->pageModel->update($pageId, ['images' => $galleryPaths]);
            }

            // Log the action
            $this->logAction('page_created', "Created page: {$data['title']}", [
                'page_id' => $pageId,
                'slug' => $data['slug'],
                'title' => $data['title'],
                'banners_uploaded' => count($bannerPaths)
            ]);

            // Get banner info safely
            $bannerInfo = getPageBannerInfo($bannerPaths);

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'data' => [
                    'id' => $pageId,
                    'slug' => $data['slug'],
                    'banner_images' => $bannerPaths,
                    'banner_urls' => $bannerInfo
                ],
                'message' => 'Page created successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating page: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get a specific page (public)
     */
    public function show($id)
    {
        try {
            $page = $this->pageModel->findById($id);

            if (!$page) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Page not found'
                ]);
                return;
            }

            // If page is not active, only admins can view it
            if (!$page['is_active']) {
                try {
                    RoleMiddleware::requireAdmin($this->pdo);
                } catch (Exception $e) {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Page not found'
                    ]);
                    return;
                }
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $page,
                'message' => 'Page retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving page: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get page by slug (public)
     */
    public function showBySlug($slug)
    {
        try {
            $page = $this->pageModel->findBySlugInstance($slug);

            if (!$page) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Page not found'
                ]);
                return;
            }

            // If page is not active, only admins can view it
            if (!$page['is_active']) {
                try {
                    RoleMiddleware::requireAdmin($this->pdo);
                } catch (Exception $e) {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Page not found'
                    ]);
                    return;
                }
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $page,
                'message' => 'Page retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving page: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update a page (admin only)
     */
    public function update($id)
    {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);

            // Handle PUT/PATCH requests with multipart/form-data
            if (
                in_array($_SERVER['REQUEST_METHOD'], ['PUT', 'PATCH']) &&
                strpos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') === 0
            ) {

                // Get the raw request body
                $rawData = file_get_contents('php://input');

                // Parse multipart data and populate $_POST and $_FILES
                MultipartFormParser::processRequest($rawData, $_SERVER['CONTENT_TYPE']);

                $data = $_POST;
            } else {
                // Handle multipart form data first (for file uploads)
                if (!empty($_POST)) {
                    $data = $_POST;
                } else {
                    // Fall back to JSON if no form data
                    $data = json_decode(file_get_contents('php://input'), true);
                }
            }

            // Check if page exists
            $existingPage = $this->pageModel->findById($id);
            if (!$existingPage) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Page not found'
                ]);
                return;
            }

            // Auto-generate slug if name is changed and no slug is provided
            if ((isset($data['name']) && $data['name'] !== $existingPage['name']) && !isset($data['slug'])) {
                $generatedSlug = generateSlug($data['name']);
                $data['slug'] = ensureUniqueSlug($this->pdo, $generatedSlug, 'pages', 'slug', $id);
            }

            // If slug is being manually updated, check for uniqueness
            if (isset($data['slug']) && $data['slug'] !== $existingPage['slug']) {
                $duplicatePage = $this->pageModel->findBySlugInstance($data['slug']);
                if ($duplicatePage) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Page with this slug already exists'
                    ]);
                    return;
                }
            }

            // Handle banner operations
            $bannerPaths = $existingPage['banner_image'] ?? [];
            if (is_string($bannerPaths)) {
                $bannerPaths = json_decode($bannerPaths, true) ?: [];
            }

            // Check if banner should be deleted (banner_image set to null)
            if (array_key_exists('banner_image', $data) && $data['banner_image'] === null) {
                if (!empty($bannerPaths)) {
                    deletePageBanner($bannerPaths);
                }
                $data['banner_image'] = null;
                $bannerPaths = []; // Clear for response
            }

            // Check for new file uploads
            $newBannerPaths = [];
            $bannerFiles = $this->normalizeUploadedFiles('banner');
            if (!empty($bannerFiles)) {
                $newBannerPaths = uploadPageBanners($bannerFiles);
            }

            if (!empty($newBannerPaths)) {
                // New banners were uploaded, so delete old ones
                if (!empty($bannerPaths)) {
                    deletePageBanner($bannerPaths);
                }
                // And assign the new paths to be saved
                $data['banner_image'] = $newBannerPaths;
                $bannerPaths = $newBannerPaths; // Update for the response
            } else {
                // Keep existing banner if no new one is uploaded
                unset($data['banner_image']);
            }

            // Handle gallery images
            $existingImages = $existingPage['images'] ?? [];
            if (is_string($existingImages)) {
                $existingImages = json_decode($existingImages, true) ?: [];
            }

            $newGalleryPaths = [];
            $imageFiles = $this->normalizeUploadedFiles('images');
            if (!empty($imageFiles)) {
                $newGalleryPaths = uploadPageBanners($imageFiles);
            }

            if (!empty($newGalleryPaths)) {
                // For gallery, we might want to APPEND or REPLACE. 
                // Given the current UI, REPLACE is simpler and usually expected for "Upload Gallery"
                if (!empty($existingImages)) {
                    deletePageBanner($existingImages); // Reuse delete logic
                }
                $data['images'] = $newGalleryPaths;
            } else {
                unset($data['images']);
            }

            $result = $this->pageModel->update($id, $data);

            if ($result) {
                // Log the action
                $this->logAction('page_updated', "Updated page: {$existingPage['title']}", [
                    'page_id' => $id,
                    'slug' => $data['slug'] ?? $existingPage['slug'],
                    'title' => $data['title'] ?? $existingPage['title'],
                    'banners_uploaded' => count($newBannerPaths)
                ]);

                // Get banner info safely
                $bannerInfo = getPageBannerInfo($bannerPaths);

                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Page updated successfully',
                    'data' => [
                        'banner_images' => $bannerPaths,
                        'banner_urls' => $bannerInfo
                    ]
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error updating page'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating page: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete a page (admin only)
     */
    public function destroy($id)
    {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);

            // Check if page exists
            $existingPage = $this->pageModel->findById($id);
            if (!$existingPage) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Page not found'
                ]);
                return;
            }

            // Store page info before deletion for logging
            $pageTitle = $existingPage['title'];
            $pageSlug = $existingPage['slug'];

            // Delete banner images if they exist
            if (!empty($existingPage['banner_image'])) {
                $bannerPaths = $existingPage['banner_image'];
                if (is_string($bannerPaths)) {
                    $bannerPaths = json_decode($bannerPaths, true) ?: [];
                }
                deletePageBanner($bannerPaths);
            }

            $result = $this->pageModel->delete($id);

            if ($result) {
                // Log the action
                $this->logAction('page_deleted', "Deleted page: {$pageTitle}", [
                    'page_id' => $id,
                    'slug' => $pageSlug,
                    'title' => $pageTitle
                ]);

                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Page deleted successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error deleting page'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting page: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get active pages (public)
     */
    public function getActive()
    {
        try {
            $pages = $this->pageModel->getActivePages();

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $pages,
                'message' => 'Active pages retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving active pages: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Normalize file fields from multipart requests.
     * Supports: field, field[], and indexed keys like field[0], field[1], ...
     */
    private function normalizeUploadedFiles($field)
    {
        if (isset($_FILES[$field])) {
            return $_FILES[$field];
        }

        if (isset($_FILES[$field . '[]'])) {
            return $_FILES[$field . '[]'];
        }

        $indexed = [];
        foreach ($_FILES as $key => $file) {
            if (preg_match('/^' . preg_quote($field, '/') . '\[(\d+)\]$/', $key, $matches)) {
                $indexed[(int) $matches[1]] = $file;
            }
        }

        if (empty($indexed)) {
            return [];
        }

        ksort($indexed);
        $normalized = [
            'name' => [],
            'type' => [],
            'tmp_name' => [],
            'error' => [],
            'size' => []
        ];

        foreach ($indexed as $file) {
            $normalized['name'][] = $file['name'] ?? null;
            $normalized['type'][] = $file['type'] ?? null;
            $normalized['tmp_name'][] = $file['tmp_name'] ?? null;
            $normalized['error'][] = $file['error'] ?? UPLOAD_ERR_NO_FILE;
            $normalized['size'][] = $file['size'] ?? 0;
        }

        return $normalized;
    }

    /**
     * Log user action
     * @param string $action Action name
     * @param string $description Action description
     * @param array $metadata Additional metadata
     */
    private function logAction($action, $description = null, $metadata = null)
    {
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
    private function getAuthToken()
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $matches[1];
        }

        return null;
    }
}
