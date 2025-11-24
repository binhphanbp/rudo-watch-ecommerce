<?php
require_once __DIR__ . '/../../../models/Users.php';
require_once __DIR__ . '/../../../core/Response.php';

class AuthController
{
    private $userModel;
    private $response;

    public function __construct()
    {
        $this->userModel = new Users();
        $this->response = new Response();
    }

    // POST /api/v1/register
    public function register($data)
    {
        if (empty($data->fullname) || empty($data->email) || empty($data->password)) {
            $this->response->json([
                'error' => 'Vui lòng điền đầy đủ thông tin'
            ], 400);
            return;
        }

        if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
            $this->response->json([
                'error' => 'Email không hợp lệ'
            ], 400);
            return;
        }

        if (strlen($data->password) < 6) {
            $this->response->json([
                'error' => 'Mật khẩu phải có ít nhất 6 ký tự'
            ], 400);
            return;
        }

        $result = $this->userModel->create([
            'fullname' => $data->fullname,
            'email' => $data->email,
            'password' => $data->password,
            'phone' => $data->phone ?? null
        ]);

        if ($result['success']) {
            $this->response->json([
                'message' => $result['message'],
                'user' => $result['user'],
                'token' => $result['token']
            ], 201);
        } else {
            $this->response->json([
                'error' => $result['message']
            ], 400);
        }
    }

    // POST /api/v1/login
    public function login($data)
    {
        // Validate input
        if (empty($data->email) || empty($data->password)) {
            $this->response->json([
                'error' => 'Vui lòng nhập email và mật khẩu'
            ], 400);
            return;
        }

        $result = $this->userModel->login($data->email, $data->password);

        if ($result['success']) {
            $this->response->json([
                'message' => $result['message'],
                'user' => $result['user'],
                'token' => $result['token']
            ], 200);
        } else {
            $this->response->json([
                'error' => $result['message']
            ], 401);
        }
    }
}
?>