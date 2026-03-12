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

        // Fetch attributes for lookups
        $colorAttr = $this->pdo->query("SELECT id FROM product_attributes WHERE name = 'Color'")->fetchColumn();
        $sizeAttr = $this->pdo->query("SELECT id FROM product_attributes WHERE name = 'Size'")->fetchColumn();

        // Variants for Fashion items
        // [Label, AttrID, AttrValue, PriceDelta, Stock]
        $fashionVariants = [
            'premium-slim-fit-chinos' => [
                ['Small/Navy',  $sizeAttr, 'Small', 0, 50],
                ['Medium/Navy', $sizeAttr, 'Medium', 0, 100],
                ['Large/Navy',  $sizeAttr, 'Large', 500, 30]
            ],
            'designer-floral-midi-dress' => [
                ['Small/Red',  $sizeAttr, 'Small', 0, 10],
                ['Medium/Red', $sizeAttr, 'Medium', 2000, 5]
            ]
        ];

        foreach ($fashionVariants as $slug => $variants) {
            $product = $productMap[$slug] ?? null;
            if (!$product) continue;

            // Clear existing variants for these products first (to avoid duplicates if re-running)
            $this->pdo->prepare('DELETE FROM product_variants WHERE product_id = ?')->execute([$product['id']]);

            foreach ($variants as $v) {
                [$label, $attrId, $attrValue, $priceDelta, $stock] = $v;

                $stmt = $this->pdo->prepare('
                    INSERT INTO product_variants (product_id, stock, variant_options, is_active, created_at, updated_at) 
                    VALUES (?, ?, ?, 1, NOW(), NOW())
                ');

                $stmt->execute([
                    $product['id'],
                    $stock,
                    json_encode(['type' => 'Size', 'value' => $attrValue])
                ]);

                $variantId = (int) $this->pdo->lastInsertId();
                if ($variantId && $attrId) {
                    $vStmt = $this->pdo->prepare("SELECT id FROM product_attribute_values WHERE attribute_id = ? AND value = ?");
                    $vStmt->execute([$attrId, $attrValue]);
                    $valueId = $vStmt->fetchColumn();
                    if (!$valueId) {
                        $iStmt = $this->pdo->prepare("INSERT INTO product_attribute_values (attribute_id, value, label) VALUES (?, ?, ?)");
                        $iStmt->execute([$attrId, $attrValue, $attrValue]);
                        $valueId = $this->pdo->lastInsertId();
                    }
                    if ($valueId) {
                        $linkStmt = $this->pdo->prepare("
                            INSERT INTO product_variant_attributes (variant_id, attribute_id, value_id, created_at, updated_at)
                            VALUES (?, ?, ?, NOW(), NOW())
                        ");
                        $linkStmt->execute([$variantId, $attrId, $valueId]);
                    }
                }
            }
            echo "✅ Seeded variants for product: $slug\n";
        }
    }
}
