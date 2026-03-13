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

            $stmt = $this->pdo->query("SELECT id, name FROM product_variant_types ORDER BY name ASC");
            $types = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $types]);
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

            $name = trim($data['name']);

            $stmt = $this->pdo->prepare("SELECT id FROM product_variant_types WHERE LOWER(name) = LOWER(?) LIMIT 1");
            $stmt->execute([$name]);
            $id = $stmt->fetchColumn();

            if (!$id) {
                $stmt = $this->pdo->prepare("INSERT INTO product_variant_types (name) VALUES (?)");
                $stmt->execute([$name]);
                $id = $this->pdo->lastInsertId();
            }

            echo json_encode(['success' => true, 'message' => 'Variant type saved', 'data' => ['id' => (int)$id]]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}
?>
