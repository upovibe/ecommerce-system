<?php
class Migration_20260316000000createpromotionstable
{
    private $pdo;
    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }
    public function up()
    {
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS promotions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT NULL,
            discount_type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
            discount_value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
            start_date DATETIME NOT NULL,
            end_date DATETIME NOT NULL,
            status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )");
    }
    public function down()
    {
        $this->pdo->exec("DROP TABLE IF EXISTS promotions");
    }
}
