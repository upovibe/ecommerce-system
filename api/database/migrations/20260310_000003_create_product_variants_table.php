<?php
class Migration_20260310000003createproductvariantstable {
    private $pdo;
    public function __construct($pdo) { $this->pdo = $pdo; }
    public function up() {
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS product_variants (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            price_override DECIMAL(15, 2) NULL,
            stock INT DEFAULT 0,
            variant_values JSON NULL COMMENT 'Array of attribute_value_ids or key-value pairs',
            variant_options JSON NULL COMMENT 'Legacy/display purposes',
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )");
    }
    public function down() { $this->pdo->exec("DROP TABLE IF EXISTS product_variants"); }
}
?>
