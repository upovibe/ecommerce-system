<?php
// api/models/ReviewModel.php

require_once __DIR__ . '/../core/BaseModel.php';

class ReviewModel extends BaseModel {
    protected static $table = 'reviews';
    
    protected static $fillable = [
        'product_id',
        'user_id',
        'rating',
        'comment',
        'is_approved'
    ];
    
    protected static $casts = [
        'rating' => 'integer',
        'is_approved' => 'boolean',
        'created_at' => 'datetime'
    ];
    
    protected static $timestamps = false;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }
}
?>
