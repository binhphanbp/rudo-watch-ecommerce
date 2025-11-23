<?php 
// Cấu hình CORS
require_once __DIR__ . '/config/cors.php';

//goi file response.php de kiem tra loi tra tu route 
require_once ("app/core/response.php");
$response = new Response();

// Lấy URI từ GET parameter hoặc từ REQUEST_URI
$uri = isset($_GET['url']) ? trim($_GET['url'], '/') : '';

// Nếu không có url param, thử lấy từ REQUEST_URI
if (empty($uri) && isset($_SERVER['REQUEST_URI'])) {
    $requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    
    // Loại bỏ base path nếu có (ví dụ: /rudo-watch-ecommerce/)
    // Tự động detect base path từ SCRIPT_NAME
    $scriptName = dirname($_SERVER['SCRIPT_NAME']);
    if ($scriptName !== '/' && $scriptName !== '\\') {
        $basePath = rtrim($scriptName, '/');
        if (strpos($requestUri, $basePath) === 0) {
            $requestUri = substr($requestUri, strlen($basePath));
        }
    }
    
    // Loại bỏ /backend/ prefix nếu có (cho trường hợp deploy từ root với /backend/)
    // Nếu deploy chỉ backend, prefix này sẽ không có
    $requestUri = preg_replace('#^/backend/#', '', $requestUri);
    
    // Loại bỏ leading/trailing slashes
    $uri = trim($requestUri, '/');
}

$uriSegments = explode('/', $uri);

// Route cho Swagger UI
if ($uri === 'swagger' || $uri === 'swagger-ui' || $uri === 'api-docs') {
    $swaggerFile = __DIR__ . '/swagger-ui.html';
    if (file_exists($swaggerFile)) {
        header('Content-Type: text/html; charset=utf-8');
        readfile($swaggerFile);
        exit();
    }
}

// Route cho Swagger YAML
if ($uri === 'swagger.yaml' || $uri === 'swagger.yml' || $uri === 'api/swagger.yaml') {
    $yamlFile = __DIR__ . '/swagger.yaml';
    if (file_exists($yamlFile)) {
        header('Content-Type: application/yaml; charset=utf-8');
        header('Access-Control-Allow-Origin: *');
        readfile($yamlFile);
        exit();
    }
}

if($uriSegments[0] !== 'api' || !isset($uriSegments[1])){ // kiem tra xem co phai la request khong or co phai version khong
    $response->json(['error' => 'Yêu cầu không hợp lệ'], 400);
    exit();
}

$version = $uriSegments[1]; // v1
$resource = $uriSegments[2] ?? null; // products

$id = $uriSegments[3] ?? null; // lấy id hoặc action nếu có: products/1 hoặc products/featured
$subAction = $uriSegments[4] ?? null; // lấy sub action: products/category/1

if(!$resource){
    $response->json(['error' => 'Yêu cầu không hợp lệ'], 400);
    exit();
}

// Route đặc biệt cho Home
if ($resource === 'home') {
    $controllerFile = __DIR__ . '/app/api/controllers/' . $version . '/HomeController.php';
    if (file_exists($controllerFile)) {
        require_once $controllerFile;
        $controller = new HomeController();
        if ($_SERVER['REQUEST_METHOD'] === 'GET' && method_exists($controller, 'index')) {
            $controller->index();
            exit();
        }
    }
}

$controllerName = ucfirst($resource) . 'Controller'; //ProductsController
$controllerFile = __DIR__ . '/app/api/controllers/' . $version . '/' . $controllerName . '.php';

//import file controller
require_once $controllerFile;

//Khởi tạo controller 
$controller = new $controllerName();

$method = $_SERVER['REQUEST_METHOD'];
$action = null;

// Kiểm tra các action đặc biệt (featured, latest, category, brand)
$specialActions = ['featured', 'latest'];
$subActions = ['category', 'brand'];

if ($id && in_array($id, $specialActions)) {
    // /api/v1/products/featured hoặc /api/v1/products/latest
    $action = $id;
    $id = null;
} elseif ($id && in_array($id, $subActions) && $subAction) {
    // /api/v1/products/category/1 hoặc /api/v1/products/brand/1
    $action = $id;
    $id = $subAction;
} else {
    // Routing thông thường
    switch($method)
    {
        case 'GET':
            $action = $id ? 'show' : 'index'; //nếu mà có id thì gọi cái hàm show(), còn ko thì show index()
            break;
        case 'POST':
            $action = 'store'; // tạo mới dữ liệu
            break;
        case 'PUT': // cập nhật dữ liệu
            $action = $id ? 'update' : null;
            break;
        case 'DELETE': // xóa dữ liệu
            $action = $id ? 'destroy' : null;
            break;
        default:
            $response->json(['error' => 'Phương thức không hợp lệ'], 405);
            exit();
    }
}

if(!$action || !method_exists($controller, $action)){
    $response->json(['error' => 'Hàm không tồn tại'], 404);
    exit();
}

try {
    if($id){
        $controller->$action($id); //truyền id vào hàm action
    }else{
        // Lấy dữ liệu JSON thô từ body (cho POST, PUT)
        $data = json_decode(file_get_contents("php://input")); // lấy dữ liệu JSON thô từ body
        $controller->$action($data);
    }
}catch(Exception $e){
    $response->json(['error' => 'Lỗi hệ thống: ' . $e->getMessage()], 500);
    exit();
}
?>