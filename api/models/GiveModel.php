<?php
// api/models/GiveModel.php - Model for give table

require_once __DIR__ . '/../core/BaseModel.php';

class GiveModel extends BaseModel {
    protected static $table = 'give';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'title',
        'text',
        'image',
        'links',
        'is_active'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_active' => 'boolean',
        'links' => 'json'
    ];
    
    // Whether the model uses timestamps
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }
    
    /**
     * Get active give entries only
     */
    public function getActiveGive() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->table} 
                WHERE is_active = 1 
                ORDER BY created_at DESC
            ");
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching active give entries: ' . $e->getMessage());
        }
    }
    
    /**
     * Get all give entries (including inactive)
     */
    public function getAllGive() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->table} 
                ORDER BY created_at DESC
            ");
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching all give entries: ' . $e->getMessage());
        }
    }
    
    /**
     * Toggle give entry active status
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
            throw new Exception('Error toggling give entry status: ' . $e->getMessage());
        }
    }
    
    /**
     * Search give entries by title or text
     */
    public function searchGive($query, $limit = null) {
        try {
            $searchTerm = "%{$query}%";
            $sql = "
                SELECT * FROM {$this->table} 
                WHERE is_active = 1 
                AND (title LIKE ? OR text LIKE ?)
                ORDER BY created_at DESC
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
            throw new Exception('Error searching give entries: ' . $e->getMessage());
        }
    }
    
    /**
     * Custom update method that allows null values and is safe from mass assignment
     */
    public function updateGive($id, $data) {
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

            // Add updated_at timestamp if the model uses them
            if (static::$timestamps) {
                $fillableData['updated_at'] = date('Y-m-d H:i:s');
            }
            
            // Build SET clause with placeholders
            $setParts = [];
            foreach ($fillableData as $key => $value) {
                $setParts[] = "`{$key}` = ?";
            }
            $setClause = implode(', ', $setParts);
            
            // Prepare parameters for execution
            $params = array_values($fillableData);
            $params[] = $id; // Add ID for WHERE clause
            
            $tableName = $this->getTableName();
            $sql = "UPDATE `{$tableName}` SET {$setClause} WHERE `id` = ?";
            
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute($params);

        } catch (PDOException $e) {
            throw new Exception('Error updating give entry: ' . $e->getMessage());
        }
    }
}
?>
