<?php
// api/models/GalleryModel.php - Model for galleries table

require_once __DIR__ . '/../core/BaseModel.php';

class GalleryModel extends BaseModel {
    protected static $table = 'galleries';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'name',
        'slug',
        'description',
        'images',
        'is_active'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_active' => 'boolean',
        'images' => 'json'
    ];
    
    // Whether the model uses timestamps
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }
    
    /**
     * Find gallery by slug (static method)
     */
    public static function findBySlug($slug) {
        return static::where('slug', $slug)->first();
    }
    
    /**
     * Find gallery by slug (instance method)
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
            throw new Exception('Error fetching gallery by slug: ' . $e->getMessage());
        }
    }
    
    /**
     * Get active galleries only
     */
    public function getActiveGalleries() {
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
            throw new Exception('Error fetching active galleries: ' . $e->getMessage());
        }
    }
    
    /**
     * Get recent galleries (latest first)
     */
    public function getRecentGalleries($limit = null) {
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
            throw new Exception('Error fetching recent galleries: ' . $e->getMessage());
        }
    }
    
    /**
     * Search galleries by name or description
     */
    public function searchGalleries($query, $limit = null) {
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
            throw new Exception('Error searching galleries: ' . $e->getMessage());
        }
    }
    
    /**
     * Toggle gallery active status
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
            throw new Exception('Error toggling gallery status: ' . $e->getMessage());
        }
    }
    
    /**
     * Custom update method that allows null values and is safe from mass assignment
     */
    public function updateGallery($id, $data) {
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
            throw new Exception('Error updating gallery: ' . $e->getMessage());
        }
    }
}
?> 