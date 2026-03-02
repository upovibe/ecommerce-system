<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Form Submission</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #1e40af, #3b82f6);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .content {
            padding: 30px;
        }
        .field {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
        }
        .field-label {
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 5px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .field-value {
            color: #374151;
            font-size: 16px;
            word-wrap: break-word;
        }
        .message-field {
            background-color: #f0f9ff;
            border-left-color: #0ea5e9;
        }
        .message-field .field-value {
            white-space: pre-wrap;
            line-height: 1.7;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            margin: 0;
            color: #6b7280;
            font-size: 14px;
        }
        .timestamp {
            background-color: #fef3c7;
            border-left-color: #f59e0b;
            color: #92400e;
        }
        .timestamp .field-label {
            color: #92400e;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📧 New Contact Form Submission</h1>
            <p>PIWC Franklin City Website</p>
        </div>
        
        <div class="content">
            <div class="field">
                <div class="field-label">Name</div>
                <div class="field-value"><?php echo htmlspecialchars($name ?? 'Not provided'); ?></div>
            </div>
            
            <div class="field">
                <div class="field-label">Email Address</div>
                <div class="field-value"><?php echo htmlspecialchars($email ?? 'Not provided'); ?></div>
            </div>
            
            <?php if (!empty($phone)): ?>
            <div class="field">
                <div class="field-label">Phone Number</div>
                <div class="field-value"><?php echo htmlspecialchars($phone); ?></div>
            </div>
            <?php endif; ?>
            
            <div class="field message-field">
                <div class="field-label">Message</div>
                <div class="field-value"><?php echo htmlspecialchars($message ?? 'No message provided'); ?></div>
            </div>
            
            <div class="field timestamp">
                <div class="field-label">Submitted On</div>
                <div class="field-value"><?php echo htmlspecialchars($submissionDate ?? date('F j, Y \a\t g:i A')); ?></div>
            </div>
        </div>
        
        <div class="footer">
            <p>This message was sent from the PIWC Franklin City contact form on the website.</p>
            <p>Please respond directly to the sender's email address: <strong><?php echo htmlspecialchars($email ?? 'N/A'); ?></strong></p>
        </div>
    </div>
</body>
</html>
