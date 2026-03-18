<?php
// api/database/seeders/product_seeder.php

class ProductSeeder
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function run()
    {
        echo "🌱 Seeding products...\n";

        // Fetch categories keyed by slug => id
        $categories = $this->pdo->query('SELECT slug, id FROM categories')
            ->fetchAll(PDO::FETCH_KEY_PAIR);

        // Fetch brands keyed by slug => id
        $brands = [];
        foreach ($this->pdo->query('SELECT slug, id FROM brands')->fetchAll(PDO::FETCH_ASSOC) as $b) {
            $brands[$b['slug']] = (int) $b['id'];
        }

        // Fetch materials keyed by slug => id
        $materials = [];
        foreach ($this->pdo->query('SELECT slug, id FROM materials')->fetchAll(PDO::FETCH_ASSOC) as $m) {
            $materials[$m['slug']] = (int) $m['id'];
        }

        // Get admin user ID
        $admin = $this->pdo->query('SELECT id FROM admins LIMIT 1')->fetch(PDO::FETCH_ASSOC);
        $adminId = $admin ? (int) $admin['id'] : null;

        // [name, slug, category_slug, type, description, base_price, main_image, brand_slug, material_slug, status]
                // [name, slug, category_slug, type, description, base_price, main_image, images[], brand_slug, material_slug, status]
        $products = [
            ['Double Beef Smash Burger','double-beef-smash-burger','burgers','physical','Two smashed beef patties, American cheese, caramelized onions and secret house sauce.',2500.00,'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',['https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80','https://images.unsplash.com/photo-1550317138-10000687a72b?w=800&q=80'],'vastbrand','synthetic','active'],
            ['Spicy Chicken Burger','spicy-chicken-burger','burgers','physical','Crispy fried chicken breast with jalapenos, coleslaw and chipotle mayo.',2200.00,'https://images.unsplash.com/photo-1603064752734-4c48eff3d7e2?w=800&q=80',['https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80','https://images.unsplash.com/photo-1550317138-10000687a72b?w=800&q=80'],'vastbrand','synthetic','active'],
            ['Margherita Pizza','margherita-pizza','pizza','physical','Classic Italian pizza with San Marzano tomatoes, mozzarella and fresh basil.',4500.00,'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',['https://images.unsplash.com/photo-1542281286-9e0a16bb7366?w=800&q=80','https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80'],'vastbrand','synthetic','active'],
            ['Pepperoni Feast Pizza','pepperoni-feast-pizza','pizza','physical','Double pepperoni on a rich tomato base with mozzarella and oregano.',5200.00,'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80',['https://images.unsplash.com/photo-1542281286-9e0a16bb7366?w=800&q=80','https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80'],'vastbrand','synthetic','active'],
            ['Salmon Nigiri Set','salmon-nigiri-set','sushi','physical','Fresh salmon nigiri with wasabi and pickled ginger.',6800.00,'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80','https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80'],'vastbrand','synthetic','active'],
            ['Spicy Tuna Roll','spicy-tuna-roll','sushi','physical','Eight-piece spicy tuna roll with sesame and nori.',4200.00,'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80',['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80','https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80'],'vastbrand','synthetic','active'],
            ['Chocolate Lava Cake','chocolate-lava-cake','desserts','physical','Warm chocolate cake with molten center and vanilla scoop.',3200.00,'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=800&q=80',['https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&q=80','https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=800&q=80'],'vastbrand','synthetic','active'],
            ['Strawberry Cheesecake','strawberry-cheesecake','desserts','physical','Creamy cheesecake topped with fresh strawberries.',3400.00,'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&q=80',['https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=800&q=80','https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&q=80'],'vastbrand','synthetic','active'],
            ['Cold Brew Coffee','cold-brew-coffee','drinks','physical','Slow-steeped cold brew with a smooth finish.',1800.00,'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80','https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80'],'vastbrand','synthetic','active'],
            ['Tropical Smoothie','tropical-smoothie','drinks','physical','Mango, pineapple and coconut smoothie.',2000.00,'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80',['https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80','https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80'],'vastbrand','synthetic','active'],
            ['Luxury 3-Bedroom Apartment','luxury-3-bed-apartment','apartments','service','Beautiful 3-bedroom apartment with panoramic city views, gym and concierge.',500000.00,'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80','https://images.unsplash.com/photo-1502005097973-6a7082348e28?w=800&q=80'],'vastbrand',null,'active'],
            ['Studio Apartment Downtown','studio-apartment-downtown','apartments','service','Modern studio in the heart of the city. Fully furnished, utilities included.',95000.00,'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80','https://images.unsplash.com/photo-1502005097973-6a7082348e28?w=800&q=80'],'vastbrand',null,'active'],
            ['Modern 4-Bedroom Suburban House','modern-suburban-house','houses','service','Spacious family home with 4 bedrooms, landscaped garden and double garage.',120000000.00,'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80','https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80'],'vastbrand',null,'active'],
            ['Waterfront Villa Estate','waterfront-villa-estate','houses','service','Luxury villa with private pool, garden, and ocean views.',250000000.00,'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80',['https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80','https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80'],'vastbrand',null,'active'],
            ['Downtown Office Suite','downtown-office-suite','commercial','service','Fully serviced office suite in the business district.',780000.00,'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80','https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80'],'vastbrand',null,'active'],
            ['Retail Storefront Space','retail-storefront-space','commercial','service','High foot-traffic retail storefront ready for lease.',650000.00,'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80',['https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80','https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80'],'vastbrand',null,'active'],
            ['Premium Slim-Fit Chinos','premium-slim-fit-chinos','mens-wear','physical','Stretch cotton chinos with a modern slim fit.',8500.00,'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80',['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80','https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80'],'nordwear','cotton','active'],
            ['Classic Oxford Button-Down Shirt','classic-oxford-shirt','mens-wear','physical','Timeless Oxford weave shirt, perfect for business casual or weekend wear.',7200.00,'https://images.unsplash.com/photo-1602810316498-ab67cf68c8e1?w=800&q=80',['https://images.unsplash.com/photo-1602810316498-ab67cf68c8e1?w=800&q=80','https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80'],'nordwear','cotton','active'],
            ['Designer Floral Midi Dress','designer-floral-midi-dress','womens-wear','physical','Flowing midi dress with a vibrant floral print, perfect for summer occasions.',18500.00,'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80',['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80','https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80'],'nordwear','wool','active'],
            ['Tailored Blazer','tailored-womens-blazer','womens-wear','physical','Sharp, structured blazer in premium wool blend.',22000.00,'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&q=80',['https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&q=80','https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80'],'nordwear','wool','active'],
            ['Leather Court Sneakers','leather-court-sneakers','footwear','physical','Premium leather sneakers with cushioned sole.',14500.00,'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80','https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800&q=80'],'urbanforge','leather','active'],
            ['Chelsea Ankle Boots','chelsea-ankle-boots','footwear','physical','Classic suede Chelsea boots for everyday wear.',19500.00,'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80','https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800&q=80'],'urbanforge','leather','active'],
            ['Leather Tote Bag','leather-tote-bag','accessories','physical','Structured leather tote with inner organizer.',18000.00,'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800&q=80',['https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800&q=80','https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80'],'urbanforge','leather','active'],
            ['Classic Chronograph Watch','classic-chronograph-watch','accessories','physical','Stainless steel chronograph with leather strap.',32000.00,'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800&q=80',['https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800&q=80','https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80'],'urbanforge','metal','active'],
            ['Flagship Smartphone Pro','flagship-smartphone-pro','phones','physical','6.7-inch OLED, 256GB storage, triple camera system.',450000.00,'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80','https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80'],'apextech','synthetic','active'],
            ['Everyday Smartphone Lite','everyday-smartphone-lite','phones','physical','6.1-inch display, 128GB storage, all-day battery.',220000.00,'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80','https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80'],'apextech','synthetic','active'],
            ['Ultrabook 14','ultrabook-14','laptops','physical','Lightweight 14-inch laptop with 16GB RAM and 512GB SSD.',780000.00,'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80','https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80'],'apextech','synthetic','active'],
            ['Gaming Laptop X','gaming-laptop-x','laptops','physical','RTX graphics, 32GB RAM, 1TB SSD for high performance.',1200000.00,'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',['https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80','https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80'],'apextech','synthetic','active'],
            ['Wireless Noise-Cancelling Headphones','wireless-nc-headphones','audio','physical','Premium 40-hour battery, ANC, and Hi-Res audio.',45000.00,'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80','https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80'],'apextech','synthetic','active'],
            ['Portable Bluetooth Speaker','portable-bluetooth-speaker','audio','physical','Compact speaker with deep bass and 12-hour battery.',38000.00,'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80',['https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80','https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],'apextech','synthetic','active'],
            ['Smart Thermostat','smart-thermostat','smart-home','physical','Energy-saving thermostat with app control.',95000.00,'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=800&q=80',['https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=800&q=80','https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80'],'apextech','synthetic','active'],
            ['Smart Lighting Kit','smart-lighting-kit','smart-home','physical','Color-changing LED kit with voice control.',55000.00,'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=800&q=80',['https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=800&q=80','https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80'],'apextech','synthetic','active'],
            ['Modular Sofa Set','modular-sofa-set','furniture','physical','Comfortable sectional sofa with modular pieces.',350000.00,'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80',['https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80','https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&q=80'],'terrahome','synthetic','active'],
            ['Oak Dining Table','oak-dining-table','furniture','physical','Solid oak dining table seats six.',280000.00,'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&q=80',['https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&q=80','https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80'],'terrahome','wood','active'],
            ['Nonstick Cookware Set','nonstick-cookware-set','kitchen','physical','10-piece nonstick cookware set with lids.',90000.00,'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=800&q=80',['https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=800&q=80','https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800&q=80'],'terrahome','metal','active'],
            ['Compact Espresso Machine','compact-espresso-machine','kitchen','physical','15-bar espresso machine with milk frother.',150000.00,'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800&q=80',['https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800&q=80','https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=800&q=80'],'terrahome','metal','active'],
            ['Ceramic Vase Set','ceramic-vase-set','home-decor','physical','Minimal ceramic vases for shelves and tables.',42000.00,'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80',['https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80','https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80'],'terrahome','synthetic','active'],
            ['Abstract Wall Art','abstract-wall-art','home-decor','physical','Large canvas art piece with abstract tones.',60000.00,'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80',['https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80','https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&q=80'],'terrahome','synthetic','active'],
            ['Luxury Cotton Sheet Set','luxury-cotton-sheet-set','bedding','physical','400-thread-count cotton sheets.',65000.00,'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80',['https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80','https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&q=80'],'terrahome','cotton','active'],
            ['Weighted Blanket','weighted-blanket','bedding','physical','15lb weighted blanket for restful sleep.',52000.00,'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&q=80',['https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&q=80','https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80'],'terrahome','synthetic','active'],
            ['Vitamin C Serum','vitamin-c-serum','skincare','physical','Brightening serum with 15% vitamin C.',18000.00,'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&q=80',['https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&q=80','https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80'],'vastbrand','synthetic','active'],
            ['Hydrating Moisturizer','hydrating-moisturizer','skincare','physical','Daily moisturizer with hyaluronic acid.',16000.00,'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80','https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&q=80'],'vastbrand','synthetic','active'],
            ['Matte Lipstick Set','matte-lipstick-set','makeup','physical','Long-wear matte lipstick trio.',14000.00,'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80','https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&q=80'],'vastbrand','synthetic','active'],
            ['Eyeshadow Palette','eyeshadow-palette','makeup','physical','Neutral eyeshadow palette with 12 shades.',15000.00,'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80','https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&q=80'],'vastbrand','synthetic','active'],
            ['Argan Oil Shampoo','argan-oil-shampoo','haircare','physical','Nourishing shampoo for smooth, shiny hair.',12000.00,'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&q=80',['https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&q=80','https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80'],'vastbrand','synthetic','active'],
            ['Heat Protectant Spray','heat-protectant-spray','haircare','physical','Lightweight spray to protect hair from heat.',9000.00,'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&q=80',['https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&q=80','https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80'],'vastbrand','synthetic','active'],
            ['Eau de Parfum','eau-de-parfum','fragrances','physical','Warm amber scent with floral notes.',28000.00,'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80',['https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80','https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80'],'vastbrand','synthetic','active'],
            ['Classic Cologne','classic-cologne','fragrances','physical','Fresh citrus cologne for daily wear.',24000.00,'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80',['https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80','https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&q=80'],'vastbrand','synthetic','active'],
            ['Performance Leggings','performance-leggings','activewear','physical','Sweat-wicking leggings for training.',16000.00,'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',['https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80','https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?w=800&q=80'],'urbanforge','synthetic','active'],
            ['Training Tee','training-tee','activewear','physical','Breathable training tee with stretch.',8000.00,'https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?w=800&q=80',['https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?w=800&q=80','https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80'],'urbanforge','synthetic','active'],
            ['Adjustable Dumbbells','adjustable-dumbbells','equipment','physical','Compact adjustable dumbbell set.',98000.00,'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',['https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80','https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?w=800&q=80'],'urbanforge','metal','active'],
            ['Premium Yoga Mat','premium-yoga-mat','equipment','physical','Non-slip yoga mat with extra cushioning.',22000.00,'https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?w=800&q=80',['https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?w=800&q=80','https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80'],'urbanforge','synthetic','active'],
            ['Hiking Backpack 45L','hiking-backpack-45l','outdoor','physical','Weather-resistant backpack with hydration sleeve.',48000.00,'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80',['https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80','https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80'],'urbanforge','synthetic','active'],
            ['4-Person Camping Tent','4-person-camping-tent','outdoor','physical','Quick-setup tent with rain fly.',65000.00,'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80',['https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80','https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80'],'urbanforge','synthetic','active'],
            ['Best-Selling Novel','best-selling-novel','fiction','physical','A page-turning contemporary novel.',12000.00,'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80',['https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80','https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&q=80'],'vastbrand','synthetic','active'],
            ['Classic Literature Set','classic-literature-set','fiction','physical','Curated set of timeless classics.',28000.00,'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&q=80',['https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&q=80','https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80'],'vastbrand','synthetic','active'],
            ['Leadership Playbook','leadership-playbook','business-books','physical','Actionable leadership strategies for teams.',18000.00,'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80',['https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80','https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&q=80'],'vastbrand','synthetic','active'],
            ['Startup Strategy Guide','startup-strategy-guide','business-books','physical','Step-by-step guide to building a startup.',20000.00,'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&q=80',['https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&q=80','https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80'],'vastbrand','synthetic','active'],
            ['Illustrated Storybook Set','illustrated-storybook-set','childrens-books','physical','Colorful storybook set for kids.',15000.00,'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80',['https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80','https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80'],'vastbrand','synthetic','active'],
            ['Learning Workbooks Pack','learning-workbooks-pack','childrens-books','physical','Activity and learning workbook pack.',13000.00,'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80',['https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80','https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80'],'vastbrand','synthetic','active'],
            ['Daily Multivitamin','daily-multivitamin','supplements','physical','Complete multivitamin for daily wellness.',14000.00,'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80',['https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80','https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80'],'vastbrand','synthetic','active'],
            ['Omega-3 Capsules','omega-3-capsules','supplements','physical','High potency omega-3 fish oil capsules.',16000.00,'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80',['https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80','https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80'],'vastbrand','synthetic','active'],
            ['Digital Thermometer','digital-thermometer','personal-care','physical','Fast-reading digital thermometer.',7000.00,'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80',['https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80','https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80'],'vastbrand','synthetic','active'],
            ['First Aid Kit','first-aid-kit','personal-care','physical','Compact first aid kit for home and travel.',12000.00,'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80','https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80'],'vastbrand','synthetic','active'],
            ['Foam Roller','foam-roller','therapy-recovery','physical','High-density foam roller for recovery.',11000.00,'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80',['https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80','https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80'],'urbanforge','synthetic','active'],
            ['Percussion Massage Gun','percussion-massage-gun','therapy-recovery','physical','Deep tissue percussion massage gun.',95000.00,'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',['https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80','https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80'],'urbanforge','synthetic','active'],
            ['High-Performance Engine Oil Filter','engine-oil-filter','automotive','physical','OEM-grade oil filter for high-mileage engines.',3500.00,'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80',['https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'],'vastbrand','synthetic','active'],
            ['Alloy Sport Wheels Set','alloy-sport-wheels-set','automotive','physical','Set of 4 lightweight alloy wheels, 18-inch.',85000.00,'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80','https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80'],'vastbrand','metal','active']
        ];

        $insert = $this->pdo->prepare('
            INSERT INTO products
                (category_id, brand_id, material_id, created_by, updated_by,
                 name, slug, product_code, sku, type, status, description,
                 main_image, images, base_price, is_active, has_variants, has_attributes, created_at, updated_at)
            VALUES
                (?, ?, ?, ?, ?,
                 ?, ?, ?, ?, ?, ?, ?,
                 ?, ?, ?, 1, ?, ?, NOW(), NOW())
        ');

        $skip = $this->pdo->prepare('SELECT id FROM products WHERE slug = ?');
        $typeStmt = $this->pdo->prepare("SELECT id FROM product_variant_types WHERE LOWER(name) = LOWER(?)");

        $attributeSlugs = [
            'luxury-3-bed-apartment',
            'studio-apartment-downtown',
            'modern-suburban-house',
            'waterfront-villa-estate',
            'downtown-office-suite',
            'retail-storefront-space',
            'flagship-smartphone-pro',
            'everyday-smartphone-lite',
            'ultrabook-14',
            'gaming-laptop-x',
            'wireless-nc-headphones',
            'portable-bluetooth-speaker',
            'engine-oil-filter',
            'alloy-sport-wheels-set',
            'modular-sofa-set',
            'oak-dining-table',
            'nonstick-cookware-set',
            'compact-espresso-machine',
            'double-beef-smash-burger',
            'spicy-chicken-burger',
            'margherita-pizza',
            'pepperoni-feast-pizza',
        ];

        foreach ($products as $p) {
            [$name, $slug, $catSlug, $type, $desc, $price, $img, $images, $brandSlug, $matSlug, $status] = $p;

            $catId = $categories[$catSlug] ?? null;
            if (!$catId) {
                echo "⚠️  Category '{$catSlug}' not found — skipping: {$name}\n";
                continue;
            }

            $skip->execute([$slug]);
            if ($skip->fetch()) {
                echo "⏭️  Already exists, skipping: {$name}\n";
                continue;
            }

            $brandId    = $brandSlug   ? ($brands[$brandSlug]     ?? null) : null;
            $materialId = $matSlug     ? ($materials[$matSlug]    ?? null) : null;

            $productCode = 'PROD-' . strtoupper(substr(uniqid(), -6));
            $sku = strtoupper($slug);

            $imagesJson = json_encode($images ?? []);
            $hasVariants = $type !== 'service' ? 1 : 0;
            $hasAttributes = in_array($slug, $attributeSlugs, true) ? 1 : 0;
            $insert->execute([
                $catId,    $brandId,  $materialId, $adminId, $adminId,
                $name,     $slug,     $productCode, $sku,     $type,       $status,  $desc,
                $img,      $imagesJson, $price,
                $hasVariants,
                $hasAttributes,
            ]);

            // Seed default variant when variants are enabled
            if ($hasVariants) {
                $newId = (int) $this->pdo->lastInsertId();
                $typeStmt->execute(['Default']);
                $typeId = $typeStmt->fetchColumn();
                if (!$typeId) {
                    $this->pdo->prepare("INSERT INTO product_variant_types (name) VALUES ('Default')")->execute();
                    $typeId = $this->pdo->lastInsertId();
                }
                $this->pdo->prepare('
                    INSERT INTO product_variants (product_id, variant_type_id, value, quantity, created_at, updated_at)
                    VALUES (?, ?, ?, ?, NOW(), NOW())
                ')->execute([
                    $newId,
                    $typeId,
                    'Default',
                    rand(5, 100),
                ]);
            }

            echo "✅ Seeded: {$name}\n";
        }

        echo "✅ Products seeded.\n";
    }
}
?>


