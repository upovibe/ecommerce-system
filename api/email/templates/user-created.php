<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to School System</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .welcome-text {
            font-size: 18px;
            margin-bottom: 20px;
        }
        .credentials-box {
            background: #e8f4fd;
            border: 2px solid #2196F3;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .credential-item {
            margin: 10px 0;
            font-weight: bold;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
        }
        .button {
            display: inline-block;
            background: #2196F3;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to School System</h1>
        <p>Your account has been created successfully</p>
    </div>
    
    <div class="content">
        <div class="welcome-text">
            <p>Hello <strong><?php echo htmlspecialchars($userName); ?></strong>,</p>
            <p>Welcome to the School Management System! Your account has been created successfully.</p>
        </div>
        
        <div class="credentials-box">
            <h3>Your Login Credentials</h3>
            <div class="credential-item">
                <strong>Email:</strong> <?php echo htmlspecialchars($userEmail); ?>
            </div>
            <div class="credential-item">
                <strong>Initial Password:</strong> <?php echo htmlspecialchars($initialPassword); ?>
            </div>
        </div>
        
        <div class="warning">
            <h4>⚠️ Important Security Notice</h4>
            <p>For your security, you <strong>must change your password</strong> on your first login. The system will automatically prompt you to set a new password.</p>
            <p><strong>Note:</strong> This login link is valid for 24 hours. If you don't log in within this time, please contact the administrator for a new password.</p>
        </div>
        
        <p>You can now log in to your account using the credentials above:</p>
        
        <a href="<?php echo htmlspecialchars($loginUrl); ?>" class="button">Login to Your Account</a>
        
        <p>If you have any questions or need assistance, please contact the system administrator.</p>
    </div>
    
    <div class="footer">
        <p>This is an automated message from the School Management System.</p>
        <p>Please do not reply to this email.</p>
    </div>
</body>
</html> 