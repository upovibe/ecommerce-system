<?php
// api/database/seeders/settings_seeder.php

class SettingsSeeder
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function run()
    {
        echo "🌱 Seeding global settings...\n";

        $settings = [
            ['site_name', 'VastCommerce', 'text', 'general'],
            ['site_description', 'Your One-Stop Universal Shop', 'text', 'general'],
            ['site_logo', '/src/public/images/logo.png', 'image', 'general'],
            ['currency', 'NGN', 'text', 'localization'],
            ['contact_email', 'info@vastcommerce.com', 'text', 'contact'],
            ['phone_number', '+234 800 VAST', 'text', 'contact'],
            ['social_facebook', 'https://facebook.com/vastcommerce', 'url', 'social'],
            ['social_instagram', 'https://instagram.com/vastcommerce', 'url', 'social'],
            ['social_twitter', 'https://twitter.com/vastcommerce', 'url', 'social']
        ];

        foreach ($settings as $s) {
            $stmt = $this->pdo->prepare('SELECT id FROM settings WHERE `key` = ?');
            $stmt->execute([$s[0]]);
            if ($stmt->fetch()) continue;

            $stmt = $this->pdo->prepare('
                INSERT INTO settings (`key`, `value`, `type`, `group`, created_at, updated_at) 
                VALUES (?, ?, ?, ?, NOW(), NOW())
            ');

            $stmt->execute([$s[0], $s[1], $s[2], $s[3]]);
            echo "✅ Seeded setting: {$s[0]}\n";
        }
    }
}
