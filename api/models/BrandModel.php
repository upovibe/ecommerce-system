<?php
// api/models/BrandModel.php

require_once __DIR__ . '/../core/BaseModel.php';

class BrandModel extends BaseModel
{
    protected static $table = 'brands';

    protected static $fillable = [
        'name',
        'slug',
        'description',
        'image',
        'is_active',
        'sort_order'
    ];

    protected static $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    protected static $timestamps = true;

    public function __construct($pdo)
    {
        parent::__construct($pdo);
    }
}

