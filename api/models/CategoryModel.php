<?php
// api/models/CategoryModel.php

require_once __DIR__ . '/../core/BaseModel.php';

class CategoryModel extends BaseModel
{
    protected static $table = 'categories';

    protected static $fillable = [
        'parent_id',
        'name',
        'slug',
        'description',
        'image',
        'meta_schema',
        'is_active',
        'sort_order'
    ];

    protected static $casts = [
        'meta_schema' => 'json',
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
