<?php
// api/models/OrderModel.php

require_once __DIR__ . '/../core/BaseModel.php';

class OrderModel extends BaseModel
{
    protected static $table = 'orders';

    protected static $fillable = [
        'user_id',
        'guest_customer_id',
        'total_amount',
        'status',
        'payment_method',
        'order_type',
        'payment_mode',
        'metadata'
    ];

    protected static $casts = [
        'total_amount' => 'float',
        'metadata' => 'json',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    protected static $timestamps = true;

    public function __construct($pdo)
    {
        parent::__construct($pdo);
    }
}
