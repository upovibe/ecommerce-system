<?php
// api/models/EventModel.php - Model for events table

require_once __DIR__ . '/../core/BaseModel.php';

class EventModel extends BaseModel {
    protected static $table = 'events';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'title',
        'slug',
        'description',
        'content',
        'start_date',
        'end_date',
        'category',
        'status',
        'location',
        'banner_image',
        'is_active'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'is_active' => 'boolean'
    ];
    
    // Whether the model uses timestamps
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }
    
    /**
     * Find event by slug (static method)
     */
    public static function findBySlug($slug) {
        return static::where('slug', $slug)->first();
    }
    
    /**
     * Find event by slug (instance method)
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
            throw new Exception('Error fetching event by slug: ' . $e->getMessage());
        }
    }
    
    /**
     * Get active events only
     */
    public function getActiveEvents() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->table} 
                WHERE is_active = 1 
                ORDER BY start_date ASC, title ASC
            ");
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching active events: ' . $e->getMessage());
        }
    }
    
    /**
     * Get upcoming events (future events only)
     */
    public function getUpcomingEvents($limit = null) {
        try {
            $sql = "
                SELECT * FROM {$this->table} 
                WHERE is_active = 1 AND start_date >= NOW() AND status = 'upcoming'
                ORDER BY start_date ASC, title ASC
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
            throw new Exception('Error fetching upcoming events: ' . $e->getMessage());
        }
    }
    
    /**
     * Get events by category
     */
    public function getByCategory($category) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->table} 
                WHERE category = ? AND is_active = 1 
                ORDER BY start_date ASC, title ASC
            ");
            $stmt->execute([$category]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching events by category: ' . $e->getMessage());
        }
    }
    
    /**
     * Get events by status
     */
    public function getByStatus($status) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->table} 
                WHERE status = ? AND is_active = 1 
                ORDER BY start_date ASC, title ASC
            ");
            $stmt->execute([$status]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching events by status: ' . $e->getMessage());
        }
    }
    
    /**
     * Search events by title or description
     */
    public function searchEvents($query, $limit = null) {
        try {
            $searchTerm = "%{$query}%";
            $sql = "
                SELECT * FROM {$this->table} 
                WHERE is_active = 1 
                AND (title LIKE ? OR description LIKE ?)
                ORDER BY start_date ASC, title ASC
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
            throw new Exception('Error searching events: ' . $e->getMessage());
        }
    }
    
    /**
     * Toggle event active status
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
            throw new Exception('Error toggling event status: ' . $e->getMessage());
        }
    }
    
    /**
     * Update event status
     */
    public function updateStatus($id, $status) {
        try {
            $validStatuses = ['upcoming', 'ongoing', 'completed', 'cancelled'];
            if (!in_array($status, $validStatuses)) {
                throw new Exception('Invalid status. Must be one of: ' . implode(', ', $validStatuses));
            }
            
            $stmt = $this->pdo->prepare("
                UPDATE {$this->table} 
                SET status = ?, updated_at = NOW() 
                WHERE id = ?
            ");
            return $stmt->execute([$status, $id]);
        } catch (PDOException $e) {
            throw new Exception('Error updating event status: ' . $e->getMessage());
        }
    }
    
    /**
     * Custom update method that allows null values and is safe from mass assignment
     */
    public function updateEvent($id, $data) {
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
            throw new Exception('Error updating event: ' . $e->getMessage());
        }
    }
}
?> 