<?php
// api/database/seeders/page_seeder.php

class PageSeeder
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function run()
    {
        echo "Seeding CMS pages...\n";

        $pages = [
            [
                'title' => 'One Store, Infinite Possibilities',
                'subtitle' => 'From real estate to luxury fashion, vehicles to fast food. Our universal architecture powers every industry with premium precision.',
                'name' => 'Home',
                'slug' => 'home',
                'content' => '<h2>Welcome to VastCommerce</h2><p>Discover curated collections, premium brands, and a shopping experience designed to feel effortless from first click to delivery.</p>',
                'banner' => null,
                'images' => [],
                'meta' => [
                    'keywords' => 'home, ecommerce, vastcommerce, storefront, products',
                    'description' => 'VastCommerce landing page showcasing featured collections and the latest arrivals.'
                ],
            ],
            [
                'title' => 'About VastCommerce',
                'subtitle' => 'Built for every industry, crafted for every customer.',
                'name' => 'About Us',
                'slug' => 'about-us',
                'content' => '<h2>Who We Are</h2><p>VastCommerce is a universal e-commerce platform built for businesses of every size. From independent creators to large enterprises, we provide the tools to grow, sell, and succeed online.</p><h3>Our Mission</h3><p>To democratize commerce - making powerful selling tools accessible to everyone, everywhere.</p><h3>Our Values</h3><ul><li><strong>Transparency</strong> - Honest pricing, no hidden fees.</li><li><strong>Reliability</strong> - 99.9% uptime SLA for your peace of mind.</li><li><strong>Customer First</strong> - Every decision starts with our merchants and their customers.</li></ul>',
                'banner' => 'uploads/pages/page_about_us.png',
                'images' => [],
                'meta' => [
                    'keywords' => 'about, ecommerce, vastcommerce, company, mission',
                    'description' => 'Learn about VastCommerce - our story, mission, and the team behind the platform.'
                ],
            ],
            [
                'title' => 'Contact Us',
                'subtitle' => 'We are here to help you every step of the way.',
                'name' => 'Contact',
                'slug' => 'contact',
                'content' => '<h2>Get in Touch</h2><p>We\'d love to hear from you. Whether you have a question about features, pricing, or anything else, our team is ready to help.</p><h3>Support Hours</h3><p>Monday - Friday: 9am - 6pm (GMT)</p><h3>Email</h3><p><a href="mailto:support@vastcommerce.com">support@vastcommerce.com</a></p><h3>Live Chat</h3><p>Available on every page via the chat bubble in the bottom right corner.</p>',
                'banner' => 'uploads/pages/page_contact.png',
                'images' => [],
                'meta' => [
                    'keywords' => 'contact, support, email, help',
                    'description' => 'Contact the VastCommerce team for support, sales, or partnership enquiries.'
                ],
            ],
            [
                'title' => 'Frequently Asked Questions',
                'subtitle' => 'Answers to the questions we hear the most.',
                'name' => 'FAQ',
                'slug' => 'faq',
                'content' => '<h2>Frequently Asked Questions</h2><h3>How do I place an order?</h3><p>Browse our products, add items to your cart, and proceed to checkout. It takes less than 2 minutes.</p><h3>What payment methods do you accept?</h3><p>We accept all major credit/debit cards, PayPal, Apple Pay, Google Pay, and bank transfers.</p><h3>How long does shipping take?</h3><p>Standard shipping takes 3-5 business days. Express shipping is available at checkout for next-day delivery.</p><h3>Can I return an item?</h3><p>Yes! We offer a hassle-free 30-day return policy on most items. See our Returns page for full details.</p><h3>How do I track my order?</h3><p>Once your order ships, you\'ll receive a tracking link via email. You can also check your order status in your account dashboard.</p>',
                'banner' => 'uploads/pages/page_faq.png',
                'images' => [],
                'meta' => [
                    'keywords' => 'faq, questions, help, orders, returns',
                    'description' => 'Find answers to the most commonly asked questions about shopping on VastCommerce.'
                ],
            ],
            [
                'title' => 'Terms & Conditions',
                'subtitle' => 'Clear rules that keep the marketplace safe.',
                'name' => 'Terms & Conditions',
                'slug' => 'terms-conditions',
                'content' => '<h2>Terms & Conditions</h2><p><em>Last updated: March 2026</em></p><h3>1. Acceptance of Terms</h3><p>By accessing or using VastCommerce, you agree to be bound by these terms and all applicable laws and regulations.</p><h3>2. Use of the Platform</h3><p>You may use our platform only for lawful purposes. You agree not to use the platform to transmit any unlawful, harmful, or fraudulent content.</p><h3>3. Intellectual Property</h3><p>All content, trademarks, and data on this platform are the property of VastCommerce or its licensors.</p><h3>4. Limitation of Liability</h3><p>VastCommerce shall not be liable for any indirect, incidental, special, or consequential damages resulting from your use of the platform.</p><h3>5. Changes to Terms</h3><p>We reserve the right to modify these terms at any time. Continued use of the platform constitutes acceptance of the revised terms.</p>',
                'banner' => 'uploads/pages/page_terms.png',
                'images' => [],
                'meta' => [
                    'keywords' => 'terms, conditions, legal, agreement',
                    'description' => 'Read the Terms and Conditions governing your use of the VastCommerce platform.'
                ],
            ],
            [
                'title' => 'Privacy Policy',
                'subtitle' => 'Your data, protected with care and transparency.',
                'name' => 'Privacy Policy',
                'slug' => 'privacy-policy',
                'content' => '<h2>Privacy Policy</h2><p><em>Last updated: March 2026</em></p><h3>What Data We Collect</h3><p>We collect information you provide directly (name, email, address) and automatically (browsing behavior, device info) to power your shopping experience.</p><h3>How We Use Your Data</h3><ul><li>To process and fulfill your orders</li><li>To personalise your experience</li><li>To send transactional and (with consent) marketing emails</li><li>To improve our platform and services</li></ul><h3>Data Sharing</h3><p>We do not sell your personal data. We share it only with trusted service providers (payment processors, couriers) who are bound by strict data agreements.</p><h3>Your Rights</h3><p>You have the right to access, correct, or delete your personal data at any time. Contact us at privacy@vastcommerce.com.</p>',
                'banner' => 'uploads/pages/page_privacy.png',
                'images' => [],
                'meta' => [
                    'keywords' => 'privacy, data, GDPR, policy, security',
                    'description' => 'Our commitment to protecting your personal data and privacy.'
                ],
            ],
            [
                'title' => 'Shipping & Returns',
                'subtitle' => 'Fast delivery options and easy returns.',
                'name' => 'Shipping & Returns',
                'slug' => 'shipping-returns',
                'content' => '<h2>Shipping & Returns</h2><h3>Shipping Options</h3><table><tr><th>Method</th><th>Estimated Time</th><th>Cost</th></tr><tr><td>Standard</td><td>3-5 Business Days</td><td>$4.99 (Free over $50)</td></tr><tr><td>Express</td><td>1-2 Business Days</td><td>$12.99</td></tr><tr><td>Overnight</td><td>Next Business Day</td><td>$24.99</td></tr></table><h3>International Shipping</h3><p>We ship to over 50 countries. Delivery times and rates vary by destination.</p><h3>Returns</h3><p>We accept returns within 30 days of delivery. Items must be unused and in original packaging. Refunds are processed within 5-7 business days of receiving the return.</p><h3>How to Return</h3><ol><li>Log in to your account and go to Order History</li><li>Select the item(s) you wish to return</li><li>Print the prepaid return label</li><li>Drop off at your nearest courier location</li></ol>',
                'banner' => 'uploads/pages/page_shipping.png',
                'images' => [],
                'meta' => [
                    'keywords' => 'shipping, returns, delivery, policy, refund',
                    'description' => 'Information about our shipping options, delivery times, and returns process.'
                ],
            ],
            [
                'title' => 'Refund Policy',
                'subtitle' => 'Fair and transparent refunds for every order.',
                'name' => 'Refund Policy',
                'slug' => 'refund-policy',
                'content' => '<h2>Refund Policy</h2><p>We want you to be completely satisfied with your purchase. If you\'re not, we\'re here to help.</p><h3>Eligibility</h3><ul><li>Refunds must be requested within 30 days of receiving your order</li><li>Items must be returned in original, unused condition</li><li>Digital downloads and customised items are non-refundable</li></ul><h3>Refund Process</h3><p>Once your return is received and inspected, we will notify you of the approval or rejection of your refund. Approved refunds are processed within 5-7 business days to your original payment method.</p><h3>Late or Missing Refunds</h3><p>If you haven\'t received your refund within 10 business days, please contact your bank first. If the issue persists, email us at refunds@vastcommerce.com.</p>',
                'banner' => 'uploads/pages/page_refund.png',
                'images' => [],
                'meta' => [
                    'keywords' => 'refund, money back, return, policy',
                    'description' => 'Our hassle-free refund policy - your satisfaction is guaranteed.'
                ],
            ],
            [
                'title' => 'Cookie Policy',
                'subtitle' => 'Understand how cookies improve your experience.',
                'name' => 'Cookie Policy',
                'slug' => 'cookie-policy',
                'content' => '<h2>Cookie Policy</h2><p>This website uses cookies to enhance your browsing experience and provide personalised services.</p><h3>What Are Cookies?</h3><p>Cookies are small text files stored on your device when you visit a website. They help us recognise you on return visits and understand how you use our site.</p><h3>Types of Cookies We Use</h3><ul><li><strong>Essential Cookies</strong> - Required for the site to function (login sessions, cart contents)</li><li><strong>Analytics Cookies</strong> - Help us understand traffic and usage patterns (e.g. Google Analytics)</li><li><strong>Marketing Cookies</strong> - Used to show relevant ads across the web (opt-in only)</li></ul><h3>Managing Cookies</h3><p>You can control cookies through your browser settings. Disabling cookies may affect some functionality of the site.</p><h3>Your Consent</h3><p>By continuing to use our site, you consent to our use of cookies in accordance with this policy.</p>',
                'banner' => 'uploads/pages/page_cookie.png',
                'images' => [],
                'meta' => [
                    'keywords' => 'cookie, gdpr, tracking, analytics, consent',
                    'description' => 'How we use cookies on VastCommerce and how you can manage your preferences.'
                ],
            ],
        ];

        foreach ($pages as $p) {
            $stmt = $this->pdo->prepare('SELECT id FROM pages WHERE slug = ?');
            $stmt->execute([$p['slug']]);
            if ($stmt->fetch()) {
                echo "Page '{$p['title']}' already exists\n";
                continue;
            }

            $stmt = $this->pdo->prepare('
                INSERT INTO pages (title, subtitle, name, slug, content, banner_image, images, meta_info, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
            ');

            $stmt->execute([
                $p['title'],
                $p['subtitle'] ?? null,
                $p['name'],
                $p['slug'],
                $p['content'],
                $p['banner'] ? json_encode([$p['banner']]) : json_encode([]),
                json_encode($p['images'] ?? []),
                json_encode($p['meta']),
            ]);
            echo "Seeded page: {$p['title']}\n";
        }
    }
}
