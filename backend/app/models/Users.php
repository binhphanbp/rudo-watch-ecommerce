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

    // Tạo user mới (Register)
    public function create($data)
    {
        try {
            // Kiểm tra email đã tồn tại chưa
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

            // Chuẩn bị dữ liệu để insert
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

    // Đăng nhập
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

                // Kiểm tra password
                if (password_verify($password, $user['password'])) {
                    // Tạo token mới nếu chưa có hoặc cập nhật
                    if (empty($user['api_token'])) {
                        $apiToken = bin2hex(random_bytes(32));
                        $this->updateToken($user['id'], $apiToken);
                        $user['api_token'] = $apiToken;
                    }

                    // Loại bỏ password khỏi response
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

    // Cập nhật token
    private function updateToken($userId, $token)
    {
        update($this->conn, $this->table_name, ['api_token' => $token], $userId);
    }

    // Lấy user theo ID
    public function getById($id)
    {
        try {
            $query = "SELECT id, fullname, email, phone, role, status, created_at 
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

    // Cập nhật thông tin user
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
}
?>