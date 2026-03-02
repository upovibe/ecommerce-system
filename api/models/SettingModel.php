<?php
// api/models/SettingModel.php

require_once __DIR__ . '/../core/BaseModel.php';

class SettingModel extends BaseModel
{
    protected static $table = 'settings';

    protected static $fillable = [
        'key',
        'value',
        'type',
        'group'
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
}
