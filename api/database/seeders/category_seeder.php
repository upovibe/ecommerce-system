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
                'Home & Living',
                'home-living',
                null,
                'Furniture, decor, and essentials to elevate your space.',
                'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80'
            ],
            [
                'Beauty & Personal Care',
                'beauty',
                null,
                'Skincare, makeup, haircare and fragrances.',
                'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80'
            ],
            [
                'Sports & Fitness',
                'sports-fitness',
                null,
                'Gear, apparel, and equipment for active lifestyles.',
                'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80'
            ],
            [
                'Books & Stationery',
                'books-stationery',
                null,
                'Bestsellers, journals, and premium stationery.',
                'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80'
            ],
            [
                'Health & Wellness',
                'health-wellness',
                null,
                'Supplements, self-care, and wellness essentials.',
                'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80'
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
                'Sushi',
                'sushi',
                'fast-food',
                'Fresh rolls, sashimi, and Japanese favorites.',
                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80'
            ],
            [
                'Desserts',
                'desserts',
                'fast-food',
                'Sweet treats, pastries, and indulgent desserts.',
                'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=800&q=80'
            ],
            [
                'Drinks',
                'drinks',
                'fast-food',
                'Refreshing beverages, smoothies, and coffee.',
                'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80'
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
                'Commercial',
                'commercial',
                'real-estate',
                'Offices, retail spaces, and commercial properties.',
                'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80'
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
            [
                'Footwear',
                'footwear',
                'fashion',
                'Sneakers, boots, heels, and everyday footwear.',
                'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80'
            ],
            [
                'Accessories',
                'accessories',
                'fashion',
                'Bags, watches, jewelry, and finishing touches.',
                'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800&q=80'
            ],
            [
                'Phones',
                'phones',
                'electronics',
                'Smartphones and accessories for every lifestyle.',
                'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80'
            ],
            [
                'Laptops',
                'laptops',
                'electronics',
                'High-performance laptops for work and play.',
                'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80'
            ],
            [
                'Audio',
                'audio',
                'electronics',
                'Headphones, speakers, and audio essentials.',
                'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'
            ],
            [
                'Smart Home',
                'smart-home',
                'electronics',
                'Smart lighting, security, and connected devices.',
                'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=800&q=80'
            ],
            [
                'Furniture',
                'furniture',
                'home-living',
                'Sofas, beds, and modern furnishings.',
                'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80'
            ],
            [
                'Kitchen',
                'kitchen',
                'home-living',
                'Cookware, appliances, and kitchen essentials.',
                'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=800&q=80'
            ],
            [
                'Home Decor',
                'home-decor',
                'home-living',
                'Decor accents to personalize your home.',
                'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80'
            ],
            [
                'Bedding',
                'bedding',
                'home-living',
                'Premium bedding and sleep essentials.',
                'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80'
            ],
            [
                'Skincare',
                'skincare',
                'beauty',
                'Cleansers, serums, and moisturizers.',
                'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&q=80'
            ],
            [
                'Makeup',
                'makeup',
                'beauty',
                'Foundations, lipsticks, and palettes.',
                'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80'
            ],
            [
                'Haircare',
                'haircare',
                'beauty',
                'Shampoos, conditioners, and treatments.',
                'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&q=80'
            ],
            [
                'Fragrances',
                'fragrances',
                'beauty',
                'Signature scents and luxury perfumes.',
                'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80'
            ],
            [
                'Activewear',
                'activewear',
                'sports-fitness',
                'Performance apparel for training.',
                'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80'
            ],
            [
                'Equipment',
                'equipment',
                'sports-fitness',
                'Gym and training equipment.',
                'https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?w=800&q=80'
            ],
            [
                'Outdoor',
                'outdoor',
                'sports-fitness',
                'Camping, hiking, and outdoor gear.',
                'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80'
            ],
            [
                'Fiction',
                'fiction',
                'books-stationery',
                'Novels and literary favorites.',
                'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80'
            ],
            [
                'Business',
                'business-books',
                'books-stationery',
                'Leadership and business insights.',
                'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80'
            ],
            [
                "Children's Books",
                'childrens-books',
                'books-stationery',
                'Stories and learning for kids.',
                'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80'
            ],
            [
                'Supplements',
                'supplements',
                'health-wellness',
                'Vitamins, minerals, and wellness supplements.',
                'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80'
            ],
            [
                'Personal Care',
                'personal-care',
                'health-wellness',
                'Everyday health essentials and care.',
                'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80'
            ],
            [
                'Therapy & Recovery',
                'therapy-recovery',
                'health-wellness',
                'Recovery tools and therapy accessories.',
                'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80'
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
