<?php
// api/controllers/MaterialController.php

require_once __DIR__ . '/../models/MaterialModel.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../core/UploadCore.php';

class MaterialController
{
    private $model;

    public function __construct($pdo)
    {
        $this->model = new MaterialModel($pdo);
    }

    public function index()
    {
        ob_clean();
        $materials = $this->model->findAll();
        echo json_encode(['success' => true, 'data' => $materials ?: []], JSON_PRETTY_PRINT);
    }

    public function show($id)
    {
        ob_clean();
        $material = $this->model->findById($id);
        if (!$material) {
            http_response_code(404);
            echo json_encode(['error' => 'Material not found'], JSON_PRETTY_PRINT);
            return;
        }
        echo json_encode(['success' => true, 'data' => $material], JSON_PRETTY_PRINT);
    }

    public function store()
    {
        ob_clean();
        global $pdo;
        AuthMiddleware::requireAuth($pdo);

        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['name'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Material name is required'], JSON_PRETTY_PRINT);
            return;
        }

        $slug = $this->generateSlug($data['name']);

        $materialData = [
            'name'        => trim($data['name']),
            'slug'        => $slug,
            'description' => $data['description'] ?? null,
            'image'       => $data['image'] ?? null,
            'is_active'   => isset($data['is_active']) ? (bool) $data['is_active'] : true,
            'sort_order'  => $data['sort_order'] ?? 0,
        ];

        $id = $this->model->create($materialData);
        if (!$id) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create material'], JSON_PRETTY_PRINT);
            return;
        }

        $material = $this->model->findById($id);
        echo json_encode(['success' => true, 'data' => $material], JSON_PRETTY_PRINT);
    }

    public function update($id)
    {
        ob_clean();
        global $pdo;
        AuthMiddleware::requireAuth($pdo);

        $material = $this->model->findById($id);
        if (!$material) {
            http_response_code(404);
            echo json_encode(['error' => 'Material not found'], JSON_PRETTY_PRINT);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $updateData = [];
        if (isset($data['name']))        $updateData['name']        = trim($data['name']);
        if (isset($data['description'])) $updateData['description'] = $data['description'];
        if (isset($data['image']))       $updateData['image']       = $data['image'];
        if (isset($data['is_active']))   $updateData['is_active']   = (bool) $data['is_active'];
        if (isset($data['sort_order']))  $updateData['sort_order']  = (int) $data['sort_order'];

        if (!empty($data['name'])) {
            $updateData['slug'] = $this->generateSlug($data['name'], $id);
        }

        $this->model->update($id, $updateData);
        $updated = $this->model->findById($id);
        echo json_encode(['success' => true, 'data' => $updated], JSON_PRETTY_PRINT);
    }

    public function destroy($id)
    {
        ob_clean();
        global $pdo;
        AuthMiddleware::requireAuth($pdo);

        $material = $this->model->findById($id);
        if (!$material) {
            http_response_code(404);
            echo json_encode(['error' => 'Material not found'], JSON_PRETTY_PRINT);
            return;
        }

        if (!empty($material['image']) && file_exists(__DIR__ . '/../../' . $material['image'])) {
            unlink(__DIR__ . '/../../' . $material['image']);
        }

        $this->model->delete($id);
        echo json_encode(['success' => true, 'message' => 'Material deleted'], JSON_PRETTY_PRINT);
    }

    public function uploadImage($id)
    {
        ob_clean();
        global $pdo;
        AuthMiddleware::requireAuth($pdo);

        $material = $this->model->findById($id);
        if (!$material) {
            http_response_code(404);
            echo json_encode(['error' => 'Material not found'], JSON_PRETTY_PRINT);
            return;
        }

        if (!isset($_FILES['image']) || $_FILES['image']['error'] === UPLOAD_ERR_NO_FILE) {
            http_response_code(400);
            echo json_encode(['error' => 'No image file provided'], JSON_PRETTY_PRINT);
            return;
        }

        $config = [
            'upload_path'  => 'uploads/materials/',
            'max_size'     => 5242880,
            'allowed_types' => ['images' => ['jpg', 'jpeg', 'png', 'gif', 'webp']],
        ];

        $result = uploadImage($_FILES['image'], $config);

        if (!$result['success']) {
            http_response_code(400);
            echo json_encode(['error' => $result['message']], JSON_PRETTY_PRINT);
            return;
        }

        if (!empty($material['image']) && file_exists(__DIR__ . '/../../' . $material['image'])) {
            unlink(__DIR__ . '/../../' . $material['image']);
        }

        $this->model->update($id, ['image' => $result['filepath']]);

        echo json_encode([
            'success' => true,
            'image_url' => '/' . $result['filepath'],
        ], JSON_PRETTY_PRINT);
    }

    public function toggleActive($id)
    {
        ob_clean();
        global $pdo;
        AuthMiddleware::requireAuth($pdo);

        $material = $this->model->findById($id);
        if (!$material) {
            http_response_code(404);
            echo json_encode(['error' => 'Material not found'], JSON_PRETTY_PRINT);
            return;
        }

        $newStatus = !$material['is_active'];
        $this->model->update($id, ['is_active' => $newStatus]);
        echo json_encode(['success' => true, 'is_active' => $newStatus], JSON_PRETTY_PRINT);
    }

    private function generateSlug($name, $excludeId = null)
    {
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name), '-'));
        $original = $slug;
        $count = 1;

        while (true) {
            $stmt = $this->model->getPdo()->prepare("SELECT id FROM materials WHERE slug = ? LIMIT 1");
            $stmt->execute([$slug]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$existing || ($excludeId && $existing['id'] == $excludeId)) {
                break;
            }
            $slug = $original . '-' . $count++;
        }

        return $slug;
    }
}

