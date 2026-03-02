<?php
// api/database/seeders/page_seeder.php

class PageSeeder
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function run()
    {
        echo "🌱 Seeding CMS pages...\n";

        $pages = [
            ['About VastCommerce', 'about-us', 'We are a universal e-commerce system designed for all categories of business.'],
            ['Privacy Policy', 'privacy-policy', 'Your data is safe with us. We use industry-standard encryption.'],
            ['Shipping & Returns', 'shipping-returns', 'Fast delivery and easy 30-day returns on most products.']
        ];

        foreach ($pages as $p) {
            $stmt = $this->pdo->prepare('SELECT id FROM pages WHERE slug = ?');
            $stmt->execute([$p[1]]);
            if ($stmt->fetch()) continue;

            $stmt = $this->pdo->prepare('
                INSERT INTO pages (title, slug, content, meta_info, is_active, created_at, updated_at) 
                VALUES (?, ?, ?, ?, 1, NOW(), NOW())
            ');

            $stmt->execute([
                $p[0],
                $p[1],
                $p[2],
                json_encode(['keywords' => 'ecommerce, shop, online'])
            ]);
            echo "✅ Seeded page: {$p[0]}\n";
        }
    }
}
