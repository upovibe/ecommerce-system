<?php
// api/controllers/ProductController.php

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../models/ProductModel.php';
require_once __DIR__ . '/../models/ProductVariantModel.php';
require_once __DIR__ . '/../helpers/SlugHelper.php';
require_once __DIR__ . '/../core/UploadCore.php';

class ProductController
{
    private $pdo;
    private $productModel;
    private $variantModel;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
        $this->productModel = new ProductModel($pdo);
        $this->variantModel = new ProductVariantModel($pdo);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /products — list all products with joins
    // ─────────────────────────────────────────────────────────────────────────
    public function index()
    {
        try {
            RoleMiddleware::requireAdmin($this->pdo);

            $stmt = $this->pdo->query("
                SELECT
                    p.id,
                    p.name,
                    p.slug,
                    p.product_code,
                    p.sku,
                    p.type,
                    p.status,
                    p.description,
                    p.main_image,
                    p.images,
                    p.base_price,
                    p.is_active,
                    p.created_at,
                    p.updated_at,
                    p.category_id,
                    c.name  AS category_name,
                    p.brand_id,
                    b.name  AS brand_name,
                    p.material_id,
                    m.name  AS material_name,
                    p.created_by,
                    p.updated_by,
                    COUNT(v.id)          AS variant_count,
                    COALESCE(SUM(v.stock), 0) AS total_stock
                FROM products p
                LEFT JOIN categories c   ON c.id = p.category_id
                LEFT JOIN brands b       ON b.id = p.brand_id
                LEFT JOIN materials m    ON m.id = p.material_id
                LEFT JOIN product_variants v ON v.product_id = p.id
                GROUP BY p.id
                ORDER BY p.created_at DESC
            ");
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($products as &$p) {
                $p = $this->castProduct($p);
            }

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $products]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /products/{id}
    // ─────────────────────────────────────────────────────────────────────────
    public function show($id)
    {
        try {
            RoleMiddleware::requireAdmin($this->pdo);

            $stmt = $this->pdo->prepare("
                SELECT
                    p.*,
                    c.name  AS category_name,
                    b.name  AS brand_name,
                    m.name  AS material_name
                FROM products p
                LEFT JOIN categories c ON c.id = p.category_id
                LEFT JOIN brands b     ON b.id = p.brand_id
                LEFT JOIN materials m  ON m.id = p.material_id
                WHERE p.id = ?
            ");
            $stmt->execute([$id]);
            $product = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$product) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Product not found']);
                return;
            }

            $product = $this->castProduct($product);

            // Get variants
            $stmt = $this->pdo->prepare("SELECT * FROM product_variants WHERE product_id = ? ORDER BY id");
            $stmt->execute([$id]);
            $variants = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($variants as &$v) {
                $v['stock']          = (int) $v['stock'];
                $v['is_active']      = (bool) $v['is_active'];
                if (is_string($v['variant_options'])) {
                    $v['variant_options'] = json_decode($v['variant_options'], true) ?: [];
                }
            }
            $product['variants'] = $variants;

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $product]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /products
    // ─────────────────────────────────────────────────────────────────────────
    public function store()
    {
        try {
            RoleMiddleware::requireAdmin($this->pdo);

            $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;

            if (empty($data['name'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Product name is required']);
                return;
            }
            if (empty($data['category_id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Category is required']);
                return;
            }

            $slug = generateSlug($data['name']);
            $slug = ensureUniqueSlug($this->pdo, $slug, 'products', 'slug');

            // Resolve updated_by from JWT if available
            $auth = $this->getAuthUserId();

            $productCode = $data['product_code'] ?? null;
            if (empty($productCode)) {
                $productCode = 'PROD-' . strtoupper(substr(uniqid(), -6));
            }

            $productSku = $data['sku'] ?? null;
            if (empty($productSku)) {
                $productSku = strtoupper($slug);
            }

            $id = $this->productModel->create([
                'category_id'  => (int) $data['category_id'],
                'brand_id'     => !empty($data['brand_id'])    ? (int) $data['brand_id']    : null,
                'material_id'  => !empty($data['material_id']) ? (int) $data['material_id'] : null,
                'created_by'   => $auth,
                'updated_by'   => $auth,
                'name'         => trim($data['name']),
                'slug'         => $slug,
                'product_code' => $productCode,
                'sku'          => $productSku,
                'type'         => $data['type']   ?? 'physical',
                'status'       => $data['status'] ?? 'draft',
                'description'  => $data['description'] ?? null,
                'details'      => isset($data['details']) ? json_encode($data['details']) : null,
                'main_image'   => $data['main_image'] ?? null,
                'images'       => isset($data['images']) ? json_encode($data['images']) : null,
                'base_price'   => (float) ($data['base_price'] ?? 0),
                'is_active'    => isset($data['is_active']) ? (int)(bool)$data['is_active'] : 1,
            ]);

            if (!$id) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to create product']);
                return;
            }

            // Seed variants
            if (empty($data['variants'])) {
                $this->pdo->prepare("
                    INSERT INTO product_variants (product_id, stock, is_active, created_at, updated_at)
                    VALUES (?, 0, 1, NOW(), NOW())
                ")->execute([$id]);
            } else {
                foreach ($data['variants'] as $v) {
                    $this->pdo->prepare("
                        INSERT INTO product_variants (product_id, stock, variant_options, is_active, created_at, updated_at)
                        VALUES (?, ?, ?, 1, NOW(), NOW())
                    ")->execute([
                        $id,
                        (int)($v['stock'] ?? 0),
                        json_encode([
                            'type' => $v['type'] ?? 'Default',
                            'value' => $v['value'] ?? ($v['label'] ?? '')
                        ]),
                    ]);
                }
            }

            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Product created', 'data' => ['id' => $id]]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUT /products/{id}
    // ─────────────────────────────────────────────────────────────────────────
    public function update($id)
    {
        try {
            RoleMiddleware::requireAdmin($this->pdo);

            $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;

            $existing = $this->productModel->findById($id);
            if (!$existing) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Product not found']);
                return;
            }

            $auth = $this->getAuthUserId();
            $updateData = ['updated_by' => $auth];

            if (isset($data['name']))        $updateData['name']        = trim($data['name']);
            if (isset($data['category_id'])) $updateData['category_id'] = (int) $data['category_id'];
            if (isset($data['brand_id']))    $updateData['brand_id']    = $data['brand_id'] ? (int) $data['brand_id'] : null;
            if (isset($data['material_id'])) $updateData['material_id'] = $data['material_id'] ? (int) $data['material_id'] : null;
            if (isset($data['product_code'])) $updateData['product_code'] = trim($data['product_code']);
            if (isset($data['sku']))          $updateData['sku']          = trim($data['sku']);
            if (isset($data['type']))        $updateData['type']        = $data['type'];
            if (isset($data['status']))      $updateData['status']      = $data['status'];
            if (isset($data['description'])) $updateData['description'] = $data['description'];
            if (isset($data['details']))     $updateData['details']     = json_encode($data['details']);
            if (isset($data['main_image']))  $updateData['main_image']  = $data['main_image'];
            if (isset($data['images']))      $updateData['images']      = json_encode($data['images']);
            if (isset($data['base_price']))  $updateData['base_price']  = (float) $data['base_price'];
            if (isset($data['is_active']))   $updateData['is_active']   = (int)(bool)$data['is_active'];

            // Regenerate slug only if name changed
            if (!empty($data['name'])) {
                $updateData['slug'] = ensureUniqueSlug(
                    $this->pdo,
                    generateSlug($data['name']),
                    'products',
                    'slug',
                    $id
                );
            }

            $this->productModel->update($id, $updateData);

            // Sync Variants: delete and re-insert for simplicity and data integrity
            if (isset($data['variants'])) {
                $this->pdo->prepare("DELETE FROM product_variants WHERE product_id = ?")->execute([$id]);
                if (empty($data['variants'])) {
                    $this->pdo->prepare("
                        INSERT INTO product_variants (product_id, stock, is_active, created_at, updated_at)
                        VALUES (?, 0, 1, NOW(), NOW())
                    ")->execute([$id]);
                } else {
                    foreach ($data['variants'] as $v) {
                        $this->pdo->prepare("
                            INSERT INTO product_variants (product_id, stock, variant_options, is_active, created_at, updated_at)
                            VALUES (?, ?, ?, 1, NOW(), NOW())
                        ")->execute([
                            $id,
                            (int)($v['stock'] ?? 0),
                            json_encode([
                                'type' => $v['type'] ?? 'Default',
                                'value' => $v['value'] ?? ($v['label'] ?? '')
                            ]),
                        ]);
                    }
                }
            }

            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Product updated']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE /products/{id}
    // ─────────────────────────────────────────────────────────────────────────
    public function destroy($id)
    {
        try {
            RoleMiddleware::requireAdmin($this->pdo);

            $existing = $this->productModel->findById($id);
            if (!$existing) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Product not found']);
                return;
            }

            // Delete local images
            $this->deleteLocalImage($existing['main_image'] ?? null);
            if (!empty($existing['images'])) {
                $imgs = is_string($existing['images']) ? json_decode($existing['images'], true) : $existing['images'];
                foreach ((array)$imgs as $img) { $this->deleteLocalImage($img); }
            }

            $this->pdo->prepare("DELETE FROM product_variants WHERE product_id = ?")->execute([$id]);
            $this->productModel->delete($id);

            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Product deleted']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUT /products/{id}/toggle-active
    // ─────────────────────────────────────────────────────────────────────────
    public function toggleActive($id)
    {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            $p = $this->productModel->findById($id);
            if (!$p) { http_response_code(404); echo json_encode(['success' => false]); return; }
            $new = !$p['is_active'];
            $this->productModel->update($id, ['is_active' => (int)$new, 'updated_by' => $this->getAuthUserId()]);
            http_response_code(200);
            echo json_encode(['success' => true, 'is_active' => $new]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /products/{id}/upload-image
    // ─────────────────────────────────────────────────────────────────────────
    public function uploadImage($id)
    {
        ob_clean();
        try {
            RoleMiddleware::requireAdmin($this->pdo);

            $product = $this->productModel->findById($id);
            if (!$product) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Product not found']);
                return;
            }

            if (!isset($_FILES['image']) || $_FILES['image']['error'] === UPLOAD_ERR_NO_FILE) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'No image file provided']);
                return;
            }

            $config = [
                'upload_path'   => 'uploads/products/',
                'max_size'      => 5242880, // 5MB
                'allowed_types' => ['images' => ['jpg', 'jpeg', 'png', 'gif', 'webp']],
            ];

            $result = uploadImage($_FILES['image'], $config);

            if (!$result['success']) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => $result['message']]);
                return;
            }

            // Delete old main image if stored locally
            $this->deleteLocalImage($product['main_image'] ?? null);

            $auth = $this->getAuthUserId();
            $this->productModel->update($id, [
                'main_image' => $result['filepath'],
                'updated_by' => $auth,
            ]);

            http_response_code(200);
            echo json_encode([
                'success'   => true,
                'image_url' => '/' . $result['filepath'],
                'filepath'  => $result['filepath'],
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function uploadGallery($id)
    {
        ob_clean();
        try {
            RoleMiddleware::requireAdmin($this->pdo);

            $product = $this->productModel->findById($id);
            if (!$product) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Product not found']);
                return;
            }

            if (!isset($_FILES['images']) || empty($_FILES['images']['name'][0])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'No image files provided']);
                return;
            }

            $config = [
                'upload_path'   => 'uploads/products/gallery/',
                'max_size'      => 5242880, // 5MB
                'allowed_types' => ['images' => ['jpg', 'jpeg', 'png', 'gif', 'webp']],
            ];

            $uploadedPaths = [];
            $files = $_FILES['images'];
            $fileCount = is_array($files['name']) ? count($files['name']) : 1;

            if ($fileCount === 1 && !is_array($files['name'])) {
                $uploadResult = uploadImage($files, $config);
                if ($uploadResult['success']) {
                    $uploadedPaths[] = $uploadResult['filepath'];
                }
            } else {
                for ($i = 0; $i < $fileCount; $i++) {
                    if ($files['error'][$i] !== UPLOAD_ERR_OK) continue;

                    $fileEntry = [
                        'name'     => $files['name'][$i],
                        'type'     => $files['type'][$i],
                        'tmp_name' => $files['tmp_name'][$i],
                        'error'    => $files['error'][$i],
                        'size'     => $files['size'][$i],
                    ];

                    $uploadResult = uploadImage($fileEntry, $config);
                    if ($uploadResult['success']) {
                        $uploadedPaths[] = $uploadResult['filepath'];
                    }
                }
            }

            if (empty($uploadedPaths)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Failed to upload any images']);
                return;
            }

            $this->productModel->update($id, [
                'images'      => json_encode($uploadedPaths),
                'updated_by' => $this->getAuthUserId(),
            ]);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'images'  => $uploadedPaths,
                'message' => count($uploadedPaths) . ' images uploaded'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    private function castProduct(array $p): array
    {
        $p['base_price']    = (float) $p['base_price'];
        $p['is_active']     = (bool)  $p['is_active'];
        $p['product_code']  = $p['product_code'] ?? null;
        $p['sku']           = $p['sku'] ?? null;
        $p['variant_count'] = isset($p['variant_count']) ? (int) $p['variant_count'] : null;
        $p['total_stock']   = isset($p['total_stock'])   ? (int) $p['total_stock']   : null;
        foreach (['brand_id', 'material_id', 'category_id', 'created_by', 'updated_by'] as $col) {
            if (isset($p[$col])) $p[$col] = $p[$col] ? (int)$p[$col] : null;
        }
        foreach (['details', 'images'] as $col) {
            if (isset($p[$col]) && is_string($p[$col])) {
                $p[$col] = json_decode($p[$col], true);
            }
        }
        return $p;
    }

    private function getAuthUserId(): ?int
    {
        try {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
            if (!$authHeader) return null;
            $token = str_replace('Bearer ', '', $authHeader);
            $parts = explode('.', $token);
            if (count($parts) !== 3) return null;
            $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
            return isset($payload['id']) ? (int)$payload['id'] : null;
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function deleteLocalImage(?string $path): void
    {
        if (!$path || str_starts_with($path, 'http')) return;
        $full = __DIR__ . '/../../' . ltrim($path, '/');
        if (file_exists($full)) @unlink($full);
    }
}
?>
