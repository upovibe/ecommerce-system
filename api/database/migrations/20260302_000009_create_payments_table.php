<?php
class Migration_20260302000009createpaymentstable {
    private $pdo;
    public function __construct($pdo) { $this->pdo = $pdo; }
    public function up() {
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            amount DECIMAL(15, 2) NOT NULL,
            payment_method VARCHAR(50) NOT NULL,
            status VARCHAR(50) DEFAULT 'completed',
            transaction_id VARCHAR(100) NULL,
            metadata JSON NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
        )");
    }
    public function down() { $this->pdo->exec("DROP TABLE IF EXISTS payments"); }
}
?>
