<?php
class Migration_20260303000000addprofileimagetousersadmins
{
    private $pdo;
    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }
    public function up()
    {
        // Add profile_image to users table if not exists
        $stmt = $this->pdo->query("SHOW COLUMNS FROM users LIKE 'profile_image'");
        if (!$stmt->fetch()) {
            $this->pdo->exec("ALTER TABLE users ADD COLUMN profile_image VARCHAR(255) DEFAULT NULL AFTER email");
        }

        // Add profile_image to admins table if not exists
        $stmt = $this->pdo->query("SHOW COLUMNS FROM admins LIKE 'profile_image'");
        if (!$stmt->fetch()) {
            $this->pdo->exec("ALTER TABLE admins ADD COLUMN profile_image VARCHAR(255) DEFAULT NULL AFTER password");
        }
    }
    public function down()
    {
        // Remove profile_image from users table
        $stmt = $this->pdo->query("SHOW COLUMNS FROM users LIKE 'profile_image'");
        if ($stmt->fetch()) {
            $this->pdo->exec("ALTER TABLE users DROP COLUMN profile_image");
        }

        // Remove profile_image from admins table
        $stmt = $this->pdo->query("SHOW COLUMNS FROM admins LIKE 'profile_image'");
        if ($stmt->fetch()) {
            $this->pdo->exec("ALTER TABLE admins DROP COLUMN profile_image");
        }
    }
}
