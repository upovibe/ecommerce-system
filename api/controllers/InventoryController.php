<?php
// api/controllers/InventoryController.php

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../models/ProductModel.php';
require_once __DIR__ . '/../models/ProductVariantModel.php';
require_once __DIR__ . '/../models/CategoryModel.php';

class InventoryController
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * GET /inventory
     * Returns all products with aggregated stock info from variants
     */
    public function index()
    {
        try {
            RoleMiddleware::requireAdmin($this->pdo);

            $stmt = $this->pdo->prepare("
                SELECT
                    p.id,
                    p.name,
                    p.slug,
                    p.type,
                    p.base_price,
                    p.is_active,
                    p.created_at,
                    p.updated_at,
                    c.name AS category_name,
                    COUNT(v.id) AS variant_count,
                    COALESCE(SUM(v.stock), 0) AS total_stock,
                    COALESCE(MIN(v.stock), 0) AS min_stock,
                    COALESCE(MAX(v.stock), 0) AS max_stock,
                    SUM(CASE WHEN v.stock = 0 THEN 1 ELSE 0 END) AS out_of_stock_count,
                    SUM(CASE WHEN v.stock > 0 AND v.stock <= 10 THEN 1 ELSE 0 END) AS low_stock_count
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN product_variants v ON v.product_id = p.id
                GROUP BY p.id
                ORDER BY p.updated_at DESC
            ");
            $stmt->execute();
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Cast types
            foreach ($products as &$product) {
                $product['base_price'] = (float) $product['base_price'];
                $product['is_active'] = (bool) $product['is_active'];
                $product['variant_count'] = (int) $product['variant_count'];
                $product['total_stock'] = (int) $product['total_stock'];
                $product['min_stock'] = (int) $product['min_stock'];
                $product['max_stock'] = (int) $product['max_stock'];
                $product['out_of_stock_count'] = (int) $product['out_of_stock_count'];
                $product['low_stock_count'] = (int) $product['low_stock_count'];
            }

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $products]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /inventory/{id}/variants
     * Returns all variants for a specific product
     */
    public function getVariants($id)
    {
        try {
            RoleMiddleware::requireAdmin($this->pdo);

            $stmt = $this->pdo->prepare("
                SELECT v.*, p.name AS product_name, p.base_price
                FROM product_variants v
                JOIN products p ON v.product_id = p.id
                WHERE v.product_id = ?
                ORDER BY v.id ASC
            ");
            $stmt->execute([$id]);
            $variants = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($variants as &$v) {
                $v['stock'] = (int) $v['stock'];
                $v['price_override'] = $v['price_override'] ? (float) $v['price_override'] : null;
                $v['is_active'] = (bool) $v['is_active'];
                if (is_string($v['variant_options'])) {
                    $v['variant_options'] = json_decode($v['variant_options'], true) ?: [];
                }
            }

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $variants]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * PUT /inventory/variants/{id}/stock
     * Adjust stock for a specific variant
     */
    public function updateVariantStock($id)
    {
        try {
            RoleMiddleware::requireAdmin($this->pdo);

            $data = json_decode(file_get_contents('php://input'), true);
            if (!isset($data['stock'])) {
                // also try POST body
                $data = $_POST;
            }

            if (!isset($data['stock'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Stock value is required']);
                return;
            }

            $stock = max(0, (int) $data['stock']);

            $stmt = $this->pdo->prepare("SELECT id FROM product_variants WHERE id = ?");
            $stmt->execute([$id]);
            if (!$stmt->fetch()) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Variant not found']);
                return;
            }

            $stmt = $this->pdo->prepare("UPDATE product_variants SET stock = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$stock, $id]);

            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Stock updated', 'data' => ['id' => (int)$id, 'stock' => $stock]]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * GET /inventory/summary
     * Returns high-level stock summary stats
     */
    public function summary()
    {
        try {
            RoleMiddleware::requireAdmin($this->pdo);

            $row = $this->pdo->query("
                SELECT
                    COUNT(DISTINCT p.id) AS total_products,
                    COUNT(v.id) AS total_variants,
                    COALESCE(SUM(v.stock), 0) AS total_units,
                    SUM(CASE WHEN v.stock = 0 THEN 1 ELSE 0 END) AS out_of_stock,
                    SUM(CASE WHEN v.stock > 0 AND v.stock <= 10 THEN 1 ELSE 0 END) AS low_stock,
                    SUM(CASE WHEN v.stock > 10 THEN 1 ELSE 0 END) AS in_stock
                FROM products p
                LEFT JOIN product_variants v ON v.product_id = p.id
            ")->fetch(PDO::FETCH_ASSOC);

            foreach ($row as $k => $v) {
                $row[$k] = (int) $v;
            }

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $row]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}
