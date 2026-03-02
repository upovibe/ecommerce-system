<?php
// api/controllers/EventController.php - Controller for events management

require_once __DIR__ . '/../middlewares/AuthMiddleware.php';
require_once __DIR__ . '/../middlewares/RoleMiddleware.php';
require_once __DIR__ . '/../core/MultipartFormParser.php';
require_once __DIR__ . '/../models/EventModel.php';
require_once __DIR__ . '/../models/UserLogModel.php';
require_once __DIR__ . '/../helpers/SlugHelper.php';
require_once __DIR__ . '/../utils/event_uploads.php';

class EventController {
    private $pdo;
    private $eventModel;
    private $userLogModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->eventModel = new EventModel($pdo);
        $this->userLogModel = new UserLogModel($pdo);
    }

    /**
     * Get all events (admin only)
     */
    public function index() {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            $events = $this->eventModel->findAll();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $events,
                'message' => 'Events retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving events: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Create a new event (admin only)
     */
    public function store() {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Handle multipart form data or JSON data for PUT/PATCH requests
            $data = [];
            $content_type = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';

            if (strpos($content_type, 'multipart/form-data') !== false) {
                $data = $_POST;
            } else {
                // Fall back to JSON
                $rawData = file_get_contents('php://input');
                $data = json_decode($rawData, true) ?? [];
            }
            

            
            // Convert date formats (handle multiple formats) - only if dates are provided
            if (isset($data['start_date']) && !empty($data['start_date'])) {
                $startDate = null;
                $dateFormats = [
                    'd/m/Y H:i:s',  // 25/9/2025 23:00:45
                    'Y-m-d H:i:s',  // 2025-09-25 23:00:45
                    'Y-m-d\TH:i',   // 2025-09-25T23:00
                    'd/m/Y H:i',    // 25/9/2025 23:00
                    'Y-m-d H:i'     // 2025-09-25 23:00
                ];
                
                foreach ($dateFormats as $format) {
                    $startDate = DateTime::createFromFormat($format, $data['start_date']);
                    if ($startDate) break;
                }
                
                if ($startDate) {
                    $data['start_date'] = $startDate->format('Y-m-d H:i:s');
                }
            }
            
            if (isset($data['end_date']) && !empty($data['end_date'])) {
                $endDate = null;
                $dateFormats = [
                    'd/m/Y H:i:s',  // 25/9/2025 23:00:45
                    'Y-m-d H:i:s',  // 2025-09-25 23:00:45
                    'Y-m-d\TH:i',   // 2025-09-25T23:00
                    'd/m/Y H:i',    // 25/9/2025 23:00
                    'Y-m-d H:i'     // 2025-09-25 23:00
                ];
                
                foreach ($dateFormats as $format) {
                    $endDate = DateTime::createFromFormat($format, $data['end_date']);
                    if ($endDate) break;
                }
                
                if ($endDate) {
                    $data['end_date'] = $endDate->format('Y-m-d H:i:s');
                }
            }
            
            // Validate that end date is after start date (only if both dates are provided and valid)
            if (isset($data['start_date']) && isset($data['end_date']) && 
                !empty($data['start_date']) && !empty($data['end_date'])) {
                $startDate = DateTime::createFromFormat('Y-m-d H:i:s', $data['start_date']);
                $endDate = DateTime::createFromFormat('Y-m-d H:i:s', $data['end_date']);
                if ($startDate && $endDate && $endDate <= $startDate) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'End date must be after start date'
                    ]);
                    return;
                }
            }
            
            // Auto-generate slug from title (only if title is provided)
            if (isset($data['title']) && !empty($data['title'])) {
                $generatedSlug = generateSlug($data['title']);
                $data['slug'] = ensureUniqueSlug($this->pdo, $generatedSlug, 'events', 'slug');
            }
            
            // Set default values (only for fields that exist in the table)
            if (!isset($data['is_active'])) {
                $data['is_active'] = 1;
            }
            
            // Handle banner upload if present
            $bannerData = null;
            if (!empty($_FILES['banner']) && $_FILES['banner']['error'] === UPLOAD_ERR_OK) {
                $bannerData = uploadEventBanner($_FILES['banner']);
                $data['banner_image'] = $bannerData['original'];
            }
            
            // Create event
            $eventId = $this->eventModel->create($data);
            
            if ($eventId) {
                // Get the created event data
                $createdEvent = $this->eventModel->findById($eventId);
                
                // Log the action
                $this->logAction('event_created', "Created event: {$data['title']}", [
                    'event_id' => $eventId,
                    'slug' => $data['slug'],
                    'title' => $data['title'],
                    'start_date' => $data['start_date'],
                    'end_date' => $data['end_date'],
                    'banner_uploaded' => $bannerData ? true : false
                ]);
                
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'data' => $createdEvent,
                    'message' => 'Event created successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to create event'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error creating event: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get a specific event (public)
     */
    public function show($id) {
        try {
            $event = $this->eventModel->findById($id);
            
            if (!$event) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Event not found'
                ]);
                return;
            }
            
            // If event is not active, only admins can view it
            if (!$event['is_active']) {
                try {
                    RoleMiddleware::requireAdmin($this->pdo);
                } catch (Exception $e) {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Event not found'
                    ]);
                    return;
                }
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $event,
                'message' => 'Event retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving event: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get event by slug (public)
     */
    public function showBySlug($slug) {
        try {
            $event = $this->eventModel->findBySlugInstance($slug);
            
            if (!$event) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Event not found'
                ]);
                return;
            }
            
            // If event is not active, only admins can view it
            if (!$event['is_active']) {
                try {
                    RoleMiddleware::requireAdmin($this->pdo);
                } catch (Exception $e) {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Event not found'
                    ]);
                    return;
                }
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $event,
                'message' => 'Event retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving event: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update an event (admin only)
     */
    public function update($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Check if event exists
            $existingEvent = $this->eventModel->findById($id);
            if (!$existingEvent) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Event not found'
                ]);
                return;
            }
            
            // Handle multipart form data or JSON data
            $data = [];
            $content_type = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
            $rawData = file_get_contents('php://input');

            if (strpos($content_type, 'multipart/form-data') !== false) {
                $parsed = MultipartFormParser::parse($rawData, $content_type);
                $data = $parsed['data'] ?? [];
                $_FILES = $parsed['files'] ?? [];
            } else {
                // Fall back to JSON
                $data = json_decode($rawData, true) ?? [];
            }
            
            // Convert date formats (handle multiple formats) - only if dates are provided
            if (isset($data['start_date']) && !empty($data['start_date'])) {
                $startDate = null;
                $dateFormats = [
                    'd/m/Y H:i:s',  // 25/9/2025 23:00:45
                    'Y-m-d H:i:s',  // 2025-09-25 23:00:45
                    'Y-m-d\TH:i',   // 2025-09-25T23:00
                    'd/m/Y H:i',    // 25/9/2025 23:00
                    'Y-m-d H:i'     // 2025-09-25 23:00
                ];
                
                foreach ($dateFormats as $format) {
                    $startDate = DateTime::createFromFormat($format, $data['start_date']);
                    if ($startDate) break;
                }
                
                if ($startDate) {
                    $data['start_date'] = $startDate->format('Y-m-d H:i:s');
                }
            }
            
            if (isset($data['end_date']) && !empty($data['end_date'])) {
                $endDate = null;
                $dateFormats = [
                    'd/m/Y H:i:s',  // 25/9/2025 23:00:45
                    'Y-m-d H:i:s',  // 2025-09-25 23:00:45
                    'Y-m-d\TH:i',   // 2025-09-25T23:00
                    'd/m/Y H:i',    // 25/9/2025 23:00
                    'Y-m-d H:i'     // 2025-09-25 23:00
                ];
                
                foreach ($dateFormats as $format) {
                    $endDate = DateTime::createFromFormat($format, $data['end_date']);
                    if ($endDate) break;
                }
                
                if ($endDate) {
                    $data['end_date'] = $endDate->format('Y-m-d H:i:s');
                }
            }
            
            // Handle slug generation if title changed
            if (isset($data['title']) && $data['title'] !== $existingEvent['title']) {
                $generatedSlug = generateSlug($data['title']);
                $data['slug'] = ensureUniqueSlug($this->pdo, $generatedSlug, 'events', 'slug', $id);
            }
            
            // Handle banner upload if present
            $bannerData = null;
            if (!empty($_FILES['banner']) && $_FILES['banner']['error'] === UPLOAD_ERR_OK) {
                try {
                    $bannerData = uploadEventBanner($_FILES['banner']);
                    $data['banner_image'] = $bannerData['original'];
                } catch (Exception $e) {
                    // Log the error and continue without banner update
                    error_log('Error uploading event banner: ' . $e->getMessage());
                    // Don't fail the entire update if banner upload fails
                }
            }
            
            
            $result = $this->eventModel->update($id, $data);
            
            if ($result) {
                // Get the updated event data
                $updatedEvent = $this->eventModel->findById($id);
                
                // Log the action
                $this->logAction('event_updated', "Updated event: {$existingEvent['title']}", [
                    'event_id' => $id,
                    'old_title' => $existingEvent['title'],
                    'new_title' => $data['title'] ?? $existingEvent['title'],
                    'banner_updated' => $bannerData ? true : false
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => $updatedEvent,
                    'message' => 'Event updated successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to update event'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating event: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Delete an event (admin only)
     */
    public function destroy($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            // Check if event exists
            $existingEvent = $this->eventModel->findById($id);
            if (!$existingEvent) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Event not found'
                ]);
                return;
            }
            
            // Delete banner image if it exists
            if (!empty($existingEvent['banner_image'])) {
                deleteEventBanner($existingEvent['banner_image']);
            }
            
            // Delete event
            $success = $this->eventModel->delete($id);
            
            if ($success) {
                // Log the action
                $this->logAction('event_deleted', "Deleted event: {$existingEvent['title']}", [
                    'event_id' => $id,
                    'title' => $existingEvent['title'],
                    'slug' => $existingEvent['slug']
                ]);
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Event deleted successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to delete event'
                ]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error deleting event: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get active events (public)
     */
    public function getActive() {
        try {
            $events = $this->eventModel->getActiveEvents();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $events,
                'message' => 'Active events retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving active events: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get upcoming events (public)
     */
    public function getUpcoming() {
        try {
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : null;
            $events = $this->eventModel->getUpcomingEvents($limit);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $events,
                'message' => 'Upcoming events retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving upcoming events: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Get events by category (public)
     */
    public function getByCategory() {
        try {
            $category = $_GET['category'] ?? '';
            if (empty($category)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Category parameter is required'
                ]);
                return;
            }
            
            $events = $this->eventModel->getByCategory($category);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $events,
                'message' => 'Events by category retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error retrieving events by category: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Search events (public)
     */
    public function search() {
        try {
            $query = $_GET['q'] ?? '';
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : null;
            
            if (empty($query)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Search query is required'
                ]);
                return;
            }
            
            $events = $this->eventModel->searchEvents($query, $limit);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $events,
                'message' => 'Search results retrieved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error searching events: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Toggle event active status (admin only)
     */
    public function toggleActive($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            $event = $this->eventModel->findById($id);
            if (!$event) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Event not found'
                ]);
                return;
            }
            
            $this->eventModel->toggleActive($id);
            
            // Log the action
            $newStatus = !$event['is_active'];
            $this->logAction('event_status_toggled', "Toggled event status: {$event['title']}", [
                'event_id' => $id,
                'title' => $event['title'],
                'new_status' => $newStatus ? 'active' : 'inactive'
            ]);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Event status updated successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating event status: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Update event status (admin only)
     */
    public function updateStatus($id) {
        try {
            // Require admin authentication
            RoleMiddleware::requireAdmin($this->pdo);
            
            $event = $this->eventModel->findById($id);
            if (!$event) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Event not found'
                ]);
                return;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            $status = $data['status'] ?? '';
            
            if (empty($status)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Status is required'
                ]);
                return;
            }
            
            $this->eventModel->updateStatus($id, $status);
            
            // Log the action
            $this->logAction('event_status_updated', "Updated event status: {$event['title']}", [
                'event_id' => $id,
                'title' => $event['title'],
                'new_status' => $status
            ]);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Event status updated successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error updating event status: ' . $e->getMessage()
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
        
        // Check Authorization header
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                return $matches[1];
            }
        }
        
        // Check for token in query parameters
        if (isset($_GET['token'])) {
            return $_GET['token'];
        }
        
        // Check for token in POST data
        if (isset($_POST['token'])) {
            return $_POST['token'];
        }
        
        return null;
    }
}
?> 