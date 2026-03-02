<?php
// api/models/PasswordResetModel.php - Model for password_resets table

require_once __DIR__ . '/../core/BaseModel.php';

class PasswordResetModel extends BaseModel {
    protected static $table = 'password_resets';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'email',
        'token',
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
     * Find reset by token
     */
    public function findByToken($token) {
        return $this->where('token', $token)->first();
    }
    
    /**
     * Find active reset by token
     */
    public function findActiveReset($token) {
        $sql = "SELECT * FROM password_resets 
                WHERE token = ? AND expires_at > NOW()";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$token]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Clean expired resets
     */
    public function cleanExpiredResets() {
        $sql = "DELETE FROM password_resets WHERE expires_at < NOW()";
        return $this->pdo->exec($sql);
    }
    
    /**
     * Delete resets for email
     */
    public function deleteByEmail($email) {
        $sql = "DELETE FROM password_resets WHERE email = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$email]);
    }
}
?> 