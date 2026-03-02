<?php
class Migration_20260302000008createaddressestable {
    private $pdo;
    public function __construct($pdo) { $this->pdo = $pdo; }
    public function up() {
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS addresses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            type ENUM('shipping', 'billing') DEFAULT 'shipping',
            address_line1 VARCHAR(255) NOT NULL,
            address_line2 VARCHAR(255) NULL,
            city VARCHAR(100) NOT NULL,
            state VARCHAR(100) NULL,
            country VARCHAR(100) DEFAULT 'Nigeria',
            postal_code VARCHAR(20) NULL,
            is_default BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )");
    }
    public function down() { $this->pdo->exec("DROP TABLE IF EXISTS addresses"); }
}
?>
