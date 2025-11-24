<?php 
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../../config/function.php';

class Carts
{
    private $conn;
    private $table_name = 'carts';
    private $cart_items_table = 'cart_items';
    private $variants_table = 'product_variants';
    private $products_table = 'products';
    public $response;

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->getConnection();
        $this->response = new Response();
    }

    // Lấy hoặc tạo cart cho user
    public function getCartByUserId($userId)
    {
        try {
            $query = "SELECT * FROM " . $this->table_name . " WHERE user_id = :user_id LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                return $stmt->fetch(PDO::FETCH_ASSOC);
            }

            // Tạo cart mới nếu chưa có
            $cartId = insert($this->conn, $this->table_name, [
                'user_id' => $userId
            ]);

            if ($cartId) {
                return [
                    'id' => $cartId,
                    'user_id' => $userId,
                    'updated_at' => null
                ];
            }

            return null;
        } catch (PDOException $e) {
            return null;
        }
    }

    // Lấy danh sách cart items với thông tin sản phẩm, ảnh, biến thể
    public function getCartItems($cartId)
    {
        try {
            $query = "SELECT 
                        ci.id as cart_item_id,
                        ci.quantity,
                        ci.price_at_add,
                        v.id as variant_id,
                        v.price as variant_price,
                        v.size,
                        v.sku,
                        v.quantity as variant_stock,
                        p.id as product_id,
                        p.name as product_name,
                        p.slug as product_slug,
                        p.thumbnail,
                        p.image as product_image,
                        p.model_code
                     FROM " . $this->cart_items_table . " ci
                     INNER JOIN " . $this->variants_table . " v ON ci.variant_id = v.id
                     INNER JOIN " . $this->products_table . " p ON v.product_id = p.id
                     WHERE ci.cart_id = :cart_id
                     ORDER BY ci.id DESC";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':cart_id', $cartId);
            $stmt->execute();

            $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Parse thumbnail từ JSON
            foreach ($items as &$item) {
                if (!empty($item['thumbnail'])) {
                    $item['thumbnail'] = json_decode($item['thumbnail'], true);
                } else {
                    $item['thumbnail'] = [];
                }
            }

            return $items;
        } catch (PDOException $e) {
            return [];
        }
    }

    // Thêm sản phẩm vào giỏ hàng (nếu trùng variant_id thì tăng số lượng)
    public function addItem($cartId, $variantId, $quantity)
    {
        try {
            // Kiểm tra variant có tồn tại không
            $variantQuery = "SELECT id, price, quantity as stock FROM " . $this->variants_table . " WHERE id = :variant_id LIMIT 1";
            $variantStmt = $this->conn->prepare($variantQuery);
            $variantStmt->bindParam(':variant_id', $variantId);
            $variantStmt->execute();

            if ($variantStmt->rowCount() === 0) {
                return [
                    'success' => false,
                    'message' => 'Biến thể sản phẩm không tồn tại'
                ];
            }

            $variant = $variantStmt->fetch(PDO::FETCH_ASSOC);

            // Kiểm tra số lượng tồn kho
            if ($variant['stock'] < $quantity) {
                return [
                    'success' => false,
                    'message' => 'Số lượng sản phẩm không đủ'
                ];
            }

            // Kiểm tra xem đã có item với variant_id này trong cart chưa
            $checkQuery = "SELECT id, quantity FROM " . $this->cart_items_table . " 
                          WHERE cart_id = :cart_id AND variant_id = :variant_id LIMIT 1";
            $checkStmt = $this->conn->prepare($checkQuery);
            $checkStmt->bindParam(':cart_id', $cartId);
            $checkStmt->bindParam(':variant_id', $variantId);
            $checkStmt->execute();

            if ($checkStmt->rowCount() > 0) {
                // Đã có item, cập nhật số lượng
                $existingItem = $checkStmt->fetch(PDO::FETCH_ASSOC);
                $newQuantity = $existingItem['quantity'] + $quantity;

                // Kiểm tra lại số lượng tồn kho
                if ($variant['stock'] < $newQuantity) {
                    return [
                        'success' => false,
                        'message' => 'Số lượng sản phẩm không đủ'
                    ];
                }

                update($this->conn, $this->cart_items_table, [
                    'quantity' => $newQuantity
                ], $existingItem['id']);

                // Cập nhật updated_at của cart
                update($this->conn, $this->table_name, [], $cartId);

                return [
                    'success' => true,
                    'message' => 'Đã cập nhật số lượng sản phẩm trong giỏ hàng',
                    'cart_item_id' => $existingItem['id']
                ];
            } else {
                // Chưa có item, thêm mới
                $cartItemId = insert($this->conn, $this->cart_items_table, [
                    'cart_id' => $cartId,
                    'variant_id' => $variantId,
                    'quantity' => $quantity,
                    'price_at_add' => $variant['price']
                ]);

                if ($cartItemId) {
                    // Cập nhật updated_at của cart
                    update($this->conn, $this->table_name, [], $cartId);

                    return [
                        'success' => true,
                        'message' => 'Đã thêm sản phẩm vào giỏ hàng',
                        'cart_item_id' => $cartItemId
                    ];
                }
            }

            return [
                'success' => false,
                'message' => 'Không thể thêm sản phẩm vào giỏ hàng'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Lỗi: ' . $e->getMessage()
            ];
        }
    }

    // Cập nhật số lượng sản phẩm trong giỏ hàng
    public function updateItem($cartItemId, $quantity, $userId)
    {
        try {
            if ($quantity <= 0) {
                return [
                    'success' => false,
                    'message' => 'Số lượng phải lớn hơn 0'
                ];
            }

            // Kiểm tra cart_item có thuộc về user không
            $checkQuery = "SELECT ci.id, ci.cart_id, ci.variant_id, v.quantity as stock
                          FROM " . $this->cart_items_table . " ci
                          INNER JOIN " . $this->table_name . " c ON ci.cart_id = c.id
                          INNER JOIN " . $this->variants_table . " v ON ci.variant_id = v.id
                          WHERE ci.id = :cart_item_id AND c.user_id = :user_id LIMIT 1";
            
            $checkStmt = $this->conn->prepare($checkQuery);
            $checkStmt->bindParam(':cart_item_id', $cartItemId);
            $checkStmt->bindParam(':user_id', $userId);
            $checkStmt->execute();

            if ($checkStmt->rowCount() === 0) {
                return [
                    'success' => false,
                    'message' => 'Không tìm thấy sản phẩm trong giỏ hàng'
                ];
            }

            $item = $checkStmt->fetch(PDO::FETCH_ASSOC);

            // Kiểm tra số lượng tồn kho
            if ($item['stock'] < $quantity) {
                return [
                    'success' => false,
                    'message' => 'Số lượng sản phẩm không đủ'
                ];
            }

            // Cập nhật số lượng
            update($this->conn, $this->cart_items_table, [
                'quantity' => $quantity
            ], $cartItemId);

            // Cập nhật updated_at của cart
            update($this->conn, $this->table_name, [], $item['cart_id']);

            return [
                'success' => true,
                'message' => 'Đã cập nhật số lượng sản phẩm'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Lỗi: ' . $e->getMessage()
            ];
        }
    }

    // Xóa sản phẩm khỏi giỏ hàng
    public function removeItem($cartItemId, $userId)
    {
        try {
            // Kiểm tra cart_item có thuộc về user không
            $checkQuery = "SELECT ci.id, ci.cart_id
                          FROM " . $this->cart_items_table . " ci
                          INNER JOIN " . $this->table_name . " c ON ci.cart_id = c.id
                          WHERE ci.id = :cart_item_id AND c.user_id = :user_id LIMIT 1";
            
            $checkStmt = $this->conn->prepare($checkQuery);
            $checkStmt->bindParam(':cart_item_id', $cartItemId);
            $checkStmt->bindParam(':user_id', $userId);
            $checkStmt->execute();

            if ($checkStmt->rowCount() === 0) {
                return [
                    'success' => false,
                    'message' => 'Không tìm thấy sản phẩm trong giỏ hàng'
                ];
            }

            $item = $checkStmt->fetch(PDO::FETCH_ASSOC);

            // Xóa item
            $deleteQuery = "DELETE FROM " . $this->cart_items_table . " WHERE id = :id";
            $deleteStmt = $this->conn->prepare($deleteQuery);
            $deleteStmt->bindParam(':id', $cartItemId);
            $deleteStmt->execute();

            // Cập nhật updated_at của cart
            update($this->conn, $this->table_name, [], $item['cart_id']);

            return [
                'success' => true,
                'message' => 'Đã xóa sản phẩm khỏi giỏ hàng'
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