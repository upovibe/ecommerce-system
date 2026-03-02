<?php
// api/database/seeders/user_seeder.php

class UserSeeder
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function run()
    {
        echo "🌱 Seeding default users...\n";
        $this->seedAdminUser();
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

        $stmt = $this->pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute(['admin@vastcommerce.com']);
        if ($stmt->fetch()) {
            echo "⚠️  Admin user already exists\n";
            return;
        }

        $stmt = $this->pdo->prepare('
            INSERT INTO users (role_id, name, email, password, is_guest, status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        ');

        $stmt->execute([
            $adminRole['id'],
            'Vast Admin',
            'admin@vastcommerce.com',
            password_hash('admin123', PASSWORD_DEFAULT),
            0,
            'active'
        ]);

        echo "✅ Seeded admin user: admin@vastcommerce.com / admin123\n";
    }
}
