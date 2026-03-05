<?php
// api/models/PageModel.php

require_once __DIR__ . '/../core/BaseModel.php';

class PageModel extends BaseModel
{
    protected static $table = 'pages';

    protected static $fillable = [
        'title',
        'slug',
        'content',
        'meta_info',
        'images',
        'banner_image',
        'is_active'
    ];

    protected static $casts = [
        'meta_info' => 'json',
        'images' => 'json',
        'banner_image' => 'json',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    protected static $timestamps = true;

    public function __construct($pdo)
    {
        parent::__construct($pdo);
    }
}
