<?php 
// Cấu hình CORS
require_once __DIR__ . '/config/cors.php';

//goi file response.php de kiem tra loi tra tu route 
require_once ("app/core/response.php");
$response = new Response();

$uri = isset($_GET['url']) ? trim($_GET['url'], '/') : ''; 
$uriSegments = explode('/', $uri);

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