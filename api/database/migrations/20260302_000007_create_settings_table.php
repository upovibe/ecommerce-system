<?php

class Migration_20260302000007createsettingstable
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function up()
    {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                setting_key VARCHAR(255) UNIQUE NOT NULL,
                setting_value TEXT,
                setting_type ENUM('text', 'number', 'boolean', 'color', 'file', 'textarea', 'select', 'image', 'array') DEFAULT 'text',
                category VARCHAR(100) DEFAULT 'general',
                description TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_setting_key (setting_key),
                INDEX idx_category (category),
                INDEX idx_active (is_active)
            )
        ");
    }

    public function down()
    {
        $this->pdo->exec("DROP TABLE IF EXISTS settings");
    }
}
