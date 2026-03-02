<?php
// api/models/PageModel.php - Model for pages table

require_once __DIR__ . '/../core/BaseModel.php';

class PageModel extends BaseModel {
    protected static $table = 'pages';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'name',
        'title',
        'subtitle',
        'slug',
        'category',
        'content',
        'meta_description',
        'meta_keywords',
        'banner_image',
        'is_active',
        'sort_order'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_active' => 'boolean',
        'banner_image' => 'json'
    ];
    
    // Whether the model uses timestamps
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }
    
    /**
     * Find page by slug (static method)
     */
    public static function findBySlug($slug) {
        return static::where('slug', $slug)->first();
    }
    
    /**
     * Find page by slug (instance method)
     */
    public function findBySlugInstance($slug) {
        try {
            $tableName = $this->getTableName();
            $stmt = $this->pdo->prepare("SELECT * FROM {$tableName} WHERE slug = ?");
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
    
    /**
     * Get active pages only
     */
    public function getActivePages() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->table} 
                WHERE is_active = 1 
                ORDER BY sort_order ASC, title ASC
            ");
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching active pages: ' . $e->getMessage());
        }
    }
    
    /**
     * Get pages by category
     */
    public function getByCategory($category) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->table} 
                WHERE category = ? AND is_active = 1 
                ORDER BY sort_order ASC, title ASC
            ");
            $stmt->execute([$category]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching pages by category: ' . $e->getMessage());
        }
    }
    
    /**
     * Toggle page active status
     */
    public function toggleActive($id) {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE {$this->table} 
                SET is_active = NOT is_active, updated_at = NOW() 
                WHERE id = ?
            ");
            return $stmt->execute([$id]);
        } catch (PDOException $e) {
            throw new Exception('Error toggling page status: ' . $e->getMessage());
        }
    }
}
?> 