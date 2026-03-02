<?php
/**
 * Profile Upload Configuration
 * Setup for user profile image uploads using UploadCore
 */

// Import the upload core
require_once __DIR__ . '/../core/UploadCore.php';

/**
 * Upload a profile image
 */
function uploadProfileImage($file) {
    $config = [
        'upload_path' => 'uploads/profiles/',
        'max_size' => 5242880, // 5MB
        'create_thumbnails' => true,
        'thumbnail_sizes' => [
            'small' => [100, 100],
            'medium' => [200, 200],
            'large' => [400, 400]
        ],
        'allowed_types' => [
            'images' => ['jpg', 'jpeg', 'png', 'gif', 'webp']
        ]
    ];
    return uploadImage($file, $config);
}

/**
 * Delete a profile image
 */
function deleteProfileImage($filePath) {
    return deleteFile($filePath);
}

/**
 * Get profile image info
 */
function getProfileImageInfo($filePath) {
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