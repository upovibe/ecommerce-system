<?php
class Migration_20260311000001createattributevaluestable {
    private $pdo;
    public function __construct($pdo) { $this->pdo = $pdo; }
    public function up() {
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS product_attribute_values (
            id INT AUTO_INCREMENT PRIMARY KEY,
            attribute_id INT NOT NULL,
            value VARCHAR(255) NOT NULL,
            label VARCHAR(255) NULL,
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (attribute_id) REFERENCES product_attributes(id) ON DELETE CASCADE
        )");
    }
    public function down() { $this->pdo->exec("DROP TABLE IF EXISTS product_attribute_values"); }
}
?>
