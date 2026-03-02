<?php
// api/helpers/SlugHelper.php - Helper functions for slug generation

if (!function_exists("generateSlug")) {
    /**
     * Generate a URL-friendly slug from a string.
     *
     * @param string $string The input string.
     * @param string $separator Separator character (default: -).
     * @return string The generated slug.
     */
    function generateSlug(string $string, string $separator = '-'): string
    {
        // Convert to lowercase
        $string = mb_strtolower($string, 'UTF-8');

        // Replace non-alphanumeric characters with separator
        $string = preg_replace('/[^\p{L}\p{N}]+/u', $separator, $string);

        // Remove duplicate separators
        $string = preg_replace('/[' . preg_quote($separator) . ']{2,}/', $separator, $string);

        // Trim separators from the beginning and end
        $string = trim($string, $separator);

        // Handle empty string case
        if (empty($string)) {
            return 'n-a-' . uniqid(); // Return a default slug if empty
        }

        return $string;
    }
}

if (!function_exists("ensureUniqueSlug")) {
    /**
     * Ensures a unique slug in the database.
     *
     * @param PDO $pdo Database connection.
     * @param string $slug Proposed slug.
     * @param string $tableName Table name.
     * @param string $columnName Slug column name.
     * @param int|null $ignoreId ID to ignore during check (for updates).
     * @return string Unique slug.
     */
    function ensureUniqueSlug(PDO $pdo, string $slug, string $tableName, string $columnName = 'slug', ?int $ignoreId = null): string {
        $originalSlug = $slug;
        $counter = 1;
        
        while (true) {
            $sql = "SELECT id FROM {$tableName} WHERE {$columnName} = ?";
            $params = [$slug];

            if ($ignoreId !== null) {
                $sql .= " AND id != ?";
                $params[] = $ignoreId;
            }
            
            $stmt = $pdo->prepare($sql);
            if (!$stmt) {
                // Handle prepare error - maybe log it and return original slug or throw exception
                error_log("Slug check prepare failed: " . $pdo->errorInfo()[2]);
                return $slug; // Fallback
            }
            
            $stmt->execute($params);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $stmt->closeCursor();

            if (!$result) {
                return $slug; // Slug is unique
            }

            // Slug exists, append counter and check again
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }
    }
}
?> 