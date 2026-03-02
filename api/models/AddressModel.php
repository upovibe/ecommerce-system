<?php
// api/models/AddressModel.php

require_once __DIR__ . '/../core/BaseModel.php';

class AddressModel extends BaseModel {
    protected static $table = 'addresses';
    
    protected static $fillable = [
        'user_id',
        'type',
        'address_line1',
        'address_line2',
        'city',
        'state',
        'country',
        'postal_code',
        'is_default'
    ];
    
    protected static $casts = [
        'is_default' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }
}
?>
