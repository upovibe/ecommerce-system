<?php
// api/models/RoleModel.php

require_once __DIR__ . '/../core/BaseModel.php';

class RoleModel extends BaseModel
{
    protected static $table = 'roles';

    protected static $fillable = [
        'name',
        'slug',
        'description',
        'permissions'
    ];

    protected static $casts = [
        'permissions' => 'json',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    protected static $timestamps = true;

    public function __construct($pdo)
    {
        parent::__construct($pdo);
    }
}
