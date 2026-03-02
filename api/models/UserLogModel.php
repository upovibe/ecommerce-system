<?php
// api/models/UserLogModel.php - Model for user_logs table

require_once __DIR__ . '/../core/BaseModel.php';

class UserLogModel extends BaseModel {
    protected static $table = 'user_logs';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'user_id',
        'action',
        'description',
        'metadata',
        'ip_address',
        'user_agent'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'metadata' => 'json',
        'created_at' => 'datetime'
    ];
    
    // Whether the model uses timestamps
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }
    
    /**
     * Log user action
     */
    public static function logAction($userId, $action, $description = null, $metadata = null) {
        global $pdo;
        
        $data = [
            'user_id' => $userId,
            'action' => $action,
            'description' => $description,
            'metadata' => $metadata ? json_encode($metadata) : null,
            'ip_address' => self::getRealIpAddress(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null
        ];
        
        return (new self($pdo))->create($data);
    }
    
    /**
     * Get logs for user
     */
    public function getUserLogs($userId, $limit = 50) {
        $sql = "SELECT * FROM user_logs 
                WHERE user_id = ? 
                ORDER BY created_at DESC 
                LIMIT ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$userId, $limit]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get logs by action
     */
    public function getLogsByAction($action, $limit = 50) {
        $sql = "SELECT ul.*, u.name as user_name 
                FROM user_logs ul 
                LEFT JOIN users u ON ul.user_id = u.id 
                WHERE ul.action = ? 
                ORDER BY ul.created_at DESC 
                LIMIT ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$action, $limit]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Clean old logs (older than 30 days)
     */
    public function cleanOldLogs($days = 30) {
        $sql = "DELETE FROM user_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$days]);
    }
}
?> 