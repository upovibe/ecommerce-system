<?php
/**
 * Settings Upload Configuration
 * Simple setup for settings uploads using UploadCore
 */

// Import the upload core
require_once __DIR__ . '/../core/UploadCore.php';

/**
 * Upload a setting file (e.g., logo, favicon)
 */
function uploadSettingFile($file) {
    $config = [
        'upload_path' => 'uploads/settings/',
        'max_size' => 5242880, // 5MB
        'create_thumbnails' => true,
        'thumbnail_sizes' => [
            'small' => [150, 150],
            'medium' => [300, 300],
            'large' => [600, 600]
        ]
    ];
    return uploadImage($file, $config);
}

/**
 * Delete a setting file
 */
function deleteSettingFile($filePath) {
    return deleteFile($filePath);
}

/**
 * Get setting file info
 */
function getSettingFileInfo($filePath) {
    if (!$filePath) {
        return [
            'url' => null,
            'thumbnails' => []
        ];
    }
    
    $fileInfo = getFileInfo($filePath);
    if (!$fileInfo) {
        return [
            'url' => null,
            'thumbnails' => []
        ];
    }
    
    // Ensure we return the expected structure
    return [
        'url' => $fileInfo ? ($fileInfo['url'] ?? null) : null,
        'thumbnails' => $fileInfo ? ($fileInfo['thumbnails'] ?? []) : []
    ];
}
