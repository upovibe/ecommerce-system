<?php
// api/utils/sermon_uploads.php - Upload utilities for sermon images and audio

require_once __DIR__ . '/../core/UploadCore.php';

/**
 * Upload multiple sermon images
 * @param array $files - Array of uploaded files from $_FILES['images']
 * @return array - Array containing uploaded image paths
 */
function uploadSermonImages($files) {
    
    $uploadDir = __DIR__ . '/../uploads/sermons/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    $maxSize = 5 * 1024 * 1024; // 5MB per image
    $maxFiles = 20;
    $uploadedImages = [];
    $fileArray = [];
    $processedFiles = []; // Track processed files to prevent duplicates
    if (isset($files['name']) && is_array($files['name'])) {
        for ($i = 0; $i < count($files['name']); $i++) {
            if ($files['error'][$i] === UPLOAD_ERR_OK) {
                $fileArray[] = [
                    'name' => $files['name'][$i],
                    'type' => $files['type'][$i],
                    'tmp_name' => $files['tmp_name'][$i],
                    'error' => $files['error'][$i],
                    'size' => $files['size'][$i]
                ];
            }
        }
    } else {
        if ($files['error'] === UPLOAD_ERR_OK) {
            $fileArray[] = $files;
        }
    }
    
    if (count($fileArray) > $maxFiles) {
        throw new Exception("Too many files. Maximum {$maxFiles} images allowed per upload.");
    }
    foreach ($fileArray as $index => $file) {
        // Create a unique identifier for this file to prevent duplicates
        $fileId = md5($file['name'] . $file['size'] . $file['type']);
        if (in_array($fileId, $processedFiles)) {
            continue;
        }
        $processedFiles[] = $fileId;
        
        if (!in_array($file['type'], $allowedTypes)) {
            throw new Exception('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
        }
        if ($file['size'] > $maxSize) {
            throw new Exception('File size too large. Maximum size is 5MB per image.');
        }
        $result = uploadImage($file, ['upload_path' => $uploadDir, 'create_thumbnails' => true]);
        if ($result['success']) {
            $uploadedImages[] = 'uploads/sermons/' . $result['filename'];
        }
    }
    return $uploadedImages;
}

/**
 * Upload multiple sermon audio files
 * @param array $files - Array of uploaded files from $_FILES['audio']
 * @return array - Array containing uploaded audio paths
 */
function uploadSermonAudio($files) {
    $uploadDir = __DIR__ . '/../uploads/sermons/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    $allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac'];
    $maxSize = 20 * 1024 * 1024; // 20MB per audio
    $maxFiles = 10;
    $uploadedAudio = [];
    $fileArray = [];
    $processedFiles = []; // Track processed files to prevent duplicates
    if (isset($files['name']) && is_array($files['name'])) {
        for ($i = 0; $i < count($files['name']); $i++) {
            if ($files['error'][$i] === UPLOAD_ERR_OK) {
                $fileArray[] = [
                    'name' => $files['name'][$i],
                    'type' => $files['type'][$i],
                    'tmp_name' => $files['tmp_name'][$i],
                    'error' => $files['error'][$i],
                    'size' => $files['size'][$i]
                ];
            }
        }
    } else {
        if ($files['error'] === UPLOAD_ERR_OK) {
            $fileArray[] = $files;
        }
    }
    if (count($fileArray) > $maxFiles) {
        throw new Exception("Too many files. Maximum {$maxFiles} audio files allowed per upload.");
    }
    foreach ($fileArray as $file) {
        // Create a unique identifier for this file to prevent duplicates
        $fileId = md5($file['name'] . $file['size'] . $file['type']);
        if (in_array($fileId, $processedFiles)) {
            continue;
        }
        $processedFiles[] = $fileId;
        
        if (!in_array($file['type'], $allowedTypes)) {
            throw new Exception('Invalid file type. Only MP3, WAV, OGG, AAC, FLAC audio files are allowed. Received: ' . $file['type']);
        }
        if ($file['size'] > $maxSize) {
            throw new Exception('File size too large. Maximum size is 20MB per audio file.');
        }
        $result = uploadAudio($file, ['upload_path' => $uploadDir]);
        if ($result['success']) {
            $uploadedAudio[] = 'uploads/sermons/' . $result['filename'];
        }
    }
    return $uploadedAudio;
}

/**
 * Delete sermon media (images or audio)
 * @param array $mediaPaths - Array of media paths to delete
 * @return bool
 */
function deleteSermonMedia($mediaPaths) {
    if (empty($mediaPaths) || !is_array($mediaPaths)) {
        return true;
    }
    $baseDir = __DIR__ . '/../';
    foreach ($mediaPaths as $mediaPath) {
        if (empty($mediaPath)) continue;
        $fullPath = $baseDir . $mediaPath;
        if (file_exists($fullPath)) {
            unlink($fullPath);
        }
    }
    return true;
}

/**
 * Add images to existing sermon
 */
function addSermonImages($files, $existingImages = []) {
    $newImages = uploadSermonImages($files);
    return array_merge($existingImages, $newImages);
}

/**
 * Add audio to existing sermon
 */
function addSermonAudio($files, $existingAudio = []) {
    $newAudio = uploadSermonAudio($files);
    return array_merge($existingAudio, $newAudio);
}

/**
 * Remove specific media from sermon
 */
function removeSermonMedia($mediaToRemove, $existingMedia) {
    deleteSermonMedia($mediaToRemove);
    $remaining = array_diff($existingMedia, $mediaToRemove);
    return array_values($remaining);
}
?> 