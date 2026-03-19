<?php
// api/controllers/PaymentController.php

require_once __DIR__ . '/../models/OrderModel.php';
require_once __DIR__ . '/../models/PaymentModel.php';
require_once __DIR__ . '/../models/SettingModel.php';

class PaymentController {
    private $pdo;
    private $orderModel;
    private $paymentModel;
    private $settingModel;
    private $config;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->orderModel = new OrderModel($pdo);
        $this->paymentModel = new PaymentModel($pdo);
        $this->settingModel = new SettingModel($pdo);
        $this->config = require __DIR__ . '/../config/app_config.php';
    }

    private function jsonInput() {
        $raw = file_get_contents('php://input');
        return json_decode($raw, true) ?: [];
    }

    private function getAllowedPaymentModes() {
        $setting = $this->settingModel->findByKey('allowed_payment_modes');
        if ($setting && !empty($setting['setting_value'])) {
            $list = json_decode($setting['setting_value'], true);
            if (is_array($list)) return $list;
        }
        return ['whatsapp', 'card', 'mobile_money'];
    }

    private function getCurrencyCode() {
        $setting = $this->settingModel->findByKey('currency');
        return $setting && !empty($setting['setting_value'])
            ? strtoupper($setting['setting_value'])
            : 'NGN';
    }

    private function paystackRequest($method, $endpoint, $payload = null) {
        $apiUrl = rtrim($this->config['paystack']['api_url'] ?? 'https://api.paystack.co', '/');
        $secret = $this->config['paystack']['secret_key'] ?? '';
        $url = $apiUrl . $endpoint;

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $secret,
            'Content-Type: application/json'
        ]);

        if ($payload !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return [$httpCode, json_decode($response, true)];
    }

    public function initialize() {
        $data = $this->jsonInput();
        $orderId = $data['order_id'] ?? null;
        $paymentMode = $data['payment_mode'] ?? 'whatsapp';
        $email = $data['email'] ?? '';

        if (!$orderId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'order_id is required']);
            return;
        }

        $allowed = $this->getAllowedPaymentModes();
        if (!in_array($paymentMode, $allowed, true)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid payment mode']);
            return;
        }

        $order = $this->orderModel->find($orderId);
        if (!$order) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Order not found']);
            return;
        }

        $amount = (float)($order['total_amount'] ?? 0);
        if ($amount <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid order amount']);
            return;
        }

        if (!$email) {
            $meta = $order['metadata'] ?? [];
            if (is_string($meta)) {
                $meta = json_decode($meta, true);
            }
            $email = $meta['customer']['email'] ?? '';
        }
        if (!$email) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Customer email is required for payment']);
            return;
        }

        $reference = $data['reference'] ?? ('REF-' . time() . '-' . $orderId);
        $channels = $paymentMode === 'card' ? ['card'] : ($paymentMode === 'mobile_money' ? ['mobile_money'] : ['card']);

        $payload = [
            'amount' => (int)round($amount * 100),
            'email' => $email,
            'reference' => $reference,
            'currency' => $this->getCurrencyCode(),
            'channels' => $channels,
            'callback_url' => $this->config['app_url'] . '/public/order/summary?reference=' . urlencode($reference),
            'metadata' => [
                'order_id' => $orderId,
                'payment_mode' => $paymentMode,
            ],
        ];

        [$code, $response] = $this->paystackRequest('POST', '/transaction/initialize', $payload);
        if ($code < 200 || $code >= 300 || empty($response['status'])) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $response['message'] ?? 'Failed to initialize payment']);
            return;
        }

        $this->paymentModel->create([
            'order_id' => $orderId,
            'amount' => $amount,
            'payment_method' => $paymentMode,
            'status' => 'pending',
            'transaction_id' => $reference,
            'metadata' => [
                'init' => $response['data'] ?? null
            ],
        ]);

        echo json_encode(['success' => true, 'data' => $response['data']]);
    }

    public function verify() {
        $reference = $_GET['reference'] ?? '';
        if (!$reference) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'reference is required']);
            return;
        }

        [$code, $response] = $this->paystackRequest('GET', '/transaction/verify/' . urlencode($reference));
        if ($code < 200 || $code >= 300 || empty($response['status'])) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $response['message'] ?? 'Failed to verify payment']);
            return;
        }

        $data = $response['data'] ?? [];
        $status = $data['status'] ?? 'failed';
        $amount = isset($data['amount']) ? ((float)$data['amount'] / 100) : null;
        $orderId = $data['metadata']['order_id'] ?? null;
        $mode = $data['metadata']['payment_mode'] ?? ($data['channel'] ?? 'card');

        if ($orderId) {
            $this->paymentModel->create([
                'order_id' => $orderId,
                'amount' => $amount ?? 0,
                'payment_method' => $mode,
                'status' => $status,
                'transaction_id' => $reference,
                'metadata' => $data,
            ]);
            if ($status === 'success') {
                $this->orderModel->update($orderId, ['status' => 'paid', 'payment_mode' => $mode]);
            }
        }

        echo json_encode(['success' => true, 'data' => $data]);
    }
}
