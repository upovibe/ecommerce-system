<?php
// api/database/seeders/product_attribute_seeder.php

class ProductAttributeSeeder
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function run()
    {
        echo "Seeding product attributes...\n";

        $types = [
            'Property Size',
            'Bedrooms',
            'Bathrooms',
            'Location',
            'Lease Term',
            'Storage',
            'Warranty',
            'Battery Life',
            'Engine Type',
            'Mileage',
            'Dimensions',
            'Material',
            'Fitment',
            'Calories',
            'Spice Level',
        ];

        foreach ($types as $name) {
            $stmt = $this->pdo->prepare("SELECT id FROM product_attribute_types WHERE LOWER(name) = LOWER(?)");
            $stmt->execute([$name]);
            if (!$stmt->fetchColumn()) {
                $this->pdo->prepare("INSERT INTO product_attribute_types (name) VALUES (?)")->execute([$name]);
            }
        }

        $products = $this->pdo->query('SELECT id, slug FROM products')->fetchAll(PDO::FETCH_ASSOC);
        $productMap = [];
        foreach ($products as $p) {
            $productMap[$p['slug']] = (int)$p['id'];
        }

        $typeStmt = $this->pdo->prepare("SELECT id FROM product_attribute_types WHERE LOWER(name) = LOWER(?)");
        $insert = $this->pdo->prepare("
            INSERT INTO product_attributes (product_id, attribute_type_id, value, created_at, updated_at)
            VALUES (?, ?, ?, NOW(), NOW())
        ");

        $attributes = [
            'luxury-3-bed-apartment' => [
                ['Property Size', '1800 sqft'],
                ['Bedrooms', '3'],
                ['Bathrooms', '2'],
                ['Location', 'Downtown skyline'],
                ['Lease Term', '12 months'],
            ],
            'studio-apartment-downtown' => [
                ['Property Size', '650 sqft'],
                ['Bedrooms', 'Studio'],
                ['Bathrooms', '1'],
                ['Location', 'City center'],
                ['Lease Term', '6-12 months'],
            ],
            'modern-suburban-house' => [
                ['Property Size', '3200 sqft'],
                ['Bedrooms', '4'],
                ['Bathrooms', '3.5'],
                ['Location', 'Suburban estate'],
            ],
            'waterfront-villa-estate' => [
                ['Property Size', '5200 sqft'],
                ['Bedrooms', '5'],
                ['Bathrooms', '4'],
                ['Location', 'Oceanfront'],
            ],
            'downtown-office-suite' => [
                ['Property Size', '1200 sqft'],
                ['Location', 'Business district'],
                ['Lease Term', '24 months'],
            ],
            'retail-storefront-space' => [
                ['Property Size', '900 sqft'],
                ['Location', 'High street retail'],
                ['Lease Term', '12 months'],
            ],
            'flagship-smartphone-pro' => [
                ['Storage', '256GB'],
                ['Warranty', '2 Years'],
                ['Battery Life', 'Up to 26 hours'],
            ],
            'everyday-smartphone-lite' => [
                ['Storage', '128GB'],
                ['Warranty', '1 Year'],
                ['Battery Life', 'Up to 20 hours'],
            ],
            'ultrabook-14' => [
                ['Storage', '512GB SSD'],
                ['Warranty', '1 Year'],
                ['Battery Life', 'Up to 12 hours'],
            ],
            'gaming-laptop-x' => [
                ['Storage', '1TB SSD'],
                ['Warranty', '2 Years'],
                ['Battery Life', 'Up to 6 hours'],
            ],
            'wireless-nc-headphones' => [
                ['Battery Life', 'Up to 40 hours'],
                ['Warranty', '1 Year'],
            ],
            'portable-bluetooth-speaker' => [
                ['Battery Life', 'Up to 12 hours'],
                ['Warranty', '1 Year'],
            ],
            'engine-oil-filter' => [
                ['Fitment', 'Sedans & SUVs'],
                ['Warranty', '6 Months'],
            ],
            'alloy-sport-wheels-set' => [
                ['Fitment', '18-inch universal'],
                ['Material', 'Alloy'],
            ],
            'modular-sofa-set' => [
                ['Dimensions', '310 x 210 cm'],
                ['Material', 'Performance fabric'],
            ],
            'oak-dining-table' => [
                ['Dimensions', '200 x 90 cm'],
                ['Material', 'Solid oak'],
            ],
            'nonstick-cookware-set' => [
                ['Material', 'Aluminum'],
                ['Warranty', '1 Year'],
            ],
            'compact-espresso-machine' => [
                ['Warranty', '1 Year'],
            ],
            'double-beef-smash-burger' => [
                ['Calories', '850 kcal'],
                ['Spice Level', 'Mild'],
            ],
            'spicy-chicken-burger' => [
                ['Calories', '760 kcal'],
                ['Spice Level', 'Hot'],
            ],
            'margherita-pizza' => [
                ['Calories', '910 kcal'],
            ],
            'pepperoni-feast-pizza' => [
                ['Calories', '1100 kcal'],
            ],
        ];

        foreach ($attributes as $slug => $rows) {
            $productId = $productMap[$slug] ?? null;
            if (!$productId) continue;
            $this->pdo->prepare('DELETE FROM product_attributes WHERE product_id = ?')->execute([$productId]);
            $this->pdo->prepare('UPDATE products SET has_attributes = 1 WHERE id = ?')->execute([$productId]);

            foreach ($rows as $row) {
                [$typeName, $value] = $row;
                $typeStmt->execute([$typeName]);
                $typeId = $typeStmt->fetchColumn();
                if (!$typeId) continue;
                $insert->execute([$productId, $typeId, $value]);
            }
        }

        echo "Product attributes seeded.\n";
    }
}
?>
