<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Email Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 768px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            overflow: hidden;
        }
        .header {
            background: #4CAF50;
            color: white;
            padding: 15px;
            text-align: center;
        }
        .content {
            background: white;
            padding: 20px;
        }
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            .container {
                max-width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Email Testing Successful</h2>
        </div>
        
        <div class="content">
            <p>Your email system is working correctly.</p>
            <p><strong>Test Details:</strong></p>
            <ul>
                <li>Sent to: <?php echo htmlspecialchars($to ?? 'test@example.com'); ?></li>
                <li>Sent at: <?php echo date('Y-m-d H:i:s'); ?></li>
            </ul>
        </div>
    </div>
</body>
</html> 