<?php
// api/models/ProductModel.php

require_once __DIR__ . '/../core/BaseModel.php';

class ProductModel extends BaseModel
{
    protected static $table = 'products';

    protected static $fillable = [
        'category_id',
        'created_by',
        'name',
        'slug',
        'type',
        'description',
        'base_price',
        'metadata',
        'is_active'
    ];

    protected static $casts = [
        'base_price' => 'float',
        'metadata' => 'json',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    protected static $timestamps = true;

    public function __construct($pdo)
    {
        parent::__construct($pdo);
    }
}
