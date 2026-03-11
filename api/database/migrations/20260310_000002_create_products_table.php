<?php
class Migration_20260310000002createproductstable {
    private $pdo;
    public function __construct($pdo) { $this->pdo = $pdo; }
    public function up() {
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS products (
            id            INT AUTO_INCREMENT PRIMARY KEY,
            category_id   INT NOT NULL,
            brand_id      INT NULL,
            material_id   INT NULL,
            created_by    INT NULL,
            updated_by    INT NULL,

            name          VARCHAR(255) NOT NULL,
            slug          VARCHAR(255) UNIQUE NOT NULL,
            product_code  VARCHAR(100) UNIQUE NULL,
            sku           VARCHAR(100) UNIQUE NULL,
            type          ENUM('physical', 'digital', 'service') DEFAULT 'physical',
            status        ENUM('active', 'draft', 'pending', 'archived') DEFAULT 'draft',

            description   TEXT NULL,
            details       JSON NULL COMMENT 'Optional specs, dimensions, or extra info',

            main_image    VARCHAR(500) NULL,
            images        JSON NULL COMMENT 'Array of additional image paths/URLs',

            base_price    DECIMAL(15, 2) DEFAULT 0.00,
            is_active     BOOLEAN DEFAULT 1,

            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

            FOREIGN KEY (category_id)  REFERENCES categories(id)  ON DELETE RESTRICT,
            FOREIGN KEY (brand_id)     REFERENCES brands(id)      ON DELETE SET NULL,
            FOREIGN KEY (material_id)  REFERENCES materials(id)   ON DELETE SET NULL,
            FOREIGN KEY (created_by)   REFERENCES users(id)       ON DELETE SET NULL,
            FOREIGN KEY (updated_by)   REFERENCES users(id)       ON DELETE SET NULL
        )");
    }
    public function down() { $this->pdo->exec("DROP TABLE IF EXISTS products"); }
}
?>
