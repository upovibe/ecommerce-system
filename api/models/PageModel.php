<?php
// api/models/PageModel.php

require_once __DIR__ . '/../core/BaseModel.php';

class PageModel extends BaseModel
{
    protected static $table = 'pages';

    protected static $fillable = [
        'name',
        'title',
        'subtitle',
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

    /**
     * Find page by slug (instance method)
     */
    public function findBySlugInstance($slug)
    {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM {$this->table} WHERE slug = ?");
            $stmt->execute([$slug]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($result) {
                $result = $this->applyCasts($result);
            }
            return $result;
        } catch (PDOException $e) {
            throw new Exception('Error fetching page by slug: ' . $e->getMessage());
        }
    }
}
