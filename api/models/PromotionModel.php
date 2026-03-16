<?php
// api/models/PromotionModel.php

require_once __DIR__ . '/../core/BaseModel.php';

class PromotionModel extends BaseModel
{
    protected static $table = 'promotions';

    protected static $fillable = [
        'name',
        'description',
        'discount_type',
        'discount_value',
        'start_date',
        'end_date',
        'status',
    ];

    protected static $casts = [
        'discount_value' => 'float',
        'start_date'     => 'datetime',
        'end_date'       => 'datetime',
        'created_at'     => 'datetime',
        'updated_at'     => 'datetime',
    ];

    protected static $timestamps = true;

    public function __construct($pdo)
    {
        parent::__construct($pdo);
    }

    /**
     * Get all active promotions for a specific date
     */
    public function getActivePromotions($date = null)
    {
        if (!$date) $date = date('Y-m-d H:i:s');
        
        $sql = "SELECT * FROM {$this->table} 
                WHERE status = 'active' 
                AND start_date <= ? 
                AND end_date >= ?";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$date, $date]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
