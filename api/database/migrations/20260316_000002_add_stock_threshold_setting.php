<?php

class Migration_20260316000002addstockthresholdsetting
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function up()
    {
        $stmt = $this->pdo->prepare("
            INSERT INTO settings (setting_key, setting_value, setting_type, category, description) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            'low_stock_threshold',
            '5',
            'number',
            'general',
            'Threshold at which a product is considered to have low stock.'
        ]);
    }

    public function down()
    {
        $stmt = $this->pdo->prepare("DELETE FROM settings WHERE setting_key = ?");
        $stmt->execute(['low_stock_threshold']);
    }
}
