<?php
// api/models/VideoGalleryModel.php - Model for video_galleries table

require_once __DIR__ . '/../core/BaseModel.php';

class VideoGalleryModel extends BaseModel {
    protected static $table = 'video_galleries';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'name',
        'slug',
        'description',
        'video_links',
        'is_active'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_active' => 'boolean',
        'video_links' => 'json'
    ];
    
    // Whether the model uses timestamps
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }
    
    /**
     * Find video gallery by slug (static method)
     */
    public static function findBySlug($slug) {
        return static::where('slug', $slug)->first();
    }
    
    /**
     * Find video gallery by slug (instance method)
     */
    public function findBySlugInstance($slug) {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM {$this->table} WHERE slug = ?");
            $stmt->execute([$slug]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($result) {
                $result = $this->applyCasts($result);
            }
            return $result;
        } catch (PDOException $e) {
            throw new Exception('Error fetching video gallery by slug: ' . $e->getMessage());
        }
    }
    
    /**
     * Get active video galleries only
     */
    public function getActiveVideoGalleries() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->table} 
                WHERE is_active = 1 
                ORDER BY created_at DESC, name ASC
            ");
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching active video galleries: ' . $e->getMessage());
        }
    }
    
    /**
     * Get recent video galleries (latest first)
     */
    public function getRecentVideoGalleries($limit = null) {
        try {
            $sql = "
                SELECT * FROM {$this->table} 
                WHERE is_active = 1
                ORDER BY created_at DESC, name ASC
            ";
            
            if ($limit) {
                $sql .= " LIMIT " . (int)$limit;
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching recent video galleries: ' . $e->getMessage());
        }
    }
    
    /**
     * Search video galleries by name or description
     */
    public function searchVideoGalleries($query, $limit = null) {
        try {
            $searchTerm = "%{$query}%";
            $sql = "
                SELECT * FROM {$this->table} 
                WHERE is_active = 1 
                AND (name LIKE ? OR description LIKE ?)
                ORDER BY created_at DESC, name ASC
            ";
            
            if ($limit) {
                $sql .= " LIMIT " . (int)$limit;
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$searchTerm, $searchTerm]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error searching video galleries: ' . $e->getMessage());
        }
    }
    
    /**
     * Toggle video gallery active status
     */
    public function toggleActive($id) {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE {$this->table} 
                SET is_active = NOT is_active, updated_at = NOW() 
                WHERE id = ?
            ");
            return $stmt->execute([$id]);
        } catch (PDOException $e) {
            throw new Exception('Error toggling video gallery status: ' . $e->getMessage());
        }
    }
    
    /**
     * Custom update method that allows null values and is safe from mass assignment
     */
    public function updateVideoGallery($id, $data) {
        try {
            // Filter data to only include fillable fields
            $fillableData = array_filter(
                $data,
                function ($key) {
                    return in_array($key, static::$fillable);
                },
                ARRAY_FILTER_USE_KEY
            );

            // If there is no valid data to update, return true
            if (empty($fillableData)) {
                return true;
            }

            // Build the SET clause dynamically
            $setClause = [];
            $values = [];
            
            foreach ($fillableData as $field => $value) {
                $setClause[] = "{$field} = ?";
                $values[] = $value;
            }
            
            // Add updated_at timestamp
            $setClause[] = "updated_at = NOW()";
            
            // Add the ID to the values array
            $values[] = $id;
            
            $sql = "UPDATE {$this->table} SET " . implode(', ', $setClause) . " WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            
            return $stmt->execute($values);
        } catch (PDOException $e) {
            throw new Exception('Error updating video gallery: ' . $e->getMessage());
        }
    }
}
?> 