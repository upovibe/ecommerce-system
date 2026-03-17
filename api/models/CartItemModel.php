<?php
// api/models/CartItemModel.php

require_once __DIR__ . '/../core/BaseModel.php';

class CartItemModel extends BaseModel
{
    protected static $table = 'cart_items';

    protected static $fillable = [
        'cart_id',
        'product_id',
        'variant_id',
        'quantity',
        'unit_price',
        'metadata',
    ];

    protected static $casts = [
        'cart_id'    => 'integer',
        'product_id' => 'integer',
        'variant_id' => 'integer',
        'quantity'   => 'integer',
        'unit_price' => 'float',
        'metadata'   => 'json',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected static $timestamps = true;

    public function __construct($pdo)
    {
        parent::__construct($pdo);
    }
}
?>
