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

        // [name, slug, parent_slug, description, image_url]
        $categories = [
            [
                'Fast Food',
                'fast-food',
                null,
                'Quick, delicious meals ready when you are.',
                'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80'
            ],
            [
                'Real Estate',
                'real-estate',
                null,
                'Find your perfect home, apartment, or commercial property.',
                'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80'
            ],
            [
                'Automotive',
                'automotive',
                null,
                'Cars, bikes, and everything on wheels.',
                'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80'
            ],
            [
                'Fashion',
                'fashion',
                null,
                'Clothing, accessories, and the latest trends.',
                'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80'
            ],
            [
                'Electronics',
                'electronics',
                null,
                'Gadgets, devices, and cutting-edge technology.',
                'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&q=80'
            ],
            [
                'Burgers',
                'burgers',
                'fast-food',
                'Juicy, handcrafted burgers with fresh toppings.',
                'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80'
            ],
            [
                'Pizza',
                'pizza',
                'fast-food',
                'Stone-baked pizzas with premium ingredients.',
                'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80'
            ],
            [
                'Apartments',
                'apartments',
                'real-estate',
                'Modern apartments in prime locations.',
                'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80'
            ],
            [
                'Houses',
                'houses',
                'real-estate',
                'Family homes and luxury villas for sale or rent.',
                'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80'
            ],
            [
                "Men's Wear",
                'mens-wear',
                'fashion',
                'Smart casuals, formal wear and streetwear for men.',
                'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=800&q=80'
            ],
            [
                "Women's Wear",
                'womens-wear',
                'fashion',
                'Elegant dresses, tops, and accessories for women.',
                'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80'
            ],
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
            if ($stmt->fetch()) {
                // Update image and description if category already exists
                $this->pdo->prepare('UPDATE categories SET description = ?, image = ? WHERE slug = ?')
                    ->execute([$cat[3], $cat[4], $cat[1]]);
                echo "🔄 Updated category: {$cat[0]}\n";
                continue;
            }

            $stmt = $this->pdo->prepare('INSERT INTO categories (name, slug, description, image, parent_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())');
            $stmt->execute([$cat[0], $cat[1], $cat[3], $cat[4], $parentIdSet]);
            echo "✅ Seeded category: {$cat[0]}\n";
        }
    }
}
