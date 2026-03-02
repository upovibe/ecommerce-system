<?php
// api/database/seeders/role_seeder.php

class RoleSeeder
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function run()
    {
        echo "🌱 Seeding default roles...\n";
        $roles = [
            ['admin', 'admin', 'System administrator with full access'],
            ['staff', 'staff', 'Staff member with management access'],
            ['customer', 'customer', 'Default role for registered customers']
        ];
        foreach ($roles as $role) {
            $stmt = $this->pdo->prepare('SELECT id FROM roles WHERE slug = ?');
            $stmt->execute([$role[1]]);
            if ($stmt->fetch()) {
                echo "⚠️  Role '{$role[0]}' already exists\n";
                continue;
            }
            $stmt = $this->pdo->prepare('INSERT INTO roles (name, slug, description, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())');
            $stmt->execute([$role[0], $role[1], $role[2]]);
            echo "✅ Seeded role: {$role[0]}\n";
        }
    }
}
