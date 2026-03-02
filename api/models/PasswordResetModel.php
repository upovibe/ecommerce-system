<?php
// api/models/PasswordResetModel.php
require_once __DIR__ . '/../core/BaseModel.php';
class PasswordResetModel extends BaseModel
{
    protected static $table = 'password_resets';
    protected static $fillable = ['email', 'token', 'expires_at'];
    protected static $timestamps = true;

    public function deleteByEmail($email)
    {
        $stmt = $this->pdo->prepare("DELETE FROM " . static::$table . " WHERE email = ?");
        return $stmt->execute([$email]);
    }

    public function findActiveReset($token)
    {
        $stmt = $this->pdo->prepare("SELECT * FROM " . static::$table . " WHERE token = ? AND expires_at > NOW() LIMIT 1");
        $stmt->execute([$token]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
