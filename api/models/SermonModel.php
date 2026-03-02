<?php
// api/models/SermonModel.php - Model for sermons table

require_once __DIR__ . '/../core/BaseModel.php';

class SermonModel extends BaseModel {
    protected static $table = 'sermons';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'title',
        'slug',
        'description',
        'content',
        'speaker',
        'date_preached',
        'video_links',
        'audio_links',
        'images',
        'is_active'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_active' => 'boolean',
        'video_links' => 'json',
        'audio_links' => 'json',
        'images' => 'json',
        'date_preached' => 'date'
    ];
    
    // Whether the model uses timestamps
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }
    
    /**
     * Find sermon by slug (static method)
     */
    public static function findBySlug($slug) {
        return static::where('slug', $slug)->first();
    }
    
    /**
     * Find sermon by slug (instance method)
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
            throw new Exception('Error fetching sermon by slug: ' . $e->getMessage());
        }
    }
    
    /**
     * Get active sermons only
     */
    public function getActiveSermons() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->table} 
                WHERE is_active = 1 
                ORDER BY date_preached DESC, created_at DESC, title ASC
            ");
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching active sermons: ' . $e->getMessage());
        }
    }
    
    /**
     * Get recent sermons (latest first)
     */
    public function getRecentSermons($limit = null) {
        try {
            $sql = "
                SELECT * FROM {$this->table} 
                WHERE is_active = 1
                ORDER BY date_preached DESC, created_at DESC, title ASC
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
            throw new Exception('Error fetching recent sermons: ' . $e->getMessage());
        }
    }
    
    /**
     * Search sermons by title, description, speaker, or content
     */
    public function searchSermons($query, $limit = null) {
        try {
            $searchTerm = "%{$query}%";
            $sql = "
                SELECT * FROM {$this->table} 
                WHERE is_active = 1 
                AND (
                    title LIKE ? OR 
                    description LIKE ? OR 
                    speaker LIKE ? OR 
                    content LIKE ?
                )
                ORDER BY date_preached DESC, created_at DESC, title ASC
            ";
            
            if ($limit) {
                $sql .= " LIMIT " . (int)$limit;
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$searchTerm, $searchTerm, $searchTerm, $searchTerm]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error searching sermons: ' . $e->getMessage());
        }
    }
    
    /**
     * Toggle sermon active status
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
            throw new Exception('Error toggling sermon status: ' . $e->getMessage());
        }
    }
    
    /**
     * Custom update method that allows null values and is safe from mass assignment
     */
    public function updateSermon($id, $data) {
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

            // Encode arrays to JSON for the appropriate fields
            foreach (['images', 'audio_links', 'video_links'] as $jsonField) {
                if (isset($fillableData[$jsonField]) && is_array($fillableData[$jsonField])) {
                    $fillableData[$jsonField] = json_encode($fillableData[$jsonField]);
                }
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
            
            $sql = "UPDATE " . static::$table . " SET " . implode(', ', $setClause) . " WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            
            return $stmt->execute($values);
        } catch (PDOException $e) {
            throw new Exception('Error updating sermon: ' . $e->getMessage());
        }
    }
}
?> 