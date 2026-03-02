<?php
// api/database/seeders/category_seeder.php

class CategorySeeder
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function run()
    {
        echo "🌱 Seeding e-commerce categories...\n";
        $categories = [
            ['Fast Food', 'fast-food', null],
            ['Real Estate', 'real-estate', null],
            ['Automotive', 'automotive', null],
            ['Fashion', 'fashion', null],
            ['Electronics', 'electronics', null],
            ['Burgers', 'burgers', 'fast-food'],
            ['Pizza', 'pizza', 'fast-food'],
            ['Apartments', 'apartments', 'real-estate'],
            ['Houses', 'houses', 'real-estate'],
            ['Men\'s Wear', 'mens-wear', 'fashion'],
            ['Women\'s Wear', 'womens-wear', 'fashion']
        ];

        foreach ($categories as $cat) {
            $parentIdSet = null;
            if ($cat[2]) {
                $stmt = $this->pdo->prepare('SELECT id FROM categories WHERE slug = ?');
                $stmt->execute([$cat[2]]);
                $parent = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($parent) $parentIdSet = $parent['id'];
            }

            $stmt = $this->pdo->prepare('SELECT id FROM categories WHERE slug = ?');
            $stmt->execute([$cat[1]]);
            if ($stmt->fetch()) continue;

            $stmt = $this->pdo->prepare('INSERT INTO categories (name, slug, parent_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())');
            $stmt->execute([$cat[0], $cat[1], $parentIdSet]);
            echo "✅ Seeded category: {$cat[0]}\n";
        }
    }
}
