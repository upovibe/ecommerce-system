<?php
/**
 * Gallery Upload Configuration
 * Simple setup for gallery uploads using UploadCore
 */

// Import the upload core
require_once __DIR__ . '/../core/UploadCore.php';

/**
 * Upload gallery image
 */
function uploadGalleryImage($file) {
    $config = [
        'upload_path' => 'uploads/galleries/',
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
 * Upload multiple gallery images
 * Handles both single and multiple file uploads gracefully.
 */
function uploadGalleryImages($files) {
    $uploadedImages = [];

    // Handle empty or invalid files array
    if (empty($files) || !is_array($files)) {
        return $uploadedImages;
    }

    // Check if this is a single file upload (e.g., from a faulty PUT parser)
    if (!isset($files['name']) || !is_array($files['name'])) {
        $result = uploadGalleryImage($files);
        if ($result['success']) {
            $uploadedImages[] = $result['filepath'];
        }
    } else {
        // This is a standard multiple file upload
        $fileCount = count($files['name']);
        
        // Validate that all required arrays have the same length
        $requiredKeys = ['name', 'type', 'tmp_name', 'error', 'size'];
        foreach ($requiredKeys as $key) {
            if (!isset($files[$key]) || !is_array($files[$key]) || count($files[$key]) !== $fileCount) {
                return $uploadedImages;
            }
        }
        
        foreach ($files['name'] as $key => $name) {
            
            // Skip empty file inputs
            if ($files['error'][$key] === UPLOAD_ERR_NO_FILE) {
                continue;
            }
            
            // Skip files with upload errors
            if ($files['error'][$key] !== UPLOAD_ERR_OK) {
                continue;
            }
            
            $file = [
                'name' => $name,
                'type' => $files['type'][$key],
                'tmp_name' => $files['tmp_name'][$key],
                'error' => $files['error'][$key],
                'size' => $files['size'][$key]
            ];
            $result = uploadGalleryImage($file);
            if ($result['success']) {
                $uploadedImages[] = $result['filepath'];
            }
        }
    }
    
    return $uploadedImages;
}

/**
 * Delete gallery image(s)
 * Handles single path (string), JSON string of paths, or an array of paths.
 */
function deleteGalleryImages($imagePaths) {
    if (empty($imagePaths)) {
        return true;
    }

    $pathsToDelete = [];
    if (is_string($imagePaths)) {
        $decoded = json_decode($imagePaths, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $pathsToDelete = $decoded;
        } else {
            // Assume it's a single file path string
            $pathsToDelete = [$imagePaths];
        }
    } elseif (is_array($imagePaths)) {
        $pathsToDelete = $imagePaths;
    }

    if (is_array($pathsToDelete)) {
        foreach ($pathsToDelete as $path) {
            if (is_string($path)) {
                deleteFile($path);
            }
        }
    }
    
    return true;
}

/**
 * Get gallery image info for multiple images
 * Handles single path (string), JSON string of paths, or an array of paths.
 */
function getGalleryImageInfo($imagePaths) {
    if (empty($imagePaths)) {
        return [];
    }

    $pathsToProcess = [];
    if (is_string($imagePaths)) {
        $decoded = json_decode($imagePaths, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $pathsToProcess = $decoded;
        } else {
            // Assume it's a single file path string
            $pathsToProcess = [$imagePaths];
        }
    } elseif (is_array($imagePaths)) {
        $pathsToProcess = $imagePaths;
    }

    if (!is_array($pathsToProcess)) {
        return [];
    }

    $imageInfo = [];
    foreach ($pathsToProcess as $path) {
        if (is_string($path)) {
            $fileInfo = getFileInfo($path);
            if ($fileInfo) {
                $imageInfo[] = [
                    'url' => $fileInfo['url'] ?? null,
                    'thumbnails' => $fileInfo['thumbnails'] ?? []
                ];
            }
        }
    }
    return $imageInfo;
} 