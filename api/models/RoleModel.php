<?php
// api/models/RoleModel.php - Model for roles table

require_once __DIR__ . '/../core/BaseModel.php';

class RoleModel extends BaseModel {
    protected static $table = 'roles';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'name',
        'description'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    // Whether the model uses timestamps
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }
    
    /**
     * Find role by name
     */
    public static function findByName($name) {
        return static::where('name', $name)->first();
    }
    
    /**
     * Get role with users count
     */
    public function withUsersCount() {
        $sql = "SELECT r.*, COUNT(u.id) as users_count 
                FROM roles r 
                LEFT JOIN users u ON r.id = u.role_id 
                GROUP BY r.id";
        return $this->pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    }
}
?> 