<?php
require_once __DIR__ . '/../../../models/ProductVariantModel.php';
require_once __DIR__ . '/../../../core/Response.php';

class ProductVariantsController
{
    private $variantModel;
    private $response;

    public function __construct()
    {
        $this->variantModel = new ProductVariants();
        $this->response = new Response();
    }

    // GET /api/v1/product-variants/:id - Lấy variant theo ID
    public function show($id)
    {
        try {
            if (!is_numeric($id)) {
                $this->response->json([
                    'success' => false,
                    'error' => 'ID không hợp lệ'
                ], 400);
                return;
            }

            $variant = $this->variantModel->getById($id);

            if (!$variant) {
                $this->response->json([
                    'success' => false,
                    'error' => 'Variant không tồn tại'
                ], 404);
                return;
            }

            $this->response->json([
                'success' => true,
                'data' => $variant
            ], 200);
        } catch (Exception $e) {
            $this->response->json([
                'success' => false,
                'error' => 'Lỗi: ' . $e->getMessage()
            ], 500);
        }
    }

    // POST /api/v1/product-variants - Tạo variant mới
    public function store($data)
    {
        try {
            // Validate input
            if (empty($data->product_id) || empty($data->price)) {
                $this->response->json([
                    'success' => false,
                    'error' => 'product_id và price là bắt buộc'
                ], 400);
                return;
            }

            if (!is_numeric($data->product_id) || !is_numeric($data->price)) {
                $this->response->json([
                    'success' => false,
                    'error' => 'product_id và price phải là số'
                ], 400);
                return;
            }

            if ($data->price < 0) {
                $this->response->json([
                    'success' => false,
                    'error' => 'Giá không thể âm'
                ], 400);
                return;
            }

            if (isset($data->quantity) && $data->quantity < 0) {
                $this->response->json([
                    'success' => false,
                    'error' => 'Số lượng không thể âm'
                ], 400);
                return;
            }

            $result = $this->variantModel->create($data);

            if ($result['success']) {
                $this->response->json([
                    'success' => true,
                    'message' => $result['message'],
                    'data' => $result['variant']
                ], 201);
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

    // PUT /api/v1/product-variants/:id - Cập nhật variant
    public function update($id)
    {
        try {
            if (!is_numeric($id)) {
                $this->response->json([
                    'success' => false,
                    'error' => 'ID không hợp lệ'
                ], 400);
                return;
            }

            $data = json_decode(file_get_contents("php://input"));

            if (isset($data->price) && !is_numeric($data->price)) {
                $this->response->json([
                    'success' => false,
                    'error' => 'price phải là số'
                ], 400);
                return;
            }

            if (isset($data->price) && $data->price < 0) {
                $this->response->json([
                    'success' => false,
                    'error' => 'Giá không thể âm'
                ], 400);
                return;
            }

            if (isset($data->quantity) && !is_numeric($data->quantity)) {
                $this->response->json([
                    'success' => false,
                    'error' => 'quantity phải là số'
                ], 400);
                return;
            }

            if (isset($data->quantity) && $data->quantity < 0) {
                $this->response->json([
                    'success' => false,
                    'error' => 'Số lượng không thể âm'
                ], 400);
                return;
            }

            if (isset($data->product_id) && !is_numeric($data->product_id)) {
                $this->response->json([
                    'success' => false,
                    'error' => 'product_id phải là số'
                ], 400);
                return;
            }

            $result = $this->variantModel->update($id, $data);

            if ($result['success']) {
                $this->response->json([
                    'success' => true,
                    'message' => $result['message'],
                    'data' => $result['variant']
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

    // DELETE /api/v1/product-variants/:id - Xóa variant
    public function destroy($id)
    {
        try {
            if (!is_numeric($id)) {
                $this->response->json([
                    'success' => false,
                    'error' => 'ID không hợp lệ'
                ], 400);
                return;
            }

            $result = $this->variantModel->delete($id);

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