<?php
class Migration_20260318000004addguestcustomeridtoorderstable {
    private $pdo;
    public function __construct($pdo) { $this->pdo = $pdo; }
    public function up() {
        $this->pdo->exec("ALTER TABLE orders
            ADD COLUMN guest_customer_id INT NULL AFTER user_id,
            ADD CONSTRAINT orders_guest_customer_fk FOREIGN KEY (guest_customer_id) REFERENCES guest_customers(id) ON DELETE SET NULL
        ");
    }
    public function down() {
        $this->pdo->exec("ALTER TABLE orders DROP FOREIGN KEY orders_guest_customer_fk");
        $this->pdo->exec("ALTER TABLE orders DROP COLUMN guest_customer_id");
    }
}
?>
