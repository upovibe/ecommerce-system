<?php
class Migration_20260302000004createproductvariantstable {
    private $pdo;
    public function __construct($pdo) { $this->pdo = $pdo; }
    public function up() {
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS product_variants (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            sku VARCHAR(100) UNIQUE NULL,
            price_override DECIMAL(15, 2) NULL,
            stock INT DEFAULT 0,
            variant_options JSON NULL,
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )");
    }
    public function down() { $this->pdo->exec("DROP TABLE IF EXISTS product_variants"); }
}
?>
