<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../../config/function.php';

class Users
{
    private $conn;
    private $table_name = 'users';
    public $response;

    public $id;
    public $fullname;
    public $email;
    public $password;
    public $phone;
    public $role;
    public $status;
    public $api_token;
    public $created_at;

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->getConnection();
        $this->response = new Response();
    }

    // register
    public function create($data)
    {
        try {
            // check email ton tai chua
            $checkQuery = "SELECT id FROM " . $this->table_name . " WHERE email = :email LIMIT 1";
            $checkStmt = $this->conn->prepare($checkQuery);
            $checkStmt->bindParam(':email', $data['email']);
            $checkStmt->execute();

            if ($checkStmt->rowCount() > 0) {
                return [
                    'success' => false,
                    'message' => 'Email đã tồn tại'
                ];
            }

            $insertData = [
                'fullname' => $data['fullname'],
                'email' => $data['email'],
                'password' => password_hash($data['password'], PASSWORD_DEFAULT),
                'phone' => $data['phone'] ?? null,
                'role' => $data['role'] ?? 0,
                'status' => $data['status'] ?? 1,
                'api_token' => bin2hex(random_bytes(32))
            ];

            $userId = insert($this->conn, $this->table_name, $insertData);

            if ($userId) {
                return [
                    'success' => true,
                    'message' => 'Đăng ký thành công',
                    'user' => $this->getById($userId),
                    'token' => $insertData['api_token']
                ];
            }

            return [
                'success' => false,
                'message' => 'Đăng ký thất bại'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Lỗi: ' . $e->getMessage()
            ];
        }
    }

    // login
    public function login($email, $password)
    {
        try {
            $query = "SELECT id, fullname, email, password, phone, role, status, api_token 
                     FROM " . $this->table_name . " 
                     WHERE email = :email AND status = 1 LIMIT 1";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':email', $email);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if (password_verify($password, $user['password'])) {
                    if (empty($user['api_token'])) {
                        $apiToken = bin2hex(random_bytes(32));
                        $this->updateToken($user['id'], $apiToken);
                        $user['api_token'] = $apiToken;
                    }

                    unset($user['password']);

                    return [
                        'success' => true,
                        'message' => 'Đăng nhập thành công',
                        'user' => $user,
                        'token' => $user['api_token']
                    ];
                } else {
                    return [
                        'success' => false,
                        'message' => 'Mật khẩu không đúng'
                    ];
                }
            } else {
                return [
                    'success' => false,
                    'message' => 'Email không tồn tại hoặc tài khoản đã bị khóa'
                ];
            }
        } catch (PDOException $e) {
            return [
                'success' => false,
                'message' => 'Lỗi: ' . $e->getMessage()
            ];
        }
    }

    // update token
    private function updateToken($userId, $token)
    {
        update($this->conn, $this->table_name, ['api_token' => $token], $userId);
    }

    // Lấy user theo ID
    public function getById($id)
    {
        try {
            $query = "SELECT id, fullname, email, phone, role, status, api_token, created_at 
                     FROM " . $this->table_name . " 
                     WHERE id = :id LIMIT 1";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                return $stmt->fetch(PDO::FETCH_ASSOC);
            }
            return null;
        } catch (PDOException $e) {
            return null;
        }
    }

    // Lấy user theo token
    public function getByToken($token)
    {
        try {
            $query = "SELECT id, fullname, email, phone, role, status, created_at 
                     FROM " . $this->table_name . " 
                     WHERE api_token = :token AND status = 1 LIMIT 1";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':token', $token);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                return $stmt->fetch(PDO::FETCH_ASSOC);
            }
            return null;
        } catch (PDOException $e) {
            return null;
        }
    }

    // Cập nhật user
    public function update($userId, $data)
    {
        try {
            $updateData = [];

            if (isset($data['fullname'])) {
                $updateData['fullname'] = $data['fullname'];
            }

            if (isset($data['phone'])) {
                $updateData['phone'] = $data['phone'];
            }

            if (isset($data['email'])) {
                $checkQuery = "SELECT id FROM " . $this->table_name . " WHERE email = :email AND id != :id LIMIT 1";
                $checkStmt = $this->conn->prepare($checkQuery);
                $checkStmt->bindParam(':email', $data['email']);
                $checkStmt->bindParam(':id', $userId);
                $checkStmt->execute();

                if ($checkStmt->rowCount() > 0) {
                    return [
                        'success' => false,
                        'message' => 'Email đã được sử dụng bởi tài khoản khác'
                    ];
                }

                $updateData['email'] = $data['email'];
            }

            if (isset($data['password']) && !empty($data['password'])) {
                $updateData['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
            }

            if (empty($updateData)) {
                return [
                    'success' => false,
                    'message' => 'Không có dữ liệu để cập nhật'
                ];
            }

            $result = update($this->conn, $this->table_name, $updateData, $userId);

            if ($result) {
                return [
                    'success' => true,
                    'message' => 'Cập nhật thành công',
                    'user' => $this->getById($userId)
                ];
            }

            return [
                'success' => false,
                'message' => 'Cập nhật thất bại'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Lỗi: ' . $e->getMessage()
            ];
        }
    }

    // Đổi mật khẩu
    public function changePassword($userId, $oldPassword, $newPassword)
    {
        try {
            $query = "SELECT password FROM " . $this->table_name . " WHERE id = :id LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $userId);
            $stmt->execute();

            if ($stmt->rowCount() === 0) {
                return [
                    'success' => false,
                    'message' => 'Người dùng không tồn tại'
                ];
            }

            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!password_verify($oldPassword, $user['password'])) {
                return [
                    'success' => false,
                    'message' => 'Mật khẩu cũ không đúng'
                ];
            }

            if (password_verify($newPassword, $user['password'])) {
                return [
                    'success' => false,
                    'message' => 'Mật khẩu mới không được trùng với mật khẩu cũ'
                ];
            }

            // Cập nhật mật khẩu mới và reset token để đăng xuất tất cả phiên
            $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
            $newToken = bin2hex(random_bytes(32));

            $result = update($this->conn, $this->table_name, [
                'password' => $hashedPassword,
                'api_token' => $newToken
            ], $userId);

            if ($result) {
                return [
                    'success' => true,
                    'message' => 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại',
                    'token' => $newToken
                ];
            }

            return [
                'success' => false,
                'message' => 'Đổi mật khẩu thất bại'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Lỗi: ' . $e->getMessage()
            ];
        }
    }

    // Cập nhật role 
    public function updateRole($adminId, $userId, $newRole)
    {
        try {
            // Kiểm tra admin có quyền không
            $adminQuery = "SELECT role FROM " . $this->table_name . " WHERE id = :admin_id AND status = 1 LIMIT 1";
            $adminStmt = $this->conn->prepare($adminQuery);
            $adminStmt->bindParam(':admin_id', $adminId);
            $adminStmt->execute();

            if ($adminStmt->rowCount() === 0) {
                return [
                    'success' => false,
                    'message' => 'Admin không tồn tại hoặc đã bị khóa'
                ];
            }

            $admin = $adminStmt->fetch(PDO::FETCH_ASSOC);

            // Kiểm tra có phải admin không (role = 1)
            if ($admin['role'] != 1) {
                return [
                    'success' => false,
                    'message' => 'Bạn không có quyền thực hiện chức năng này'
                ];
            }

            // Kiểm tra user cần update có tồn tại không
            $userQuery = "SELECT id, role, fullname FROM " . $this->table_name . " WHERE id = :user_id LIMIT 1";
            $userStmt = $this->conn->prepare($userQuery);
            $userStmt->bindParam(':user_id', $userId);
            $userStmt->execute();

            if ($userStmt->rowCount() === 0) {
                return [
                    'success' => false,
                    'message' => 'Người dùng không tồn tại'
                ];
            }

            $user = $userStmt->fetch(PDO::FETCH_ASSOC);

            // Validate role (0: user, 1: admin)
            if (!in_array($newRole, [0, 1])) {
                return [
                    'success' => false,
                    'message' => 'Role không hợp lệ. Chỉ chấp nhận 0 (User) hoặc 1 (Admin)'
                ];
            }

            // Không cho phép admin tự thay đổi role của chính mình
            if ($adminId == $userId) {
                return [
                    'success' => false,
                    'message' => 'Không thể thay đổi role của chính mình'
                ];
            }

            // Cập nhật role 
            $updateQuery = "UPDATE " . $this->table_name . " SET role = :role WHERE id = :id";
            $updateStmt = $this->conn->prepare($updateQuery);
            $updateStmt->bindParam(':role', $newRole, PDO::PARAM_INT);
            $updateStmt->bindParam(':id', $userId, PDO::PARAM_INT);
            $result = $updateStmt->execute();

            if ($result) {
                $roleName = $newRole == 1 ? 'Admin' : 'User';
                return [
                    'success' => true,
                    'message' => "Đã cập nhật role của {$user['fullname']} thành {$roleName}",
                    'user' => $this->getById($userId)
                ];
            }

            return [
                'success' => false,
                'message' => 'Cập nhật role thất bại'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Lỗi: ' . $e->getMessage()
            ];
        }
    }
}
