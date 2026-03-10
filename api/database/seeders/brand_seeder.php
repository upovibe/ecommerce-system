<?php
// api/database/seeders/brand_seeder.php

class BrandSeeder
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function run()
    {
        echo "🌱 Seeding brands...\n";

        // [name, slug, description, image_url]
        $brands = [
            ['VastBrand', 'vastbrand', 'Signature in-house brand for flagship products.', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80'],
            ['NordWear', 'nordwear', 'Minimal apparel and essentials designed for daily comfort.', 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80'],
            ['ApexTech', 'apextech', 'Modern electronics built for performance and reliability.', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80'],
            ['TerraHome', 'terrahome', 'Home and living goods with a natural touch.', 'https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?w=800&q=80'],
            ['UrbanForge', 'urbanforge', 'Urban lifestyle brand for active city living.', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80'],
        ];

        foreach ($brands as $b) {
            $stmt = $this->pdo->prepare('SELECT id FROM brands WHERE slug = ?');
            $stmt->execute([$b[1]]);
            if ($stmt->fetch()) {
                $this->pdo->prepare('UPDATE brands SET description = ?, image = ? WHERE slug = ?')
                    ->execute([$b[2], $b[3], $b[1]]);
                echo "🔄 Updated brand: {$b[0]}\n";
                continue;
            }

            $stmt = $this->pdo->prepare('
                INSERT INTO brands (name, slug, description, image, created_at, updated_at)
                VALUES (?, ?, ?, ?, NOW(), NOW())
            ');
            $stmt->execute([$b[0], $b[1], $b[2], $b[3]]);
            echo "✅ Seeded brand: {$b[0]}\n";
        }
    }
}

