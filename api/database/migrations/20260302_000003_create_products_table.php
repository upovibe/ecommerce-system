<?php
// This migration is superseded by 20260310_000002_create_products_table.php
// which runs after brands and materials tables exist (needed for FK constraints).
// Kept as a no-op to avoid breaking the migration file list.
class Migration_20260302000003createproductstable {
    private $pdo;
    public function __construct($pdo) { $this->pdo = $pdo; }
    public function up()   { /* no-op — see 20260310_000002_create_products_table.php */ }
    public function down() { /* no-op */ }
}
?>
