<?php
// api/models/ProductVariantModel.php

require_once __DIR__ . '/../core/BaseModel.php';

class ProductVariantModel extends BaseModel
{
    protected static $table = 'product_variants';

    protected static $fillable = [
        'product_id',
        'variant_type_id',
        'value',
        'quantity'
    ];

    protected static $casts = [
        'quantity' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    protected static $timestamps = true;

    public function __construct($pdo)
    {
        parent::__construct($pdo);
    }
}
