<?php
// api/models/GuestCustomerModel.php

require_once __DIR__ . '/../core/BaseModel.php';

class GuestCustomerModel extends BaseModel
{
    protected static $table = 'guest_customers';

    protected static $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'note'
    ];

    protected static $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    protected static $timestamps = true;

    public function __construct($pdo)
    {
        parent::__construct($pdo);
    }
}
