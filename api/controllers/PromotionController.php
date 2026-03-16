<?php
// api/controllers/PromotionController.php

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../models/PromotionModel.php';
require_once __DIR__ . '/../models/ProductPromotionModel.php';

class PromotionController
{
    private $pdo;
    private $promotionModel;
    private $productPromotionModel;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
        $this->promotionModel = new PromotionModel($pdo);
        $this->productPromotionModel = new ProductPromotionModel($pdo);
    }

    public function index()
    {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            $promotions = $this->promotionModel->findAll();
            
            // For each promotion, get the associated product IDs
            foreach ($promotions as &$promotion) {
                $sql = "SELECT product_id FROM product_promotions WHERE promotion_id = ?";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([$promotion['id']]);
                $promotion['product_ids'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
            }

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $promotions]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function store()
    {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            $data = json_decode(file_get_contents('php://input'), true);
            
            $productIds = $data['product_ids'] ?? [];
            unset($data['product_ids']);

            if (empty($data['name']) || empty($data['start_date']) || empty($data['end_date'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Missing required fields']);
                return;
            }

            $id = $this->promotionModel->create($data);

            if ($id && !empty($productIds)) {
                foreach ($productIds as $productId) {
                    $this->productPromotionModel->create([
                        'promotion_id' => $id,
                        'product_id' => $productId
                    ]);
                }
            }

            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Promotion created', 'id' => $id]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function show($id)
    {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            $promotion = $this->promotionModel->findById($id);
            if (!$promotion) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Promotion not found']);
                return;
            }

            $promotion['products'] = $this->productPromotionModel->getProductsByPromotion($id);

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $promotion]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function update($id)
    {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            $data = json_decode(file_get_contents('php://input'), true);

            $productIds = $data['product_ids'] ?? null; // Use null to differentiate between empty array and not provided
            unset($data['product_ids']);

            $result = $this->promotionModel->update($id, $data);

            // If product_ids were provided, update the product associations
            if ($productIds !== null) {
                // First, remove all existing product associations for this promotion
                $this->productPromotionModel->deleteByPromotionId($id);

                // Then, add the new associations
                if (!empty($productIds)) {
                    foreach ($productIds as $productId) {
                        $this->productPromotionModel->create([
                            'promotion_id' => $id,
                            'product_id' => $productId
                        ]);
                    }
                }
            }

            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Promotion updated']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function destroy($id)
    {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            $this->promotionModel->delete($id);
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Promotion deleted']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function attachProducts($id)
    {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            $data = json_decode(file_get_contents('php://input'), true);
            $productIds = $data['product_ids'] ?? [];

            foreach ($productIds as $productId) {
                $this->productPromotionModel->create([
                    'promotion_id' => $id,
                    'product_id' => $productId
                ]);
            }

            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Products attached to promotion']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function detachProduct($promotionId, $productId)
    {
        try {
            RoleMiddleware::requireAdmin($this->pdo);
            $sql = "DELETE FROM product_promotions WHERE promotion_id = ? AND product_id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$promotionId, $productId]);

            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Product detached from promotion']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}
?>
