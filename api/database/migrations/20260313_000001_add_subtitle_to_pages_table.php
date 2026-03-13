<?php

class Migration_20260313000001addsubtitletopagestable
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function up()
    {
        $this->pdo->exec("
            ALTER TABLE pages
            ADD COLUMN subtitle VARCHAR(255) NULL AFTER title
        ");
    }

    public function down()
    {
        $this->pdo->exec("
            ALTER TABLE pages
            DROP COLUMN subtitle
        ");
    }
}
