<?php
// api/models/UserSessionModel.php - Model for user_sessions table

require_once __DIR__ . '/../core/BaseModel.php';

class UserSessionModel extends BaseModel {
    protected static $table = 'user_sessions';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'user_id',
        'token',
        'user_agent',
        'ip_address',
        'expires_at'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'expires_at' => 'datetime',
        'created_at' => 'datetime'
    ];
    
    // Whether the model uses timestamps
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }
    
    /**
     * Find session by token
     */
    public static function findByToken($token) {
        $pdo = static::getPdo();
        $sql = "SELECT * FROM user_sessions WHERE token = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$token]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Find active session by token
     */
    public static function findActiveSession($token) {
        $pdo = static::getPdo();
        $sql = "SELECT * FROM user_sessions 
                WHERE token = ? AND expires_at > NOW()";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$token]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Clean expired sessions
     */
    public function cleanExpiredSessions() {
        $sql = "DELETE FROM user_sessions WHERE expires_at < NOW()";
        return $this->pdo->exec($sql);
    }
    
    /**
     * Revoke all sessions for a user
     */
    public function revokeUserSessions($userId) {
        $sql = "DELETE FROM user_sessions WHERE user_id = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$userId]);
    }
}
?> 