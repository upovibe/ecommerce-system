<?php
// api/models/CartModel.php

require_once __DIR__ . '/../core/BaseModel.php';

class CartModel extends BaseModel
{
    protected static $table = 'carts';

    protected static $fillable = [
        'user_id',
        'status',
    ];

    protected static $casts = [
        'user_id'   => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected static $timestamps = true;

    public function __construct($pdo)
    {
        parent::__construct($pdo);
    }

    public function findActiveByUser($userId)
    {
        $stmt = $this->pdo->prepare("SELECT * FROM " . static::$table . " WHERE user_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1");
        $stmt->execute([$userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>
