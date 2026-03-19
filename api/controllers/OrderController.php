<?php
// api/controllers/OrderController.php

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../models/OrderModel.php';
require_once __DIR__ . '/../models/OrderItemModel.php';
require_once __DIR__ . '/../models/CartModel.php';
require_once __DIR__ . '/../models/SettingModel.php';
require_once __DIR__ . '/../models/GuestCustomerModel.php';
require_once __DIR__ . '/../services/EmailService.php';

class OrderController
{
    private $pdo;
    private $orderModel;
    private $orderItemModel;
    private $cartModel;
    private $settingModel;
    private $guestCustomerModel;
    private $emailService;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
        $this->orderModel = new OrderModel($pdo);
        $this->orderItemModel = new OrderItemModel($pdo);
        $this->cartModel = new CartModel($pdo);
        $this->settingModel = new SettingModel($pdo);
        $this->guestCustomerModel = new GuestCustomerModel($pdo);
        $this->emailService = new EmailService();
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

    private function getProductForOrder($productId)
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

    private function notifyAdminWhatsApp($orderId, $payload = [])
    {
        $setting = $this->settingModel->findByKey('admin_whatsapp');
        $number = trim($setting['setting_value'] ?? '');
        if (!$number) return null;
        $digits = preg_replace('/\D+/', '', $number);
        if (!$digits) return null;

        $name = $payload['name'] ?? 'Guest';
        $email = $payload['email'] ?? '';
        $phone = $payload['phone'] ?? '';
        $total = $payload['total'] ?? 0;
        $orderType = $payload['order_type'] ?? 'delivery';
        $paymentMode = $payload['payment_mode'] ?? 'whatsapp';

        $message = "New order #{$orderId}\nName: {$name}\nEmail: {$email}\nPhone: {$phone}\nTotal: {$total}\nType: {$orderType}\nPayment: {$paymentMode}";
        $url = "https://wa.me/{$digits}?text=" . urlencode($message);

        error_log("Admin WhatsApp order notification: " . $url);
        return [
            'number' => $digits,
            'message' => $message,
            'url' => $url
        ];
    }

