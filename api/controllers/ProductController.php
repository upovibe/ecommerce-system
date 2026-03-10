<?php
// api/controllers/ProductController.php

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../models/ProductModel.php';
require_once __DIR__ . '/../models/ProductVariantModel.php';
require_once __DIR__ . '/../helpers/SlugHelper.php';

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

    /**
     * GET /products  — list all products with category and variant count
     */
    public function index()
    {
        try {
            RoleMiddleware::requireAdmin($this->pdo);

            $stmt = $this->pdo->query("
                SELECT p.*, c.name AS category_name,
                       COUNT(v.id) AS variant_count,
                       COALESCE(SUM(v.stock), 0) AS total_stock
                FROM products p
                LEFT JOIN categories c ON c.id = p.category_id
                LEFT JOIN product_variants v ON v.product_id = p.id
                GROUP BY p.id
                ORDER BY p.created_at DESC
            ");
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($products as &$p) {
                $p['base_price']    = (float) $p['base_price'];
                $p['is_active']     = (bool)  $p['is_active'];
                $p['variant_count'] = (int)   $p['variant_count'];
                $p['total_stock']   = (int)   $p['total_stock'];
                if (is_string($p['metadata'])) {
                    $p['metadata'] = json_decode($p['metadata'], true) ?: [];
                }
            }

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $products]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /products/{id}
     */
    public function show($id)
    {
        try {
            RoleMiddleware::requireAdmin($this->pdo);

            $stmt = $this->pdo->prepare("
                SELECT p.*, c.name AS category_name
                FROM products p
                LEFT JOIN categories c ON c.id = p.category_id
                WHERE p.id = ?
            ");
            $stmt->execute([$id]);
            $product = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$product) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Product not found']);
                return;
            }

            $product['base_price'] = (float) $product['base_price'];
            $product['is_active']  = (bool)  $product['is_active'];
            if (is_string($product['metadata'])) {
                $product['metadata'] = json_decode($product['metadata'], true) ?: [];
            }

            // Get variants
            $stmt = $this->pdo->prepare("SELECT * FROM product_variants WHERE product_id = ? ORDER BY id");
            $stmt->execute([$id]);
            $variants = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($variants as &$v) {
                $v['stock']          = (int) $v['stock'];
                $v['price_override'] = $v['price_override'] ? (float) $v['price_override'] : null;
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

    /**
     * POST /products
     */
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

            // Generate unique slug
            $slug = generateSlug($data['name']);
            $slug = ensureUniqueSlug($this->pdo, $slug, 'products', 'slug');

            $metadata = [];
            if (!empty($data['image']))        $metadata['image']        = $data['image'];
            if (!empty($data['brand']))        $metadata['brand']        = $data['brand'];
            if (!empty($data['brand_id']))     $metadata['brand_id']     = (int) $data['brand_id'];
            if (!empty($data['material']))     $metadata['material']     = $data['material'];
            if (!empty($data['material_id']))  $metadata['material_id']  = (int) $data['material_id'];
            if (!empty($data['warranty']))     $metadata['warranty']     = $data['warranty'];

            $id = $this->productModel->create([
                'category_id' => (int) $data['category_id'],
                'name'        => trim($data['name']),
                'slug'        => $slug,
                'type'        => $data['type'] ?? 'physical',
                'description' => $data['description'] ?? null,
                'base_price'  => (float) ($data['base_price'] ?? 0),
                'metadata'    => json_encode($metadata),
                'is_active'   => isset($data['is_active']) ? (int)(bool)$data['is_active'] : 1,
            ]);

            // Seed default variant if none
            if (empty($data['variants'])) {
                $this->pdo->prepare("
                    INSERT INTO product_variants (product_id, sku, stock, is_active, created_at, updated_at)
                    VALUES (?, ?, 0, 1, NOW(), NOW())
                ")->execute([$id, strtoupper($slug) . '-DEFAULT']);
            } else {
                foreach ($data['variants'] as $v) {
                    $this->pdo->prepare("
                        INSERT INTO product_variants (product_id, sku, price_override, stock, variant_options, is_active, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())
                    ")->execute([
                        $id,
                        $v['sku'] ?? null,
                        !empty($v['price_override']) ? (float)$v['price_override'] : null,
                        (int)($v['stock'] ?? 0),
                        json_encode(['label' => $v['label'] ?? 'Default']),
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

    /**
     * PUT /products/{id}
     */
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

            $updateData = [];
            if (isset($data['name']))        $updateData['name']        = trim($data['name']);
            if (isset($data['category_id'])) $updateData['category_id'] = (int) $data['category_id'];
            if (isset($data['type']))        $updateData['type']        = $data['type'];
            if (isset($data['description'])) $updateData['description'] = $data['description'];
            if (isset($data['base_price']))  $updateData['base_price']  = (float) $data['base_price'];
            if (isset($data['is_active']))   $updateData['is_active']   = (int)(bool)$data['is_active'];

            // Merge metadata
            $meta = is_string($existing['metadata'])
                ? (json_decode($existing['metadata'], true) ?: [])
                : ($existing['metadata'] ?: []);
            if (isset($data['image']))       $meta['image']       = $data['image'];
            if (isset($data['brand']))       $meta['brand']       = $data['brand'];
            if (isset($data['brand_id']))    $meta['brand_id']    = (int) $data['brand_id'];
            if (isset($data['material']))    $meta['material']    = $data['material'];
            if (isset($data['material_id'])) $meta['material_id'] = (int) $data['material_id'];
            if (isset($data['warranty']))    $meta['warranty']    = $data['warranty'];
            $updateData['metadata'] = json_encode($meta);

            $this->productModel->update($id, $updateData);

            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Product updated']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * DELETE /products/{id}
     */
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

            // Cascade deletes variants via DB FK, but we delete explicitly for clarity
            $this->pdo->prepare("DELETE FROM product_variants WHERE product_id = ?")->execute([$id]);
            $this->productModel->delete($id);

            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Product deleted']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * PUT /products/{id}/toggle-active
     */
    public function toggleActive($id)
    {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            $p = $this->productModel->findById($id);
            if (!$p) { http_response_code(404); echo json_encode(['success' => false]); return; }
            $new = !$p['is_active'];
            $this->productModel->update($id, ['is_active' => (int)$new]);
            http_response_code(200);
            echo json_encode(['success' => true, 'is_active' => $new]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}
