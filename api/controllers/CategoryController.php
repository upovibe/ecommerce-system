<?php
// api/controllers/CategoryController.php

require_once __DIR__ . '/../models/CategoryModel.php';
require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../core/UploadCore.php';

class CategoryController
{
    private $model;

    public function __construct($pdo)
    {
        $this->model = new CategoryModel($pdo);
    }

    public function index()
    {
        ob_clean();
        $categories = $this->model->findAll();
        echo json_encode(['success' => true, 'data' => $categories ?: []], JSON_PRETTY_PRINT);
    }

    public function show($id)
    {
        ob_clean();
        $category = $this->model->findById($id);
        if (!$category) {
            http_response_code(404);
            echo json_encode(['error' => 'Category not found'], JSON_PRETTY_PRINT);
            return;
        }
        echo json_encode(['success' => true, 'data' => $category], JSON_PRETTY_PRINT);
    }

    public function store()
    {
        ob_clean();
        global $pdo;
        AuthMiddleware::requireAuth($pdo);

        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['name'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Category name is required'], JSON_PRETTY_PRINT);
            return;
        }

        // Auto-generate slug from name
        $slug = $this->generateSlug($data['name']);

        $categoryData = [
            'name'        => trim($data['name']),
            'slug'        => $slug,
            'description' => $data['description'] ?? null,
            'image'       => $data['image'] ?? null,
            'parent_id'   => $data['parent_id'] ?? null,
            'is_active'   => isset($data['is_active']) ? (bool)$data['is_active'] : true,
            'sort_order'  => $data['sort_order'] ?? 0,
        ];

        $id = $this->model->create($categoryData);
        if (!$id) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create category'], JSON_PRETTY_PRINT);
            return;
        }

        $category = $this->model->findById($id);
        echo json_encode(['success' => true, 'data' => $category], JSON_PRETTY_PRINT);
    }

    public function update($id)
    {
        ob_clean();
        global $pdo;
        AuthMiddleware::requireAuth($pdo);

        $category = $this->model->findById($id);
        if (!$category) {
            http_response_code(404);
            echo json_encode(['error' => 'Category not found'], JSON_PRETTY_PRINT);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        $updateData = [];
        if (isset($data['name']))        $updateData['name']        = trim($data['name']);
        if (isset($data['description'])) $updateData['description'] = $data['description'];
        if (isset($data['image']))       $updateData['image']       = $data['image'];
        if (isset($data['parent_id']))   $updateData['parent_id']   = $data['parent_id'];
        if (isset($data['is_active']))   $updateData['is_active']   = (bool)$data['is_active'];
        if (isset($data['sort_order']))  $updateData['sort_order']  = (int)$data['sort_order'];

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

        $category = $this->model->findById($id);
        if (!$category) {
            http_response_code(404);
            echo json_encode(['error' => 'Category not found'], JSON_PRETTY_PRINT);
            return;
        }

        // Delete image file if exists
        if (!empty($category['image']) && file_exists(__DIR__ . '/../../' . $category['image'])) {
            unlink(__DIR__ . '/../../' . $category['image']);
        }

        $this->model->delete($id);
        echo json_encode(['success' => true, 'message' => 'Category deleted'], JSON_PRETTY_PRINT);
    }

    public function uploadImage($id)
    {
        ob_clean();
        global $pdo;
        AuthMiddleware::requireAuth($pdo);

        $category = $this->model->findById($id);
        if (!$category) {
            http_response_code(404);
            echo json_encode(['error' => 'Category not found'], JSON_PRETTY_PRINT);
            return;
        }

        if (!isset($_FILES['image']) || $_FILES['image']['error'] === UPLOAD_ERR_NO_FILE) {
            http_response_code(400);
            echo json_encode(['error' => 'No image file provided'], JSON_PRETTY_PRINT);
            return;
        }

        $config = [
            'upload_path'  => 'uploads/categories/',
            'max_size'     => 5242880, // 5MB
            'allowed_types' => ['images' => ['jpg', 'jpeg', 'png', 'gif', 'webp']],
        ];

        $result = uploadImage($_FILES['image'], $config);

        if (!$result['success']) {
            http_response_code(400);
            echo json_encode(['error' => $result['message']], JSON_PRETTY_PRINT);
            return;
        }

        // Delete old image
        if (!empty($category['image']) && file_exists(__DIR__ . '/../../' . $category['image'])) {
            unlink(__DIR__ . '/../../' . $category['image']);
        }

        $this->model->update($id, ['image' => $result['filepath']]);

        echo json_encode([
            'success'   => true,
            'image_url' => '/' . $result['filepath'],
        ], JSON_PRETTY_PRINT);
    }

    public function toggleActive($id)
    {
        ob_clean();
        global $pdo;
        AuthMiddleware::requireAuth($pdo);

        $category = $this->model->findById($id);
        if (!$category) {
            http_response_code(404);
            echo json_encode(['error' => 'Category not found'], JSON_PRETTY_PRINT);
            return;
        }

        $newStatus = !$category['is_active'];
        $this->model->update($id, ['is_active' => $newStatus]);
        echo json_encode(['success' => true, 'is_active' => $newStatus], JSON_PRETTY_PRINT);
    }

    private function generateSlug($name, $excludeId = null)
    {
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name), '-'));
        $original = $slug;
        $count = 1;

        while (true) {
            $stmt = $this->model->getPdo()->prepare("SELECT id FROM categories WHERE slug = ? LIMIT 1");
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
