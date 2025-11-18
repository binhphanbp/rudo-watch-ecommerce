<?php 
header('Access-Control-Allow-Origin: *'); // cho phép tất cả domain truy cập
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS'); // cho phép các giao thức HTTP
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"); // cho phép các header

// check xem server có hỗ trợ CORS khong
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

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
$resource = $uriSegments[2] ?? null; // users

$id = $uriSegments[3] ?? null; // lấy id nếu có: users/1 

if(!$resource){
    $response->json(['error' => 'Yêu cầu không hợp lệ'], 400);
    exit();
}

$controllerName = ucfirst($resource) . 'Controller'; //UsersController
$controllerFile = __DIR__ . '/app/controllers/' . $controllerName . '.php';

//import file controller
require_once $controllerFile;

//Khởi tạo controller 
$controller = new $controllerName();


$method = $_SERVER['REQUEST_METHOD'];
$action = null;

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
    case 'DELETE': // xóa dữ liệu
        $action = $id ? 'destroy' : null; 
    default:
        $response->json(['error' => 'Phương thức không hợp lệ'], 405);
        exit();
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