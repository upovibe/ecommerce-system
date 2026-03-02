<?php
// api/models/UserModel.php

require_once __DIR__ . '/../core/BaseModel.php';

class UserModel extends BaseModel
{
    protected static $table = 'users';

    protected static $fillable = [
        'role_id',
        'name',
        'email',
        'password',
        'phone',
        'is_guest',
        'status'
    ];

    protected static $hidden = [
        'password'
    ];

    protected static $casts = [
        'is_guest' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    protected static $timestamps = true;

    public function __construct($pdo)
    {
        parent::__construct($pdo);
    }
}
