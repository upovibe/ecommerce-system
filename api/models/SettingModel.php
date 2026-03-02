<?php
// api/models/SettingModel.php - Model for settings table

require_once __DIR__ . '/../core/BaseModel.php';

class SettingModel extends BaseModel {
    protected static $table = 'settings';
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'setting_key',
        'setting_value',
        'setting_type',
        'category',
        'description',
        'is_active'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'is_active' => 'boolean'
    ];
    
    // Whether the model uses timestamps
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }
    
    /**
     * Find setting by key
     */
    public static function findByKey($key) {
        return static::where('setting_key', $key)->first();
    }
    
    /**
     * Get setting value by key
     */
    public static function getValue($key, $default = null) {
        $setting = static::findByKey($key);
        return $setting ? $setting['setting_value'] : $default;
    }
    
    /**
     * Set setting value by key
     */
    public static function setValue($key, $value, $type = 'text', $category = 'general') {
        $setting = static::findByKey($key);
        
        if ($setting) {
            // Update existing setting
            $model = new static(static::getPdo());
            return $model->update($setting['id'], [
                'setting_value' => $value,
                'setting_type' => $type,
                'category' => $category
            ]);
        } else {
            // Create new setting
            $model = new static(static::getPdo());
            return $model->create([
                'setting_key' => $key,
                'setting_value' => $value,
                'setting_type' => $type,
                'category' => $category,
                'is_active' => 1
            ]);
        }
    }
    
    /**
     * Get settings by category
     */
    public function getByCategory($category) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM {$this->table} 
                WHERE category = ? AND is_active = 1 
                ORDER BY setting_key ASC
            ");
            $stmt->execute([$category]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception('Error fetching settings by category: ' . $e->getMessage());
        }
    }
    
    /**
     * Get all settings as key-value array
     */
    public function getAllAsArray() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT setting_key, setting_value, setting_type, category 
                FROM {$this->table} 
                WHERE is_active = 1
            ");
            $stmt->execute();
            $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $result = [];
            foreach ($settings as $setting) {
                $result[$setting['setting_key']] = $setting['setting_value'];
            }
            
            return $result;
        } catch (PDOException $e) {
            throw new Exception('Error fetching settings: ' . $e->getMessage());
        }
    }
    
    /**
     * Get theme settings
     */
    public function getThemeSettings() {
        return $this->getByCategory('theme');
    }
    
    /**
     * Get contact settings
     */
    public function getContactSettings() {
        return $this->getByCategory('contact');
    }
    
    /**
     * Get social media settings
     */
    public function getSocialSettings() {
        return $this->getByCategory('social');
    }

    /**
     * Get map settings
     */
    public function getMapSettings() {
        return $this->getByCategory('map');
    }
}
?> 