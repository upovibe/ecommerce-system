<?php

class Migration_20260302000010createsettingstable {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function up() {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                `key` VARCHAR(100) UNIQUE NOT NULL,
                `value` TEXT NULL,
                `type` VARCHAR(50) DEFAULT 'text',
                `group` VARCHAR(50) DEFAULT 'general',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_key (`key`),
                INDEX idx_group (`group`)
            )
        ");
    }

    public function down() {
        $this->pdo->exec("DROP TABLE IF EXISTS settings");
    }
}
?>
