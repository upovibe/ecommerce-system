<?php
// api/models/WishlistItemModel.php

require_once __DIR__ . '/../core/BaseModel.php';

class WishlistItemModel extends BaseModel
{
    protected static $table = 'wishlist_items';

    protected static $fillable = [
        'user_id',
        'product_id',
        'variant_id',
    ];

    protected static $casts = [
        'user_id'   => 'integer',
        'product_id' => 'integer',
        'variant_id' => 'integer',
        'created_at' => 'datetime',
    ];

    protected static $timestamps = false;

    public function __construct($pdo)
    {
        parent::__construct($pdo);
    }
}
?>
