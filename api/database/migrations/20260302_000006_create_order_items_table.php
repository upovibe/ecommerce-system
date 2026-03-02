<?php
class Migration_20260302000006createorderitemstable {
    private $pdo;
    public function __construct($pdo) { $this->pdo = $pdo; }
    public function up() {
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            product_id INT NOT NULL,
            variant_id INT NULL,
            quantity INT DEFAULT 1,
            price_at_purchase DECIMAL(15, 2) NOT NULL,
            metadata JSON NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
            FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
        )");
    }
    public function down() { $this->pdo->exec("DROP TABLE IF EXISTS order_items"); }
}
?>
