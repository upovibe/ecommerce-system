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
                ['Color', 'Navy', 40],
                ['Color', 'Khaki', 60],
            ],
            'classic-oxford-shirt' => [
                ['Size', 'Small', 40],
                ['Size', 'Medium', 70],
                ['Size', 'Large', 30],
                ['Color', 'White', 60],
                ['Color', 'Light Blue', 40],
            ],
            'designer-floral-midi-dress' => [
                ['Size', 'Small', 10],
                ['Size', 'Medium', 5],
                ['Size', 'Large', 3],
            ],
            'tailored-womens-blazer' => [
                ['Size', 'Small', 8],
                ['Size', 'Medium', 6],
                ['Size', 'Large', 4],
            ],
            'leather-court-sneakers' => [
                ['Size', '40', 12],
                ['Size', '41', 18],
                ['Size', '42', 16],
                ['Color', 'White', 20],
                ['Color', 'Black', 10],
            ],
            'chelsea-ankle-boots' => [
                ['Size', '39', 8],
                ['Size', '40', 10],
                ['Size', '41', 8],
            ],
            'flagship-smartphone-pro' => [
                ['Storage', '128GB', 10],
                ['Storage', '256GB', 15],
                ['Color', 'Graphite', 12],
                ['Color', 'Silver', 8],
            ],
            'everyday-smartphone-lite' => [
                ['Storage', '64GB', 20],
                ['Storage', '128GB', 14],
                ['Color', 'Midnight', 12],
            ],
            'ultrabook-14' => [
                ['Memory', '16GB RAM', 8],
                ['Memory', '32GB RAM', 4],
                ['Storage', '512GB SSD', 10],
            ],
            'gaming-laptop-x' => [
                ['GPU', 'RTX 4060', 6],
                ['GPU', 'RTX 4070', 4],
                ['Storage', '1TB SSD', 5],
            ],
            'wireless-nc-headphones' => [
                ['Color', 'Black', 20],
                ['Color', 'Sand', 10],
            ],
            'portable-bluetooth-speaker' => [
                ['Color', 'Charcoal', 15],
                ['Color', 'Navy', 10],
            ],
            'modular-sofa-set' => [
                ['Configuration', '3-Seater', 5],
                ['Configuration', 'L-Shape', 3],
                ['Color', 'Charcoal', 3],
                ['Color', 'Sand', 2],
            ],
            'oak-dining-table' => [
                ['Size', '6-Seater', 4],
                ['Size', '8-Seater', 2],
            ],
            'nonstick-cookware-set' => [
                ['Size', '10-Piece', 12],
                ['Size', '12-Piece', 8],
            ],
            'compact-espresso-machine' => [
                ['Color', 'Black', 6],
                ['Color', 'Silver', 4],
            ],
            'luxury-cotton-sheet-set' => [
                ['Size', 'Queen', 12],
                ['Size', 'King', 8],
                ['Color', 'White', 10],
                ['Color', 'Sand', 6],
            ],
            'weighted-blanket' => [
                ['Weight', '15lb', 10],
                ['Weight', '20lb', 6],
            ],
            'vitamin-c-serum' => [
                ['Size', '30ml', 20],
                ['Size', '50ml', 12],
            ],
            'matte-lipstick-set' => [
                ['Shade', 'Nude Trio', 10],
                ['Shade', 'Berry Trio', 8],
            ],
            'performance-leggings' => [
                ['Size', 'Small', 10],
                ['Size', 'Medium', 14],
                ['Size', 'Large', 8],
                ['Color', 'Black', 12],
                ['Color', 'Olive', 6],
            ],
            'adjustable-dumbbells' => [
                ['Weight', '5-25kg', 6],
                ['Weight', '5-40kg', 4],
            ],
            'premium-yoga-mat' => [
                ['Color', 'Slate', 10],
                ['Color', 'Sand', 8],
            ],
            'daily-multivitamin' => [
                ['Pack', '30 Count', 20],
                ['Pack', '90 Count', 12],
            ],
            'omega-3-capsules' => [
                ['Pack', '60 Count', 18],
                ['Pack', '120 Count', 10],
            ],
            'foam-roller' => [
                ['Size', 'Short', 12],
                ['Size', 'Long', 8],
            ],
            'margherita-pizza' => [
                ['Size', 'Small', 20],
                ['Size', 'Medium', 25],
                ['Size', 'Large', 15],
            ],
            'pepperoni-feast-pizza' => [
                ['Size', 'Small', 18],
                ['Size', 'Medium', 20],
                ['Size', 'Large', 12],
            ],
            'cold-brew-coffee' => [
                ['Size', '12oz', 30],
                ['Size', '16oz', 20],
            ],
            'tropical-smoothie' => [
                ['Size', '12oz', 25],
                ['Size', '16oz', 18],
            ],
            'leather-tote-bag' => [
                ['Color', 'Black', 12],
                ['Color', 'Tan', 8],
            ],
            'classic-chronograph-watch' => [
                ['Strap', 'Brown Leather', 6],
                ['Strap', 'Black Leather', 6],
            ],

        ];

        foreach ($variants as $slug => $rows) {
            $productId = $productMap[$slug] ?? null;
            if (!$productId) continue;

            $this->pdo->prepare('DELETE FROM product_variants WHERE product_id = ?')->execute([$productId]);
            $this->pdo->prepare('UPDATE products SET has_variants = 1 WHERE id = ?')->execute([$productId]);

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










