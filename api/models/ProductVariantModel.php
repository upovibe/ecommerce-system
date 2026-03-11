<?php
// api/models/ProductVariantModel.php

require_once __DIR__ . '/../core/BaseModel.php';

class ProductVariantModel extends BaseModel
{
    protected static $table = 'product_variants';

    protected static $fillable = [
        'product_id',
        'price_override',
        'stock',
        'variant_values',
        'variant_options',
        'is_active'
    ];

    protected static $casts = [
        'price_override' => 'float',
        'stock' => 'integer',
        'variant_values' => 'json',
        'variant_options' => 'json',
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
