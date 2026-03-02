<?php
// api/core/Router.php - Simple router for mapping routes to controllers

class Router {
    private static $routes = [];

    public static function add($method, $path, $controllerAction) {
        self::$routes[] = ['method' => strtoupper($method), 'path' => $path, 'action' => $controllerAction];
    }

    public static function get($path, $controllerAction) {
        self::add('GET', $path, $controllerAction);
    }

    public static function post($path, $controllerAction) {
        self::add('POST', $path, $controllerAction);
    }

    public static function put($path, $controllerAction) {
        self::add('PUT', $path, $controllerAction);
    }

    public static function delete($path, $controllerAction) {
        self::add('DELETE', $path, $controllerAction);
    }

    public static function patch($path, $controllerAction) {
        self::add('PATCH', $path, $controllerAction);
    }

    public static function dispatch($uri, $method, $pdo) {
        $method = strtoupper($method);
        foreach (self::$routes as $route) {
            if ($route['method'] === $method) {
                $params = self::matchRoute($route['path'], $uri);
                if ($params !== false) {
                    list($controller, $action) = explode('@', $route['action']);
                    require_once __DIR__ . '/../controllers/' . $controller . '.php';
                    $controllerInstance = new $controller($pdo);
                    
                    // Pass parameters to the action method
                    if (!empty($params)) {
                        return $controllerInstance->$action(...array_values($params));
                    } else {
                        return $controllerInstance->$action();
                    }
                }
            }
        }
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
    }
    
    private static function matchRoute($routePath, $uri) {
        // Convert route path to regex pattern
        $pattern = preg_replace('/\{([^}]+)\}/', '([^/]+)', $routePath);
        $pattern = '#^' . $pattern . '$#';
        
        if (preg_match($pattern, $uri, $matches)) {
            // Extract parameter names from route path
            preg_match_all('/\{([^}]+)\}/', $routePath, $paramNames);
            $paramNames = $paramNames[1];
            
            // Create parameters array
            $params = [];
            for ($i = 1; $i < count($matches); $i++) {
                if (isset($paramNames[$i - 1])) {
                    $params[$paramNames[$i - 1]] = $matches[$i];
                }
            }
            
            return $params;
        }
        
        return false;
    }
} 