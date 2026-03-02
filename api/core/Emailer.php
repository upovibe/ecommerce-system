<?php
// api/core/Emailer.php - Email testing and management

class Emailer {
    
    private static function getEmailerEnv($key, $default = null) {
        static $envCache = [];
        
        // Check if we already have this value cached
        if (isset($envCache[$key])) {
            return $envCache[$key];
        }
        
        $envFile = __DIR__ . '/../../.env';
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos(trim($line), '#') === 0) continue; // Skip comments
                if (strpos($line, '=') === false) continue; // Skip lines without =
                list($envKey, $value) = explode('=', $line, 2);
                if (trim($envKey) === $key) {
                    $envCache[$key] = trim($value);
                    return $envCache[$key];
                }
            }
        }
        $envCache[$key] = $default;
        return $envCache[$key];
    }
    
    public static function test($emailAddress) {
        echo "📧 Testing Email System\n";
        echo "======================\n\n";
        
        if (!filter_var($emailAddress, FILTER_VALIDATE_EMAIL)) {
            echo "❌ Invalid email address: $emailAddress\n";
            echo "Usage: php index.php --email:user@example.com\n";
            return false;
        }
        
        echo "📧 Testing email sending to: $emailAddress\n\n";
        
        // Load EmailService
        require_once __DIR__ . '/EmailService.php';
        
        try {
            $emailService = new EmailService();
            
            // Use CLIENT_URL from environment for testing (frontend URL)
            $clientUrl = self::getEmailerEnv('CLIENT_URL');
            $testUrl = $clientUrl . '/email-test';
            
            // Test with the dedicated test email function
            $result = $emailService->sendTestEmailEmail($emailAddress, $emailAddress, $testUrl);
            
            if ($result) {
                echo "✅ Email sent successfully!\n";
                self::logEmailTest($emailAddress, true);
                return true;
            } else {
                echo "❌ Email not sent\n";
                self::logEmailTest($emailAddress, false);
                return false;
            }
            
        } catch (Exception $e) {
            echo "❌ Error: " . $e->getMessage() . "\n";
            self::logEmailTest($emailAddress, false, $e->getMessage());
            return false;
        }
    }
    
    private static function logEmailTest($emailAddress, $success, $error = null) {
        $logFile = __DIR__ . '/../storage/logs/upoui.log';
        $logDir = dirname($logFile);
        
        // Create logs directory if it doesn't exist
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        $timestamp = date('Y-m-d H:i:s');
        $status = $success ? 'SUCCESS' : 'FAILED';
        $message = $success ? 'Email sent successfully' : ($error ? "Error: $error" : 'Email not sent');
        
        $logEntry = "[$timestamp] EMAIL_TEST [$status] To: $emailAddress - $message\n";
        
        file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }
    
    public static function run() {
        echo "📧 Emailer - Email Management System\n";
        echo "===================================\n\n";
        
        echo "Available commands:\n";
        echo "  --email:user@example.com  - Test email sending\n";
        echo "  --email:config            - Show email configuration\n";
        echo "  --email:templates         - List available email templates\n";
        echo "\n";
    }
}
?> 