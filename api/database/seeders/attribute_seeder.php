<?php
// api/database/seeders/attribute_seeder.php

class AttributeSeeder
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function run()
    {
        echo "🌱 Seeding product attributes...\n";

        $attributes = [
            [
                'name' => 'Color',
                'label' => 'Product Color',
                'values' => [
                    ['value' => 'Red', 'label' => 'Red'],
                    ['value' => 'Blue', 'label' => 'Blue'],
                    ['value' => 'Green', 'label' => 'Green'],
                    ['value' => 'Black', 'label' => 'Black'],
                    ['value' => 'White', 'label' => 'White'],
                ]
            ],
            [
                'name' => 'Size',
                'label' => 'Product Size',
                'values' => [
                    ['value' => 'Small', 'label' => 'S'],
                    ['value' => 'Medium', 'label' => 'M'],
                    ['value' => 'Large', 'label' => 'L'],
                    ['value' => 'Extra Large', 'label' => 'XL'],
                ]
            ],
            [
                'name' => 'Material',
                'label' => 'Primary Material',
                'values' => [
                    ['value' => 'Cotton', 'label' => 'Cotton'],
                    ['value' => 'Polyester', 'label' => 'Polyester'],
                    ['value' => 'Leather', 'label' => 'Leather'],
                ]
            ],
            [
                'name' => 'Weight',
                'label' => 'Product Weight',
                'values' => [
                    ['value' => 'Light', 'label' => 'Light'],
                    ['value' => 'Medium', 'label' => 'Medium'],
                    ['value' => 'Heavy', 'label' => 'Heavy'],
                ]
            ]
        ];

        foreach ($attributes as $attr) {
            // Check if exists
            $stmt = $this->pdo->prepare("SELECT id FROM product_attributes WHERE name = ?");
            $stmt->execute([$attr['name']]);
            $attrId = $stmt->fetchColumn();

            if (!$attrId) {
                $stmt = $this->pdo->prepare("INSERT INTO product_attributes (name, label) VALUES (?, ?)");
                $stmt->execute([$attr['name'], $attr['label']]);
                $attrId = $this->pdo->lastInsertId();
            }

            foreach ($attr['values'] as $val) {
                $stmt = $this->pdo->prepare("SELECT id FROM product_attribute_values WHERE attribute_id = ? AND value = ?");
                $stmt->execute([$attrId, $val['value']]);
                if (!$stmt->fetch()) {
                    $stmt = $this->pdo->prepare("INSERT INTO product_attribute_values (attribute_id, value, label) VALUES (?, ?, ?)");
                    $stmt->execute([$attrId, $val['value'], $val['label']]);
                }
            }
        }

        echo "✅ Attributes seeded.\n";
    }
}
