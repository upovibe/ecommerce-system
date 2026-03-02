<?php
// api/controllers/RoleController.php - Controller for role operations

require_once __DIR__ . '/../models/RoleModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';

class RoleController {
    private $roleModel;
    private $logModel;

    public function __construct($pdo) {
        $this->roleModel = new RoleModel($pdo);
        $this->logModel = new UserLogModel($pdo);
    }

    public function index() {
        try {
            ob_clean();
            
            $roles = $this->roleModel->withUsersCount();
            
            // Return standard API response format
            echo json_encode([
                'success' => true,
                'data' => $roles,
                'message' => 'Roles retrieved successfully'
            ], JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ], JSON_PRETTY_PRINT);
        }
    }

    public function store() {
        try {
            ob_clean();
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (!isset($data['name'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Role name is required'
                ], JSON_PRETTY_PRINT);
                return;
            }
            
            // Check if role name already exists
            $existingRole = $this->roleModel->findByName($data['name']);
            if ($existingRole) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Role name already exists'
                ], JSON_PRETTY_PRINT);
                return;
            }
            
            $id = $this->roleModel->create($data);
            
            if ($id) {
                // Get the created role data
                $createdRole = $this->roleModel->findById($id);
            
            // Log role creation
            $this->logModel->logAction(null, 'role_created', 'New role created', $data);
            
            http_response_code(201);
            echo json_encode([
                    'success' => true,
                    'data' => $createdRole,
                'message' => 'Role created successfully'
            ], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Failed to create role'
                ], JSON_PRETTY_PRINT);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function show($id) {
        try {
            ob_clean();
            
            $role = $this->roleModel->findById($id);
            if (!$role) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Role not found'
                ], JSON_PRETTY_PRINT);
                return;
            }
            
            echo json_encode([
                'success' => true,
                'data' => $role,
                'message' => 'Role retrieved successfully'
            ], JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function update($id) {
        try {
            ob_clean();
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Check if role exists
            $existingRole = $this->roleModel->findById($id);
            if (!$existingRole) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Role not found'
                ], JSON_PRETTY_PRINT);
                return;
            }
            
            // Check name uniqueness if name is being updated
            if (isset($data['name']) && $data['name'] !== $existingRole['name']) {
                $nameExists = $this->roleModel->findByName($data['name']);
                if ($nameExists) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Role name already exists'
                    ], JSON_PRETTY_PRINT);
                    return;
                }
            }
            
            $result = $this->roleModel->update($id, $data);
            
            if ($result) {
                // Get the updated role data
                $updatedRole = $this->roleModel->findById($id);
                
                // Log role update
                $this->logModel->logAction(null, 'role_updated', 'Role updated', $data);
                
                echo json_encode([
                    'success' => true,
                    'data' => $updatedRole,
                    'message' => 'Role updated successfully'
                ], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Failed to update role'
                ], JSON_PRETTY_PRINT);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }

    public function destroy($id) {
        try {
            ob_clean();
            
            // Check if role exists
            $role = $this->roleModel->findById($id);
            if (!$role) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Role not found'
                ], JSON_PRETTY_PRINT);
                return;
            }
            
            // Check if role is being used by any users
            $rolesWithCount = $this->roleModel->withUsersCount();
            foreach ($rolesWithCount as $roleWithCount) {
                if ($roleWithCount['id'] == $id && $roleWithCount['users_count'] > 0) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Cannot delete role that is assigned to users'], JSON_PRETTY_PRINT);
                    return;
                }
            }
            
            $result = $this->roleModel->delete($id);
            
            if ($result) {
                // Log role deletion
                $this->logModel->logAction(null, 'role_deleted', 'Role deleted', ['role_id' => $id]);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Role deleted successfully'
                ], JSON_PRETTY_PRINT);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Failed to delete role'
                ], JSON_PRETTY_PRINT);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()], JSON_PRETTY_PRINT);
        }
    }
}
?> 