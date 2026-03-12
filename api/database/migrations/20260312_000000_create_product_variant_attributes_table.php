<?php
class Migration_20260312000000createproductvariantattributestable {
    private $pdo;
    public function __construct($pdo) { $this->pdo = $pdo; }
    public function up() {
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS product_variant_attributes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            variant_id INT NOT NULL,
            attribute_id INT NOT NULL,
            value_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_variant_attribute (variant_id, attribute_id),
            INDEX idx_variant_attribute_value (variant_id, attribute_id, value_id),
            FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
            FOREIGN KEY (attribute_id) REFERENCES product_attributes(id) ON DELETE CASCADE,
            FOREIGN KEY (value_id) REFERENCES product_attribute_values(id) ON DELETE CASCADE
        )");
    }
    public function down() { $this->pdo->exec("DROP TABLE IF EXISTS product_variant_attributes"); }
}
?>
