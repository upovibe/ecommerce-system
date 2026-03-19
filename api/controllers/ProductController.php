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
                    p.has_variants,
                    p.has_attributes,
                    p.has_brand,
                    p.has_material,
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
                    v.variant_count,
                    v.total_stock,
                    promo.id AS promotion_id,
                    promo.name AS promotion_name,
                    promo.discount_type,
                    promo.discount_value,
                    promo.start_date AS promotion_start,
                    promo.end_date AS promotion_end
                FROM products p
                LEFT JOIN categories c   ON c.id = p.category_id
                LEFT JOIN brands b       ON b.id = p.brand_id
                LEFT JOIN materials m    ON m.id = p.material_id
                LEFT JOIN (
                    SELECT product_id, COUNT(id) AS variant_count, COALESCE(SUM(COALESCE(quantity, 0)), 0) AS total_stock
                    FROM product_variants
                    GROUP BY product_id
                ) v ON v.product_id = p.id
                LEFT JOIN (
                    SELECT pp.product_id, pr.id, pr.name, pr.discount_type, pr.discount_value, pr.start_date, pr.end_date
                    FROM product_promotions pp
                    JOIN promotions pr ON pr.id = pp.promotion_id
                    WHERE pr.status = 'active' 
                      AND pr.start_date <= NOW() 
                      AND pr.end_date >= NOW()
                ) promo ON promo.product_id = p.id
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

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // GET /products/public â€” public product list (active only)
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    public function publicIndex()
    {
        try {
            $stmt = $this->pdo->query("
                SELECT
                    p.id,
                    p.name,
                    p.slug,
                    p.type,
                    p.status,
                    p.description,
                    p.main_image,
                    p.images,
                    p.base_price,
                    p.is_active,
                    p.has_variants,
                    p.has_attributes,
                    p.has_brand,
                    p.has_material,
                    p.created_at,
                    p.updated_at,
                    p.category_id,
                    c.name  AS category_name,
                    p.brand_id,
                    b.name  AS brand_name,
                    p.material_id,
                    m.name  AS material_name,
                    v.variant_count,
                    v.total_stock,
                    promo.id AS promotion_id,
                    promo.name AS promotion_name,
                    promo.discount_type,
                    promo.discount_value,
                    promo.start_date AS promotion_start,
                    promo.end_date AS promotion_end
                FROM products p
                LEFT JOIN categories c   ON c.id = p.category_id
                LEFT JOIN brands b       ON b.id = p.brand_id
                LEFT JOIN materials m    ON m.id = p.material_id
                LEFT JOIN (
                    SELECT product_id, COUNT(id) AS variant_count, COALESCE(SUM(COALESCE(quantity, 0)), 0) AS total_stock
                    FROM product_variants
                    GROUP BY product_id
                ) v ON v.product_id = p.id
                LEFT JOIN (
                    SELECT pp.product_id, pr.id, pr.name, pr.discount_type, pr.discount_value, pr.start_date, pr.end_date
                    FROM product_promotions pp
                    JOIN promotions pr ON pr.id = pp.promotion_id
                    WHERE pr.status = 'active' 
                      AND pr.start_date <= NOW() 
                      AND pr.end_date >= NOW()
                ) promo ON promo.product_id = p.id
                WHERE p.is_active = 1 AND p.status = 'active'
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

    // GET /products/public-filters — variant/attribute filters for public catalog
    public function publicFilters()
    {
        try {
            $variantOptions = [];
            $variantMap = [];
            $stmt = $this->pdo->query("
                SELECT v.product_id, t.name AS type_name, v.value
                FROM product_variants v
                JOIN product_variant_types t ON t.id = v.variant_type_id
                JOIN products p ON p.id = v.product_id
                WHERE p.is_active = 1 AND p.status = 'active'
            ");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($rows as $row) {
                $pid = (int) $row['product_id'];
                $type = trim((string) $row['type_name']);
                $value = trim((string) $row['value']);
                if ($type === '' || $value === '') continue;
                if (!isset($variantOptions[$type])) $variantOptions[$type] = [];
                if (!in_array($value, $variantOptions[$type], true)) $variantOptions[$type][] = $value;
                if (!isset($variantMap[$pid])) $variantMap[$pid] = [];
                $variantMap[$pid][] = ['type' => $type, 'value' => $value];
            }

            $attributeOptions = [];
            $attributeMap = [];
            $stmt = $this->pdo->query("
                SELECT a.product_id, t.name AS type_name, a.value
                FROM product_attributes a
                JOIN product_attribute_types t ON t.id = a.attribute_type_id
                JOIN products p ON p.id = a.product_id
                WHERE p.is_active = 1 AND p.status = 'active'
            ");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($rows as $row) {
                $pid = (int) $row['product_id'];
                $type = trim((string) $row['type_name']);
                $value = trim((string) $row['value']);
                if ($type === '' || $value === '') continue;
                if (!isset($attributeOptions[$type])) $attributeOptions[$type] = [];
                if (!in_array($value, $attributeOptions[$type], true)) $attributeOptions[$type][] = $value;
                if (!isset($attributeMap[$pid])) $attributeMap[$pid] = [];
                $attributeMap[$pid][] = ['type' => $type, 'value' => $value];
            }

            echo json_encode([
                'success' => true,
                'data' => [
                    'variants' => [
                        'options' => $variantOptions,
                        'map' => $variantMap
                    ],
                    'attributes' => [
                        'options' => $attributeOptions,
                        'map' => $attributeMap
                    ]
                ]
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /products/{id}
    // ─────────────────────────────────────────────────────────────────────────
    // ─────────────────────────────────────────────────────────
    // GET /products/public/{slug} — public product details
    // ─────────────────────────────────────────────────────────
    public function publicShow($slug)
    {
        try {
            $slug = urldecode($slug);
            $isId = ctype_digit($slug);
            $where = $isId ? "p.id = ?" : "p.slug = ?";

            $stmt = $this->pdo->prepare("
                SELECT
                    p.*,
                    c.name  AS category_name,
                    b.name  AS brand_name,
                    m.name  AS material_name,
                    promo.id AS promotion_id,
                    promo.name AS promotion_name,
                    promo.discount_type,
                    promo.discount_value,
                    promo.start_date AS promotion_start,
                    promo.end_date AS promotion_end
                FROM products p
                LEFT JOIN categories c ON c.id = p.category_id
                LEFT JOIN brands b     ON b.id = p.brand_id
                LEFT JOIN materials m  ON m.id = p.material_id
                LEFT JOIN (
                    SELECT pp.product_id, pr.id, pr.name, pr.discount_type, pr.discount_value, pr.start_date, pr.end_date
                    FROM product_promotions pp
                    JOIN promotions pr ON pr.id = pp.promotion_id
                    WHERE pr.status = 'active' 
                      AND pr.start_date <= NOW() 
                      AND pr.end_date >= NOW()
                ) promo ON promo.product_id = p.id
                WHERE {$where}
                  AND p.is_active = 1
                  AND p.status = 'active'
            ");
            $stmt->execute([$slug]);
            $product = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$product) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Product not found']);
                return;
            }

            $product = $this->castProduct($product);

            // Get variants
            $stmt = $this->pdo->prepare("
                SELECT v.*, t.name AS type_name
                FROM product_variants v
                JOIN product_variant_types t ON t.id = v.variant_type_id
                WHERE v.product_id = ?
                ORDER BY v.id
            ");
            $stmt->execute([$product['id']]);
            $variants = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $variantCount = 0;
            $totalStock = 0;
            foreach ($variants as &$v) {
                $v['quantity'] = $v['quantity'] !== null ? (int) $v['quantity'] : null;
                $v['stock'] = $v['quantity'];
                $type = $v['type_name'] ?? 'Default';
                $value = $v['value'] ?? 'Default';
                $v['variant_options'] = [
                    'type'  => $type,
                    'value' => $value,
                    'label' => $type . ': ' . $value,
                ];
                $variantCount++;
                if ($v['quantity'] !== null) {
                    $totalStock += (int) $v['quantity'];
                }
            }
            $product['variants'] = $variants;
            $product['variant_count'] = $variantCount;
            $product['total_stock'] = $totalStock;

            $stmt = $this->pdo->prepare("
                SELECT a.id, a.value, t.name AS type_name
                FROM product_attributes a
                JOIN product_attribute_types t ON t.id = a.attribute_type_id
                WHERE a.product_id = ?
                ORDER BY a.id
            ");
            $stmt->execute([$product['id']]);
            $attrs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $product['attributes'] = array_map(function ($row) {
                return [
                    'id' => (int)$row['id'],
                    'type' => $row['type_name'],
                    'value' => $row['value'],
                ];
            }, $attrs);

            // Re-calculate stock status now that we have total_stock
            $threshold = $this->getStockThreshold();
            if ($product['total_stock'] === null || $product['total_stock'] <= 0) {
                $product['stock_status'] = 'out_of_stock';
            } elseif ($product['total_stock'] <= $threshold) {
                $product['stock_status'] = 'low_stock';
            } else {
                $product['stock_status'] = 'in_stock';
            }

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $product]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function show($id)
    {
        try {
            RoleMiddleware::requireAdmin($this->pdo);

            $stmt = $this->pdo->prepare("
                SELECT
                    p.*,
                    c.name  AS category_name,
                    b.name  AS brand_name,
                    m.name  AS material_name,
                    promo.id AS promotion_id,
                    promo.name AS promotion_name,
                    promo.discount_type,
                    promo.discount_value,
                    promo.start_date AS promotion_start,
                    promo.end_date AS promotion_end
                FROM products p
                LEFT JOIN categories c ON c.id = p.category_id
                LEFT JOIN brands b     ON b.id = p.brand_id
                LEFT JOIN materials m  ON m.id = p.material_id
                LEFT JOIN (
                    SELECT pp.product_id, pr.id, pr.name, pr.discount_type, pr.discount_value, pr.start_date, pr.end_date
                    FROM product_promotions pp
                    JOIN promotions pr ON pr.id = pp.promotion_id
                    WHERE pr.status = 'active' 
                      AND pr.start_date <= NOW() 
                      AND pr.end_date >= NOW()
                ) promo ON promo.product_id = p.id
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
            $stmt = $this->pdo->prepare("
                SELECT v.*, t.name AS type_name
                FROM product_variants v
                JOIN product_variant_types t ON t.id = v.variant_type_id
                WHERE v.product_id = ?
                ORDER BY v.id
            ");
            $stmt->execute([$id]);
            $variants = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $variantCount = 0;
            $totalStock = 0;
            foreach ($variants as &$v) {
                $v['quantity'] = $v['quantity'] !== null ? (int) $v['quantity'] : null;
                $v['stock'] = $v['quantity'];
                $type = $v['type_name'] ?? 'Default';
                $value = $v['value'] ?? 'Default';
                $v['variant_options'] = [
                    'type'  => $type,
                    'value' => $value,
                    'label' => $type . ': ' . $value,
                ];
                $variantCount++;
                if ($v['quantity'] !== null) {
                    $totalStock += (int) $v['quantity'];
                }
            }
            $product['variants'] = $variants;
            $product['variant_count'] = $variantCount;
            $product['total_stock'] = $totalStock;

            $stmt = $this->pdo->prepare("
                SELECT a.id, a.value, t.name AS type_name
                FROM product_attributes a
                JOIN product_attribute_types t ON t.id = a.attribute_type_id
                WHERE a.product_id = ?
                ORDER BY a.id
            ");
            $stmt->execute([$id]);
            $attrs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $product['attributes'] = array_map(function ($row) {
                return [
                    'id' => (int)$row['id'],
                    'type' => $row['type_name'],
                    'value' => $row['value'],
                ];
            }, $attrs);

            // Re-calculate stock status now that we have total_stock
            $threshold = $this->getStockThreshold();
            if ($product['total_stock'] === null || $product['total_stock'] <= 0) {
                $product['stock_status'] = 'out_of_stock';
            } elseif ($product['total_stock'] <= $threshold) {
                $product['stock_status'] = 'low_stock';
            } else {
                $product['stock_status'] = 'in_stock';
            }

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
            $productCode = trim((string) $productCode);
            if ($productCode !== '') {
                $productCode = ensureUniqueSlug($this->pdo, $productCode, 'products', 'product_code');
            } else {
                $productCode = null;
            }

            $productSku = $data['sku'] ?? null;
            if (empty($productSku)) {
                $productSku = strtoupper($slug);
            }
            $productSku = trim((string) $productSku);
            if ($productSku !== '') {
                $productSku = ensureUniqueSlug($this->pdo, $productSku, 'products', 'sku');
            } else {
                $productSku = null;
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
                'has_variants' => isset($data['has_variants']) ? (int)(bool)$data['has_variants'] : 1,
                'has_attributes' => isset($data['has_attributes']) ? (int)(bool)$data['has_attributes'] : 1,
                'has_brand' => isset($data['has_brand']) ? (int)(bool)$data['has_brand'] : 1,
                'has_material' => isset($data['has_material']) ? (int)(bool)$data['has_material'] : 1,
            ]);

            if (!$id) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to create product']);
                return;
            }

            // Seed variants
            if (empty($data['variants'])) {
                $defaultTypeId = $this->resolveVariantTypeId('Default');
                $this->pdo->prepare("
                    INSERT INTO product_variants (product_id, variant_type_id, value, quantity, created_at, updated_at)
                    VALUES (?, ?, ?, ?, NOW(), NOW())
                ")->execute([$id, $defaultTypeId, 'Default', 0]);
            } else {
                foreach ($data['variants'] as $v) {
                    $type = trim((string)($v['type'] ?? 'Default')) ?: 'Default';
                    $value = trim((string)($v['value'] ?? 'Default')) ?: 'Default';
                    $typeId = $this->resolveVariantTypeId($type);
                    $quantity = isset($v['quantity']) ? (int)$v['quantity'] : (isset($v['stock']) ? (int)$v['stock'] : null);

                    $stmt = $this->pdo->prepare("
                        INSERT INTO product_variants (product_id, variant_type_id, value, quantity, created_at, updated_at)
                        VALUES (?, ?, ?, ?, NOW(), NOW())
                    ");
                    $stmt->execute([$id, $typeId, $value, $quantity]);
                }
            }

            if (isset($data['attributes'])) {
                $this->pdo->prepare("DELETE FROM product_attributes WHERE product_id = ?")->execute([$id]);
                foreach ((array)$data['attributes'] as $a) {
                    $type = trim((string)($a['type'] ?? $a['name'] ?? 'Attribute')) ?: 'Attribute';
                    $value = trim((string)($a['value'] ?? '')) ?: '';
                    if ($value === '') continue;
                    $typeId = $this->resolveAttributeTypeId($type);
                    $this->pdo->prepare("
                        INSERT INTO product_attributes (product_id, attribute_type_id, value, created_at, updated_at)
                        VALUES (?, ?, ?, NOW(), NOW())
                    ")->execute([$id, $typeId, $value]);
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
            if (isset($data['product_code'])) {
                $code = trim((string) $data['product_code']);
                $updateData['product_code'] = $code === ''
                    ? null
                    : ensureUniqueSlug($this->pdo, $code, 'products', 'product_code', $id);
            }
            if (isset($data['sku'])) {
                $sku = trim((string) $data['sku']);
                $updateData['sku'] = $sku === ''
                    ? null
                    : ensureUniqueSlug($this->pdo, $sku, 'products', 'sku', $id);
            }
            if (isset($data['type']))        $updateData['type']        = $data['type'];
            if (isset($data['status']))      $updateData['status']      = $data['status'];
            if (isset($data['description'])) $updateData['description'] = $data['description'];
            if (isset($data['details']))     $updateData['details']     = json_encode($data['details']);
            if (isset($data['main_image']))  $updateData['main_image']  = $data['main_image'];
            if (isset($data['images']))      $updateData['images']      = json_encode($data['images']);
            if (isset($data['base_price']))  $updateData['base_price']  = (float) $data['base_price'];
            if (isset($data['is_active']))   $updateData['is_active']   = (int)(bool)$data['is_active'];
            if (isset($data['has_variants']))   $updateData['has_variants']   = (int)(bool)$data['has_variants'];
            if (isset($data['has_attributes'])) $updateData['has_attributes'] = (int)(bool)$data['has_attributes'];
            if (isset($data['has_brand']))      $updateData['has_brand']      = (int)(bool)$data['has_brand'];
            if (isset($data['has_material']))   $updateData['has_material']   = (int)(bool)$data['has_material'];

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
                    $defaultTypeId = $this->resolveVariantTypeId('Default');
                    $this->pdo->prepare("
                        INSERT INTO product_variants (product_id, variant_type_id, value, quantity, created_at, updated_at)
                        VALUES (?, ?, ?, ?, NOW(), NOW())
                    ")->execute([$id, $defaultTypeId, 'Default', 0]);
                } else {
                    foreach ($data['variants'] as $v) {
                        $type = trim((string)($v['type'] ?? 'Default')) ?: 'Default';
                        $value = trim((string)($v['value'] ?? 'Default')) ?: 'Default';
                        $typeId = $this->resolveVariantTypeId($type);
                        $quantity = isset($v['quantity']) ? (int)$v['quantity'] : (isset($v['stock']) ? (int)$v['stock'] : null);

                        $stmt = $this->pdo->prepare("
                            INSERT INTO product_variants (product_id, variant_type_id, value, quantity, created_at, updated_at)
                            VALUES (?, ?, ?, ?, NOW(), NOW())
                        ");
                        $stmt->execute([$id, $typeId, $value, $quantity]);
                    }
                }
            }

            if (isset($data['attributes'])) {
                $this->pdo->prepare("DELETE FROM product_attributes WHERE product_id = ?")->execute([$id]);
                foreach ((array)$data['attributes'] as $a) {
                    $type = trim((string)($a['type'] ?? $a['name'] ?? 'Attribute')) ?: 'Attribute';
                    $value = trim((string)($a['value'] ?? '')) ?: '';
                    if ($value === '') continue;
                    $typeId = $this->resolveAttributeTypeId($type);
                    $this->pdo->prepare("
                        INSERT INTO product_attributes (product_id, attribute_type_id, value, created_at, updated_at)
                        VALUES (?, ?, ?, NOW(), NOW())
                    ")->execute([$id, $typeId, $value]);
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
            $this->pdo->prepare("DELETE FROM product_attributes WHERE product_id = ?")->execute([$id]);
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

    private function getStockThreshold(): int
    {
        static $threshold = null;
        if ($threshold === null) {
            try {
                $stmt = $this->pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = 'low_stock_threshold' LIMIT 1");
                $stmt->execute();
                $val = $stmt->fetchColumn();
                $threshold = ($val !== false) ? (int)$val : 5;
            } catch (Exception $e) {
                $threshold = 5;
            }
        }
        return $threshold;
    }

    private function resolveVariantTypeId(string $name): int
    {
        $name = trim($name);
        if ($name === '') $name = 'Default';

        $stmt = $this->pdo->prepare("SELECT id FROM product_variant_types WHERE LOWER(name) = LOWER(?) LIMIT 1");
        $stmt->execute([$name]);
        $id = $stmt->fetchColumn();
        if ($id) return (int) $id;

        $stmt = $this->pdo->prepare("INSERT INTO product_variant_types (name) VALUES (?)");
        $stmt->execute([$name]);
        return (int) $this->pdo->lastInsertId();
    }

    private function resolveAttributeTypeId(string $name): int
    {
        $name = trim($name);
        if ($name === '') $name = 'Attribute';

        $stmt = $this->pdo->prepare("SELECT id FROM product_attribute_types WHERE LOWER(name) = LOWER(?) LIMIT 1");
        $stmt->execute([$name]);
        $id = $stmt->fetchColumn();
        if ($id) return (int) $id;

        $stmt = $this->pdo->prepare("INSERT INTO product_attribute_types (name) VALUES (?)");
        $stmt->execute([$name]);
        return (int) $this->pdo->lastInsertId();
    }

    private function castProduct(array $p): array
    {
        $p['base_price']    = (float) $p['base_price'];
        $p['is_active']     = (bool)  $p['is_active'];
        $p['product_code']  = $p['product_code'] ?? null;
        $p['sku']           = $p['sku'] ?? null;
        $p['variant_count'] = isset($p['variant_count']) ? (int) $p['variant_count'] : null;
        $p['total_stock']   = isset($p['total_stock'])   ? (int) $p['total_stock']   : null;
        if (array_key_exists('has_variants', $p)) {
            $p['has_variants'] = (bool) $p['has_variants'];
        }
        if (array_key_exists('has_attributes', $p)) {
            $p['has_attributes'] = (bool) $p['has_attributes'];
        }
        if (array_key_exists('has_brand', $p)) {
            $p['has_brand'] = (bool) $p['has_brand'];
        }
        if (array_key_exists('has_material', $p)) {
            $p['has_material'] = (bool) $p['has_material'];
        }

        // Stock status processing
        $threshold = $this->getStockThreshold();
        $p['low_stock_threshold'] = $threshold;
        
        if (isset($p['total_stock'])) {
            if ($p['total_stock'] === null || $p['total_stock'] <= 0) {
                $p['stock_status'] = 'out_of_stock';
            } elseif ($p['total_stock'] <= $threshold) {
                $p['stock_status'] = 'low_stock';
            } else {
                $p['stock_status'] = 'in_stock';
            }
        } else {
            $p['stock_status'] = 'unknown'; // Will be refined in show() for single product
        }

        // Services/digital items are not stock-limited
        if (isset($p['type']) && in_array($p['type'], ['service', 'digital'], true)) {
            $p['stock_status'] = 'in_stock';
            $p['total_stock'] = null;
            $p['variant_count'] = null;
        }
        
        // Promotion processing
        $p['is_on_promotion'] = !empty($p['promotion_id']);
        if ($p['is_on_promotion']) {
            $p['discount_value'] = (float) $p['discount_value'];
            $p['discounted_price'] = $p['base_price'];
            
            if ($p['discount_type'] === 'percentage') {
                $p['discounted_price'] = $p['base_price'] * (1 - ($p['discount_value'] / 100));
            } else if ($p['discount_type'] === 'fixed') {
                $p['discounted_price'] = max(0, $p['base_price'] - $p['discount_value']);
            }
            
            $p['promotion_details'] = [
                'id' => (int) $p['promotion_id'],
                'name' => $p['promotion_name'],
                'type' => $p['discount_type'],
                'value' => $p['discount_value'],
                'start_date' => $p['promotion_start'],
                'end_date' => $p['promotion_end'],
                'label' => $p['discount_type'] === 'percentage' ? $p['discount_value'] . '%' : '$' . $p['discount_value']
            ];
        } else {
            $p['discounted_price'] = $p['base_price'];
            $p['promotion_details'] = null;
        }

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
