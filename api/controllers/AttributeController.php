<?php
// api/controllers/AttributeController.php

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';

class AttributeController
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    // GET /attributes
    public function index()
    {
        try {
            RoleMiddleware::requireAdmin($this->pdo);

            $stmt = $this->pdo->query("SELECT * FROM product_attributes WHERE is_active = 1 ORDER BY name ASC");
            $attributes = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($attributes as &$attr) {
                $vStmt = $this->pdo->prepare("SELECT * FROM product_attribute_values WHERE attribute_id = ? AND is_active = 1 ORDER BY value ASC");
                $vStmt->execute([$attr['id']]);
                $attr['values'] = $vStmt->fetchAll(PDO::FETCH_ASSOC);
            }

            echo json_encode(['success' => true, 'data' => $attributes]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // POST /attributes
    public function store()
    {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            $data = json_decode(file_get_contents('php://input'), true);

            if (empty($data['name'])) {
                throw new Exception("Attribute name is required");
            }

            $stmt = $this->pdo->prepare("INSERT INTO product_attributes (name, label) VALUES (?, ?)");
            $stmt->execute([$data['name'], $data['label'] ?? null]);
            $id = $this->pdo->lastInsertId();

            if (!empty($data['values']) && is_array($data['values'])) {
                foreach ($data['values'] as $val) {
                    $vStmt = $this->pdo->prepare("INSERT INTO product_attribute_values (attribute_id, value, label) VALUES (?, ?, ?)");
                    $vStmt->execute([$id, $val['value'], $val['label'] ?? null]);
                }
            }

            echo json_encode(['success' => true, 'message' => 'Attribute created', 'data' => ['id' => $id]]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}
?>
