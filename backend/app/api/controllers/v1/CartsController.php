<?php
require_once __DIR__ . '/../../../models/Carts.php';
require_once __DIR__ . '/../../../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../../../core/Response.php';

class CartsController
{
    private $cartModel;
    private $authMiddleware;
    private $response;

    public function __construct()
    {
        $this->cartModel = new Carts();
        $this->authMiddleware = new AuthMiddleware();
        $this->response = new Response();
    }

    // GET /api/v1/cart - Lấy danh sách giỏ hàng
    public function index()
    {
        $user = $this->authMiddleware->authenticate();
        if (!$user) {
            return;
        }

        try {
            $cart = $this->cartModel->getCartByUserId($user['id']);
            
            if (!$cart) {
                $this->response->json([
                    'success' => true,
                    'message' => 'Giỏ hàng trống',
                    'cart' => [],
                    'items' => []
                ], 200);
                return;
            }

            $items = $this->cartModel->getCartItems($cart['id']);

            $this->response->json([
                'success' => true,
                'message' => 'Lấy danh sách giỏ hàng thành công',
                'cart' => $cart,
                'items' => $items
            ], 200);
        } catch (Exception $e) {
            $this->response->json([
                'success' => false,
                'error' => 'Lỗi: ' . $e->getMessage()
            ], 500);
        }
    }

    // POST /api/v1/cart/add - Thêm sản phẩm vào giỏ hàng
    public function add($data)
    {
        $user = $this->authMiddleware->authenticate();
        if (!$user) {
            return;
        }

        // Validate input
        if (empty($data->variant_id) || empty($data->quantity)) {
            $this->response->json([
                'success' => false,
                'error' => 'Vui lòng cung cấp variant_id và quantity'
            ], 400);
            return;
        }

        if (!is_numeric($data->variant_id) || !is_numeric($data->quantity)) {
            $this->response->json([
                'success' => false,
                'error' => 'variant_id và quantity phải là số'
            ], 400);
            return;
        }

        if ($data->quantity <= 0) {
            $this->response->json([
                'success' => false,
                'error' => 'Số lượng phải lớn hơn 0'
            ], 400);
            return;
        }

        try {
            $cart = $this->cartModel->getCartByUserId($user['id']);
            
            if (!$cart) {
                $this->response->json([
                    'success' => false,
                    'error' => 'Không thể tạo giỏ hàng'
                ], 500);
                return;
            }

            $result = $this->cartModel->addItem($cart['id'], $data->variant_id, $data->quantity);

            if ($result['success']) {
                $this->response->json([
                    'success' => true,
                    'message' => $result['message'],
                    'cart_item_id' => $result['cart_item_id']
                ], 200);
            } else {
                $this->response->json([
                    'success' => false,
                    'error' => $result['message']
                ], 400);
            }
        } catch (Exception $e) {
            $this->response->json([
                'success' => false,
                'error' => 'Lỗi: ' . $e->getMessage()
            ], 500);
        }
    }

    // PUT /api/v1/cart/update - Cập nhật số lượng
    public function update($data)
    {
        $user = $this->authMiddleware->authenticate();
        if (!$user) {
            return;
        }

        // Validate input
        if (empty($data->cart_item_id) || empty($data->quantity)) {
            $this->response->json([
                'success' => false,
                'error' => 'Vui lòng cung cấp cart_item_id và quantity'
            ], 400);
            return;
        }

        if (!is_numeric($data->cart_item_id) || !is_numeric($data->quantity)) {
            $this->response->json([
                'success' => false,
                'error' => 'cart_item_id và quantity phải là số'
            ], 400);
            return;
        }

        try {
            $result = $this->cartModel->updateItem($data->cart_item_id, $data->quantity, $user['id']);

            if ($result['success']) {
                $this->response->json([
                    'success' => true,
                    'message' => $result['message']
                ], 200);
            } else {
                $this->response->json([
                    'success' => false,
                    'error' => $result['message']
                ], 400);
            }
        } catch (Exception $e) {
            $this->response->json([
                'success' => false,
                'error' => 'Lỗi: ' . $e->getMessage()
            ], 500);
        }
    }

    // DELETE /api/v1/cart/remove - Xóa sản phẩm khỏi giỏ hàng
    public function remove($data)
    {
        $user = $this->authMiddleware->authenticate();
        if (!$user) {
            return;
        }

        // Validate input
        if (empty($data->cart_item_id)) {
            $this->response->json([
                'success' => false,
                'error' => 'Vui lòng cung cấp cart_item_id'
            ], 400);
            return;
        }

        if (!is_numeric($data->cart_item_id)) {
            $this->response->json([
                'success' => false,
                'error' => 'cart_item_id phải là số'
            ], 400);
            return;
        }

        try {
            $result = $this->cartModel->removeItem($data->cart_item_id, $user['id']);

            if ($result['success']) {
                $this->response->json([
                    'success' => true,
                    'message' => $result['message']
                ], 200);
            } else {
                $this->response->json([
                    'success' => false,
                    'error' => $result['message']
                ], 400);
            }
        } catch (Exception $e) {
            $this->response->json([
                'success' => false,
                'error' => 'Lỗi: ' . $e->getMessage()
            ], 500);
        }
    }
}
?>