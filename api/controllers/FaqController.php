<?php
// api/controllers/FaqController.php - Controller for FAQ management

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../models/FaqModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';

class FaqController
{
    private $pdo;
    private $faqModel;
    private $userLogModel;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
        $this->faqModel = new FaqModel($pdo);
        $this->userLogModel = new UserLogModel($pdo);
    }

    /**
     * Get all FAQs (admin only)
     */
    public function index()
    {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            $faqs = $this->faqModel->findAll();
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $faqs, 'message' => 'FAQs retrieved successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error retrieving FAQs: ' . $e->getMessage()]);
        }
    }

    /**
     * Create a FAQ (admin only)
     */
    public function store()
    {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            $data = $_POST ?: json_decode(file_get_contents('php://input'), true);
            if (empty($data['question'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Question is required']);
                return;
            }
            if (empty($data['answer'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Answer is required']);
                return;
            }
            $faqId = $this->faqModel->create($data);
            if ($faqId) {
                $created = $this->faqModel->findById($faqId);
                $this->logAction('faq_created', 'Created FAQ', ['faq_id' => $faqId]);
                http_response_code(201);
                echo json_encode(['success' => true, 'data' => $created, 'message' => 'FAQ created successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to create FAQ']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error creating FAQ: ' . $e->getMessage()]);
        }
    }

    /**
     * Update a FAQ (admin only)
     */
    public function update($id)
    {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            $existing = $this->faqModel->findById($id);
            if (!$existing) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'FAQ not found']);
                return;
            }
            $data = $_POST ?: json_decode(file_get_contents('php://input'), true) ?: [];
            $success = $this->faqModel->update($id, $data);
            if ($success) {
                $updated = $this->faqModel->findById($id);
                $this->logAction('faq_updated', 'Updated FAQ', ['faq_id' => $id]);
                http_response_code(200);
                echo json_encode(['success' => true, 'data' => $updated, 'message' => 'FAQ updated successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to update FAQ']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error updating FAQ: ' . $e->getMessage()]);
        }
    }

    /**
     * Delete a FAQ (admin only)
     */
    public function destroy($id)
    {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            $existing = $this->faqModel->findById($id);
            if (!$existing) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'FAQ not found']);
                return;
            }
            $success = $this->faqModel->delete($id);
            if ($success) {
                $this->logAction('faq_deleted', 'Deleted FAQ', ['faq_id' => $id]);
                http_response_code(200);
                echo json_encode(['success' => true, 'message' => 'FAQ deleted successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to delete FAQ']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error deleting FAQ: ' . $e->getMessage()]);
        }
    }

    /**
     * Public FAQs
     */
    public function getPublic()
    {
        try {
            $faqs = $this->faqModel->getActive();
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $faqs, 'message' => 'FAQs retrieved successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error retrieving FAQs: ' . $e->getMessage()]);
        }
    }

    private function logAction($action, $description = null, $metadata = null)
    {
        try {
            $token = $this->getAuthToken();
            if ($token) {
                $this->userLogModel->logAction($token, $action, $description, $metadata);
            }
        } catch (Exception $e) {
            error_log('Error logging action: ' . $e->getMessage());
        }
    }

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
