<?php
// api/models/TeamModel.php - Model for teams table

require_once __DIR__ . '/../core/BaseModel.php';

class TeamModel extends BaseModel {
    protected static $table = 'teams';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'name',
        'profile_image',
        'position',
        'department',
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
     * Get active team members only
     */
    public function getActiveTeamMembers() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->getTableName()} 
                WHERE is_active = 1 
                ORDER BY department ASC, name ASC
            ");
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching active team members: ' . $e->getMessage());
        }
    }
    
    /**
     * Get team members by department
     */
    public function getTeamMembersByDepartment($department) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->getTableName()} 
                WHERE department = ? AND is_active = 1
                ORDER BY name ASC
            ");
            $stmt->execute([$department]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching team members by department: ' . $e->getMessage());
        }
    }
    
    /**
     * Get all departments with team member counts
     */
    public function getDepartmentsWithCounts() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT department, COUNT(*) as count 
                FROM {$this->getTableName()} 
                WHERE is_active = 1 
                GROUP BY department 
                ORDER BY department ASC
            ");
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception('Error fetching departments with counts: ' . $e->getMessage());
        }
    }
    
    /**
     * Search team members by name or position
     */
    public function searchTeamMembers($query, $limit = null) {
        try {
            $searchTerm = "%{$query}%";
            $sql = "
                SELECT * FROM {$this->getTableName()} 
                WHERE is_active = 1 
                AND (name LIKE ? OR position LIKE ?)
                ORDER BY department ASC, name ASC
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
            throw new Exception('Error searching team members: ' . $e->getMessage());
        }
    }
    
    /**
     * Toggle team member active status
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
            throw new Exception('Error toggling team member status: ' . $e->getMessage());
        }
    }
    
    /**
     * Custom update method that allows null values and is safe from mass assignment
     */
    public function updateTeamMember($id, $data) {
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
            throw new Exception('Error updating team member: ' . $e->getMessage());
        }
    }
    
    /**
     * Get available departments
     */
    public function getAvailableDepartments() {
        return [
            'District Pastor',
            'Presiding Elder',
            'Senior Pastor',
            'Associate Pastor',
            'Youth Pastor',
            'Worship Pastor'
        ];
    }
}
?> 