<?php
// api/controllers/WishlistController.php

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../models/WishlistItemModel.php';
require_once __DIR__ . '/../models/ProductModel.php';
require_once __DIR__ . '/../models/ProductVariantModel.php';

class WishlistController
{
    private $pdo;
    private $wishlistModel;
    private $productModel;
    private $variantModel;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
        $this->wishlistModel = new WishlistItemModel($pdo);
        $this->productModel = new ProductModel($pdo);
        $this->variantModel = new ProductVariantModel($pdo);
    }

    private function getUser()
    {
        return AuthMiddleware::requireAuth($this->pdo);
    }

    public function index()
    {
        try {
            $user = $this->getUser();
            $stmt = $this->pdo->prepare("
                SELECT 
                    w.*,
                    p.name AS product_name,
                    p.slug AS product_slug,
                    p.main_image,
                    p.base_price,
                    p.is_active,
                    p.status
                FROM wishlist_items w
                JOIN products p ON p.id = w.product_id
                WHERE w.user_id = ?
                ORDER BY w.id DESC
            ");
            $stmt->execute([$user['id']]);
            $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(['success' => true, 'data' => $items]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function addItem()
    {
        try {
            $user = $this->getUser();
            $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;

            $productId = isset($data['product_id']) ? (int) $data['product_id'] : 0;
            $variantId = isset($data['variant_id']) ? (int) $data['variant_id'] : null;

            if ($productId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'product_id is required']);
                return;
            }

            $product = $this->productModel->findById($productId);
            if (!$product) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Product not found']);
                return;
            }

            if ($variantId) {
                $variant = $this->variantModel->findById($variantId);
                if (!$variant || (int)$variant['product_id'] !== $productId) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Invalid variant']);
                    return;
                }
            }

            $stmt = $this->pdo->prepare("
                SELECT id FROM wishlist_items 
                WHERE user_id = ? AND product_id = ? AND (variant_id <=> ?)
                LIMIT 1
            ");
            $stmt->execute([$user['id'], $productId, $variantId]);
            if ($stmt->fetch()) {
                echo json_encode(['success' => true, 'message' => 'Already in wishlist']);
                return;
            }

            $this->wishlistModel->create([
                'user_id' => $user['id'],
                'product_id' => $productId,
                'variant_id' => $variantId,
            ]);

            echo json_encode(['success' => true, 'message' => 'Added to wishlist']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function removeItem($id)
    {
        try {
            $user = $this->getUser();
            $stmt = $this->pdo->prepare("SELECT id FROM wishlist_items WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $user['id']]);
            if (!$stmt->fetch()) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Wishlist item not found']);
                return;
            }

            $this->wishlistModel->delete($id);
            echo json_encode(['success' => true, 'message' => 'Removed from wishlist']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}
?>
