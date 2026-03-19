<?php
// api/models/FaqModel.php

require_once __DIR__ . '/../core/BaseModel.php';

class FaqModel extends BaseModel
{
    protected static $table = 'faqs';

    protected static $fillable = [
        'question',
        'answer',
        'is_active',
        'sort_order'
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

    public function getActive()
    {
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM {$this->table} WHERE is_active = 1 ORDER BY sort_order ASC, id ASC");
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return array_map([$this, 'applyCasts'], $rows);
        } catch (PDOException $e) {
            throw new Exception('Error fetching active FAQs: ' . $e->getMessage());
        }
    }
}
