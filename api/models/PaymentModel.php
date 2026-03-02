<?php
// api/models/PaymentModel.php

require_once __DIR__ . '/../core/BaseModel.php';

class PaymentModel extends BaseModel {
    protected static $table = 'payments';
    
    protected static $fillable = [
        'order_id',
        'amount',
        'payment_method',
        'status',
        'transaction_id',
        'metadata'
    ];
    
    protected static $casts = [
        'amount' => 'float',
        'metadata' => 'json',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }
}
?>
