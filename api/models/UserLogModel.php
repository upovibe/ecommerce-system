<?php
// api/models/UserLogModel.php
require_once __DIR__ . '/../core/BaseModel.php';
class UserLogModel extends BaseModel
{
    protected static $table = 'user_logs';
    protected static $fillable = ['user_id', 'action', 'description', 'metadata', 'ip_address', 'user_agent'];
    protected static $timestamps = true;

    public function logAction($userId, $action, $description = null, $metadata = null)
    {
        return $this->create([
            'user_id' => $userId,
            'action' => $action,
            'description' => $description,
            'metadata' => $metadata ? json_encode($metadata) : null,
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);
    }
}
