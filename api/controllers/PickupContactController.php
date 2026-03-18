<?php
// api/controllers/PickupContactController.php

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../models/PickupContactModel.php';

class PickupContactController
{
    private $pdo;
    private $pickupModel;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
        $this->pickupModel = new PickupContactModel($pdo);
    }

    private function getUser()
    {
        return AuthMiddleware::requireAuth($this->pdo);
    }

    public function index()
    {
        try {
            $user = $this->getUser();
            $stmt = $this->pdo->prepare("SELECT * FROM pickup_contacts WHERE user_id = ? ORDER BY is_default DESC, id DESC");
            $stmt->execute([$user['id']]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $rows]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function store()
    {
        try {
            $user = $this->getUser();
            $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;

            $name = trim($data['name'] ?? '');
            $phone = trim($data['phone'] ?? '');
            if (!$name || !$phone) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Pickup name and phone are required']);
                return;
            }

            $payload = [
                'user_id' => $user['id'],
                'name' => $name,
                'phone' => $phone,
                'note' => $data['note'] ?? null,
                'is_default' => !empty($data['is_default']) ? 1 : 0,
            ];

            if (!empty($payload['is_default'])) {
                $stmt = $this->pdo->prepare("UPDATE pickup_contacts SET is_default = 0 WHERE user_id = ?");
                $stmt->execute([$user['id']]);
            }

            $id = $this->pickupModel->create($payload);
            $row = $this->pickupModel->findById($id);
            echo json_encode(['success' => true, 'data' => $row]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function destroy($id)
    {
        try {
            $user = $this->getUser();
            $stmt = $this->pdo->prepare("SELECT id FROM pickup_contacts WHERE id = ? AND user_id = ?");
            $stmt->execute([(int)$id, $user['id']]);
            if (!$stmt->fetch()) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Pickup contact not found']);
                return;
            }
            $this->pickupModel->delete((int)$id);
            echo json_encode(['success' => true, 'message' => 'Pickup contact removed']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}
?>
