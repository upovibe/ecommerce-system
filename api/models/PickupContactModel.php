<?php
// api/models/PickupContactModel.php

require_once __DIR__ . '/../core/BaseModel.php';

class PickupContactModel extends BaseModel
{
    protected static $table = 'pickup_contacts';

    protected static $fillable = [
        'user_id',
        'name',
        'phone',
        'note',
        'is_default'
    ];

    protected static $casts = [
        'is_default' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    protected static $timestamps = true;

    public function __construct($pdo)
    {
        parent::__construct($pdo);
    }
}
