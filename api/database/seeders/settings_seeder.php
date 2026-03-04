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
            ['site_name', 'VastCommerce', 'text', 'general', 'Official storefront name'],
            ['site_description', 'Your One-Stop Universal Shop', 'text', 'general', 'Meta description for SEO'],
            ['site_logo', '/src/assets/logo.png', 'image', 'general', 'Main header logo'],
            ['currency', 'NGN', 'text', 'localization', 'Base currency code'],
            ['contact_email', 'info@vastcommerce.com', 'text', 'contact', 'Primary support email'],
            ['phone_number', '+234 800 VAST', 'text', 'contact', 'Customer service line'],
            ['social_facebook', 'https://facebook.com/vastcommerce', 'text', 'social', 'Official Facebook link'],
            ['site_twitter', 'https://twitter.com/vastcommerce', 'text', 'social', 'Official Twitter link'],
            // Design Tokens (Colors)
            ['primary_color', '#4f46e5', 'color', 'theme', 'Main brand indigo color'],
            ['secondary_color', '#64748b', 'color', 'theme', 'Secondary slate color for neutral elements'],
            ['accent_color', '#f59e0b', 'color', 'theme', 'Accent amber color for highlights'],
            ['background_color', '#f8fafc', 'color', 'theme', 'Default application background'],
            ['card_bg_color', '#ffffff', 'color', 'theme', 'Background for cards and surfaces'],
            ['button_primary_bg', '#4f46e5', 'color', 'theme', 'Background for primary action buttons'],
            ['button_primary_text', '#ffffff', 'color', 'theme', 'Text color for primary action buttons'],
            ['link_color', '#4f46e5', 'color', 'theme', 'Default text link color'],
            ['success_color', '#10b981', 'color', 'theme', 'Success emerald color'],
            ['error_color', '#ef4444', 'color', 'theme', 'Error red color'],
            ['warning_color', '#f59e0b', 'color', 'theme', 'Warning amber color'],
            ['hover_primary', '#4338ca', 'color', 'theme', 'Primary color hover state'],
            ['hover_secondary', '#475569', 'color', 'theme', 'Secondary color hover state'],
            ['hover_accent', '#d97706', 'color', 'theme', 'Accent color hover state'],
            ['text_color', '#1e293b', 'color', 'theme', 'Default text color'],
            ['dark_color', '#0f172a', 'color', 'theme', 'Dark slate color for contrast']
        ];

        foreach ($settings as $s) {
            $stmt = $this->pdo->prepare('SELECT id FROM settings WHERE setting_key = ?');
            $stmt->execute([$s[0]]);
            if ($stmt->fetch()) continue;

            $stmt = $this->pdo->prepare('
                INSERT INTO settings (setting_key, setting_value, setting_type, category, description, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
            ');

            $stmt->execute([$s[0], $s[1], $s[2], $s[3], $s[4]]);
            echo "✅ Seeded setting: {$s[0]}\n";
        }
    }
}
