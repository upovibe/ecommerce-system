<?php
// router.php - PHP dev server router for SPA support
// Serves static files directly, routes API calls to the API, and falls back to index.html for SPA routes

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$decodedUri = urldecode($uri);
$filePath = __DIR__ . $decodedUri;
// Shared uploads live one level above this project root (C:\laragon\www\uploads)
$sharedUploadPath = dirname(__DIR__) . $decodedUri;

// Serve shared uploads explicitly to avoid SPA fallback returning index.html for images.
if (str_starts_with($uri, '/uploads/') && file_exists($sharedUploadPath) && !is_dir($sharedUploadPath)) {
    $mimeType = function_exists('mime_content_type') ? mime_content_type($sharedUploadPath) : null;
    if ($mimeType) {
        header('Content-Type: ' . $mimeType);
    }
    header('Content-Length: ' . filesize($sharedUploadPath));
    readfile($sharedUploadPath);
    return;
}

// Serve real static files directly (JS, CSS, images, fonts, etc.)
if ($uri !== '/' && file_exists($filePath) && !is_dir($filePath)) {
    return false; // Let PHP handle it natively
}

// Route API requests to the API handler
if (str_starts_with($uri, '/api')) {
    require __DIR__ . '/api/index.php';
    return;
}

// For everything else (SPA routes like /public, /auth/login, /dashboard, etc.)
// Serve index.html and let the frontend router handle it
header('Content-Type: text/html');
echo file_get_contents(__DIR__ . '/index.html');
