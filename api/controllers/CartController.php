<?php
// api/controllers/CartController.php

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../models/CartModel.php';
require_once __DIR__ . '/../models/CartItemModel.php';
require_once __DIR__ . '/../models/ProductModel.php';
require_once __DIR__ . '/../models/ProductVariantModel.php';

class CartController
{
    private $pdo;
    private $cartModel;
    private $cartItemModel;
    private $productModel;
    private $variantModel;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
        $this->cartModel = new CartModel($pdo);
        $this->cartItemModel = new CartItemModel($pdo);
        $this->productModel = new ProductModel($pdo);
        $this->variantModel = new ProductVariantModel($pdo);
    }

    private function getUser()
    {
        return AuthMiddleware::requireAuth($this->pdo);
    }

    private function getOrCreateCart($userId)
    {
        $cart = $this->cartModel->findActiveByUser($userId);
        if ($cart) return $cart;

        $id = $this->cartModel->create([
            'user_id' => $userId,
            'status' => 'active'
        ]);
        return $this->cartModel->findById($id);
    }

    private function getProductForCart($productId)
    {
        $stmt = $this->pdo->prepare("
            SELECT
                p.*,
                promo.id AS promotion_id,
                promo.discount_type,
                promo.discount_value
            FROM products p
            LEFT JOIN (
                SELECT pp.product_id, pr.id, pr.discount_type, pr.discount_value, pr.start_date, pr.end_date
                FROM product_promotions pp
                JOIN promotions pr ON pr.id = pp.promotion_id
                WHERE pr.status = 'active'
                  AND pr.start_date <= NOW()
                  AND pr.end_date >= NOW()
            ) promo ON promo.product_id = p.id
            WHERE p.id = ? AND p.is_active = 1 AND p.status = 'active'
        ");
        $stmt->execute([$productId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    private function calculateUnitPrice($product)
    {
        $base = (float) ($product['base_price'] ?? 0);
        if (!empty($product['promotion_id'])) {
            $discountType = $product['discount_type'];
            $discountValue = (float) ($product['discount_value'] ?? 0);
            if ($discountType === 'percentage') {
                return $base * (1 - ($discountValue / 100));
            }
            if ($discountType === 'fixed') {
                return max(0, $base - $discountValue);
            }
        }
        return $base;
    }

    public function index()
    {
        try {
            $user = $this->getUser();
            $cart = $this->getOrCreateCart($user['id']);

            $stmt = $this->pdo->prepare("
                SELECT 
                    ci.*,
                    p.name AS product_name,
                    p.slug AS product_slug,
                    p.main_image,
                    p.category_id,
                    c.name AS category_name
                FROM cart_items ci
                JOIN products p ON p.id = ci.product_id
                LEFT JOIN categories c ON c.id = p.category_id
                WHERE ci.cart_id = ?
                ORDER BY ci.id DESC
            ");
            $stmt->execute([$cart['id']]);
            $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $total = 0;
            foreach ($items as &$item) {
                $item['quantity'] = (int) $item['quantity'];
                $item['unit_price'] = (float) $item['unit_price'];
                $item['line_total'] = $item['unit_price'] * $item['quantity'];
                $total += $item['line_total'];
            }

            echo json_encode([
                'success' => true,
                'data' => [
                    'cart' => $cart,
                    'items' => $items,
                    'total_amount' => $total,
                ]
            ]);
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
            $quantity = isset($data['quantity']) ? (int) $data['quantity'] : 1;

            if ($productId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'product_id is required']);
                return;
            }
            if ($quantity < 1) $quantity = 1;

            $product = $this->getProductForCart($productId);
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

            $cart = $this->getOrCreateCart($user['id']);

            // If item exists, increment quantity
            $stmt = $this->pdo->prepare("
                SELECT * FROM cart_items 
                WHERE cart_id = ? AND product_id = ? AND (variant_id <=> ?)
                LIMIT 1
            ");
            $stmt->execute([$cart['id'], $productId, $variantId]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($existing) {
                $newQty = (int)$existing['quantity'] + $quantity;
                $this->cartItemModel->update($existing['id'], ['quantity' => $newQty]);
                echo json_encode(['success' => true, 'message' => 'Cart updated']);
                return;
            }

            $unitPrice = $this->calculateUnitPrice($product);
            $this->cartItemModel->create([
                'cart_id' => $cart['id'],
                'product_id' => $productId,
                'variant_id' => $variantId,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
            ]);

            echo json_encode(['success' => true, 'message' => 'Item added to cart']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function updateItem($id)
    {
        try {
            $user = $this->getUser();
            $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
            $quantity = isset($data['quantity']) ? (int) $data['quantity'] : 1;
            if ($quantity < 1) $quantity = 1;

            $cart = $this->getOrCreateCart($user['id']);
            $stmt = $this->pdo->prepare("SELECT * FROM cart_items WHERE id = ? AND cart_id = ?");
            $stmt->execute([$id, $cart['id']]);
            $item = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$item) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Cart item not found']);
                return;
            }

            $this->cartItemModel->update($id, ['quantity' => $quantity]);
            echo json_encode(['success' => true, 'message' => 'Cart item updated']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function removeItem($id)
    {
        try {
            $user = $this->getUser();
            $cart = $this->getOrCreateCart($user['id']);
            $stmt = $this->pdo->prepare("SELECT id FROM cart_items WHERE id = ? AND cart_id = ?");
            $stmt->execute([$id, $cart['id']]);
            if (!$stmt->fetch()) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Cart item not found']);
                return;
            }

            $this->cartItemModel->delete($id);
            echo json_encode(['success' => true, 'message' => 'Cart item removed']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public function clear()
    {
        try {
            $user = $this->getUser();
            $cart = $this->getOrCreateCart($user['id']);
            $stmt = $this->pdo->prepare("DELETE FROM cart_items WHERE cart_id = ?");
            $stmt->execute([$cart['id']]);
            echo json_encode(['success' => true, 'message' => 'Cart cleared']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}
?>
