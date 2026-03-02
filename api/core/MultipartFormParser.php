<?php
/**
 * MultipartFormParser
 * Handles parsing of multipart/form-data from PUT and PATCH requests
 * since PHP doesn't automatically populate $_POST and $_FILES for these methods
 */

class MultipartFormParser {
    
    /**
     * Parse multipart/form-data from PUT/PATCH requests
     * @param string $rawData The raw request body
     * @param string $contentType The Content-Type header
     * @return array Array with 'data' (form fields) and 'files' (uploaded files)
     */
    public static function parse($rawData, $contentType) {
        $data = [];
        $files = [];
        
        // Extract boundary from Content-Type
        $boundary = null;
        if (preg_match('/boundary=(.*)$/', $contentType, $matches)) {
            $boundary = $matches[1];
        }
        
        if (!$boundary) {
            return ['data' => [], 'files' => []];
        }
        
        // Split by boundary
        $parts = explode('--' . $boundary, $rawData);
        
        foreach ($parts as $index => $part) {
            if (empty($part) || $part === '--') continue;
            
            // Parse each part
            $parsedPart = self::parsePart($part);
            
            if ($parsedPart['isFile']) {
                $fieldName = $parsedPart['fieldName'];
                // Handle multiple files with the same field name
                if (isset($files[$fieldName])) {
                    // Convert single file to array if it's the first duplicate
                    if (!isset($files[$fieldName]['name']) || !is_array($files[$fieldName]['name'])) {
                        $singleFile = $files[$fieldName];
                        $files[$fieldName] = [
                            'name' => [$singleFile['name']],
                            'type' => [$singleFile['type']],
                            'tmp_name' => [$singleFile['tmp_name']],
                            'error' => [$singleFile['error']],
                            'size' => [$singleFile['size']]
                        ];
                    }
                    // Add the new file to the array
                    $files[$fieldName]['name'][] = $parsedPart['fileData']['name'];
                    $files[$fieldName]['type'][] = $parsedPart['fileData']['type'];
                    $files[$fieldName]['tmp_name'][] = $parsedPart['fileData']['tmp_name'];
                    $files[$fieldName]['error'][] = $parsedPart['fileData']['error'];
                    $files[$fieldName]['size'][] = $parsedPart['fileData']['size'];
                } else {
                    $files[$fieldName] = $parsedPart['fileData'];
                }
            } else {
                $fieldName = $parsedPart['fieldName'];
                $value = $parsedPart['value'];
                
                // Handle array fields (e.g., video_links[])
                if (preg_match('/^(.+)\[\]$/', $fieldName, $matches)) {
                    $arrayFieldName = $matches[1];
                    if (!isset($data[$arrayFieldName])) {
                        $data[$arrayFieldName] = [];
                    }
                    $data[$arrayFieldName][] = $value;
                } else {
                    $data[$fieldName] = $value;
                }
            }
        }
        
        return [
            'data' => $data,
            'files' => $files
        ];
    }
    
    /**
     * Parse a single multipart part
     * @param string $part The part content
     * @return array Parsed part data
     */
    private static function parsePart($part) {
        $lines = explode("\r\n", $part);
        $headers = [];
        $body = '';
        $fieldName = null;
        $fileName = null;
        $contentType = null;
        
        // Skip the first line if it's empty (boundary line)
        $startIndex = 0;
        if (empty($lines[0])) {
            $startIndex = 1;
        }
        
        // Find the empty line that separates headers from body
        $headerEndIndex = -1;
        for ($i = $startIndex; $i < count($lines); $i++) {
            if (empty($lines[$i])) {
                $headerEndIndex = $i;
                break;
            }
        }
        
        // Parse headers
        for ($i = $startIndex; $i < $headerEndIndex; $i++) {
            $line = $lines[$i];
            
            // Parse Content-Disposition
            if (preg_match('/Content-Disposition: form-data; name="([^"]+)"; filename="([^"]+)"/', $line, $matches)) {
                $fieldName = $matches[1];
                $fileName = $matches[2];
            } elseif (preg_match('/Content-Disposition: form-data; name="([^"]+)"/', $line, $matches)) {
                $fieldName = $matches[1];
            }
            
            // Parse Content-Type
            if (preg_match('/Content-Type: (.+)/', $line, $matches)) {
                $contentType = $matches[1];
            }
        }
        
        // Collect body content
        for ($i = $headerEndIndex + 1; $i < count($lines); $i++) {
            $body .= $lines[$i] . "\r\n";
        }
        
        // Remove trailing \r\n
        $body = rtrim($body, "\r\n");
        
        // Determine if this is a file upload
        $isFile = !empty($fileName);
        
        if ($isFile) {
            // Create temporary file for upload
            $tmpFile = tempnam(sys_get_temp_dir(), 'upload_');
            file_put_contents($tmpFile, $body);
            
            return [
                'isFile' => true,
                'fieldName' => $fieldName,
                'fileData' => [
                    'name' => $fileName,
                    'type' => $contentType,
                    'tmp_name' => $tmpFile,
                    'error' => 0,
                    'size' => strlen($body)
                ]
            ];
        } else {
            return [
                'isFile' => false,
                'fieldName' => $fieldName,
                'value' => $body
            ];
        }
    }
    
    /**
     * Process PUT/PATCH multipart request and populate $_POST and $_FILES
     * @param string $rawData The raw request body
     * @param string $contentType The Content-Type header
     * @return array Parsed data
     */
    public static function processRequest($rawData, $contentType) {
        $parsed = self::parse($rawData, $contentType);
        
        // Populate $_POST with form data
        foreach ($parsed['data'] as $key => $value) {
            $_POST[$key] = $value;
        }
        
        // Populate $_FILES with file data
        foreach ($parsed['files'] as $key => $fileData) {
            $_FILES[$key] = $fileData;
        }
        
        return $parsed;
    }
} 