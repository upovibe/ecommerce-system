<?php
// api/core/BaseModel.php - Base class for all database models

class BaseModel {
    protected $pdo;
    protected static $table = '';
    protected $attributes = [];
    protected $whereConditions = [];
    protected static $fillable = [];
    protected static $hidden = [];
    protected static $timestamps = true;
    protected static $casts = [];

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->table = static::$table;
    }

    protected function getTableName() {
        return (string)(static::$table ?: $this->table);
    }

    // Dynamic property handling
    public function __get($name) {
        return $this->attributes[$name] ?? null;
    }

    public function __set($name, $value) {
        $this->attributes[$name] = $value;
    }

    public function __isset($name) {
        return isset($this->attributes[$name]);
    }

    // Set multiple attributes
    public function fill($data) {
        foreach ($data as $key => $value) {
            if (in_array($key, static::$fillable)) {
                $this->attributes[$key] = $value;
            }
        }
        return $this;
    }

    // Get attributes (excluding hidden ones)
    public function toArray() {
        $data = $this->attributes;
        foreach (static::$hidden as $hidden) {
            unset($data[$hidden]);
        }
        return $data;
    }

    // Where clause builder
    public static function where($column, $value) {
        $instance = new static(static::getPdo());
        $instance->whereConditions[] = [$column, $value];
        return $instance;
    }

    // Get first result
    public function first() {
        if (!empty($this->whereConditions)) {
            $conditions = [];
            $values = [];
            foreach ($this->whereConditions as $condition) {
                $conditions[] = "{$condition[0]} = ?";
                $values[] = $condition[1];
            }
            $whereClause = implode(' AND ', $conditions);
            $tableName = $this->getTableName();
            $sql = "SELECT * FROM {$tableName} WHERE {$whereClause} LIMIT 1";
            
            try {
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute($values);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($result) {
                    $result = $this->applyCasts($result);
                    $this->attributes = $result;
                }
                return $result;
            } catch (PDOException $e) {
                throw new Exception('Error in where query: ' . $e->getMessage());
            }
        }
        return null;
    }

    public function findAll() {
        try {
            $tableName = $this->getTableName();
            $stmt = $this->pdo->query("SELECT * FROM {$tableName}");
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Apply casts to each result
            foreach ($results as &$result) {
                $result = $this->applyCasts($result);
            }
            
            return $results;
        } catch (PDOException $e) {
            throw new Exception('Error fetching all records: ' . $e->getMessage());
        }
    }

    public function findById($id) {
        try {
            $tableName = $this->getTableName();
            $stmt = $this->pdo->prepare("SELECT * FROM {$tableName} WHERE id = ?");
            $stmt->execute([$id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($result) {
                $result = $this->applyCasts($result);
                $this->attributes = $result;
            }
            return $result;
        } catch (PDOException $e) {
            throw new Exception('Error fetching record by ID: ' . $e->getMessage());
        }
    }

    public function create($data) {
        try {
            // Add timestamps if enabled
            if (static::$timestamps) {
                $data['created_at'] = date('Y-m-d H:i:s');
                $data['updated_at'] = date('Y-m-d H:i:s');
            }

            // Apply JSON casting if defined
            $processedData = $data;
            foreach ($data as $key => $value) {
                if (isset(static::$casts[$key]) && static::$casts[$key] === 'json' && is_array($value)) {
                    $processedData[$key] = json_encode($value);
                }
            }

            $keys = implode(', ', array_keys($processedData));
            $placeholders = ':' . implode(', :', array_keys($processedData));
            $tableName = $this->getTableName();
            $stmt = $this->pdo->prepare("INSERT INTO {$tableName} ($keys) VALUES ($placeholders)");
            foreach ($processedData as $key => $value) {
                $stmt->bindValue(':' . $key, $value);
            }
            $stmt->execute();
            $id = $this->pdo->lastInsertId();
            
            // Set the created record's attributes
            $this->attributes = array_merge($processedData, ['id' => $id]);
            
            return $id;
        } catch (PDOException $e) {
            throw new Exception('Error creating record: ' . $e->getMessage());
        }
    }

    public function update($id, $data) {
        try {
            // Add updated_at timestamp if enabled
            if (static::$timestamps) {
                $data['updated_at'] = date('Y-m-d H:i:s');
            }

            // Filter out empty keys and null values
            $filteredData = [];
            foreach ($data as $key => $value) {
                if (!empty($key) && $key !== '' && $value !== null) {
                    // Apply JSON casting if defined
                    if (isset(static::$casts[$key]) && static::$casts[$key] === 'json' && is_array($value)) {
                        $filteredData[$key] = json_encode($value);
                    } else {
                        $filteredData[$key] = $value;
                    }
                }
            }

            // Build SET clause with placeholders
            $setParts = [];
            $params = [];
            
            foreach ($filteredData as $key => $value) {
                $setParts[] = "$key = ?";
                $params[] = $value;
            }
            
            if (empty($setParts)) {
                // No valid fields to update
                return true;
            }
            
            $setClause = implode(', ', $setParts);
            $params[] = $id; // Add ID for WHERE clause
            
            $tableName = $this->getTableName();
            $sql = "UPDATE {$tableName} SET $setClause WHERE id = ?";
            
            $stmt = $this->pdo->prepare($sql);
            $result = $stmt->execute($params);
            
            if ($result) {
                $this->attributes = array_merge($this->attributes, $filteredData);
            }
            
            return $result;
        } catch (PDOException $e) {
            throw new Exception('Error updating record: ' . $e->getMessage());
        }
    }

    public function delete($id) {
        try {
            $tableName = $this->getTableName();
            $stmt = $this->pdo->prepare("DELETE FROM {$tableName} WHERE id = ?");
            return $stmt->execute([$id]);
        } catch (PDOException $e) {
            throw new Exception('Error deleting record: ' . $e->getMessage());
        }
    }

    // Save method for creating or updating
    public function save() {
        if (isset($this->attributes['id'])) {
            $id = $this->attributes['id'];
            unset($this->attributes['id']);
            return $this->update($id, $this->attributes);
        } else {
            return $this->create($this->attributes);
        }
    }

    /**
     * Apply casts to data when retrieving from database
     */
    protected function applyCasts($data) {
        foreach (static::$casts as $field => $cast) {
            if (isset($data[$field]) && $data[$field] !== null) {
                switch ($cast) {
                    case 'json':
                        if (is_string($data[$field])) {
                            $decoded = json_decode($data[$field], true);
                            if (json_last_error() === JSON_ERROR_NONE) {
                                $data[$field] = $decoded;
                            }
                        }
                        break;
                    case 'boolean':
                        $data[$field] = (bool) $data[$field];
                        break;
                    case 'datetime':
                        // Keep as string for now, could be converted to DateTime object if needed
                        break;
                }
            }
        }
        return $data;
    }

    // Get PDO instance (you'll need to implement this based on your connection setup)
    protected static function getPdo() {
        // This should return your PDO instance
        // You might need to adjust this based on how you handle database connections
        global $pdo; // Assuming you have a global PDO instance
        return $pdo;
    }
    
    /**
     * Get real IP address
     */
    protected static function getRealIpAddress() {
        // Check for forwarded IP addresses
        $ipKeys = [
            'HTTP_CF_CONNECTING_IP', // Cloudflare
            'HTTP_CLIENT_IP',        // Client IP
            'HTTP_X_FORWARDED_FOR',  // Forwarded IP
            'HTTP_X_FORWARDED',      // Forwarded IP
            'HTTP_X_CLUSTER_CLIENT_IP', // Cluster client IP
            'HTTP_FORWARDED_FOR',    // Forwarded for
            'HTTP_FORWARDED',        // Forwarded
            'REMOTE_ADDR'            // Direct IP
        ];
        
        foreach ($ipKeys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                foreach (explode(',', $_SERVER[$key]) as $ip) {
                    $ip = trim($ip);
                    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                        return $ip;
                    }
                }
            }
        }
        
        // Fallback to REMOTE_ADDR
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }

    // Override in child classes to define table schema
    public static function schema() {
        return [];
    }

    // Generate and execute migration SQL
    public static function migrate($pdo) {
        $schema = static::schema();
        if (empty($schema)) {
            throw new Exception('No schema defined for ' . static::class);
        }

        $table = static::$table;
        $fields = [];
        foreach ($schema as $field => $definition) {
            $fields[] = "$field $definition";
        }
        $fieldsSql = implode(', ', $fields);

        $sql = "CREATE TABLE IF NOT EXISTS $table ($fieldsSql)";
        try {
            $pdo->exec($sql);
            echo "Migrated table: $table\n";
        } catch (PDOException $e) {
            throw new Exception('Migration failed for $table: ' . $e->getMessage());
        }
    }
}
?> 