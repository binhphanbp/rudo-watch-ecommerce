<?php
require_once __DIR__ . '/../../../models/Users.php';
require_once __DIR__ . '/../../../core/Response.php';
require_once __DIR__ . '/../../../middleware/AuthMiddleware.php';

class UserController
{
    private $userModel;
    private $response;
    private $auth;

    public function __construct()
    {
        $this->userModel = new Users();
        $this->response = new Response();
        $this->auth = new AuthMiddleware();
    }

    // GET /api/v1/user/profile
    public function profile()
    {
        $user = $this->auth->authenticate();
        if (!$user) {
            return; 
        }

        $this->response->json([
            'user' => $user
        ], 200);
    }

    // PUT /api/v1/user/update
    public function update($data)
    {
        $user = $this->auth->authenticate();
        if (!$user) {
            return; 
        }

        $updateData = [];
        
        if (isset($data->fullname)) {
            $updateData['fullname'] = $data->fullname;
        }

        if (isset($data->phone)) {
            $updateData['phone'] = $data->phone;
        }

        if (isset($data->email)) {
            if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
                $this->response->json([
                    'error' => 'Email không hợp lệ'
                ], 400);
                return;
            }
            $updateData['email'] = $data->email;
        }

        if (isset($data->password) && !empty($data->password)) {
            if (strlen($data->password) < 6) {
                $this->response->json([
                    'error' => 'Mật khẩu phải có ít nhất 6 ký tự'
                ], 400);
                return;
            }
            $updateData['password'] = $data->password;
        }

        if (empty($updateData)) {
            $this->response->json([
                'error' => 'Không có dữ liệu để cập nhật'
            ], 400);
            return;
        }

        $result = $this->userModel->update($user['id'], $updateData);

        if ($result['success']) {
            $this->response->json([
                'message' => $result['message'],
                'user' => $result['user']
            ], 200);
        } else {
            $this->response->json([
                'error' => $result['message']
            ], 400);
        }
    }
}
?>