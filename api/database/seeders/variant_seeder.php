<?php
// api/database/seeders/variant_seeder.php

class VariantSeeder
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function run()
    {
        echo "ðŸŒ± Seeding product variants...\n";

        $products = $this->pdo->query('SELECT id, slug FROM products')->fetchAll(PDO::FETCH_ASSOC);
        $productMap = [];
        foreach ($products as $p) {
            $productMap[$p['slug']] = $p['id'];
        }

        $typeStmt = $this->pdo->prepare("SELECT id FROM product_variant_types WHERE LOWER(name) = LOWER(?)");

        $variants = [
            'premium-slim-fit-chinos' => [
                ['Size', 'Small', 50],
                ['Size', 'Medium', 100],
                ['Size', 'Large', 30],
            ],
            'designer-floral-midi-dress' => [
                ['Size', 'Small', 10],
                ['Size', 'Medium', 5],
            ],
        ];

        foreach ($variants as $slug => $rows) {
            $productId = $productMap[$slug] ?? null;
            if (!$productId) continue;

            $this->pdo->prepare('DELETE FROM product_variants WHERE product_id = ?')->execute([$productId]);

            foreach ($rows as $row) {
                [$typeName, $value, $qty] = $row;
                $typeStmt->execute([$typeName]);
                $typeId = $typeStmt->fetchColumn();
                if (!$typeId) {
                    $this->pdo->prepare("INSERT INTO product_variant_types (name) VALUES (?)")->execute([$typeName]);
                    $typeId = $this->pdo->lastInsertId();
                }

                $this->pdo->prepare('
                    INSERT INTO product_variants (product_id, variant_type_id, value, quantity, created_at, updated_at)
                    VALUES (?, ?, ?, ?, NOW(), NOW())
                ')->execute([$productId, $typeId, $value, $qty]);
            }

            echo "âœ… Seeded variants for product: $slug\n";
        }
    }
}
?>
