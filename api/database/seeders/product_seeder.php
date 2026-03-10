<?php
// api/database/seeders/product_seeder.php

class ProductSeeder
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function run()
    {
        echo "🌱 Seeding e-commerce products...\n";

        // Fetch categories keyed by slug => id
        $stmt = $this->pdo->query('SELECT slug, id FROM categories');
        $categories = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

        // Fetch brands/materials keyed by slug => id (optional)
        $brandStmt = $this->pdo->query('SELECT slug, id, name FROM brands');
        $brandsBySlug = [];
        foreach ($brandStmt->fetchAll(PDO::FETCH_ASSOC) as $b) {
            $brandsBySlug[$b['slug']] = ['id' => (int) $b['id'], 'name' => $b['name']];
        }

        $materialStmt = $this->pdo->query('SELECT slug, id, name FROM materials');
        $materialsBySlug = [];
        foreach ($materialStmt->fetchAll(PDO::FETCH_ASSOC) as $m) {
            $materialsBySlug[$m['slug']] = ['id' => (int) $m['id'], 'name' => $m['name']];
        }

        $defaultBrandSlug = 'vastbrand';
        $defaultMaterialSlug = 'synthetic';

        // Get admin user ID from admins table
        $stmt = $this->pdo->query('SELECT id FROM admins WHERE email = "admin@vastcommerce.com"');
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
        $adminId = $admin ? $admin['id'] : null;

        // [name, slug, category_slug, type, description, base_price, image_url]
        $products = [
            // Fast Food — Burgers
            [
                'Double Beef Smash Burger',
                'double-beef-smash-burger',
                'burgers',
                'physical',
                'Two smashed beef patties, American cheese, caramelized onions and secret house sauce.',
                2500.00,
                'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
            ],
            [
                'Spicy Chicken Burger',
                'spicy-chicken-burger',
                'burgers',
                'physical',
                'Crispy fried chicken breast with jalapeños, coleslaw and chipotle mayo.',
                2200.00,
                'https://images.unsplash.com/photo-1603064752734-4c48eff3d7e2?w=800&q=80',
            ],

            // Fast Food — Pizza
            [
                'Margherita Pizza',
                'margherita-pizza',
                'pizza',
                'physical',
                'Classic Italian pizza with San Marzano tomatoes, mozzarella and fresh basil.',
                4500.00,
                'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
            ],
            [
                'Pepperoni Feast Pizza',
                'pepperoni-feast-pizza',
                'pizza',
                'physical',
                'Double pepperoni on a rich tomato base with mozzarella and oregano.',
                5200.00,
                'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80',
            ],

            // Real Estate — Apartments
            [
                'Luxury 3-Bedroom Apartment',
                'luxury-3-bed-apartment',
                'apartments',
                'service',
                'Beautiful 3-bedroom apartment with panoramic city views, gym and concierge.',
                500000.00,
                'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
            ],
            [
                'Studio Apartment Downtown',
                'studio-apartment-downtown',
                'apartments',
                'service',
                'Modern studio in the heart of the city. Fully furnished, utilities included.',
                95000.00,
                'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
            ],

            // Real Estate — Houses
            [
                'Modern 4-Bedroom Suburban House',
                'modern-suburban-house',
                'houses',
                'service',
                'Spacious family home with 4 bedrooms, landscaped garden and double garage.',
                120000000.00,
                'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
            ],

            // Fashion — Men's Wear
            [
                'Premium Slim-Fit Chinos',
                'premium-slim-fit-chinos',
                'mens-wear',
                'physical',
                'Stretch cotton chinos with a modern slim fit. Available in navy, khaki and olive.',
                8500.00,
                'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80',
            ],
            [
                'Classic Oxford Button-Down Shirt',
                'classic-oxford-shirt',
                'mens-wear',
                'physical',
                'Timeless Oxford weave shirt, perfect for business casual or weekend wear.',
                7200.00,
                'https://images.unsplash.com/photo-1602810316498-ab67cf68c8e1?w=800&q=80',
            ],

            // Fashion — Women's Wear
            [
                'Designer Floral Midi Dress',
                'designer-floral-midi-dress',
                'womens-wear',
                'physical',
                'Flowing midi dress with a vibrant floral print, perfect for summer occasions.',
                18500.00,
                'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80',
            ],
            [
                'Tailored Blazer',
                'tailored-womens-blazer',
                'womens-wear',
                'physical',
                'Sharp, structured blazer in premium wool blend. Office to evening ready.',
                22000.00,
                'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&q=80',
            ],

            // Automotive
            [
                'High-Performance Engine Oil Filter',
                'engine-oil-filter',
                'automotive',
                'physical',
                'OEM-grade oil filter for high-mileage engines. Fits most sedans and SUVs.',
                3500.00,
                'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80',
            ],
            [
                'Alloy Sport Wheels Set',
                'alloy-sport-wheels-set',
                'automotive',
                'physical',
                'Set of 4 lightweight alloy wheels, 18-inch. Universal bolt pattern.',
                85000.00,
                'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
            ],

            // Electronics
            [
                'Wireless Noise-Cancelling Headphones',
                'wireless-nc-headphones',
                'electronics',
                'physical',
                'Premium 40-hour battery, ANC, and Hi-Res audio. Foldable design.',
                45000.00,
                'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
            ],
            [
                '65" 4K OLED Smart TV',
                '65-inch-4k-oled-tv',
                'electronics',
                'physical',
                'Stunning OLED panel with Dolby Vision, HDMI 2.1 and built-in streaming apps.',
                350000.00,
                'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&q=80',
            ],
        ];

        foreach ($products as $p) {
            $catId = $categories[$p[2]] ?? null;
            if (!$catId) {
                echo "⚠️  Category '{$p[2]}' not found, skipping: {$p[0]}\n";
                continue;
            }

            $stmt = $this->pdo->prepare('SELECT id FROM products WHERE slug = ?');
            $stmt->execute([$p[1]]);
            if ($stmt->fetch()) {
                // Update image in metadata for existing products
                $brand = $brandsBySlug[$defaultBrandSlug] ?? null;
                $material = $materialsBySlug[$defaultMaterialSlug] ?? null;
                $stmt2 = $this->pdo->prepare("
                    UPDATE products
                    SET metadata = JSON_SET(
                        COALESCE(metadata, '{}'),
                        '$.image', ?,
                        '$.brand', ?,
                        '$.brand_id', ?,
                        '$.material', ?,
                        '$.material_id', ?,
                        '$.warranty', '1 Year'
                    )
                    WHERE slug = ?
                ");
                $stmt2->execute([
                    $p[6],
                    $brand['name'] ?? 'VastBrand',
                    $brand['id'] ?? null,
                    $material['name'] ?? null,
                    $material['id'] ?? null,
                    $p[1],
                ]);
                echo "🔄 Updated product: {$p[0]}\n";
                continue;
            }

            $stmt = $this->pdo->prepare('
                INSERT INTO products (category_id, created_by, name, slug, type, description, base_price, metadata, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ');

            $brand = $brandsBySlug[$defaultBrandSlug] ?? null;
            $material = $materialsBySlug[$defaultMaterialSlug] ?? null;
            $stmt->execute([
                $catId,
                $adminId,
                $p[0],
                $p[1],
                $p[3],
                $p[4],
                $p[5],
                json_encode([
                    'image'    => $p[6],
                    'brand'    => $brand['name'] ?? 'VastBrand',
                    'brand_id' => $brand['id'] ?? null,
                    'material' => $material['name'] ?? null,
                    'material_id' => $material['id'] ?? null,
                    'warranty' => '1 Year',
                ]),
            ]);
            echo "✅ Seeded product: {$p[0]}\n";
        }
    }
}
