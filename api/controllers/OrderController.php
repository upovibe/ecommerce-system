<?php
// api/controllers/OrderController.php

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../models/OrderModel.php';
require_once __DIR__ . '/../models/OrderItemModel.php';
require_once __DIR__ . '/../models/CartModel.php';
require_once __DIR__ . '/../models/SettingModel.php';

class OrderController
{
    private $pdo;
    private $orderModel;
    private $orderItemModel;
    private $cartModel;
    private $settingModel;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
        $this->orderModel = new OrderModel($pdo);
        $this->orderItemModel = new OrderItemModel($pdo);
        $this->cartModel = new CartModel($pdo);
        $this->settingModel = new SettingModel($pdo);
    }

    private function getUser()
    {
        return AuthMiddleware::requireAuth($this->pdo);
    }

    private function requireAdmin()
    {
        return RoleMiddleware::requireAdmin($this->pdo);
    }

    private function getAllowedList($key, $fallback = [])
    {
        $setting = $this->settingModel->findByKey($key);
        if (!$setting) return $fallback;
        $raw = $setting['setting_value'] ?? '';
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) return $decoded;
        $parts = array_filter(array_map('trim', explode(',', (string)$raw)));
        return $parts ?: $fallback;
    }

    public function createFromCart()
    {
        try {
            $user = $this->getUser();
            $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;

            $orderType = $data['order_type'] ?? 'delivery';
            $paymentMode = $data['payment_mode'] ?? 'pay_on_delivery';

            $allowedOrderTypes = $this->getAllowedList('allowed_order_types', ['delivery', 'service']);
            $allowedPaymentModes = $this->getAllowedList('allowed_payment_modes', ['pay_on_delivery', 'pay_before_delivery', 'in_person']);

            if (!in_array($orderType, $allowedOrderTypes, true)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid order type']);
                return;
            }
            if (!in_array($paymentMode, $allowedPaymentModes, true)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid payment mode']);
                return;
            }

            $cart = $this->cartModel->findActiveByUser($user['id']);
            if (!$cart) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Cart is empty']);
                return;
            }

            $stmt = $this->pdo->prepare("
                SELECT * FROM cart_items WHERE cart_id = ?
            ");
            $stmt->execute([$cart['id']]);
            $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
            if (!$items) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Cart is empty']);
                return;
            }

            $total = 0;
            foreach ($items as $item) {
                $qty = (int) $item['quantity'];
                $price = (float) $item['unit_price'];
                $total += $qty * $price;
            }

            $orderId = $this->orderModel->create([
                'user_id' => $user['id'],
                'total_amount' => $total,
                'status' => 'pending',
                'payment_method' => $paymentMode,
                'order_type' => $orderType,
                'payment_mode' => $paymentMode,
                'metadata' => $data['metadata'] ?? null,
            ]);

            foreach ($items as $item) {
                $this->orderItemModel->create([
                    'order_id' => $orderId,
                    'product_id' => $item['product_id'],
                    'variant_id' => $item['variant_id'] ?: null,
                    'quantity' => (int)$item['quantity'],
                    'price_at_purchase' => (float)$item['unit_price'],
                    'metadata' => $item['metadata'] ?? null,
                ]);
            }

            // Mark cart as ordered
            $this->cartModel->update($cart['id'], ['status' => 'ordered']);

            echo json_encode(['success' => true, 'message' => 'Order created', 'order_id' => $orderId]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // ─────────────────────────────────────────────────────────
    // GET /orders — admin list
    // ─────────────────────────────────────────────────────────
    public function index()
    {
        try {
            $this->requireAdmin();
            $stmt = $this->pdo->query("
                SELECT
                    o.*,
                    u.name AS user_name,
                    u.email AS user_email,
                    COUNT(oi.id) AS items_count
                FROM orders o
                LEFT JOIN users u ON u.id = o.user_id
                LEFT JOIN order_items oi ON oi.order_id = o.id
                GROUP BY o.id
                ORDER BY o.created_at DESC
            ");
            $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($orders as &$o) {
                $o['items_count'] = (int) ($o['items_count'] ?? 0);
                $o['total_amount'] = (float) ($o['total_amount'] ?? 0);
            }

            echo json_encode(['success' => true, 'data' => $orders]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // ─────────────────────────────────────────────────────────
    // GET /orders/{id} — admin details
    // ─────────────────────────────────────────────────────────
    public function show($id)
    {
        try {
            $this->requireAdmin();
            $stmt = $this->pdo->prepare("
                SELECT
                    o.*,
                    u.name AS user_name,
                    u.email AS user_email
                FROM orders o
                LEFT JOIN users u ON u.id = o.user_id
                WHERE o.id = ?
            ");
            $stmt->execute([$id]);
            $order = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$order) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Order not found']);
                return;
            }

            $itemsStmt = $this->pdo->prepare("
                SELECT
                    oi.*,
                    p.name AS product_name,
                    p.slug AS product_slug,
                    p.main_image,
                    v.value AS variant_value,
                    t.name AS variant_type
                FROM order_items oi
                JOIN products p ON p.id = oi.product_id
                LEFT JOIN product_variants v ON v.id = oi.variant_id
                LEFT JOIN product_variant_types t ON t.id = v.variant_type_id
                WHERE oi.order_id = ?
                ORDER BY oi.id
            ");
            $itemsStmt->execute([$id]);
            $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

            $total = 0;
            foreach ($items as &$item) {
                $item['quantity'] = (int) $item['quantity'];
                $item['price_at_purchase'] = (float) $item['price_at_purchase'];
                $item['line_total'] = $item['price_at_purchase'] * $item['quantity'];
                $total += $item['line_total'];
            }

            $order['items'] = $items;
            $order['items_total'] = $total;
            $order['total_amount'] = (float) ($order['total_amount'] ?? 0);

            echo json_encode(['success' => true, 'data' => $order]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // ─────────────────────────────────────────────────────────
    // PUT /orders/{id} — admin update
    // ─────────────────────────────────────────────────────────
    public function update($id)
    {
        try {
            $this->requireAdmin();
            $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;

            $existing = $this->orderModel->findById($id);
            if (!$existing) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Order not found']);
                return;
            }

            $updateData = [];
            if (isset($data['status'])) $updateData['status'] = $data['status'];
            if (isset($data['payment_method'])) $updateData['payment_method'] = $data['payment_method'];

            if (isset($data['order_type'])) {
                $allowedOrderTypes = $this->getAllowedList('allowed_order_types', ['delivery', 'service']);
                if (!in_array($data['order_type'], $allowedOrderTypes, true)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Invalid order type']);
                    return;
                }
                $updateData['order_type'] = $data['order_type'];
            }

            if (isset($data['payment_mode'])) {
                $allowedPaymentModes = $this->getAllowedList('allowed_payment_modes', ['pay_on_delivery', 'pay_before_delivery', 'in_person']);
                if (!in_array($data['payment_mode'], $allowedPaymentModes, true)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Invalid payment mode']);
                    return;
                }
                $updateData['payment_mode'] = $data['payment_mode'];
            }

            if (array_key_exists('metadata', $data)) {
                $updateData['metadata'] = $data['metadata'];
            }

            if (!$updateData) {
                echo json_encode(['success' => true, 'message' => 'No changes']);
                return;
            }

            $this->orderModel->update($id, $updateData);
            echo json_encode(['success' => true, 'message' => 'Order updated']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}
?>
