<?php
// api/controllers/ContactController.php - Handle contact form submissions

require_once __DIR__ . '/../core/EmailService.php';

class ContactController {
    private $pdo;
    private $config;

    public function __construct() {
        $this->pdo = require __DIR__ . '/../database/connection.php';
        $this->config = require __DIR__ . '/../config/app_config.php';
    }

    /**
     * Handle contact form submission
     */
    public function submit() {
        try {
            // Clear any previous output
            if (ob_get_level()) {
                ob_clean();
            }
            
            // Set proper headers
            header('Content-Type: application/json');
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: POST, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
            
            // Handle preflight requests
            if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
                http_response_code(200);
                exit();
            }
            
            // Get form data
            $rawInput = file_get_contents('php://input');
            error_log("Raw input received: " . $rawInput);
            
            $data = json_decode($rawInput, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                error_log("JSON decode error: " . json_last_error_msg());
                http_response_code(400);
                echo json_encode([
                    'success' => false, 
                    'message' => 'Invalid JSON data received'
                ], JSON_PRETTY_PRINT);
                return;
            }
            
            // Validate required fields
            if (empty($data['name']) || empty($data['email']) || empty($data['message'])) {
                error_log("Missing required fields. Data: " . print_r($data, true));
                http_response_code(400);
                echo json_encode([
                    'success' => false, 
                    'message' => 'Name, email, and message are required'
                ], JSON_PRETTY_PRINT);
                return;
            }

            // Validate email format
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                error_log("Invalid email format: " . $data['email']);
                http_response_code(400);
                echo json_encode([
                    'success' => false, 
                    'message' => 'Please provide a valid email address'
                ], JSON_PRETTY_PRINT);
                return;
            }

            // Sanitize input data
            $name = htmlspecialchars(trim($data['name']), ENT_QUOTES, 'UTF-8');
            $email = filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL);
            $subject = isset($data['subject']) ? htmlspecialchars(trim($data['subject']), ENT_QUOTES, 'UTF-8') : 'Contact Form Submission';
            $message = htmlspecialchars(trim($data['message']), ENT_QUOTES, 'UTF-8');
            $phone = isset($data['phone']) ? htmlspecialchars(trim($data['phone']), ENT_QUOTES, 'UTF-8') : '';

            // Prepare email data
            $emailData = [
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'subject' => $subject,
                'message' => $message,
                'submissionDate' => date('F j, Y \a\t g:i A')
            ];

            // Log the attempt
            error_log("Attempting to send contact form email from: {$email}");

            // Send email notification
            try {
                // Check if EmailService class exists and can be instantiated
                if (!class_exists('EmailService')) {
                    error_log("EmailService class not found");
                    throw new Exception("Email service not available");
                }
                
                $emailService = new EmailService();
                
                // Check SMTP configuration
                $smtpConfig = $this->config['mail'];
                if (empty($smtpConfig['host']) || empty($smtpConfig['username']) || empty($smtpConfig['password'])) {
                    error_log("SMTP configuration incomplete: " . print_r($smtpConfig, true));
                    throw new Exception("Email configuration incomplete");
                }
                
                // Send to church email
                $churchEmail = $this->config['mail']['from_address'];
                error_log("Sending email to: {$churchEmail}");
                
                $emailSent = $emailService->sendContactFormEmail(
                    $churchEmail,
                    $name,
                    $email,
                    $phone,
                    $message,
                    $emailData['submissionDate']
                );

                if ($emailSent) {
                    // Log the contact form submission
                    error_log("Contact form submitted successfully from: {$email}");
                    
                    http_response_code(200);
                    echo json_encode([
                        'success' => true,
                        'message' => 'Thank you for your message! We\'ll get back to you soon.',
                        'data' => [
                            'name' => $name,
                            'email' => $email,
                            'submitted_at' => $emailData['submissionDate']
                        ]
                    ], JSON_PRETTY_PRINT);
                } else {
                    error_log("Failed to send contact form email from: {$email}");
                    http_response_code(500);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Failed to send message. Please try again later.'
                    ], JSON_PRETTY_PRINT);
                }
            } catch (Exception $emailError) {
                error_log("Contact form email error: " . $emailError->getMessage());
                error_log("Email error trace: " . $emailError->getTraceAsString());
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to send message. Please try again later.'
                ], JSON_PRETTY_PRINT);
            }

        } catch (Exception $e) {
            error_log("Contact form submission error: " . $e->getMessage());
            error_log("Error trace: " . $e->getTraceAsString());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'An error occurred. Please try again later.'
            ], JSON_PRETTY_PRINT);
        }
    }

}
