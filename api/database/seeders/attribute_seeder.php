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
        echo "ðŸŒ± Seeding variant types...\n";

        $types = ['Default', 'Size', 'Color', 'Weight'];

        foreach ($types as $name) {
            $stmt = $this->pdo->prepare("SELECT id FROM product_variant_types WHERE LOWER(name) = LOWER(?)");
            $stmt->execute([$name]);
            $id = $stmt->fetchColumn();
            if (!$id) {
                $stmt = $this->pdo->prepare("INSERT INTO product_variant_types (name) VALUES (?)");
                $stmt->execute([$name]);
            }
        }

        echo "âœ… Variant types seeded.\n";
    }
}
?>
