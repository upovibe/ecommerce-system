<?php
// api/models/LifeGroupModel.php - Model for life_groups table

require_once __DIR__ . '/../core/BaseModel.php';

class LifeGroupModel extends BaseModel {
    protected static $table = 'life_groups';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'title',
        'slug',
        'description',
        'banner',
        'link',
        'is_active'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_active' => 'boolean'
    ];
    
    // Whether the model uses timestamps
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }
    
    /**
     * Get active life groups only
     */
    public function getActiveLifeGroups() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->getTableName()} 
                WHERE is_active = 1 
                ORDER BY title ASC
            ");
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching active life groups: ' . $e->getMessage());
        }
    }
    
    /**
     * Get life group by slug
     */
    public function getLifeGroupBySlug($slug) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->getTableName()} 
                WHERE slug = ? AND is_active = 1
            ");
            $stmt->execute([$slug]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                return $this->applyCasts($result);
            }
            
            return null;
        } catch (PDOException $e) {
            throw new Exception('Error fetching life group by slug: ' . $e->getMessage());
        }
    }
    
    /**
     * Search life groups by title or description
     */
    public function searchLifeGroups($query, $limit = null) {
        try {
            $searchTerm = "%{$query}%";
            $sql = "
                SELECT * FROM {$this->getTableName()} 
                WHERE is_active = 1 
                AND (title LIKE ? OR description LIKE ?)
                ORDER BY title ASC
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
            throw new Exception('Error searching life groups: ' . $e->getMessage());
        }
    }
    
    /**
     * Toggle life group active status
     */
    public function toggleActive($id) {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE {$this->getTableName()} 
                SET is_active = NOT is_active, updated_at = NOW() 
                WHERE id = ?
            ");
            return $stmt->execute([$id]);
        } catch (PDOException $e) {
            throw new Exception('Error toggling life group status: ' . $e->getMessage());
        }
    }
    
    /**
     * Custom update method that allows null values and is safe from mass assignment
     */
    public function updateLifeGroup($id, $data) {
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
            
            $sql = "UPDATE {$this->getTableName()} SET " . implode(', ', $setClause) . " WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            
            return $stmt->execute($values);
        } catch (PDOException $e) {
            throw new Exception('Error updating life group: ' . $e->getMessage());
        }
    }
    
    /**
     * Check if slug exists
     */
    public function slugExists($slug, $excludeId = null) {
        try {
            $sql = "SELECT COUNT(*) FROM {$this->getTableName()} WHERE slug = ?";
            $params = [$slug];
            
            if ($excludeId) {
                $sql .= " AND id != ?";
                $params[] = $excludeId;
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            
            return $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            throw new Exception('Error checking slug existence: ' . $e->getMessage());
        }
    }
    
    /**
     * Generate unique slug from title
     */
    public function generateSlug($title, $excludeId = null) {
        $baseSlug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $title)));
        $slug = $baseSlug;
        $counter = 1;
        
        while ($this->slugExists($slug, $excludeId)) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }
        
        return $slug;
    }
}
?> 