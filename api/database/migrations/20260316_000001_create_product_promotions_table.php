<?php
class Migration_20260316000001createproductpromotionstable
{
    private $pdo;
    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }
    public function up()
    {
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS product_promotions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            promotion_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE
        )");
    }
    public function down()
    {
        $this->pdo->exec("DROP TABLE IF EXISTS product_promotions");
    }
}
