<?php
// api/controllers/SermonController.php - Controller for sermon management

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../core/MultipartFormParser.php';
require_once __DIR__ . '/../models/SermonModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../helpers/SlugHelper.php';
require_once __DIR__ . '/../utils/sermon_uploads.php';

class SermonController {
    private $pdo;
    private $sermonModel;
    private $userLogModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->sermonModel = new SermonModel($pdo);
        $this->userLogModel = new UserLogModel($pdo);
    }

    /**
     * Get all sermons (admin only)
     */
    public function index() {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            $sermons = $this->sermonModel->findAll();
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $sermons, 'message' => 'Sermons retrieved successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error retrieving sermons: ' . $e->getMessage()]);
        }
    }

    /**
     * Create a new sermon (admin only)
     */
    public function store() {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            $data = [];
            $content_type = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
            $rawData = file_get_contents('php://input');

            if (strpos($content_type, 'multipart/form-data') !== false) {
                $data = $_POST;
                // $_FILES is already available globally
            } else {
                $data = json_decode($rawData, true) ?? [];
            }

            // Slug generation
            if (isset($data['title']) && !empty($data['title'])) {
                $generatedSlug = generateSlug($data['title']);
                $data['slug'] = ensureUniqueSlug($this->pdo, $generatedSlug, 'sermons', 'slug');
            }
            if (!isset($data['is_active'])) {
                $data['is_active'] = 1;
            }

            // Server-side validation for required fields
            $requiredFields = ['title', 'speaker', 'date_preached', 'content'];
            foreach ($requiredFields as $field) {
                if (empty($data[$field])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => ucfirst(str_replace('_', ' ', $field)) . ' is required']);
                    return;
                }
            }

            // Handle image uploads
            $uploadedImages = [];
            if (!empty($_FILES['images'])) {
                try {
                    $uploadedImages = uploadSermonImages($_FILES['images']);
                    $data['images'] = $uploadedImages;
                } catch (Exception $e) {
                    $data['images'] = [];
                }
            } else {
                $data['images'] = [];
            }

            // Handle audio uploads
            $uploadedAudio = [];
            if (!empty($_FILES['audio'])) {
                try {
                    $uploadedAudio = uploadSermonAudio($_FILES['audio']);
                    $data['audio_links'] = $uploadedAudio;
                } catch (Exception $e) {
                    $data['audio_links'] = [];
                }
            } else {
                $data['audio_links'] = [];
            }

            // Video links (should be array of URLs)
            if (isset($data['video_links']) && is_array($data['video_links'])) {
                $data['video_links'] = array_filter($data['video_links'], function($link) {
                    return !empty(trim($link));
                });
            } else {
                $data['video_links'] = [];
            }

            $sermonId = $this->sermonModel->create($data);
            
            if ($sermonId) {
                $createdSermon = $this->sermonModel->findById($sermonId);
                $this->logAction('sermon_created', "Created sermon: {$data['title']}", [
                    'sermon_id' => $sermonId,
                    'slug' => $data['slug'],
                    'title' => $data['title'],
                    'images_uploaded' => count($uploadedImages),
                    'audio_uploaded' => count($uploadedAudio),
                    'video_links_count' => count($data['video_links'])
                ]);
                http_response_code(201);
                echo json_encode(['success' => true, 'data' => $createdSermon, 'message' => 'Sermon created successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to create sermon']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error creating sermon: ' . $e->getMessage()]);
        }
    }

    /**
     * Get a specific sermon (public)
     */
    public function show($id) {
        try {
            $sermon = $this->sermonModel->findById($id);
            if (!$sermon) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Sermon not found']);
                return;
            }
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $sermon, 'message' => 'Sermon retrieved successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error retrieving sermon: ' . $e->getMessage()]);
        }
    }

    /**
     * Get sermon by slug (public)
     */
    public function showBySlug($slug) {
        try {
            $sermon = $this->sermonModel->findBySlugInstance($slug);
            if (!$sermon) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Sermon not found']);
                return;
            }
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $sermon, 'message' => 'Sermon retrieved successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error retrieving sermon: ' . $e->getMessage()]);
        }
    }

    /**
     * Update sermon (admin only)
     */
    public function update($id) {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            $existingSermon = $this->sermonModel->findById($id);
            if (!$existingSermon) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Sermon not found']);
                return;
            }
            $data = [];
            $content_type = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
            $rawData = file_get_contents('php://input');

            if (strpos($content_type, 'multipart/form-data') !== false) {
                $parsed = MultipartFormParser::parse($rawData, $content_type);
                $data = $parsed['data'] ?? [];
                $_FILES = $parsed['files'] ?? [];
                
            } else {
                $data = json_decode($rawData, true) ?? [];
            }

            // Slug update if title changes
            if (isset($data['title']) && !empty($data['title']) && $data['title'] !== $existingSermon['title']) {
                $generatedSlug = generateSlug($data['title']);
                $data['slug'] = ensureUniqueSlug($this->pdo, $generatedSlug, 'sermons', 'slug', $id);
            }

            // Handle image uploads (add to existing)
            $uploadedImages = [];
            if (!empty($_FILES['images'])) {
                try {
                    $data['images'] = addSermonImages($_FILES['images'], $existingSermon['images'] ?: []);
                    // Calculate how many new images were added
                    $existingCount = count($existingSermon['images'] ?: []);
                    $newCount = count($data['images']);
                    $uploadedImages = array_fill(0, $newCount - $existingCount, 'new_image');
                } catch (Exception $e) {
                    $data['images'] = $existingSermon['images'] ?: [];
                }
            } else {
                $data['images'] = $existingSermon['images'] ?: [];
            }

            // Handle audio uploads (add to existing)
            $uploadedAudio = [];
            if (!empty($_FILES['audio'])) {
                try {
                    $data['audio_links'] = addSermonAudio($_FILES['audio'], $existingSermon['audio_links'] ?: []);
                    // Calculate how many new audio files were added
                    $existingCount = count($existingSermon['audio_links'] ?: []);
                    $newCount = count($data['audio_links']);
                    $uploadedAudio = array_fill(0, $newCount - $existingCount, 'new_audio');
                } catch (Exception $e) {
                    $data['audio_links'] = $existingSermon['audio_links'] ?: [];
                }
            } else {
                $data['audio_links'] = $existingSermon['audio_links'] ?: [];
            }

            // Video links
            if (isset($data['video_links']) && is_array($data['video_links'])) {
                $data['video_links'] = array_filter($data['video_links'], function($link) {
                    return !empty(trim($link));
                });
            } else {
                $data['video_links'] = $existingSermon['video_links'] ?: [];
            }

            $result = $this->sermonModel->updateSermon($id, $data);
            if ($result) {
                $updatedSermon = $this->sermonModel->findById($id);
                $this->logAction('sermon_updated', "Updated sermon: {$existingSermon['title']}", [
                    'sermon_id' => $id,
                    'slug' => $data['slug'] ?? $existingSermon['slug'],
                    'title' => $data['title'] ?? $existingSermon['title'],
                    'images_added' => count($uploadedImages),
                    'audio_added' => count($uploadedAudio)
                ]);
                http_response_code(200);
                echo json_encode(['success' => true, 'data' => $updatedSermon, 'message' => 'Sermon updated successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to update sermon']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error updating sermon: ' . $e->getMessage()]);
        }
    }

    /**
     * Delete sermon (admin only)
     */
    public function destroy($id) {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            $existingSermon = $this->sermonModel->findById($id);
            if (!$existingSermon) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Sermon not found']);
                return;
            }
            // Delete images
            if (!empty($existingSermon['images'])) {
                deleteSermonMedia($existingSermon['images']);
            }
            if (!empty($existingSermon['audio_links'])) {
                deleteSermonMedia($existingSermon['audio_links']);
            }
            $result = $this->sermonModel->delete($id);
            if ($result) {
                $this->logAction('sermon_deleted', "Deleted sermon: {$existingSermon['title']}", [
                    'sermon_id' => $id,
                    'slug' => $existingSermon['slug'],
                    'title' => $existingSermon['title']
                ]);
                http_response_code(200);
                echo json_encode(['success' => true, 'message' => 'Sermon deleted successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to delete sermon']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error deleting sermon: ' . $e->getMessage()]);
        }
    }

    /**
     * Get active sermons (public)
     */
    public function getActive() {
        try {
            $sermons = $this->sermonModel->getActiveSermons();
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $sermons, 'message' => 'Active sermons retrieved successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error retrieving active sermons: ' . $e->getMessage()]);
        }
    }

    /**
     * Get recent sermons (public)
     */
    public function getRecent() {
        try {
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
            $sermons = $this->sermonModel->getRecentSermons($limit);
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $sermons, 'message' => 'Recent sermons retrieved successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error retrieving recent sermons: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove a single image from sermon (admin only)
     */
    public function removeImage($sermonId, $imageIndex) {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            $existingSermon = $this->sermonModel->findById($sermonId);
            if (!$existingSermon) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Sermon not found']);
                return;
            }
            $images = $existingSermon['images'] ?: [];
            if (!is_numeric($imageIndex) || $imageIndex < 0 || $imageIndex >= count($images)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid image index']);
                return;
            }
            $imageToRemove = $images[$imageIndex];
            $images = removeSermonMedia([$imageToRemove], $images);
            $updateData = ['images' => $images];
            $result = $this->sermonModel->updateSermon($sermonId, $updateData);
            if ($result) {
                $updatedSermon = $this->sermonModel->findById($sermonId);
                $this->logAction('sermon_image_removed', "Removed image from sermon: {$existingSermon['title']}", [
                    'sermon_id' => $sermonId,
                    'image_removed' => $imageToRemove,
                    'remaining_images' => count($images)
                ]);
                http_response_code(200);
                echo json_encode(['success' => true, 'data' => $updatedSermon, 'message' => 'Image removed successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to remove image']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error removing image: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove a single audio file from sermon (admin only)
     */
    public function removeAudio($sermonId, $audioIndex) {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            $existingSermon = $this->sermonModel->findById($sermonId);
            if (!$existingSermon) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Sermon not found']);
                return;
            }
            $audioLinks = $existingSermon['audio_links'] ?: [];
            if (!is_numeric($audioIndex) || $audioIndex < 0 || $audioIndex >= count($audioLinks)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid audio index']);
                return;
            }
            $audioToRemove = $audioLinks[$audioIndex];
            $audioLinks = removeSermonMedia([$audioToRemove], $audioLinks);
            $updateData = ['audio_links' => $audioLinks];
            $result = $this->sermonModel->updateSermon($sermonId, $updateData);
            if ($result) {
                $updatedSermon = $this->sermonModel->findById($sermonId);
                $this->logAction('sermon_audio_removed', "Removed audio from sermon: {$existingSermon['title']}", [
                    'sermon_id' => $sermonId,
                    'audio_removed' => $audioToRemove,
                    'remaining_audio' => count($audioLinks)
                ]);
                http_response_code(200);
                echo json_encode(['success' => true, 'data' => $updatedSermon, 'message' => 'Audio removed successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to remove audio']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error removing audio: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove a single video link from sermon (admin only)
     */
    public function removeVideoLink($sermonId, $videoIndex) {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            $existingSermon = $this->sermonModel->findById($sermonId);
            if (!$existingSermon) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Sermon not found']);
                return;
            }
            $videoLinks = $existingSermon['video_links'] ?: [];
            if (!is_numeric($videoIndex) || $videoIndex < 0 || $videoIndex >= count($videoLinks)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid video index']);
                return;
            }
            $videoToRemove = $videoLinks[$videoIndex];
            array_splice($videoLinks, $videoIndex, 1);
            $updateData = ['video_links' => $videoLinks];
            $result = $this->sermonModel->updateSermon($sermonId, $updateData);
            if ($result) {
                $updatedSermon = $this->sermonModel->findById($sermonId);
                $this->logAction('sermon_video_removed', "Removed video from sermon: {$existingSermon['title']}", [
                    'sermon_id' => $sermonId,
                    'video_removed' => $videoToRemove,
                    'remaining_videos' => count($videoLinks)
                ]);
                http_response_code(200);
                echo json_encode(['success' => true, 'data' => $updatedSermon, 'message' => 'Video removed successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to remove video']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error removing video: ' . $e->getMessage()]);
        }
    }

    /**
     * Search sermons (public)
     */
    public function search() {
        try {
            $query = $_GET['q'] ?? '';
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
            if (empty($query)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Search query is required']);
                return;
            }
            $sermons = $this->sermonModel->searchSermons($query, $limit);
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $sermons, 'message' => 'Sermon search completed successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error searching sermons: ' . $e->getMessage()]);
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
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $matches[1];
        }
        return null;
    }
}
?> 