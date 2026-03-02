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
        $this->seedCustomerUser();
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
            INSERT INTO admins (role_id, name, email, password, status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        ');

        $stmt->execute([
            $adminRole['id'],
            'Vast Admin',
            'admin@vastcommerce.com',
            password_hash('admin123', PASSWORD_DEFAULT),
            'active'
        ]);

        echo "✅ Seeded admin user into admins table: admin@vastcommerce.com / admin123\n";
    }

    private function seedCustomerUser()
    {
        echo "📝 Seeding customer user into users table...\n";

        $stmt = $this->pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute(['customer@vastcommerce.com']);
        if ($stmt->fetch()) {
            echo "⚠️  Customer user already exists in users table\n";
            return;
        }

        $stmt = $this->pdo->prepare('
            INSERT INTO users (name, email, password, is_guest, status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        ');

        $stmt->execute([
            'John Doe Customer',
            'customer@vastcommerce.com',
            password_hash('customer123', PASSWORD_DEFAULT),
            0,
            'active'
        ]);

        echo "✅ Seeded customer user into users table: customer@vastcommerce.com / customer123\n";
    }
}
