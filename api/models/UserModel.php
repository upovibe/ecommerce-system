<?php
// api/models/UserModel.php - Model for users table

require_once __DIR__ . '/../core/BaseModel.php';

class UserModel extends BaseModel {
    protected static $table = 'users';
    protected $whereConditions = [];
    
    // Fields that can be mass assigned
    protected static $fillable = [
        'name',
        'email', 
        'password',
        'password_changed',
        'phone',
        'role_id',
        'gender',
        'profile_image',
        'status'
    ];
    
    // Fields that should be hidden from JSON/array output
    protected static $hidden = [
        'password'
    ];
    
    // Fields that should be cast to specific types
    protected static $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'metadata' => 'json'
    ];
    
    // Whether the model uses timestamps
    protected static $timestamps = true;

    public function __construct($pdo) {
        parent::__construct($pdo);
    }
    
    /**
     * Hash password before saving
     */
    public function setPassword($password) {
        $this->password = password_hash($password, PASSWORD_DEFAULT);
    }
    
    /**
     * Verify password
     */
    public function verifyPassword($password) {
        return password_verify($password, $this->attributes['password']);
    }
    
    /**
     * Find user by email
     */
    public static function findByEmail($email) {
        return static::where('email', $email)->first();
    }
}
?> 