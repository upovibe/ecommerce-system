<?php
// api/email/config/email-functions.php - Email function definitions for PIWC-FC Church System

return [
    'test-email' => [
        'subject' => 'Email Test - PIWC Franklin City',
        'template' => 'test-email',
        'variables' => ['to', 'testUrl']
    ],
    
    'password-reset' => [
        'subject' => 'Password Reset Request - PIWC Franklin City',
        'template' => 'password-reset',
        'variables' => ['resetUrl']
    ],
    
    'user-created' => [
        'subject' => 'Welcome to PIWC Franklin City - Your Account Details',
        'template' => 'user-created',
        'variables' => ['userName', 'userEmail', 'initialPassword', 'loginUrl']
    ],
    
    'account-update' => [
        'subject' => 'Your Account Has Been Updated - PIWC Franklin City',
        'template' => 'account-update',
        'variables' => ['userName', 'changes', 'oldEmail']
    ],
    
    'contact-form' => [
        'subject' => 'New Contact Form Submission - PIWC Franklin City',
        'template' => 'contact-form',
        'variables' => ['name', 'email', 'phone', 'message', 'submissionDate']
    ]
]; 

?>