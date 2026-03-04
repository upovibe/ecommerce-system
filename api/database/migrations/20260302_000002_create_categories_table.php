<?php
class Migration_20260302000002createcategoriestable
{
    private $pdo;
    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }
    public function up()
    {
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            parent_id INT NULL,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            description TEXT NULL,
            image VARCHAR(500) NULL,
            meta_schema JSON NULL,
            is_active BOOLEAN DEFAULT 1,
            sort_order INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
        )");
        // Add columns if they don't exist yet (for existing installs)
        try {
            $this->pdo->exec("ALTER TABLE categories ADD COLUMN description TEXT NULL AFTER slug");
        } catch (Exception $e) {
        }
        try {
            $this->pdo->exec("ALTER TABLE categories ADD COLUMN image VARCHAR(500) NULL AFTER description");
        } catch (Exception $e) {
        }
    }
    public function down()
    {
        $this->pdo->exec("DROP TABLE IF EXISTS categories");
    }
}
