<?php
// api/controllers/AddressController.php

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../models/AddressModel.php';

class AddressController
{
    private $pdo;
    private $addressModel;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
        $this->addressModel = new AddressModel($pdo);
    }

    private function getUser()
    {
        return AuthMiddleware::requireAuth($this->pdo);
    }

    public function index()
    {
        try {
            $user = $this->getUser();
            $stmt = $this->pdo->prepare("SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC");
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

            $line1 = trim($data['address_line1'] ?? '');
            $city = trim($data['city'] ?? '');
            if (!$line1 || !$city) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Address line and city are required']);
                return;
            }

            $payload = [
                'user_id' => $user['id'],
                'type' => $data['type'] ?? 'shipping',
                'address_line1' => $line1,
                'address_line2' => $data['address_line2'] ?? null,
                'city' => $city,
                'state' => $data['state'] ?? null,
                'country' => $data['country'] ?? 'Nigeria',
                'postal_code' => $data['postal_code'] ?? null,
                'is_default' => !empty($data['is_default']) ? 1 : 0,
            ];

            if (!empty($payload['is_default'])) {
                $stmt = $this->pdo->prepare("UPDATE addresses SET is_default = 0 WHERE user_id = ?");
                $stmt->execute([$user['id']]);
            }

            $id = $this->addressModel->create($payload);
            $row = $this->addressModel->findById($id);
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
            $stmt = $this->pdo->prepare("SELECT id FROM addresses WHERE id = ? AND user_id = ?");
            $stmt->execute([(int)$id, $user['id']]);
            if (!$stmt->fetch()) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Address not found']);
                return;
            }
            $this->addressModel->delete((int)$id);
            echo json_encode(['success' => true, 'message' => 'Address removed']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}
?>
