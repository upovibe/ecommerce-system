<?php
// api/models/OrderItemModel.php

require_once __DIR__ . '/../core/BaseModel.php';

class OrderItemModel extends BaseModel {
    protected static $table = 'order_items';
    
    protected static $fillable = [
        'order_id',
        'product_id',
        'variant_id',
        'quantity',
        'price_at_purchase',
        'metadata'
    ];
    
    protected static $casts = [
        'quantity' => 'integer',
        'price_at_purchase' => 'float',
        'metadata' => 'json',
        'created_at' => 'datetime'
    ];
    
    protected static $timestamps = false;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }
}
?>
