<?php

class Router
{
    private $response;
    private $version;
    private $resource;
    private $id;
    private $subAction;
    private $method;

    // Cấu hình routes tập trung
    private const ROUTES = [
        // Auth routes
        'auth' => [
            'register' => ['controller' => 'AuthController', 'method' => 'POST', 'action' => 'register'],
            'login' => ['controller' => 'AuthController', 'method' => 'POST', 'action' => 'login'],
            'facebook' => ['controller' => 'SocialAuthController', 'method' => 'GET', 'action' => 'facebookStart'],
            'facebook-callback' => ['controller' => 'SocialAuthController', 'method' => 'GET', 'action' => 'facebookCallback'],
            'google' => ['controller' => 'SocialAuthController', 'method' => 'GET', 'action' => 'googleStart'],
            'google-callback' => ['controller' => 'SocialAuthController', 'method' => 'GET', 'action' => 'googleCallback']
        ],
        // User routes
        'user' => [
            'profile' => ['controller' => 'UserController', 'method' => 'GET', 'action' => 'profile'],
            'update' => ['controller' => 'UserController', 'method' => 'PUT', 'action' => 'update'],
            'change-password' => ['controller' => 'UserController', 'method' => 'PUT', 'action' => 'changePassword'],
            'update-role' => ['controller' => 'UserController', 'method' => 'PUT', 'action' => 'updateRole']
        ],
        // Address routes
        'addresses' => [
            'default' => ['controller' => 'AddressesController', 'method' => 'GET', 'action' => 'default'],
            'set-default' => ['controller' => 'AddressesController', 'method' => 'PUT', 'action' => 'setDefault']
        ],
        // Plural resources
        'plural' => [
            'cart' => 'Carts',
            'category' => 'Categories',
            'brand' => 'Brands',
            'address' => 'Addresses'
        ]
    ];

    public function __construct($uriSegments, $response)
    {
        $this->response = $response;
        $this->version = $uriSegments[1] ?? null;
        $this->resource = $uriSegments[2] ?? null;
        $this->id = $uriSegments[3] ?? null;
        $this->subAction = $uriSegments[4] ?? null;
        $this->method = $_SERVER['REQUEST_METHOD'];
    }

    // Xử lý route đặc biệt
    public function handleSpecialRoute()
    {
        // Auth: /api/v1/register, /api/v1/login
        if (isset(self::ROUTES['auth'][$this->resource])) {
            return $this->dispatch(self::ROUTES['auth'][$this->resource]);
        }

        // User: /api/v1/user/profile, /api/v1/user/update
        if ($this->resource === 'user' && isset(self::ROUTES['user'][$this->id])) {
            return $this->dispatch(self::ROUTES['user'][$this->id], $this->id);
        }

        // Addresses special routes: /api/v1/addresses/default, /api/v1/addresses/{id}/set-default
        if ($this->resource === 'addresses') {
            // GET /api/v1/addresses/default
            if ($this->id === 'default' && isset(self::ROUTES['addresses']['default'])) {
                return $this->dispatch(self::ROUTES['addresses']['default']);
            }
            // PUT /api/v1/addresses/{id}/set-default
            if ($this->subAction === 'set-default' && isset(self::ROUTES['addresses']['set-default'])) {
                return $this->dispatchWithParam(self::ROUTES['addresses']['set-default'], $this->id);
            }
        }

        return false;
    }

    // Xử lý route CRUD chuẩn
    public function handleStandardRoute()
    {
        if (!$this->resource) return false;

        $controllerName = $this->getControllerName();
        $controller = $this->loadController($controllerName);
        if (!$controller) return false;

        $actionData = $this->getAction();
        if (!$actionData['action'] || !method_exists($controller, $actionData['action'])) {
            return false;
        }

        return $this->executeAction($controller, $actionData);
    }

    // Dispatch route với controller và action
    private function dispatch($route, $actionType = null)
    {
        if ($this->method !== $route['method']) return false;

        $controller = $this->loadController($route['controller']);
        if (!$controller) return false;

        $needsData = in_array($actionType, ['update', 'change-password', 'update-role']) ||
            $this->method === 'POST';

        $data = $needsData ? json_decode(file_get_contents("php://input")) : null;

        $controller->{$route['action']}($data);
        return true;
    }

    // Dispatch route với param (ví dụ: /addresses/{id}/set-default)
    private function dispatchWithParam($route, $param)
    {
        if ($this->method !== $route['method']) return false;

        $controller = $this->loadController($route['controller']);
        if (!$controller) return false;

        $controller->{$route['action']}($param);
        return true;
    }

    // Load controller
    private function loadController($controllerName)
    {
        $file = __DIR__ . '/../api/controllers/' . $this->version . '/' . $controllerName . '.php';
        if (!file_exists($file)) return null;

        require_once $file;
        return new $controllerName();
    }

    // Lấy tên controller từ resource
    private function getControllerName()
    {
        // Kiểm tra plural resources
        if (isset(self::ROUTES['plural'][$this->resource])) {
            return self::ROUTES['plural'][$this->resource] . 'Controller';
        }

        // Xử lý resource có dấu gạch ngang: product-variants -> ProductVariants
        if (strpos($this->resource, '-') !== false) {
            return str_replace('-', '', ucwords($this->resource, '-')) . 'Controller';
        }

        return ucfirst($this->resource) . 'Controller';
    }

    // Xác định action và param
    private function getAction()
    {
        // Cart sub-actions: /api/v1/cart/add
        if ($this->resource === 'cart' && in_array($this->id, ['add', 'update', 'remove'])) {
            $cartMethods = ['add' => 'POST', 'update' => 'PUT', 'remove' => 'DELETE'];
            return $this->method === $cartMethods[$this->id]
                ? ['action' => $this->id, 'param' => null]
                : ['action' => null, 'param' => null];
        }

        // Special actions: /api/v1/products/featured
        if ($this->id && in_array($this->id, ['featured', 'latest'])) {
            return ['action' => $this->id, 'param' => null];
        }

        // Sub-resource: /api/v1/products/category/1
        if ($this->id && in_array($this->id, ['category', 'brand']) && $this->subAction) {
            return ['action' => $this->id, 'param' => $this->subAction];
        }

        // CRUD mapping
        $crudMap = [
            'GET' => [$this->id ? 'show' : 'index', $this->id],
            'POST' => ['store', null],
            'PUT' => [$this->id ? 'update' : null, $this->id],
            'DELETE' => [$this->id ? 'destroy' : null, $this->id]
        ];

        return isset($crudMap[$this->method])
            ? ['action' => $crudMap[$this->method][0], 'param' => $crudMap[$this->method][1]]
            : ['action' => null, 'param' => null];
    }

    // Thực thi action
    private function executeAction($controller, $actionData)
    {
        try {
            if ($actionData['param'] !== null) {
                $controller->{$actionData['action']}($actionData['param']);
            } else {
                $data = json_decode(file_get_contents("php://input"));
                $controller->{$actionData['action']}($data);
            }
            return true;
        } catch (Exception $e) {
            $this->response->json(['error' => 'Lỗi hệ thống: ' . $e->getMessage()], 500);
            return true;
        }
    }
}
