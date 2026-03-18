<?php
class Migration_20260318000002addvariantattributeflagstoproductstable
{
    private $pdo;
    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }
    public function up()
    {
        $stmt = $this->pdo->query("SHOW COLUMNS FROM products LIKE 'has_variants'");
        if (!$stmt->fetch()) {
            $this->pdo->exec("ALTER TABLE products ADD COLUMN has_variants BOOLEAN DEFAULT 1 AFTER is_active");
        }

        $stmt = $this->pdo->query("SHOW COLUMNS FROM products LIKE 'has_attributes'");
        if (!$stmt->fetch()) {
            $this->pdo->exec("ALTER TABLE products ADD COLUMN has_attributes BOOLEAN DEFAULT 1 AFTER has_variants");
        }

        $stmt = $this->pdo->query("SHOW COLUMNS FROM products LIKE 'has_brand'");
        if (!$stmt->fetch()) {
            $this->pdo->exec("ALTER TABLE products ADD COLUMN has_brand BOOLEAN DEFAULT 1 AFTER has_attributes");
        }

        $stmt = $this->pdo->query("SHOW COLUMNS FROM products LIKE 'has_material'");
        if (!$stmt->fetch()) {
            $this->pdo->exec("ALTER TABLE products ADD COLUMN has_material BOOLEAN DEFAULT 1 AFTER has_brand");
        }
    }
    public function down()
    {
        $stmt = $this->pdo->query("SHOW COLUMNS FROM products LIKE 'has_variants'");
        if ($stmt->fetch()) {
            $this->pdo->exec("ALTER TABLE products DROP COLUMN has_variants");
        }

        $stmt = $this->pdo->query("SHOW COLUMNS FROM products LIKE 'has_attributes'");
        if ($stmt->fetch()) {
            $this->pdo->exec("ALTER TABLE products DROP COLUMN has_attributes");
        }

        $stmt = $this->pdo->query("SHOW COLUMNS FROM products LIKE 'has_brand'");
        if ($stmt->fetch()) {
            $this->pdo->exec("ALTER TABLE products DROP COLUMN has_brand");
        }

        $stmt = $this->pdo->query("SHOW COLUMNS FROM products LIKE 'has_material'");
        if ($stmt->fetch()) {
            $this->pdo->exec("ALTER TABLE products DROP COLUMN has_material");
        }
    }
}
?>
