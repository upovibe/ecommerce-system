<?php
class Migration_20260302000003createproductstable {
    private $pdo;
    public function __construct($pdo) { $this->pdo = $pdo; }
    public function up() {
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            category_id INT NOT NULL,
            created_by INT NULL,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            type ENUM('physical', 'digital', 'service') DEFAULT 'physical',
            description TEXT NULL,
            base_price DECIMAL(15, 2) DEFAULT 0.00,
            metadata JSON NULL,
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        )");
    }
    public function down() { $this->pdo->exec("DROP TABLE IF EXISTS products"); }
}
?>
