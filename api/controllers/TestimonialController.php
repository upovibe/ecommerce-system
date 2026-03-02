<?php
// api/controllers/TestimonialController.php - Controller for testimonial management

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../models/TestimonialModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../helpers/SlugHelper.php';

class TestimonialController {
    private $pdo;
    private $testimonialModel;
    private $userLogModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->testimonialModel = new TestimonialModel($pdo);
        $this->userLogModel = new UserLogModel($pdo);
    }

    /**
     * Get all testimonials (admin only)
     */
    public function index() {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            $testimonials = $this->testimonialModel->findAll();
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $testimonials, 'message' => 'Testimonials retrieved successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error retrieving testimonials: ' . $e->getMessage()]);
        }
    }

    /**
     * Create a new testimonial (admin only)
     */
    public function store() {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            $data = $_POST ?: json_decode(file_get_contents('php://input'), true);
            if (empty($data['title'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Title is required']);
                return;
            }
            // Auto-generate slug if not provided
            if (empty($data['slug'])) {
                $generatedSlug = generateSlug($data['title']);
                $data['slug'] = ensureUniqueSlug($this->pdo, $generatedSlug, 'testimonials', 'slug');
            }
            if (empty($data['description'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Description is required']);
                return;
            }
            $testimonialId = $this->testimonialModel->create($data);
            if ($testimonialId) {
                $createdTestimonial = $this->testimonialModel->findById($testimonialId);
                $this->logAction('testimonial_created', "Created testimonial: {$data['title']}", [
                    'testimonial_id' => $testimonialId,
                    'title' => $data['title'],
                    'slug' => $data['slug']
                ]);
                http_response_code(201);
                echo json_encode(['success' => true, 'data' => $createdTestimonial, 'message' => 'Testimonial created successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to create testimonial']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error creating testimonial: ' . $e->getMessage()]);
        }
    }

    /**
     * Get a specific testimonial by ID (public)
     */
    public function show($id) {
        try {
            $testimonial = $this->testimonialModel->findById($id);
            if (!$testimonial) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Testimonial not found']);
                return;
            }
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $testimonial, 'message' => 'Testimonial retrieved successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error retrieving testimonial: ' . $e->getMessage()]);
        }
    }

    /**
     * Update a testimonial (admin only)
     */
    public function update($id) {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            $existingTestimonial = $this->testimonialModel->findById($id);
            if (!$existingTestimonial) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Testimonial not found']);
                return;
            }
            $data = $_POST ?: json_decode(file_get_contents('php://input'), true) ?: [];
            // If title changes, update slug
            if (isset($data['title']) && $data['title'] !== $existingTestimonial['title']) {
                $generatedSlug = generateSlug($data['title']);
                $data['slug'] = ensureUniqueSlug($this->pdo, $generatedSlug, 'testimonials', 'slug', $id);
            }
            $success = $this->testimonialModel->update($id, $data);
            if ($success) {
                $updatedTestimonial = $this->testimonialModel->findById($id);
                $this->logAction('testimonial_updated', "Updated testimonial: {$updatedTestimonial['title']}", [
                    'testimonial_id' => $id,
                    'updated_fields' => array_keys($data)
                ]);
                http_response_code(200);
                echo json_encode(['success' => true, 'data' => $updatedTestimonial, 'message' => 'Testimonial updated successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to update testimonial']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error updating testimonial: ' . $e->getMessage()]);
        }
    }

    /**
     * Delete a testimonial (admin only)
     */
    public function destroy($id) {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            $existingTestimonial = $this->testimonialModel->findById($id);
            if (!$existingTestimonial) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Testimonial not found']);
                return;
            }
            $success = $this->testimonialModel->delete($id);
            if ($success) {
                $this->logAction('testimonial_deleted', "Deleted testimonial: {$existingTestimonial['title']}", [
                    'testimonial_id' => $id,
                    'title' => $existingTestimonial['title']
                ]);
                http_response_code(200);
                echo json_encode(['success' => true, 'message' => 'Testimonial deleted successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to delete testimonial']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error deleting testimonial: ' . $e->getMessage()]);
        }
    }

    /**
     * Get all testimonials (public endpoint)
     */
    public function getPublic() {
        try {
            $testimonials = $this->testimonialModel->findAll();
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $testimonials, 'message' => 'Testimonials retrieved successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error retrieving testimonials: ' . $e->getMessage()]);
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