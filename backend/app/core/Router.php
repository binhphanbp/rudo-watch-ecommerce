<?php

class Router
{
    private $response;
    private $version;
    private $resource;
    private $id;
    private $subAction;
    private $method;

    public function __construct($uriSegments, $response)
    {
        $this->response = $response;
        $this->version = $uriSegments[1] ?? null;
        $this->resource = $uriSegments[2] ?? null;
        $this->id = $uriSegments[3] ?? null;
        $this->subAction = $uriSegments[4] ?? null;
        $this->method = $_SERVER['REQUEST_METHOD'];
    }

    // Định nghĩa các route đặc biệt
    private function getSpecialRoutes()
    {
        return [
            'register' => ['controller' => 'AuthController', 'method' => 'POST', 'action' => 'register'],
            'login' => ['controller' => 'AuthController', 'method' => 'POST', 'action' => 'login'],
            'home' => ['controller' => 'HomeController', 'method' => 'GET', 'action' => 'index'],
            'user' => [
                'profile' => ['method' => 'GET', 'action' => 'profile'],
                'update' => ['method' => 'PUT', 'action' => 'update']
            ]
        ];
    }

    // Xử lý route đặc biệt
    public function handleSpecialRoute()
    {
        $routes = $this->getSpecialRoutes();

        // Xử lý register/login
        if (in_array($this->resource, ['register', 'login'])) {
            return $this->handleAuthRoute($routes[$this->resource]);
        }

        // Xử lý home
        if ($this->resource === 'home') {
            return $this->handleRoute($routes['home']);
        }

        // Xử lý user/profile và user/update
        if ($this->resource === 'user' && isset($routes['user'][$this->id])) {
            return $this->handleUserRoute($routes['user'][$this->id]);
        }

        return false;
    }

    // Xử lý auth route (register/login)
    private function handleAuthRoute($route)
    {
        if ($this->method !== $route['method']) {
            return false;
        }

        $controllerFile = __DIR__ . '/../api/controllers/' . $this->version . '/' . $route['controller'] . '.php';
        if (!file_exists($controllerFile)) {
            return false;
        }

        require_once $controllerFile;
        $controller = new $route['controller']();
        $data = json_decode(file_get_contents("php://input"));
        $controller->{$route['action']}($data);
        return true;
    }

    // Xử lý user route (profile/update)
    private function handleUserRoute($route)
    {
        if ($this->method !== $route['method']) {
            return false;
        }

        $controllerFile = __DIR__ . '/../api/controllers/' . $this->version . '/UserController.php';
        if (!file_exists($controllerFile)) {
            return false;
        }

        require_once $controllerFile;
        $controller = new UserController();
        
        if ($this->id === 'update') {
            $data = json_decode(file_get_contents("php://input"));
            $controller->{$route['action']}($data);
        } else {
            $controller->{$route['action']}();
        }
        return true;
    }

    // Xử lý home route
    private function handleRoute($route)
    {
        if ($this->method !== $route['method']) {
            return false;
        }

        $controllerFile = __DIR__ . '/../api/controllers/' . $this->version . '/' . $route['controller'] . '.php';
        if (!file_exists($controllerFile)) {
            return false;
        }

        require_once $controllerFile;
        $controller = new $route['controller']();
        if (method_exists($controller, $route['action'])) {
            $controller->{$route['action']}();
            return true;
        }
        return false;
    }

    // Xử lý route thông thường (CRUD)
    public function handleStandardRoute()
    {
        if (!$this->resource) {
            return false;
        }

        // Xử lý tên controller (một số resource dùng plural form)
        $resourceName = $this->resource;
        $pluralResources = ['cart' => 'Carts', 'category' => 'Categories', 'brand' => 'Brands'];
        
        if (isset($pluralResources[$resourceName])) {
            $controllerName = $pluralResources[$resourceName] . 'Controller';
        } else {
            // Xử lý resource có dấu gạch ngang (ví dụ: product-variants -> ProductVariants)
            if (strpos($resourceName, '-') !== false) {
                $parts = explode('-', $resourceName);
                $controllerName = '';
                foreach ($parts as $part) {
                    $controllerName .= ucfirst($part);
                }
                $controllerName .= 'Controller';
            } else {
                $controllerName = ucfirst($resourceName) . 'Controller';
            }
        }
        
        $controllerFile = __DIR__ . '/../api/controllers/' . $this->version . '/' . $controllerName . '.php';

        if (!file_exists($controllerFile)) {
            return false;
        }

        require_once $controllerFile;
        $controller = new $controllerName();

        $actionData = $this->determineAction();
        $action = $actionData['action'];
        $param = $actionData['param'];

        if (!$action || !method_exists($controller, $action)) {
            return false;
        }

        try {
            if ($param !== null) {
                $controller->$action($param);
            } else {
                $data = json_decode(file_get_contents("php://input"));
                $controller->$action($data);
            }
            return true;
        } catch (Exception $e) {
            $this->response->json(['error' => 'Lỗi hệ thống: ' . $e->getMessage()], 500);
            return true;
        }
    }

    // Xác định action dựa trên method và id
    private function determineAction()
    {
        $specialActions = ['featured', 'latest'];
        $subActions = ['category', 'brand'];
        
        // Xử lý cart routes với sub-actions: cart/add, cart/update, cart/remove
        if ($this->resource === 'cart' && $this->id) {
            $cartActions = ['add', 'update', 'remove'];
            if (in_array($this->id, $cartActions)) {
                switch ($this->method) {
                    case 'POST':
                        if ($this->id === 'add') {
                            return ['action' => 'add', 'param' => null];
                        }
                        break;
                    case 'PUT':
                        if ($this->id === 'update') {
                            return ['action' => 'update', 'param' => null];
                        }
                        break;
                    case 'DELETE':
                        if ($this->id === 'remove') {
                            return ['action' => 'remove', 'param' => null];
                        }
                        break;
                }
            }
        }

        // Xử lý special actions: products/featured, products/latest
        if ($this->id && in_array($this->id, $specialActions)) {
            return ['action' => $this->id, 'param' => null];
        }

        // Xử lý sub actions: products/category/1, products/brand/1
        if ($this->id && in_array($this->id, $subActions) && $this->subAction) {
            return ['action' => $this->id, 'param' => $this->subAction];
        }

        // Xử lý CRUD thông thường
        switch ($this->method) {
            case 'GET':
                return ['action' => $this->id ? 'show' : 'index', 'param' => $this->id];
            case 'POST':
                return ['action' => 'store', 'param' => null];
            case 'PUT':
                return ['action' => $this->id ? 'update' : null, 'param' => $this->id];
            case 'DELETE':
                return ['action' => $this->id ? 'destroy' : null, 'param' => $this->id];
            default:
                $this->response->json(['error' => 'Phương thức không hợp lệ'], 405);
                return ['action' => null, 'param' => null];
        }
    }
}
?>