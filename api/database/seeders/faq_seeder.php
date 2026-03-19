<?php
// api/database/seeders/faq_seeder.php

class FaqSeeder
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function run()
    {
        echo "Seeding FAQs...\n";

        $faqs = [
            [
                'question' => 'What payment methods do you accept?',
                'answer' => 'We accept card payments, mobile money, and WhatsApp checkout depending on your store settings.',
                'sort_order' => 1,
            ],
            [
                'question' => 'How long does shipping take?',
                'answer' => 'Standard shipping typically takes 3-5 business days. Express options may be available at checkout.',
                'sort_order' => 2,
            ],
            [
                'question' => 'What is your return policy?',
                'answer' => 'Most items can be returned within 30 days in original condition. See the Returns Policy page for details.',
                'sort_order' => 3,
            ],
            [
                'question' => 'Do you ship internationally?',
                'answer' => 'Yes, we ship to select countries. Delivery times and rates vary by destination.',
                'sort_order' => 4,
            ],
        ];

        foreach ($faqs as $f) {
            $stmt = $this->pdo->prepare('SELECT id FROM faqs WHERE question = ?');
            $stmt->execute([$f['question']]);
            if ($stmt->fetch()) {
                echo "FAQ already exists: {$f['question']}\n";
                continue;
            }

            $stmt = $this->pdo->prepare('
                INSERT INTO faqs (question, answer, is_active, sort_order, created_at, updated_at)
                VALUES (?, ?, 1, ?, NOW(), NOW())
            ');
            $stmt->execute([$f['question'], $f['answer'], $f['sort_order']]);
            echo "Seeded FAQ: {$f['question']}\n";
        }
    }
}
