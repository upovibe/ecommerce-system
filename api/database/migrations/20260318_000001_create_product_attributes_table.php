<?php
class Migration_20260318000001createproductattributestable {
    private $pdo;
    public function __construct($pdo) { $this->pdo = $pdo; }
    public function up() {
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS product_attributes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            attribute_type_id INT NOT NULL,
            value VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )");
    }
    public function down() { $this->pdo->exec("DROP TABLE IF EXISTS product_attributes"); }
}
?>
