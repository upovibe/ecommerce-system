<?php
// api/models/SettingModel.php

require_once __DIR__ . '/../core/BaseModel.php';

class SettingModel extends BaseModel
{
    protected static $table = 'settings';

    protected static $fillable = [
        'setting_key',
        'setting_value',
        'setting_type',
        'category',
        'description',
        'is_active'
    ];

    protected static $casts = [
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
     * Find a setting by its key
     */
    public function findByKey($key)
    {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM " . static::$table . " WHERE setting_key = ? LIMIT 1");
            $stmt->execute([$key]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ? $this->applyCasts($result) : null;
        } catch (PDOException $e) {
            throw new Exception("Error finding setting by key: " . $e->getMessage());
        }
    }

    /**
     * Get settings by category
     */
    public function getByCategory($category)
    {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM " . static::$table . " WHERE category = ?");
            $stmt->execute([$category]);
            return array_map([$this, 'applyCasts'], $stmt->fetchAll(PDO::FETCH_ASSOC));
        } catch (PDOException $e) {
            throw new Exception("Error fetching settings by category: " . $e->getMessage());
        }
    }

    /**
     * Get theme specific settings
     */
    public function getThemeSettings()
    {
        return $this->getByCategory('theme');
    }

    /**
     * Get contact specific settings
     */
    public function getContactSettings()
    {
        return $this->getByCategory('contact');
    }

    /**
     * Get social specific settings
     */
    public function getSocialSettings()
    {
        return $this->getByCategory('social');
    }

    /**
     * Get map specific settings
     */
    public function getMapSettings()
    {
        return $this->getByCategory('location');
    }

    /**
     * Get all settings as a key-value associative array
     */
    public function getAllAsArray()
    {
        try {
            $stmt = $this->pdo->query("SELECT setting_key, setting_value FROM " . static::$table . " WHERE is_active = 1");
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $settings = [];
            foreach ($results as $row) {
                $settings[$row['setting_key']] = $row['setting_value'];
            }
            return $settings;
        } catch (PDOException $e) {
            throw new Exception("Error fetching settings as array: " . $e->getMessage());
        }
    }
}
