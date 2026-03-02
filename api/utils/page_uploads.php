<?php
/**
 * Page Upload Configuration
 * Simple setup for page uploads using UploadCore
 */

// Import the upload core
require_once __DIR__ . '/../core/UploadCore.php';

/**
 * Upload page banner
 */
function uploadPageBanner($file) {
    $config = [
        'upload_path' => 'uploads/pages/',
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
 * Upload multiple page banners
 * Handles both single and multiple file uploads gracefully.
 */
function uploadPageBanners($files) {
    $uploadedBanners = [];

    // Handle empty or invalid files array
    if (empty($files) || !is_array($files)) {
        return $uploadedBanners;
    }

    // Check if this is a single file upload (e.g., from a faulty PUT parser)
    if (!isset($files['name']) || !is_array($files['name'])) {
        $result = uploadPageBanner($files);
        if ($result['success']) {
            $uploadedBanners[] = $result['filepath'];
        }
    } else {
        // This is a standard multiple file upload
        $fileCount = count($files['name']);
        
        // Validate that all required arrays have the same length
        $requiredKeys = ['name', 'type', 'tmp_name', 'error', 'size'];
        foreach ($requiredKeys as $key) {
            if (!isset($files[$key]) || !is_array($files[$key]) || count($files[$key]) !== $fileCount) {
                return $uploadedBanners;
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
            $result = uploadPageBanner($file);
            if ($result['success']) {
                $uploadedBanners[] = $result['filepath'];
            }
        }
    }
    
    return $uploadedBanners;
}

/**
 * Delete page banner(s)
 * Handles single path (string), JSON string of paths, or an array of paths.
 */
function deletePageBanner($bannerPaths) {
    if (empty($bannerPaths)) {
        return true;
    }

    $pathsToDelete = [];
    if (is_string($bannerPaths)) {
        $decoded = json_decode($bannerPaths, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $pathsToDelete = $decoded;
        } else {
            // Assume it's a single file path string
            $pathsToDelete = [$bannerPaths];
        }
    } elseif (is_array($bannerPaths)) {
        $pathsToDelete = $bannerPaths;
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
 * Get banner info for multiple banners
 * Handles single path (string), JSON string of paths, or an array of paths.
 */
function getPageBannerInfo($bannerPaths) {
    if (empty($bannerPaths)) {
        return [];
    }

    $pathsToProcess = [];
    if (is_string($bannerPaths)) {
        $decoded = json_decode($bannerPaths, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $pathsToProcess = $decoded;
        } else {
            // Assume it's a single file path string
            $pathsToProcess = [$bannerPaths];
        }
    } elseif (is_array($bannerPaths)) {
        $pathsToProcess = $bannerPaths;
    }

    if (!is_array($pathsToProcess)) {
        return [];
    }

    $bannerInfo = [];
    foreach ($pathsToProcess as $path) {
        if (is_string($path)) {
            $fileInfo = getFileInfo($path);
            if ($fileInfo) {
                $bannerInfo[] = [
                    'url' => $fileInfo['url'] ?? null,
                    'thumbnails' => $fileInfo['thumbnails'] ?? []
                ];
            }
        }
    }
    return $bannerInfo;
}