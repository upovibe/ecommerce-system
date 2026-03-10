<?php
// api/database/seeders/material_seeder.php

class MaterialSeeder
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function run()
    {
        echo "🌱 Seeding materials...\n";

        // [name, slug, description, image_url]
        $materials = [
            ['Cotton', 'cotton', 'Soft, breathable cotton for everyday wear.', 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=800&q=80'],
            ['Leather', 'leather', 'Durable premium leather with classic finish.', 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800&q=80'],
            ['Denim', 'denim', 'Classic denim fabric for timeless style.', 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800&q=80'],
            ['Wool', 'wool', 'Warm natural wool for colder seasons.', 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=800&q=80'],
            ['Synthetic', 'synthetic', 'Performance blends for active use.', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80'],
        ];

        foreach ($materials as $m) {
            $stmt = $this->pdo->prepare('SELECT id FROM materials WHERE slug = ?');
            $stmt->execute([$m[1]]);
            if ($stmt->fetch()) {
                $this->pdo->prepare('UPDATE materials SET description = ?, image = ? WHERE slug = ?')
                    ->execute([$m[2], $m[3], $m[1]]);
                echo "🔄 Updated material: {$m[0]}\n";
                continue;
            }

            $stmt = $this->pdo->prepare('
                INSERT INTO materials (name, slug, description, image, created_at, updated_at)
                VALUES (?, ?, ?, ?, NOW(), NOW())
            ');
            $stmt->execute([$m[0], $m[1], $m[2], $m[3]]);
            echo "✅ Seeded material: {$m[0]}\n";
        }
    }
}

