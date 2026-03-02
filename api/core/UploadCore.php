<?php

/**
 * Centralized Upload Core System
 * Handles all file types: images, documents, videos, etc.
 * Usage: Import functions and use anywhere in the application
 */

class UploadCore {
    
    // Default configurations
    private static $defaultConfig = [
        'max_size' => 10485760, // 10MB
        'allowed_types' => [
            'images' => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
            'documents' => ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'],
            'videos' => ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
            'audio' => ['mp3', 'wav', 'ogg', 'aac', 'flac'],
            'archives' => ['zip', 'rar', '7z', 'tar', 'gz']
        ],
        'upload_path' => 'uploads/',
        'create_thumbnails' => true,
        'thumbnail_sizes' => [
            'small' => [150, 150],
            'medium' => [300, 300],
            'large' => [600, 600]
        ],
        'image_quality' => 85,
        'secure_filename' => true,
        'overwrite_existing' => false
    ];

    /**
     * Upload any file type with validation
     */
    public static function uploadFile($file, $options = []) {
        try {
            // Merge options with defaults
            $config = array_merge(self::$defaultConfig, $options);
            
            // Validate file
            $validation = self::validateFile($file, $config);
            if (!$validation['success']) {
                return $validation;
            }

            // Generate secure filename
            $filename = self::generateSecureFilename($file['name'], $config['secure_filename']);
            
            // Create upload directory
            $uploadDir = self::createUploadDirectory($config['upload_path']);
            
            // Determine file type
            $fileType = self::getFileType($file['name']);
            
            // Handle different file types
            switch ($fileType) {
                case 'image':
                    return self::handleImageUpload($file, $filename, $uploadDir, $config);
                case 'video':
                    return self::handleVideoUpload($file, $filename, $uploadDir, $config);
                case 'document':
                    return self::handleDocumentUpload($file, $filename, $uploadDir, $config);
                case 'audio':
                    return self::handleAudioUpload($file, $filename, $uploadDir, $config);
                case 'archive':
                    return self::handleArchiveUpload($file, $filename, $uploadDir, $config);
                default:
                    return self::handleGenericUpload($file, $filename, $uploadDir, $config);
            }
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Upload image with thumbnail generation
     */
    public static function uploadImage($file, $options = []) {
        $options['create_thumbnails'] = true;
        return self::uploadFile($file, $options);
    }

    /**
     * Upload document (no thumbnails)
     */
    public static function uploadDocument($file, $options = []) {
        $options['create_thumbnails'] = false;
        return self::uploadFile($file, $options);
    }

    /**
     * Upload video file
     */
    public static function uploadVideo($file, $options = []) {
        $options['create_thumbnails'] = false;
        return self::uploadFile($file, $options);
    }

    /**
     * Upload audio file
     */
    public static function uploadAudio($file, $options = []) {
        $options['create_thumbnails'] = false;
        return self::uploadFile($file, $options);
    }

    /**
     * Delete file and its thumbnails
     */
    public static function deleteFile($filepath, $options = []) {
        try {
            $config = array_merge(self::$defaultConfig, $options);
            
            if (!file_exists($filepath)) {
                return [
                    'success' => false,
                    'message' => 'File not found'
                ];
            }

            // Delete main file
            unlink($filepath);

            // Delete thumbnails if they exist
            $fileInfo = pathinfo($filepath);
            $thumbnailDir = $fileInfo['dirname'] . '/thumbnails/';
            
            if (is_dir($thumbnailDir)) {
                $thumbnails = glob($thumbnailDir . $fileInfo['filename'] . '_*.' . $fileInfo['extension']);
                foreach ($thumbnails as $thumbnail) {
                    if (file_exists($thumbnail)) {
                        unlink($thumbnail);
                    }
                }
            }

            return [
                'success' => true,
                'message' => 'File deleted successfully'
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Delete failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get file information
     */
    public static function getFileInfo($filepath) {
        if (!file_exists($filepath)) {
            return null;
        }

        $fileInfo = pathinfo($filepath);
        $stats = stat($filepath);

        return [
            'filename' => $fileInfo['filename'],
            'extension' => $fileInfo['extension'],
            'basename' => $fileInfo['basename'],
            'dirname' => $fileInfo['dirname'],
            'size' => $stats['size'],
            'size_formatted' => self::formatFileSize($stats['size']),
            'modified' => date('Y-m-d H:i:s', $stats['mtime']),
            'type' => self::getFileType($fileInfo['basename']),
            'url' => self::getFileUrl($filepath),
            'thumbnails' => self::getThumbnailUrls($filepath)
        ];
    }

    /**
     * Resize image
     */
    public static function resizeImage($sourcePath, $targetPath, $width, $height, $quality = 85) {
        if (!extension_loaded('gd')) {
            return [
                'success' => false,
                'message' => 'GD extension not available'
            ];
        }

        try {
            $imageInfo = getimagesize($sourcePath);
            if (!$imageInfo) {
                return [
                    'success' => false,
                    'message' => 'Invalid image file'
                ];
            }

            $sourceImage = self::createImageFromFile($sourcePath, $imageInfo[2]);
            if (!$sourceImage) {
                return [
                    'success' => false,
                    'message' => 'Failed to create image resource'
                ];
            }

            // Calculate new dimensions maintaining aspect ratio
            $sourceWidth = imagesx($sourceImage);
            $sourceHeight = imagesy($sourceImage);
            
            $ratio = min($width / $sourceWidth, $height / $sourceHeight);
            $newWidth = round($sourceWidth * $ratio);
            $newHeight = round($sourceHeight * $ratio);

            $targetImage = imagecreatetruecolor($newWidth, $newHeight);
            
            // Preserve transparency for PNG
            if ($imageInfo[2] == IMAGETYPE_PNG) {
                imagealphablending($targetImage, false);
                imagesavealpha($targetImage, true);
                $transparent = imagecolorallocatealpha($targetImage, 255, 255, 255, 127);
                imagefill($targetImage, 0, 0, $transparent);
            }

            imagecopyresampled($targetImage, $sourceImage, 0, 0, 0, 0, $newWidth, $newHeight, $sourceWidth, $sourceHeight);

            // Save image
            $saveResult = self::saveImage($targetImage, $targetPath, $imageInfo[2], $quality);

            imagedestroy($sourceImage);
            imagedestroy($targetImage);

            if ($saveResult) {
                return ['success' => true, 'path' => $targetPath];
            } else {
                return ['success' => false, 'message' => 'Failed to save resized image.'];
            }

        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Image resize failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Validate uploaded file
     */
    private static function validateFile($file, $config) {
        // Check if file was uploaded
        if (!isset($file['tmp_name'])) {
            return [
                'success' => false,
                'message' => 'No file uploaded or invalid upload'
            ];
        }
        
        // For manually created temporary files (from multipart parsing), skip is_uploaded_file check
        $isValidUpload = is_uploaded_file($file['tmp_name']) || file_exists($file['tmp_name']);
        if (!$isValidUpload) {
            return [
                'success' => false,
                'message' => 'No file uploaded or invalid upload'
            ];
        }

        // Check file size
        if ($file['size'] > $config['max_size']) {
            return [
                'success' => false,
                'message' => 'File size exceeds maximum allowed size (' . self::formatFileSize($config['max_size']) . ')'
            ];
        }

        // Check file type
        $fileType = self::getFileType($file['name']);
        $allowedTypes = array_merge(...array_values($config['allowed_types']));
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        if (!in_array($extension, $allowedTypes)) {
            return [
                'success' => false,
                'message' => 'File type not allowed. Allowed types: ' . implode(', ', $allowedTypes)
            ];
        }

        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $errorMessages = [
                UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize',
                UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE',
                UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
                UPLOAD_ERR_NO_FILE => 'No file was uploaded',
                UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
                UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
                UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload'
            ];
            
            return [
                'success' => false,
                'message' => $errorMessages[$file['error']] ?? 'Unknown upload error'
            ];
        }

        return ['success' => true];
    }

    /**
     * Generate secure filename
     */
    private static function generateSecureFilename($originalName, $secure = true) {
        $extension = pathinfo($originalName, PATHINFO_EXTENSION);
        $filename = pathinfo($originalName, PATHINFO_FILENAME);
        
        if ($secure) {
            // Remove special characters and spaces
            $filename = preg_replace('/[^a-zA-Z0-9_-]/', '_', $filename);
            // Add timestamp to prevent conflicts
            $filename = $filename . '_' . time() . '_' . uniqid();
        }
        
        return $filename . '.' . $extension;
    }

    /**
     * Create upload directory
     */
    private static function createUploadDirectory($path) {
        $fullPath = rtrim($path, '/') . '/';
        
        if (!is_dir($fullPath)) {
            if (!mkdir($fullPath, 0755, true)) {
                throw new Exception('Failed to create upload directory');
            }
        }
        
        return $fullPath;
    }

    /**
     * Get file type based on extension
     */
    private static function getFileType($filename) {
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        
        $imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'];
        $videoTypes = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp'];
        $audioTypes = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma'];
        $documentTypes = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages'];
        $archiveTypes = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];
        
        if (in_array($extension, $imageTypes)) return 'image';
        if (in_array($extension, $videoTypes)) return 'video';
        if (in_array($extension, $audioTypes)) return 'audio';
        if (in_array($extension, $documentTypes)) return 'document';
        if (in_array($extension, $archiveTypes)) return 'archive';
        
        return 'unknown';
    }

    /**
     * Handle image upload with thumbnails
     */
    private static function handleImageUpload($file, $filename, $uploadDir, $config) {
        $filepath = $uploadDir . $filename;
        
        // Use copy for manually created files, move_uploaded_file for regular uploads
        if (is_uploaded_file($file['tmp_name'])) {
            $uploadSuccess = move_uploaded_file($file['tmp_name'], $filepath);
        } else {
            $uploadSuccess = copy($file['tmp_name'], $filepath);
        }
        
        if (!$uploadSuccess) {
            return [
                'success' => false,
                'message' => 'Failed to move uploaded file'
            ];
        }

        $result = [
            'success' => true,
            'message' => 'Image uploaded successfully',
            'filepath' => $filepath,
            'filename' => $filename,
            'url' => self::getFileUrl($filepath),
            'size' => $file['size'],
            'type' => 'image'
        ];

        // Generate thumbnails if enabled
        if ($config['create_thumbnails'] && extension_loaded('gd')) {
            $thumbnails = self::generateThumbnails($filepath, $config['thumbnail_sizes']);
            $result['thumbnails'] = $thumbnails;
        }

        return $result;
    }

    /**
     * Handle video upload
     */
    private static function handleVideoUpload($file, $filename, $uploadDir, $config) {
        $filepath = $uploadDir . $filename;
        
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            return [
                'success' => false,
                'message' => 'Failed to move uploaded file'
            ];
        }

        return [
            'success' => true,
            'message' => 'Video uploaded successfully',
            'filepath' => $filepath,
            'filename' => $filename,
            'url' => self::getFileUrl($filepath),
            'size' => $file['size'],
            'type' => 'video'
        ];
    }

    /**
     * Handle document upload
     */
    private static function handleDocumentUpload($file, $filename, $uploadDir, $config) {
        $filepath = $uploadDir . $filename;
        
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            return [
                'success' => false,
                'message' => 'Failed to move uploaded file'
            ];
        }

        return [
            'success' => true,
            'message' => 'Document uploaded successfully',
            'filepath' => $filepath,
            'filename' => $filename,
            'url' => self::getFileUrl($filepath),
            'size' => $file['size'],
            'type' => 'document'
        ];
    }

    /**
     * Handle audio upload
     */
    private static function handleAudioUpload($file, $filename, $uploadDir, $config) {
        $filepath = $uploadDir . $filename;
        
        // Use copy for manually created files, move_uploaded_file for regular uploads
        if (is_uploaded_file($file['tmp_name'])) {
            $uploadSuccess = move_uploaded_file($file['tmp_name'], $filepath);
        } else {
            $uploadSuccess = copy($file['tmp_name'], $filepath);
        }
        
        if (!$uploadSuccess) {
            return [
                'success' => false,
                'message' => 'Failed to move uploaded file'
            ];
        }

        return [
            'success' => true,
            'message' => 'Audio uploaded successfully',
            'filepath' => $filepath,
            'filename' => $filename,
            'url' => self::getFileUrl($filepath),
            'size' => $file['size'],
            'type' => 'audio'
        ];
    }

    /**
     * Handle archive upload
     */
    private static function handleArchiveUpload($file, $filename, $uploadDir, $config) {
        $filepath = $uploadDir . $filename;
        
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            return [
                'success' => false,
                'message' => 'Failed to move uploaded file'
            ];
        }

        return [
            'success' => true,
            'message' => 'Archive uploaded successfully',
            'filepath' => $filepath,
            'filename' => $filename,
            'url' => self::getFileUrl($filepath),
            'size' => $file['size'],
            'type' => 'archive'
        ];
    }

    /**
     * Handle generic file upload
     */
    private static function handleGenericUpload($file, $filename, $uploadDir, $config) {
        $filepath = $uploadDir . $filename;
        
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            return [
                'success' => false,
                'message' => 'Failed to move uploaded file'
            ];
        }

        return [
            'success' => true,
            'message' => 'File uploaded successfully',
            'filepath' => $filepath,
            'filename' => $filename,
            'url' => self::getFileUrl($filepath),
            'size' => $file['size'],
            'type' => 'unknown'
        ];
    }

    /**
     * Generate thumbnails for image
     */
    private static function generateThumbnails($imagePath, $sizes) {
        $thumbnails = [];
        $thumbnailDir = dirname($imagePath) . '/thumbnails/';
        
        if (!is_dir($thumbnailDir)) {
            mkdir($thumbnailDir, 0755, true);
        }

        foreach ($sizes as $sizeName => $dimensions) {
            $thumbnailName = pathinfo($imagePath, PATHINFO_FILENAME) . '_' . $sizeName . '.' . pathinfo($imagePath, PATHINFO_EXTENSION);
            $thumbnailPath = $thumbnailDir . $thumbnailName;
            
            $result = self::resizeImage($imagePath, $thumbnailPath, $dimensions[0], $dimensions[1]);
            
            if ($result['success']) {
                $thumbnails[$sizeName] = [
                    'url' => self::getFileUrl($thumbnailPath),
                    'path' => $thumbnailPath,
                    'width' => $dimensions[0],
                    'height' => $dimensions[1]
                ];
            }
        }

        return $thumbnails;
    }

    /**
     * Create image resource from file
     */
    private static function createImageFromFile($filepath, $imageType) {
        switch ($imageType) {
            case IMAGETYPE_JPEG:
                return imagecreatefromjpeg($filepath);
            case IMAGETYPE_PNG:
                return imagecreatefrompng($filepath);
            case IMAGETYPE_GIF:
                return imagecreatefromgif($filepath);
            case IMAGETYPE_WEBP:
                return imagecreatefromwebp($filepath);
            default:
                return false;
        }
    }

    /**
     * Save image to file
     */
    private static function saveImage($image, $filepath, $imageType, $quality) {
        $dir = dirname($filepath);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        switch ($imageType) {
            case IMAGETYPE_JPEG:
                return imagejpeg($image, $filepath, $quality);
            case IMAGETYPE_PNG:
                return imagepng($image, $filepath, round($quality / 10));
            case IMAGETYPE_GIF:
                return imagegif($image, $filepath);
            case IMAGETYPE_WEBP:
                return imagewebp($image, $filepath, $quality);
            default:
                return false;
        }
    }

    /**
     * Get file URL
     */
    private static function getFileUrl($filepath) {
        $baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
        $scriptDir = dirname($_SERVER['SCRIPT_NAME']);
        $relativePath = str_replace($_SERVER['DOCUMENT_ROOT'], '', realpath($filepath));
        
        return $baseUrl . $relativePath;
    }

    /**
     * Get thumbnail URLs
     */
    private static function getThumbnailUrls($filepath) {
        $thumbnails = [];
        $thumbnailDir = dirname($filepath) . '/thumbnails/';
        $filename = pathinfo($filepath, PATHINFO_FILENAME);
        $extension = pathinfo($filepath, PATHINFO_EXTENSION);
        
        if (is_dir($thumbnailDir)) {
            $files = glob($thumbnailDir . $filename . '_*.' . $extension);
            foreach ($files as $file) {
                $sizeName = str_replace([$thumbnailDir, $filename . '_', '.' . $extension], '', $file);
                $thumbnails[$sizeName] = self::getFileUrl($file);
            }
        }
        
        return $thumbnails;
    }

    /**
     * Format file size
     */
    private static function formatFileSize($bytes) {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        
        $bytes /= pow(1024, $pow);
        
        return round($bytes, 2) . ' ' . $units[$pow];
    }
}

// Helper functions for easy usage
function uploadFile($file, $options = []) {
    return UploadCore::uploadFile($file, $options);
}

function uploadImage($file, $options = []) {
    return UploadCore::uploadImage($file, $options);
}

function uploadDocument($file, $options = []) {
    return UploadCore::uploadDocument($file, $options);
}

function uploadVideo($file, $options = []) {
    return UploadCore::uploadVideo($file, $options);
}

function uploadAudio($file, $options = []) {
    return UploadCore::uploadAudio($file, $options);
}

function deleteFile($filepath, $options = []) {
    return UploadCore::deleteFile($filepath, $options);
}

function getFileInfo($filepath) {
    return UploadCore::getFileInfo($filepath);
}

function resizeImage($sourcePath, $targetPath, $width, $height, $quality = 85) {
    return UploadCore::resizeImage($sourcePath, $targetPath, $width, $height, $quality);
} 