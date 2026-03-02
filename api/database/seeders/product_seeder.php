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

        // Get some category IDs
        $stmt = $this->pdo->query('SELECT id, slug FROM categories');
        $categories = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

        // Get admin user ID
        $stmt = $this->pdo->query('SELECT id FROM users WHERE email = "admin@vastcommerce.com"');
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
        $adminId = $admin ? $admin['id'] : null;

        $products = [
            // Fast Food
            ['Double Beef Burger', 'double-beef-burger', 'burgers', 'physical', 'Juicy double beef patty with cheese and secret sauce.', 2500.00],
            ['Margherita Pizza', 'margherita-pizza', 'pizza', 'physical', 'Classic Italian pizza with tomato sauce, mozzarella, and basil.', 4500.00],

            // Real Estate
            ['Luxury 3-Bedroom Apartment', 'luxury-3-bed-apartment', 'apartments', 'service', 'Beautiful 3-bedroom apartment with city views.', 500000.00],
            ['Modern Suburban House', 'modern-suburban-house', 'houses', 'service', 'Specious house with 4 bedrooms and a private garden.', 120000000.00],

            // Fashion
            ['Premium Cotton T-Shirt', 'premium-cotton-t-shirt', 'mens-wear', 'physical', 'High-quality cotton t-shirt available in multiple colors.', 5000.00],
            ['Designer Silk Dress', 'designer-silk-dress', 'womens-wear', 'physical', 'Elegant silk dress for special occasions.', 25000.00],

            // Automotive
            ['Engine Oil Filter', 'engine-oil-filter', 'automotive', 'physical', 'High-performance oil filter for high mileage engines.', 3500.00],

            // Electronics
            ['Wireless Noise-Cancelling Headphones', 'wireless-nc-headphones', 'electronics', 'physical', 'Premium sound quality with active noise cancellation.', 45000.00]
        ];

        foreach ($products as $p) {
            $catId = $categories[$p[2]] ?? null;
            if (!$catId) continue;

            $stmt = $this->pdo->prepare('SELECT id FROM products WHERE slug = ?');
            $stmt->execute([$p[1]]);
            if ($stmt->fetch()) continue;

            $stmt = $this->pdo->prepare('
                INSERT INTO products (category_id, created_by, name, slug, type, description, base_price, metadata, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ');

            $stmt->execute([
                $catId,
                $adminId,
                $p[0],
                $p[1],
                $p[3],
                $p[4],
                $p[5],
                json_encode(['brand' => 'VastBrand', 'warranty' => '1 Year'])
            ]);
            echo "✅ Seeded product: {$p[0]}\n";
        }
    }
}
