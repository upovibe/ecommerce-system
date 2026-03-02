<?php
// api/utils/event_uploads.php - Upload utilities for events

require_once __DIR__ . '/../core/UploadCore.php';

/**
 * Upload event banner image
 * 
 * @param array $file - The uploaded file array from $_FILES
 * @return array - Array containing original and thumbnail paths
 */
function uploadEventBanner($file) {
    $config = [
        'upload_path' => 'uploads/events/',
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
        'original' => 'uploads/events/' . $result['filename'],
        'thumbnails' => $result['thumbnails'] ?? []
    ];
}

/**
 * Delete event banner image and its thumbnails
 * 
 * @param string $imagePath - The image path to delete
 * @return bool - True if deletion was successful
 */
function deleteEventBanner($imagePath) {
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
 * Update event banner image (delete old, upload new)
 * 
 * @param array $newFile - The new uploaded file array
 * @param string $oldImagePath - The old image path to delete
 * @return array - Array containing new original and thumbnail paths
 */
function updateEventBanner($newFile, $oldImagePath = null) {
    // Delete old image if it exists
    if ($oldImagePath) {
        deleteEventBanner($oldImagePath);
    }
    
    // Upload new image
    return uploadEventBanner($newFile);
}

?>