<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../core/Response.php';

class AuthMiddleware
{
    private $userModel;
    private $response;

    public function __construct()
    {
        $this->userModel = new Users();
        $this->response = new Response();
    }

    // Kiểm tra token và trả về user nếu hợp lệ
    public function authenticate()
    {
        $token = $this->getTokenFromHeader();

        if (!$token) {
            $this->response->json([
                'error' => 'Token không được cung cấp'
            ], 401);
            return null;
        }

        $user = $this->userModel->getByToken($token);

        if (!$user) {
            $this->response->json([
                'error' => 'Token không hợp lệ hoặc đã hết hạn'
            ], 401);
            return null;
        }

        return $user;
    }

    // Lấy token từ Authorization header
    public function getTokenFromHeader()
    {
        $authHeader = null;

        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        } else {
            $headers = getallheaders();
            if ($headers) {
                if (isset($headers['Authorization'])) {
                    $authHeader = $headers['Authorization'];
                } elseif (isset($headers['authorization'])) {
                    $authHeader = $headers['authorization'];
                }
            }
        }

        if (!$authHeader) {
            return null;
        }

        // Lấy token từ "Bearer {token}"
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return trim($matches[1]);
        }

        // Nếu không có Bearer, thử lấy trực tiếp
        return trim($authHeader);
    }

    // Kiểm tra user có role admin không
    public function requireAdmin($user)
    {
        if (!$user || $user['role'] != 1) {
            $this->response->json([
                'error' => 'Bạn không có quyền truy cập'
            ], 403);
            return false;
        }
        return true;
    }
}
