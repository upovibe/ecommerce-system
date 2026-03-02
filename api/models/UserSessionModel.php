<?php
// api/models/UserSessionModel.php
require_once __DIR__ . '/../core/BaseModel.php';
class UserSessionModel extends BaseModel
{
    protected static $table = 'user_sessions';
    protected static $fillable = [
        'user_id',
        'user_type',
        'token',
        'user_agent',
        'ip_address',
        'expires_at'
    ];
    protected static $timestamps = true;

    public function findByToken($token)
    {
        $stmt = $this->pdo->prepare("SELECT * FROM " . static::$table . " WHERE token = ? AND expires_at > NOW() LIMIT 1");
        $stmt->execute([$token]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function findActiveSession($token)
    {
        return $this->findByToken($token);
    }

    public function revokeUserSessions($userId, $userType)
    {
        $stmt = $this->pdo->prepare("DELETE FROM " . static::$table . " WHERE user_id = ? AND user_type = ?");
        return $stmt->execute([$userId, $userType]);
    }
}
