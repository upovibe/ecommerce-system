<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Updated - School System</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e9ecef;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 10px;
        }
        .title {
            font-size: 20px;
            font-weight: 600;
            color: #333;
            margin-bottom: 5px;
        }
        .subtitle {
            color: #6c757d;
            font-size: 14px;
        }
        .content {
            margin-bottom: 30px;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
            color: #333;
        }
        .changes-section {
            background-color: #f8f9fa;
            border-left: 4px solid #007bff;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .changes-title {
            font-weight: 600;
            color: #007bff;
            margin-bottom: 15px;
            font-size: 16px;
        }
        .change-item {
            margin-bottom: 8px;
            padding-left: 20px;
            position: relative;
        }
        .change-item:before {
            content: "•";
            color: #007bff;
            font-weight: bold;
            position: absolute;
            left: 0;
        }
        .security-notice {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
        }
        .security-title {
            font-weight: 600;
            color: #856404;
            margin-bottom: 10px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 12px;
        }
        .contact-info {
            margin-top: 15px;
            font-size: 14px;
        }
        .highlight {
            background-color: #e3f2fd;
            padding: 2px 4px;
            border-radius: 3px;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏫 School System</div>
            <div class="title">Account Update Notification</div>
            <div class="subtitle">Your account information has been updated</div>
        </div>

        <div class="content">
            <div class="greeting">
                Hello <strong><?php echo htmlspecialchars($userName); ?></strong>,
            </div>

            <p>Your account information has been updated by an administrator. Here are the changes that were made:</p>

            <div class="changes-section">
                <div class="changes-title">📝 Changes Made:</div>
                <?php foreach ($changes as $change): ?>
                    <div class="change-item"><?php echo htmlspecialchars($change); ?></div>
                <?php endforeach; ?>
            </div>

            <div class="security-notice">
                <div class="security-title">🔒 Security Information:</div>
                <ul style="margin: 0; padding-left: 20px;">
                    <li>If you did not request these changes, please contact support immediately</li>
                    <li>Your login credentials remain secure</li>
                    <li>You can continue to access your account with your existing password</li>
                    <li>If your account was deactivated, you will not be able to log in until it's reactivated</li>
                </ul>
            </div>

            <p>If you have any questions about these changes, please contact your system administrator or support team.</p>

            <?php if ($oldEmail && $oldEmail !== $userName): ?>
                <p><strong>Note:</strong> If your email address was changed, you will receive future notifications at your new email address.</p>
            <?php endif; ?>
        </div>

        <div class="footer">
            <p>This is an automated notification from the School System.</p>
            <div class="contact-info">
                <p>If you have any questions, please contact your system administrator.</p>
                <p>Generated on: <?php echo date('F j, Y \a\t g:i A'); ?></p>
            </div>
        </div>
    </div>
</body>
</html> 