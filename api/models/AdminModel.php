<?php
// api/models/AdminModel.php

require_once __DIR__ . '/../core/BaseModel.php';

class AdminModel extends BaseModel
{
    protected static $table = 'admins';

    protected static $fillable = [
        'role_id',
        'name',
        'email',
        'password',
        'phone',
        'gender',
        'date_of_birth',
        'address',
        'status',
        'profile_image'
    ];

    protected static $hidden = [
        'password'
    ];

    protected static $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    protected static $timestamps = true;

    public function __construct($pdo)
    {
        parent::__construct($pdo);
    }

    public function findByEmail($email)
    {
        $stmt = $this->pdo->prepare("SELECT * FROM " . static::$table . " WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function findByEmailExcept($email, $id)
    {
        $stmt = $this->pdo->prepare("SELECT * FROM " . static::$table . " WHERE email = ? AND id != ? LIMIT 1");
        $stmt->execute([$email, $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
