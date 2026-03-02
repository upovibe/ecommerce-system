<?php
/**
 * Team Upload Configuration
 * Setup for team member profile image uploads using UploadCore
 */

// Import the upload core
require_once __DIR__ . '/../core/UploadCore.php';

/**
 * Upload a team member profile image
 */
function uploadTeamImage($file) {
    $config = [
        'upload_path' => 'uploads/teams/',
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
 * Delete a team member profile image
 */
function deleteTeamImage($filePath) {
    return deleteFile($filePath);
}

/**
 * Get team member profile image info
 */
function getTeamImageInfo($filePath) {
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
?> 