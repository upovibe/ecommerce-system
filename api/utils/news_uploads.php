<?php
// api/utils/news_uploads.php - Upload utilities for news

require_once __DIR__ . '/../core/UploadCore.php';

/**
 * Upload news banner image
 * 
 * @param array $file - The uploaded file array from $_FILES
 * @return array - Array containing original and thumbnail paths
 */
function uploadNewsBanner($file) {
    $config = [
        'upload_path' => 'uploads/news/',
        'max_size' => 5242880, // 5MB
        'create_thumbnails' => true,
        'thumbnail_sizes' => [
            'small' => [150, 150],
            'medium' => [300, 300],
            'large' => [600, 600]
        ]
    ];
    
    $result = uploadImage($file, $config);
    
    if (!$result['success']) {
        throw new Exception($result['message']);
    }
    
    return [
        'original' => 'uploads/news/' . $result['filename'],
        'thumbnails' => $result['thumbnails'] ?? []
    ];
}

/**
 * Delete news banner image and its thumbnails
 * 
 * @param string $imagePath - The image path to delete
 * @return bool - True if deletion was successful
 */
function deleteNewsBanner($imagePath) {
    if (empty($imagePath)) {
        return true;
    }
    
    $baseDir = __DIR__ . '/../';
    $originalPath = $baseDir . $imagePath;
    
    // Use UploadCore deleteFile function
    $result = deleteFile($originalPath);
    
    return $result['success'] ?? true;
}

/**
 * Update news banner image (delete old, upload new)
 * 
 * @param array $newFile - The new uploaded file array
 * @param string $oldImagePath - The old image path to delete
 * @return array - Array containing new original and thumbnail paths
 */
function updateNewsBanner($newFile, $oldImagePath = null) {
    // Delete old image if it exists
    if ($oldImagePath) {
        deleteNewsBanner($oldImagePath);
    }
    
    // Upload new image
    return uploadNewsBanner($newFile);
}
?> 