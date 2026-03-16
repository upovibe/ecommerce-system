<?php
// api/models/ProductPromotionModel.php

require_once __DIR__ . '/../core/BaseModel.php';

class ProductPromotionModel extends BaseModel
{
    protected static $table = 'product_promotions';

    protected static $fillable = [
        'product_id',
        'promotion_id',
    ];

    protected static $casts = [
        'product_id'   => 'integer',
        'promotion_id' => 'integer',
        'created_at'   => 'datetime',
    ];

    protected static $timestamps = false; // Only created_at is default in migration

    public function __construct($pdo)
    {
        parent::__construct($pdo);
    }

    /**
     * Get products for a specific promotion
     */
    public function getProductsByPromotion($promotionId)
    {
        $sql = "SELECT p.* FROM products p
                JOIN {$this->table} pp ON pp.product_id = p.id
                WHERE pp.promotion_id = ?";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$promotionId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get promotions for a specific product
     */
    public function getPromotionsByProduct($productId)
    {
        $sql = "SELECT pr.* FROM promotions pr
                JOIN {$this->table} pp ON pp.promotion_id = pr.id
                WHERE pp.product_id = ?";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$productId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Delete all associations for a specific promotion
     */
    public function deleteByPromotionId($promotionId)
    {
        $stmt = $this->pdo->prepare("DELETE FROM " . static::$table . " WHERE promotion_id = ?");
        return $stmt->execute([$promotionId]);
    }
}
?>
