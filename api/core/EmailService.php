<?php
// api/core/EmailService.php - Simplified email service placeholder

class EmailService
{
    public function __construct()
    {
        // Placeholder for future SMTP config
    }

    public function sendPasswordResetEmail($to, $resetUrl)
    {
        error_log("Email to $to: Reset your password at $resetUrl");
        return true;
    }

    public function sendUserCreatedEmail($to, $name, $email, $password, $loginUrl)
    {
        error_log("Email to $to: Welcome $name! Login at $loginUrl with password: $password");
        return true;
    }

    public function sendEmailChangeNotification($to, $name, $oldEmail, $newEmail)
    {
        error_log("Email to $to: Hello $name, your email has been changed from $oldEmail to $newEmail.");
        return true;
    }

    public function sendEmailVerificationCode($to, $name, $code, $newEmail)
    {
        error_log("Email to $to: Hello $name, your verification code for changing to $newEmail is: $code (expires in 15 minutes).");
        return true;
    }
}
