<?php
class Migration_20260311000000createattributestable {
    private $pdo;
    public function __construct($pdo) { $this->pdo = $pdo; }
    public function up() {
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS product_attributes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            label VARCHAR(100) NULL,
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_product_attributes_name (name)
        )");
    }
    public function down() { $this->pdo->exec("DROP TABLE IF EXISTS product_attributes"); }
}
?>
