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
        echo "🌱 Seeding products...\n";

        // Fetch categories keyed by slug => id
        $categories = $this->pdo->query('SELECT slug, id FROM categories')
            ->fetchAll(PDO::FETCH_KEY_PAIR);

        // Fetch brands keyed by slug => id
        $brands = [];
        foreach ($this->pdo->query('SELECT slug, id FROM brands')->fetchAll(PDO::FETCH_ASSOC) as $b) {
            $brands[$b['slug']] = (int) $b['id'];
        }

        // Fetch materials keyed by slug => id
        $materials = [];
        foreach ($this->pdo->query('SELECT slug, id FROM materials')->fetchAll(PDO::FETCH_ASSOC) as $m) {
            $materials[$m['slug']] = (int) $m['id'];
        }

        // Get admin user ID
        $admin = $this->pdo->query('SELECT id FROM admins LIMIT 1')->fetch(PDO::FETCH_ASSOC);
        $adminId = $admin ? (int) $admin['id'] : null;

        // [name, slug, category_slug, type, description, base_price, main_image, brand_slug, material_slug, status]
        $products = [
            // ── Burgers ───────────────────────────────────────────────────────
            [
                'Double Beef Smash Burger',
                'double-beef-smash-burger',
                'burgers',
                'physical',
                'Two smashed beef patties, American cheese, caramelized onions and secret house sauce.',
                2500.00,
                'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
                'vastbrand',
                'synthetic',
                'active',
            ],
            [
                'Spicy Chicken Burger',
                'spicy-chicken-burger',
                'burgers',
                'physical',
                'Crispy fried chicken breast with jalapeños, coleslaw and chipotle mayo.',
                2200.00,
                'https://images.unsplash.com/photo-1603064752734-4c48eff3d7e2?w=800&q=80',
                'vastbrand',
                'synthetic',
                'active',
            ],

            // ── Pizza ─────────────────────────────────────────────────────────
            [
                'Margherita Pizza',
                'margherita-pizza',
                'pizza',
                'physical',
                'Classic Italian pizza with San Marzano tomatoes, mozzarella and fresh basil.',
                4500.00,
                'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
                'vastbrand',
                'synthetic',
                'active',
            ],
            [
                'Pepperoni Feast Pizza',
                'pepperoni-feast-pizza',
                'pizza',
                'physical',
                'Double pepperoni on a rich tomato base with mozzarella and oregano.',
                5200.00,
                'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80',
                'vastbrand',
                'synthetic',
                'active',
            ],

            // ── Real Estate ───────────────────────────────────────────────────
            [
                'Luxury 3-Bedroom Apartment',
                'luxury-3-bed-apartment',
                'apartments',
                'service',
                'Beautiful 3-bedroom apartment with panoramic city views, gym and concierge.',
                500000.00,
                'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
                'vastbrand',
                null,
                'active',
            ],
            [
                'Studio Apartment Downtown',
                'studio-apartment-downtown',
                'apartments',
                'service',
                'Modern studio in the heart of the city. Fully furnished, utilities included.',
                95000.00,
                'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
                'vastbrand',
                null,
                'active',
            ],
            [
                'Modern 4-Bedroom Suburban House',
                'modern-suburban-house',
                'houses',
                'service',
                'Spacious family home with 4 bedrooms, landscaped garden and double garage.',
                120000000.00,
                'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
                'vastbrand',
                null,
                'active',
            ],

            // ── Fashion — Men's ───────────────────────────────────────────────
            [
                'Premium Slim-Fit Chinos',
                'premium-slim-fit-chinos',
                'mens-wear',
                'physical',
                'Stretch cotton chinos with a modern slim fit. Available in navy, khaki and olive.',
                8500.00,
                'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80',
                'vastbrand',
                'cotton',
                'active',
            ],
            [
                'Classic Oxford Button-Down Shirt',
                'classic-oxford-shirt',
                'mens-wear',
                'physical',
                'Timeless Oxford weave shirt, perfect for business casual or weekend wear.',
                7200.00,
                'https://images.unsplash.com/photo-1602810316498-ab67cf68c8e1?w=800&q=80',
                'vastbrand',
                'cotton',
                'active',
            ],

            // ── Fashion — Women's ─────────────────────────────────────────────
            [
                'Designer Floral Midi Dress',
                'designer-floral-midi-dress',
                'womens-wear',
                'physical',
                'Flowing midi dress with a vibrant floral print, perfect for summer occasions.',
                18500.00,
                'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80',
                'vastbrand',
                'silk',
                'active',
            ],
            [
                'Tailored Blazer',
                'tailored-womens-blazer',
                'womens-wear',
                'physical',
                'Sharp, structured blazer in premium wool blend. Office to evening ready.',
                22000.00,
                'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&q=80',
                'vastbrand',
                'wool',
                'active',
            ],

            // ── Automotive ────────────────────────────────────────────────────
            [
                'High-Performance Engine Oil Filter',
                'engine-oil-filter',
                'automotive',
                'physical',
                'OEM-grade oil filter for high-mileage engines. Fits most sedans and SUVs.',
                3500.00,
                'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80',
                'vastbrand',
                'synthetic',
                'active',
            ],
            [
                'Alloy Sport Wheels Set',
                'alloy-sport-wheels-set',
                'automotive',
                'physical',
                'Set of 4 lightweight alloy wheels, 18-inch. Universal bolt pattern.',
                85000.00,
                'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
                'vastbrand',
                'metal',
                'active',
            ],

            // ── Electronics ───────────────────────────────────────────────────
            [
                'Wireless Noise-Cancelling Headphones',
                'wireless-nc-headphones',
                'electronics',
                'physical',
                'Premium 40-hour battery, ANC, and Hi-Res audio. Foldable design.',
                45000.00,
                'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
                'vastbrand',
                'plastic',
                'active',
            ],
            [
                '65" 4K OLED Smart TV',
                '65-inch-4k-oled-tv',
                'electronics',
                'physical',
                'Stunning OLED panel with Dolby Vision, HDMI 2.1 and built-in streaming apps.',
                350000.00,
                'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&q=80',
                'vastbrand',
                'plastic',
                'active',
            ],
        ];

        $insert = $this->pdo->prepare('
            INSERT INTO products
                (category_id, brand_id, material_id, created_by, updated_by,
                 name, slug, product_code, sku, type, status, description,
                 main_image, images, base_price, is_active, created_at, updated_at)
            VALUES
                (?, ?, ?, ?, ?,
                 ?, ?, ?, ?, ?, ?, ?,
                 ?, NULL, ?, 1, NOW(), NOW())
        ');

        $skip = $this->pdo->prepare('SELECT id FROM products WHERE slug = ?');
        $typeStmt = $this->pdo->prepare("SELECT id FROM product_variant_types WHERE LOWER(name) = LOWER(?)");

        foreach ($products as $p) {
            [$name, $slug, $catSlug, $type, $desc, $price, $img, $brandSlug, $matSlug, $status] = $p;

            $catId = $categories[$catSlug] ?? null;
            if (!$catId) {
                echo "⚠️  Category '{$catSlug}' not found — skipping: {$name}\n";
                continue;
            }

            $skip->execute([$slug]);
            if ($skip->fetch()) {
                echo "⏭️  Already exists, skipping: {$name}\n";
                continue;
            }

            $brandId    = $brandSlug   ? ($brands[$brandSlug]     ?? null) : null;
            $materialId = $matSlug     ? ($materials[$matSlug]    ?? null) : null;

            $productCode = 'PROD-' . strtoupper(substr(uniqid(), -6));
            $sku = strtoupper($slug);

            $insert->execute([
                $catId,    $brandId,  $materialId, $adminId, $adminId,
                $name,     $slug,     $productCode, $sku,     $type,       $status,  $desc,
                $img,      $price,
            ]);

            // Seed default variant
            $newId = (int) $this->pdo->lastInsertId();
            $typeStmt->execute(['Default']);
            $typeId = $typeStmt->fetchColumn();
            if (!$typeId) {
                $this->pdo->prepare("INSERT INTO product_variant_types (name) VALUES ('Default')")->execute();
                $typeId = $this->pdo->lastInsertId();
            }
            $this->pdo->prepare('
                INSERT INTO product_variants (product_id, variant_type_id, value, quantity, created_at, updated_at)
                VALUES (?, ?, ?, ?, NOW(), NOW())
            ')->execute([
                $newId,
                $typeId,
                'Default',
                rand(5, 100),
            ]);

            echo "✅ Seeded: {$name}\n";
        }

        echo "✅ Products seeded.\n";
    }
}
?>
