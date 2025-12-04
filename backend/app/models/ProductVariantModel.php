<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../../config/function.php';

class ProductVariants
{
    private $conn;
    private $table_name = 'product_variants';
    private $products_table = 'products';
    public $response;

    // Các thuộc tính của bảng product_variants
    public $id;
    public $product_id;
    public $price;
    public $colors;
    public $image;
    public $size;
    public $sku;
    public $quantity;

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->getConnection();
        $this->response = new Response();
    }

    // Lấy variant theo ID
    public function getById($id)
    {
        try {
            $query = "SELECT * FROM " . $this->table_name . " WHERE id = :id LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (PDOException $e) {
            throw $e;
        }
    }

    // Lấy tất cả variants theo product_id
    public function getByProductId($productId)
    {
        try {
            $query = "SELECT * FROM " . $this->table_name . " WHERE product_id = :product_id ORDER BY id ASC";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':product_id', $productId, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        } catch (PDOException $e) {
            return [];
        }
    }

    // Lấy tất cả variants cho nhiều product_id trong một query
    public function getByProductIds($productIds)
    {
        try {
            if (empty($productIds)) {
                return [];
            }

            $placeholders = str_repeat('?,', count($productIds) - 1) . '?';
            $query = "SELECT * FROM " . $this->table_name . " WHERE product_id IN ($placeholders) ORDER BY product_id, id ASC";

            $stmt = $this->conn->prepare($query);
            $stmt->execute($productIds);
            return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        } catch (PDOException $e) {
            return [];
        }
    }

    // Kiểm tra SKU trùng lặp
    private function getBySku($sku)
    {
        try {
            $query = "SELECT id FROM " . $this->table_name . " WHERE sku = :sku LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':sku', $sku);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (PDOException $e) {
            return null;
        }
    }

    // Tạo variant mới
    public function create($data)
    {
        try {
            if (empty($data->product_id) || empty($data->price)) {
                return [
                    'success' => false,
                    'message' => 'product_id và price là bắt buộc'
                ];
            }

            $productQuery = "SELECT id FROM " . $this->products_table . " WHERE id = :product_id LIMIT 1";
            $productStmt = $this->conn->prepare($productQuery);
            $productStmt->bindParam(':product_id', $data->product_id);
            $productStmt->execute();

            if ($productStmt->rowCount() === 0) {
                return [
                    'success' => false,
                    'message' => 'Sản phẩm không tồn tại'
                ];
            }

            if (!empty($data->sku)) {
                $existingSku = $this->getBySku($data->sku);
                if ($existingSku) {
                    return [
                        'success' => false,
                        'message' => 'SKU đã tồn tại'
                    ];
                }
            }

            $insertData = [
                'product_id' => $data->product_id,
                'price' => $data->price,
                'colors' => $data->colors,
                'image' => $data->image ?? null,
                'size' => $data->size ?? null,
                'sku' => $data->sku ?? null,
                'quantity' => $data->quantity ?? 0
            ];

            $id = insert($this->conn, $this->table_name, $insertData);

            if ($id) {
                return [
                    'success' => true,
                    'message' => 'Tạo variant thành công',
                    'variant' => $this->getById($id)
                ];
            }

            return [
                'success' => false,
                'message' => 'Không thể tạo variant'
            ];
        } catch (PDOException $e) {
            return [
                'success' => false,
                'message' => 'Lỗi: ' . $e->getMessage()
            ];
        }
    }

    public function update($id, $data)
    {
        try {
            $existing = $this->getById($id);
            if (!$existing) {
                return [
                    'success' => false,
                    'message' => 'Variant không tồn tại'
                ];
            }

            if (isset($data->sku) && !empty($data->sku) && $data->sku !== $existing['sku']) {
                $existingSku = $this->getBySku($data->sku);
                if ($existingSku) {
                    return [
                        'success' => false,
                        'message' => 'SKU đã tồn tại'
                    ];
                }
            }

            if (isset($data->product_id) && $data->product_id != $existing['product_id']) {
                $productQuery = "SELECT id FROM " . $this->products_table . " WHERE id = :product_id LIMIT 1";
                $productStmt = $this->conn->prepare($productQuery);
                $productStmt->bindParam(':product_id', $data->product_id);
                $productStmt->execute();

                if ($productStmt->rowCount() === 0) {
                    return [
                        'success' => false,
                        'message' => 'Sản phẩm không tồn tại'
                    ];
                }
            }

            $updateData = [];

            if (isset($data->product_id)) {
                $updateData['product_id'] = $data->product_id;
            }
            if (isset($data->price)) {
                $updateData['price'] = $data->price;
            }
            if (isset($data->size)) {
                $updateData['size'] = $data->size;
            }
            if (isset($data->colors)) {
                $updateData['colors'] = $data->colors;
            }
            if (isset($data->image)) {
                $updateData['image'] = $data->image;
            }
            if (isset($data->sku)) {
                $updateData['sku'] = $data->sku;
            }
            if (isset($data->quantity)) {
                $updateData['quantity'] = $data->quantity;
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
                    'message' => 'Cập nhật variant thành công',
                    'variant' => $this->getById($id)
                ];
            }

            return [
                'success' => false,
                'message' => 'Không thể cập nhật variant'
            ];
        } catch (PDOException $e) {
            return [
                'success' => false,
                'message' => 'Lỗi: ' . $e->getMessage()
            ];
        }
    }

    public function delete($id)
    {
        try {
            $existing = $this->getById($id);
            if (!$existing) {
                return [
                    'success' => false,
                    'message' => 'Variant không tồn tại'
                ];
            }

            $checkQuery = "SELECT COUNT(*) as count FROM cart_items WHERE variant_id = :variant_id";
            $checkStmt = $this->conn->prepare($checkQuery);
            $checkStmt->bindParam(':variant_id', $id);
            $checkStmt->execute();
            $result = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if ($result['count'] > 0) {
                return [
                    'success' => false,
                    'message' => 'Không thể xóa variant vì đang có trong giỏ hàng'
                ];
            }

            $checkOrderQuery = "SELECT COUNT(*) as count FROM order_detail WHERE variant_id = :variant_id";
            $checkOrderStmt = $this->conn->prepare($checkOrderQuery);
            $checkOrderStmt->bindParam(':variant_id', $id);
            $checkOrderStmt->execute();
            $orderResult = $checkOrderStmt->fetch(PDO::FETCH_ASSOC);

            if ($orderResult['count'] > 0) {
                return [
                    'success' => false,
                    'message' => 'Không thể xóa variant vì đang có trong đơn hàng'
                ];
            }

            $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $result = $stmt->execute();

            if ($result) {
                return [
                    'success' => true,
                    'message' => 'Xóa variant thành công'
                ];
            }

            return [
                'success' => false,
                'message' => 'Không thể xóa variant'
            ];
        } catch (PDOException $e) {
            return [
                'success' => false,
                'message' => 'Lỗi: ' . $e->getMessage()
            ];
        }
    }
}