<?php
// api/controllers/TeamController.php - Controller for team management

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../utils/team_uploads.php';
require_once __DIR__ . '/../core/MultipartFormParser.php';
require_once __DIR__ . '/../models/TeamModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';

class TeamController {
    private $pdo;
    private $teamModel;
    private $userLogModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->teamModel = new TeamModel($pdo);
        $this->userLogModel = new UserLogModel($pdo);
    }

    /**
     * Get all team members (admin only)
     */
    public function index() {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            $teamMembers = $this->teamModel->findAll();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $teamMembers,
                'message' => 'Team members retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving team members: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Create a new team member (admin only)
     */
    public function store() {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Handle multipart form data first (for file uploads)
            if (!empty($_POST)) {
                $data = $_POST;
            } else {
                // Fall back to JSON if no form data
                $data = json_decode(file_get_contents('php://input'), true);
            }
            
            // Validate required fields
            if (empty($data['name'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Name is required'
                ]);
                return;
            }

            if (empty($data['position'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Position is required'
                ]);
                return;
            }

            if (empty($data['department'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Department is required'
                ]);
                return;
            }

            // Validate department
            $availableDepartments = $this->teamModel->getAvailableDepartments();
            if (!in_array($data['department'], $availableDepartments)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid department. Available departments: ' . implode(', ', $availableDepartments)
                ]);
                return;
            }
            
            // Set default values
            if (!isset($data['is_active'])) {
                $data['is_active'] = 1;
            }
            
            // Create team member first to get the ID
            $teamMemberId = $this->teamModel->create($data);
            
            // Handle profile image upload if present
            $profileImagePath = null;
            if (!empty($_FILES['profile_image']) && $_FILES['profile_image']['error'] === UPLOAD_ERR_OK) {
                $uploadResult = uploadTeamImage($_FILES['profile_image']);
                
                if ($uploadResult['success']) {
                    $profileImagePath = $uploadResult['filepath'];
                    // Update team member with profile image path
                    $this->teamModel->updateTeamMember($teamMemberId, ['profile_image' => $profileImagePath]);
                }
            }
            
            if ($teamMemberId) {
                // Get the created team member data
                $createdTeamMember = $this->teamModel->findById($teamMemberId);
                
                // Log the action
                $this->logAction('team_member_created', "Created team member: {$data['name']}", [
                    'team_member_id' => $teamMemberId,
                    'name' => $data['name'],
                    'position' => $data['position'],
                    'department' => $data['department'],
                    'profile_image_uploaded' => $profileImagePath ? true : false
                ]);
                
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'data' => $createdTeamMember,
                    'message' => 'Team member created successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to create team member'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating team member: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get a specific team member by ID (public endpoint)
     */
    public function show($id) {
        try {
            $teamMember = $this->teamModel->findById($id);
            
            if (!$teamMember) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Team member not found'
                ]);
                return;
            }
            
            // If team member is not active, only admins can view it
            if (!$teamMember['is_active']) {
                try {
                    RoleMiddleware::requireAdmin($this->pdo);
                } catch (Exception $e) {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Team member not found'
                    ]);
                    return;
                }
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $teamMember,
                'message' => 'Team member retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving team member: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update a team member (admin only)
     */
    public function update($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Check if team member exists
            $existingTeamMember = $this->teamModel->findById($id);
            if (!$existingTeamMember) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Team member not found'
                ]);
                return;
            }

            // Handle multipart/form-data for PUT requests (same as SettingController)
            $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
            if (strpos($contentType, 'multipart/form-data') !== false && $_SERVER['REQUEST_METHOD'] === 'PUT') {
                $rawData = file_get_contents('php://input');
                MultipartFormParser::processRequest($rawData, $contentType);
            }
            
            // Handle both JSON and multipart form data
            $data = [];
            if (strpos($contentType, 'multipart/form-data') !== false) {
                // Handle multipart form data
                $data = $_POST;
            } else {
                // Handle JSON data
                $data = json_decode(file_get_contents('php://input'), true) ?? [];
            }

            // Validate department if provided
            if (isset($data['department']) && !empty($data['department'])) {
                $availableDepartments = $this->teamModel->getAvailableDepartments();
                if (!in_array($data['department'], $availableDepartments)) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Invalid department. Available departments: ' . implode(', ', $availableDepartments)
                    ]);
                    return;
                }
            }
            
            // Handle profile image upload if present
            if (!empty($_FILES['profile_image']) && $_FILES['profile_image']['error'] === UPLOAD_ERR_OK) {
                $uploadResult = uploadTeamImage($_FILES['profile_image']);
                
                if ($uploadResult['success']) {
                    // Delete old profile image if it exists
                    if (!empty($existingTeamMember['profile_image']) && file_exists($existingTeamMember['profile_image'])) {
                        deleteTeamImage($existingTeamMember['profile_image']);
                    }
                    $data['profile_image'] = $uploadResult['filepath'];
                }
            }
            
            // Update team member
            $success = $this->teamModel->updateTeamMember($id, $data);
            
            if ($success) {
                // Get the updated team member data
                $updatedTeamMember = $this->teamModel->findById($id);
                
                // Log the action
                $this->logAction('team_member_updated', "Updated team member: {$updatedTeamMember['name']}", [
                    'team_member_id' => $id,
                    'updated_fields' => array_keys($data)
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => $updatedTeamMember,
                    'message' => 'Team member updated successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to update team member'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating team member: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete a team member (admin only)
     */
    public function destroy($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Check if team member exists
            $existingTeamMember = $this->teamModel->findById($id);
            if (!$existingTeamMember) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Team member not found'
                ]);
                return;
            }
            
            // Delete old profile image if it exists
            if (!empty($existingTeamMember['profile_image']) && file_exists($existingTeamMember['profile_image'])) {
                deleteTeamImage($existingTeamMember['profile_image']);
            }
            
            // Delete team member
            $success = $this->teamModel->delete($id);
            
            if ($success) {
                // Log the action
                $this->logAction('team_member_deleted', "Deleted team member: {$existingTeamMember['name']}", [
                    'team_member_id' => $id,
                    'name' => $existingTeamMember['name']
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Team member deleted successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to delete team member'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting team member: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get all active team members (public endpoint)
     */
    public function getPublic() {
        try {
            $teamMembers = $this->teamModel->getActiveTeamMembers();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $teamMembers,
                'message' => 'Active team members retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving team members: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get team members by department (public endpoint)
     */
    public function getByDepartment($department) {
        try {
            $availableDepartments = $this->teamModel->getAvailableDepartments();
            if (!in_array($department, $availableDepartments)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid department. Available departments: ' . implode(', ', $availableDepartments)
                ]);
                return;
            }

            $teamMembers = $this->teamModel->getTeamMembersByDepartment($department);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $teamMembers,
                'message' => "Team members from {$department} department retrieved successfully"
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving team members by department: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Log user action
     */
    private function logAction($action, $description = null, $metadata = null) {
        try {
            $token = $this->getAuthToken();
            if ($token) {
                $this->userLogModel->logAction($token, $action, $description, $metadata);
            }
        } catch (Exception $e) {
            // Log error silently to avoid breaking the main operation
            error_log('Error logging action: ' . $e->getMessage());
        }
    }

    /**
     * Get authentication token from request
     */
    private function getAuthToken() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $matches[1];
        }
        
        return null;
    }
}
?> 