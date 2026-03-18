<?php
class Migration_20260318000005createpickupcontactstable {
    private $pdo;
    public function __construct($pdo) { $this->pdo = $pdo; }
    public function up() {
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS pickup_contacts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            name VARCHAR(120) NOT NULL,
            phone VARCHAR(50) NOT NULL,
            note TEXT DEFAULT NULL,
            is_default BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )");
    }
    public function down() { $this->pdo->exec("DROP TABLE IF EXISTS pickup_contacts"); }
}
?>
