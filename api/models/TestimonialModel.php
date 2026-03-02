<?php
// api/models/TestimonialModel.php - Model for testimonials table

require_once __DIR__ . '/../core/BaseModel.php';

class TestimonialModel extends BaseModel {
    protected static $table = 'testimonials';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'title',
        'slug',
        'description'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    // Whether the model uses timestamps
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }

    /**
     * Find testimonial by title
     */
    public static function findByTitle($title) {
        return static::where('title', $title)->first();
    }
} 