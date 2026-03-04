<?php
// api/database/seeders/user_seeder.php

class UserSeeder
{
    private $pdo;

    // Unsplash profile photo URLs (stable portrait photos)
    private $adminAvatars = [
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80', // business man
        'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80', // professional woman
    ];

    private $customerAvatars = [
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
        'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&q=80',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
    ];

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function run()
    {
        echo "🌱 Seeding default users...\n";
        $this->seedAdminUser();
        $this->seedCustomerUsers();
    }

    private function seedAdminUser()
    {
        echo "📝 Seeding admin user...\n";

        $stmt = $this->pdo->prepare('SELECT id FROM roles WHERE slug = ?');
        $stmt->execute(['admin']);
        $adminRole = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$adminRole) {
            echo "❌ Admin role not found.\n";
            return;
        }

        $stmt = $this->pdo->prepare('SELECT id FROM admins WHERE email = ?');
        $stmt->execute(['admin@vastcommerce.com']);
        if ($stmt->fetch()) {
            echo "⚠️  Admin user already exists in admins table\n";
            return;
        }

        $stmt = $this->pdo->prepare('
            INSERT INTO admins (role_id, name, email, password, profile_image, status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        ');

        $stmt->execute([
            $adminRole['id'],
            'Vast Admin',
            'admin@vastcommerce.com',
            password_hash('admin123', PASSWORD_DEFAULT),
            $this->adminAvatars[0],
            'active'
        ]);

        echo "✅ Seeded admin user: admin@vastcommerce.com / admin123\n";
    }

    private function seedCustomerUsers()
    {
        echo "📝 Seeding customer users...\n";

        $customers = [
            ['James Carter',    'customer@vastcommerce.com',    'customer123',  $this->customerAvatars[0]],
            ['Sophia Williams', 'sophia@vastcommerce.com',      'sophia123',    $this->customerAvatars[1]],
            ['Marcus Thompson', 'marcus@vastcommerce.com',      'marcus123',    $this->customerAvatars[2]],
            ['Emily Johnson',   'emily@vastcommerce.com',       'emily123',     $this->customerAvatars[3]],
            ['Daniel Brown',    'daniel@vastcommerce.com',      'daniel123',    $this->customerAvatars[4]],
        ];

        foreach ($customers as $c) {
            $stmt = $this->pdo->prepare('SELECT id FROM users WHERE email = ?');
            $stmt->execute([$c[1]]);
            if ($stmt->fetch()) {
                echo "⚠️  User already exists: {$c[1]}\n";
                continue;
            }

            $stmt = $this->pdo->prepare('
                INSERT INTO users (name, email, password, profile_image, is_guest, status, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
            ');
            $stmt->execute([
                $c[0],
                $c[1],
                password_hash($c[2], PASSWORD_DEFAULT),
                $c[3],
                0,
                'active'
            ]);
            echo "✅ Seeded customer: {$c[1]}\n";
        }
    }
}
