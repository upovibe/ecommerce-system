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
        echo "🌱 Seeding product variants...\n";

        // Get some product IDs
        $stmt = $this->pdo->query('SELECT id, slug, base_price FROM products');
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $productMap = [];
        foreach ($products as $p) {
            $productMap[$p['slug']] = $p;
        }

        // Variants for Fashion items
        $fashionVariants = [
            'premium-cotton-t-shirt' => [
                ['Small/Black', 'TSHIRT-S-B', 0, 50],
                ['Medium/Black', 'TSHIRT-M-B', 0, 100],
                ['Large/White', 'TSHIRT-L-W', 500, 30]
            ],
            'designer-silk-dress' => [
                ['Small/Red', 'DRESS-S-R', 0, 10],
                ['Medium/Blue', 'DRESS-M-B', 2000, 5]
            ]
        ];

        foreach ($fashionVariants as $slug => $variants) {
            $product = $productMap[$slug] ?? null;
            if (!$product) continue;

            foreach ($variants as $v) {
                $stmt = $this->pdo->prepare('SELECT id FROM product_variants WHERE sku = ?');
                $stmt->execute([$v[1]]);
                if ($stmt->fetch()) continue;

                $stmt = $this->pdo->prepare('
                    INSERT INTO product_variants (product_id, sku, price_override, stock, variant_options, created_at, updated_at) 
                    VALUES (?, ?, ?, ?, ?, NOW(), NOW())
                ');

                $stmt->execute([
                    $product['id'],
                    $v[1],
                    $v[2] > 0 ? $product['base_price'] + $v[2] : null,
                    $v[3],
                    json_encode(['label' => $v[0]])
                ]);
            }
            echo "✅ Seeded variants for product: $slug\n";
        }
    }
}
