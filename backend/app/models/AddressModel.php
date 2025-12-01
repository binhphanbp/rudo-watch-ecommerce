<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../../config/function.php';

class Addresses
{
    private $conn;
    private $table_name = 'addresses';
    public $response;

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->getConnection();
        $this->response = new Response();
    }

    /**
     * Lấy tất cả địa chỉ của user
     */
    public function getAllByUserId($userId)
    {
        try {
            $query = "SELECT * FROM " . $this->table_name . " 
                      WHERE user_id = :user_id 
                      ORDER BY is_default DESC, created_at DESC";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            throw new Exception("Lỗi lấy danh sách địa chỉ: " . $e->getMessage());
        }
    }

    /**
     * Lấy địa chỉ theo ID
     */
    public function getById($id)
    {
        try {
            $query = "SELECT * FROM " . $this->table_name . " WHERE id = :id LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            throw new Exception("Lỗi lấy địa chỉ: " . $e->getMessage());
        }
    }

    /**
     * Lấy địa chỉ mặc định của user
     */
    public function getDefaultByUserId($userId)
    {
        try {
            $query = "SELECT * FROM " . $this->table_name . " 
                      WHERE user_id = :user_id AND is_default = 1 
                      LIMIT 1";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            throw new Exception("Lỗi lấy địa chỉ mặc định: " . $e->getMessage());
        }
    }

    /**
     * Tạo địa chỉ mới
     */
    public function create($data)
    {
        try {
            // Nếu là địa chỉ mặc định, bỏ mặc định của các địa chỉ khác
            if (isset($data['is_default']) && $data['is_default'] == 1) {
                $this->removeDefaultAddress($data['user_id']);
            }

            // Nếu đây là địa chỉ đầu tiên, tự động đặt làm mặc định
            $existingAddresses = $this->getAllByUserId($data['user_id']);
            if (empty($existingAddresses)) {
                $data['is_default'] = 1;
            }

            $insertData = [
                'user_id' => $data['user_id'],
                'street' => $data['street'] ?? null,
                'ward' => $data['ward'] ?? null,
                'province' => $data['province'] ?? null,
                'receiver_name' => $data['receiver_name'] ?? null,
                'receiver_phone' => $data['receiver_phone'] ?? null,
                'is_default' => $data['is_default'] ?? 0
            ];

            $addressId = insert($this->conn, $this->table_name, $insertData);

            if ($addressId) {
                return [
                    'success' => true,
                    'message' => 'Thêm địa chỉ thành công',
                    'data' => $this->getById($addressId)
                ];
            }

            return [
                'success' => false,
                'message' => 'Thêm địa chỉ thất bại'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Lỗi: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Cập nhật địa chỉ
     */
    public function update($id, $data)
    {
        try {
            $address = $this->getById($id);
            if (!$address) {
                return [
                    'success' => false,
                    'message' => 'Địa chỉ không tồn tại'
                ];
            }

            // Nếu cập nhật thành địa chỉ mặc định
            if (isset($data['is_default']) && $data['is_default'] == 1) {
                $this->removeDefaultAddress($address['user_id']);
            }

            $updateData = [];
            $allowedFields = ['street', 'ward', 'province', 'receiver_name', 'receiver_phone', 'is_default'];

            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updateData[$field] = $data[$field];
                }
            }

            if (empty($updateData)) {
                return [
                    'success' => false,
                    'message' => 'Không có dữ liệu để cập nhật'
                ];
            }

            $result = update($this->conn, $this->table_name, $updateData, $id);

            if ($result) {
                return [
                    'success' => true,
                    'message' => 'Cập nhật địa chỉ thành công',
                    'data' => $this->getById($id)
                ];
            }

            return [
                'success' => false,
                'message' => 'Cập nhật địa chỉ thất bại'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Lỗi: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Xóa địa chỉ
     */
    public function delete($id)
    {
        try {
            $address = $this->getById($id);
            if (!$address) {
                return [
                    'success' => false,
                    'message' => 'Địa chỉ không tồn tại'
                ];
            }

            $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);

            if ($stmt->execute()) {
                // Nếu xóa địa chỉ mặc định, đặt địa chỉ đầu tiên còn lại làm mặc định
                if ($address['is_default'] == 1) {
                    $this->setFirstAddressAsDefault($address['user_id']);
                }

                return [
                    'success' => true,
                    'message' => 'Xóa địa chỉ thành công'
                ];
            }

            return [
                'success' => false,
                'message' => 'Xóa địa chỉ thất bại'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Lỗi: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Đặt địa chỉ làm mặc định
     */
    public function setDefault($id, $userId)
    {
        try {
            $address = $this->getById($id);
            if (!$address) {
                return [
                    'success' => false,
                    'message' => 'Địa chỉ không tồn tại'
                ];
            }

            // Kiểm tra địa chỉ thuộc về user
            if ($address['user_id'] != $userId) {
                return [
                    'success' => false,
                    'message' => 'Bạn không có quyền thực hiện thao tác này'
                ];
            }

            // Bỏ mặc định của các địa chỉ khác
            $this->removeDefaultAddress($userId);

            // Đặt địa chỉ này làm mặc định
            $result = update($this->conn, $this->table_name, ['is_default' => 1], $id);

            if ($result) {
                return [
                    'success' => true,
                    'message' => 'Đặt địa chỉ mặc định thành công',
                    'data' => $this->getById($id)
                ];
            }

            return [
                'success' => false,
                'message' => 'Đặt địa chỉ mặc định thất bại'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Lỗi: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Bỏ mặc định tất cả địa chỉ của user
     */
    private function removeDefaultAddress($userId)
    {
        try {
            $query = "UPDATE " . $this->table_name . " 
                      SET is_default = 0, updated_at = :updated_at 
                      WHERE user_id = :user_id";

            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':updated_at', get_datetime());
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);

            return $stmt->execute();
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Đặt địa chỉ đầu tiên làm mặc định
     */
    private function setFirstAddressAsDefault($userId)
    {
        try {
            $query = "SELECT id FROM " . $this->table_name . " 
                      WHERE user_id = :user_id 
                      ORDER BY created_at ASC 
                      LIMIT 1";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->execute();

            $address = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($address) {
                update($this->conn, $this->table_name, ['is_default' => 1], $address['id']);
            }
        } catch (Exception $e) {
        }
    }

    /**
     * Kiểm tra địa chỉ thuộc về user
     */
    public function belongsToUser($addressId, $userId)
    {
        try {
            $query = "SELECT id FROM " . $this->table_name . " 
                      WHERE id = :id AND user_id = :user_id 
                      LIMIT 1";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $addressId, PDO::PARAM_INT);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Đếm số địa chỉ của user
     */
    public function countByUserId($userId)
    {
        try {
            $query = "SELECT COUNT(*) as total FROM " . $this->table_name . " 
                      WHERE user_id = :user_id";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->execute();

            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['total'] ?? 0;
        } catch (Exception $e) {
            return 0;
        }
    }
}