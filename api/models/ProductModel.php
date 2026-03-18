<?php
// api/models/ProductModel.php

require_once __DIR__ . '/../core/BaseModel.php';

class ProductModel extends BaseModel
{
    protected static $table = 'products';

    protected static $fillable = [
        'category_id',
        'brand_id',
        'material_id',
        'created_by',
        'updated_by',
        'name',
        'slug',
        'product_code',
        'sku',
        'type',
        'status',
        'description',
        'details',
        'main_image',
        'images',
        'base_price',
        'is_active',
        'has_variants',
        'has_attributes',
    ];

    protected static $casts = [
        'base_price'  => 'float',
        'details'     => 'json',
        'images'      => 'json',
        'is_active'   => 'boolean',
        'has_variants' => 'boolean',
        'has_attributes' => 'boolean',
        'brand_id'    => 'integer',
        'material_id' => 'integer',
        'category_id' => 'integer',
        'created_by'  => 'integer',
        'updated_by'  => 'integer',
        'created_at'  => 'datetime',
        'updated_at'  => 'datetime',
    ];

    protected static $timestamps = true;

    public function __construct($pdo)
    {
        parent::__construct($pdo);
    }
}
?>