    public function createFromCart()
    {
        try {
            $user = $this->getUser();
            $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;

            $orderType = $data['order_type'] ?? 'delivery';
            $paymentMode = $data['payment_mode'] ?? 'whatsapp';

            $allowedOrderTypes = $this->getAllowedList('allowed_order_types', ['delivery', 'pickup', 'service']);
            $allowedPaymentModes = $this->getAllowedList('allowed_payment_modes', ['whatsapp', 'card', 'mobile_money']);

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

            $metadata = $data['metadata'] ?? null;
            $orderId = $this->orderModel->create([
                'user_id' => $user['id'],
                'guest_customer_id' => null,
                'total_amount' => $total,
                'status' => 'pending',
                'payment_method' => $paymentMode,
                'order_type' => $orderType,
                'payment_mode' => $paymentMode,
                'metadata' => $metadata,
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

            $customerMeta = is_array($metadata) ? ($metadata['customer'] ?? []) : [];
            $whatsapp = $this->notifyAdminWhatsApp($orderId, [
                'name' => $customerMeta['name'] ?? $user['name'] ?? 'Customer',
                'email' => $customerMeta['email'] ?? $user['email'] ?? '',
                'phone' => $customerMeta['phone'] ?? '',
                'total' => $total,
                'order_type' => $orderType,
                'payment_mode' => $paymentMode
            ]);
            if ($whatsapp) {
                $meta = is_array($metadata) ? $metadata : [];
                $meta['admin_whatsapp'] = $whatsapp;
                $this->orderModel->update($orderId, ['metadata' => $meta]);
            }

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
                    gc.name AS guest_name,
                    gc.email AS guest_email,
                    gc.phone AS guest_phone,
                    COUNT(oi.id) AS items_count
                FROM orders o
                LEFT JOIN users u ON u.id = o.user_id
                LEFT JOIN guest_customers gc ON gc.id = o.guest_customer_id
                LEFT JOIN order_items oi ON oi.order_id = o.id
                GROUP BY o.id
                ORDER BY o.created_at DESC
            ");
            $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($orders as &$o) {
                $o['items_count'] = (int) ($o['items_count'] ?? 0);
                $o['total_amount'] = (float) ($o['total_amount'] ?? 0);
                if (isset($o['metadata']) && is_string($o['metadata'])) {
                    $decoded = json_decode($o['metadata'], true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $o['metadata'] = $decoded;
                    }
                }
                $metaCustomer = is_array($o['metadata'] ?? null) ? ($o['metadata']['customer'] ?? []) : [];
                $o['customer_name'] = $o['user_name'] ?? $o['guest_name'] ?? ($metaCustomer['name'] ?? null);
                $o['customer_email'] = $o['user_email'] ?? $o['guest_email'] ?? ($metaCustomer['email'] ?? null);
                $o['customer_phone'] = $o['guest_phone'] ?? ($metaCustomer['phone'] ?? null);
                $o['customer_address'] = $o['guest_address'] ?? ($metaCustomer['address'] ?? null);
                $o['pickup_contact'] = is_array($o['metadata'] ?? null) ? ($o['metadata']['pickup_contact'] ?? null) : null;
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
                    u.email AS user_email,
                    gc.name AS guest_name,
                    gc.email AS guest_email,
                    gc.phone AS guest_phone,
                    gc.address AS guest_address,
                    gc.note AS guest_note
                FROM orders o
                LEFT JOIN users u ON u.id = o.user_id
                LEFT JOIN guest_customers gc ON gc.id = o.guest_customer_id
                WHERE o.id = ?
            ");
            $stmt->execute([$id]);
            $order = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$order) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Order not found']);
                return;
            }

            if (isset($order['metadata']) && is_string($order['metadata'])) {
                $decoded = json_decode($order['metadata'], true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $order['metadata'] = $decoded;
                }
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
                $allowedOrderTypes = $this->getAllowedList('allowed_order_types', ['delivery', 'pickup', 'service']);
                if (!in_array($data['order_type'], $allowedOrderTypes, true)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Invalid order type']);
                    return;
                }
                $updateData['order_type'] = $data['order_type'];
            }

            if (isset($data['payment_mode'])) {
                $allowedPaymentModes = $this->getAllowedList('allowed_payment_modes', ['whatsapp', 'card', 'mobile_money']);
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

    // ─────────────────────────────────────────────────────────
    // POST /orders/guest — guest checkout
    // ─────────────────────────────────────────────────────────
    public function createGuestOrder()
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
            $customer = $data['customer'] ?? [];
            $items = $data['items'] ?? [];

            $email = trim($customer['email'] ?? '');
            $name = trim($customer['name'] ?? '');
            $phone = trim($customer['phone'] ?? '');
            $rawAddress = $customer['address'] ?? '';
            if (is_array($rawAddress)) {
                $address = trim(
                    ($rawAddress['line1'] ?? '') . ' ' .
                    ($rawAddress['line2'] ?? '') . ' ' .
                    ($rawAddress['city'] ?? '') . ' ' .
                    ($rawAddress['state'] ?? '') . ' ' .
                    ($rawAddress['country'] ?? '') . ' ' .
                    ($rawAddress['postal'] ?? '')
                );
            } else {
                $address = trim((string)$rawAddress);
            }

            if (!$email || !$name) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Customer name and email are required']);
                return;
            }
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid email address']);
                return;
            }
            if (!is_array($items) || empty($items)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Order items are required']);
                return;
            }

            $orderType = $data['order_type'] ?? 'delivery';
            $paymentMode = $data['payment_mode'] ?? 'whatsapp';
            $allowedOrderTypes = $this->getAllowedList('allowed_order_types', ['delivery', 'pickup', 'service']);
            $allowedPaymentModes = $this->getAllowedList('allowed_payment_modes', ['whatsapp', 'card', 'mobile_money']);
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

            $total = 0;
            $normalizedItems = [];
            foreach ($items as $item) {
                $productId = (int) ($item['product_id'] ?? 0);
                $variantId = isset($item['variant_id']) ? (int) $item['variant_id'] : null;
                $quantity = (int) ($item['quantity'] ?? 1);
                if ($productId <= 0) continue;
                if ($quantity < 1) $quantity = 1;

                $product = $this->getProductForOrder($productId);
                if (!$product) continue;
                $unitPrice = $this->calculateUnitPrice($product);
                $line = $unitPrice * $quantity;
                $total += $line;
                $normalizedItems[] = [
                    'product_id' => $productId,
                    'variant_id' => $variantId ?: null,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                ];
            }

            if (empty($normalizedItems)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'No valid items found']);
                return;
            }

            $guestId = $this->guestCustomerModel->create([
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'address' => $address,
                'note' => $customer['note'] ?? null
            ]);

            $orderId = $this->orderModel->create([
                'user_id' => null,
                'guest_customer_id' => $guestId,
                'total_amount' => $total,
                'status' => 'pending',
                'payment_method' => $paymentMode,
                'order_type' => $orderType,
                'payment_mode' => $paymentMode,
                'metadata' => [
                    'customer' => [
                        'name' => $name,
                        'email' => $email,
                        'phone' => $phone,
                        'address' => $customer['address'] ?? $address,
                        'note' => $customer['note'] ?? ''
                    ],
                    'source' => 'guest',
                ],
            ]);

            foreach ($normalizedItems as $item) {
                $this->orderItemModel->create([
                    'order_id' => $orderId,
                    'product_id' => $item['product_id'],
                    'variant_id' => $item['variant_id'],
                    'quantity' => $item['quantity'],
                    'price_at_purchase' => $item['unit_price'],
                    'metadata' => null,
                ]);
            }

            $whatsapp = $this->notifyAdminWhatsApp($orderId, [
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'total' => $total,
                'order_type' => $orderType,
                'payment_mode' => $paymentMode
            ]);
            if ($whatsapp) {
                $this->orderModel->update($orderId, [
                    'metadata' => [
                        'customer' => [
                            'name' => $name,
                            'email' => $email,
                            'phone' => $phone,
                            'address' => $address,
                            'note' => $customer['note'] ?? ''
                        ],
                        'source' => 'guest',
                        'admin_whatsapp' => $whatsapp
                    ]
                ]);
            }

            try {
                $this->emailService->sendOrderReceipt($email, $name, $orderId, $total);
            } catch (Exception $e) {
                // ignore email failures
            }

            echo json_encode(['success' => true, 'message' => 'Order created', 'order_id' => $orderId]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}
?>


