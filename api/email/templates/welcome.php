<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to School System</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .highlight { background: #e8f5e8; border: 1px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to School System!</h1>
        </div>
        
        <div class="content">
            <p>Hello <?php echo htmlspecialchars($userName); ?>,</p>
            
            <p>Welcome to the School System! Your account has been successfully created.</p>
            
            <div class="highlight">
                <strong>Getting Started:</strong>
                <ul>
                    <li>Your account is now active and ready to use</li>
                    <li>You can log in using your email address</li>
                    <li>Explore the dashboard to access all features</li>
                </ul>
            </div>
            
            <p>Click the button below to access your account:</p>
            
            <div style="text-align: center;">
                <a href="<?php echo htmlspecialchars($loginUrl); ?>" class="button">Login to Your Account</a>
            </div>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br>School System Team</p>
        </div>
        
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; <?php echo date('Y'); ?> School System. All rights reserved.</p>
        </div>
    </div>
</body>
</html> 