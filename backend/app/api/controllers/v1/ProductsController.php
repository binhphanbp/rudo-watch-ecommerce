<?php
require_once __DIR__ . '/../../../models/ProductModel.php';
require_once __DIR__ . '/../../../core/Response.php';

class ProductsController
{
    private $productModel;
    private $response;

    public function __construct()
    {
        $this->productModel = new Products();
        $this->response = new Response();
    }

    // Lấy danh sách sản phẩm
    // Endpoint: GET /api/v1/products

    public function index()
    {
        try {
            // Lấy các tham số từ query string
            $params = [
                'search' => $_GET['search'] ?? '',
                'category_id' => $_GET['category_id'] ?? '',
                'brand_id' => $_GET['brand_id'] ?? '',
                'status' => $_GET['status'] ?? '',
                'sort_by' => $_GET['sort_by'] ?? '',
                'sort_order' => $_GET['sort_order'] ?? 'DESC',
                'page' => $_GET['page'] ?? 1,
                'limit' => $_GET['limit'] ?? 10
            ];

            // Loại bỏ các tham số rỗng
            $params = array_filter($params, function($value) {
                return $value !== '';
            });

            $result = $this->productModel->getAll($params);
            $this->response->json($result, 200);
        } catch (Exception $e) {
            $this->response->json(['error' => $e->getMessage()], 500);
        }
    }

    // Lấy chi tiết sản phẩm theo ID
    // Endpoint: GET /api/v1/products/{id}
    public function show($id)
    {
        try {
            if (!is_numeric($id)) {
                $this->response->json(['error' => 'ID không hợp lệ'], 400);
                return;
            }

            $product = $this->productModel->getById($id);

            if (!$product) {
                $this->response->json(['error' => 'Sản phẩm không tồn tại'], 404);
                return;
            }

            $this->response->json($product, 200);
        } catch (Exception $e) {
            $this->response->json(['error' => $e->getMessage()], 500);
        }
    }

    // Tạo sản phẩm mới
    // Endpoint: POST /api/v1/products
    public function store($data)
    {
        try {
            // Validate dữ liệu đầu vào
            $errors = $this->validateProductData($data, false);

            if (!empty($errors)) {
                $this->response->json(['errors' => $errors], 400);
                return;
            }

            $product = $this->productModel->create($data);

            if ($product) {
                $this->response->json($product, 201);
            } else {
                $this->response->json(['error' => 'Không thể tạo sản phẩm'], 500);
            }
        } catch (Exception $e) {
            $this->response->json(['error' => $e->getMessage()], 500);
        }
    }

    // Cập nhật sản phẩm
    // Endpoint: PUT /api/v1/products/{id}
    public function update($id)
    {
        try {
            if (!is_numeric($id)) {
                $this->response->json(['error' => 'ID không hợp lệ'], 400);
                return;
            }

            // Lấy dữ liệu từ body
            $data = json_decode(file_get_contents("php://input"));

            if (!$data) {
                $this->response->json(['error' => 'Dữ liệu không hợp lệ'], 400);
                return;
            }

            // Validate dữ liệu
            $errors = $this->validateProductData($data, true);

            if (!empty($errors)) {
                $this->response->json(['errors' => $errors], 400);
                return;
            }

            $product = $this->productModel->update($id, $data);

            if ($product) {
                $this->response->json($product, 200);
            } else {
                $this->response->json(['error' => 'Sản phẩm không tồn tại hoặc không thể cập nhật'], 404);
            }
        } catch (Exception $e) {
            $this->response->json(['error' => $e->getMessage()], 500);
        }
    }

    // Xóa sản phẩm
    // Endpoint: DELETE /api/v1/products/{id}
    public function destroy($id)
    {
        try {
            if (!is_numeric($id)) {
                $this->response->json(['error' => 'ID không hợp lệ'], 400);
                return;
            }

            // Kiểm tra sản phẩm có tồn tại không
            $product = $this->productModel->getById($id);

            if (!$product) {
                $this->response->json(['error' => 'Sản phẩm không tồn tại'], 404);
                return;
            }

            $result = $this->productModel->delete($id);

            if ($result) {
                $this->response->json(['message' => 'Xóa sản phẩm thành công'], 200);
            } else {
                $this->response->json(['error' => 'Không thể xóa sản phẩm'], 500);
            }
        } catch (Exception $e) {
            $this->response->json(['error' => $e->getMessage()], 500);
        }
    }

    // Lấy sản phẩm nổi bật
    // Endpoint: GET /api/v1/products/featured
    public function featured($data = null)
    {
        try {
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
            $products = $this->productModel->getFeatured($limit);
            $this->response->json($products, 200);
        } catch (Exception $e) {
            $this->response->json(['error' => $e->getMessage()], 500);
        }
    }

    // Lấy sản phẩm mới nhất
    // Endpoint: GET /api/v1/products/latest
    public function latest($data = null)
    {
        try {
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
            $products = $this->productModel->getLatest($limit);
            $this->response->json($products, 200);
        } catch (Exception $e) {
            $this->response->json(['error' => $e->getMessage()], 500);
        }
    }

    // Lấy sản phẩm theo danh mục
    // Endpoint: GET /api/v1/products/category/{category_id}
    public function category($categoryId)
    {
        try {
            if (!is_numeric($categoryId)) {
                $this->response->json(['error' => 'Category ID không hợp lệ'], 400);
                return;
            }

            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : null;
            $products = $this->productModel->getByCategory($categoryId, $limit);
            $this->response->json($products, 200);
        } catch (Exception $e) {
            $this->response->json(['error' => $e->getMessage()], 500);
        }
    }

    // Lấy sản phẩm theo thương hiệu
    // Endpoint: GET /api/v1/products/brand/{brand_id}
    public function brand($brandId)
    {
        try {
            if (!is_numeric($brandId)) {
                $this->response->json(['error' => 'Brand ID không hợp lệ'], 400);
                return;
            }

            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : null;
            $products = $this->productModel->getByBrand($brandId, $limit);
            $this->response->json($products, 200);
        } catch (Exception $e) {
            $this->response->json(['error' => $e->getMessage()], 500);
        }
    }

    // Validate dữ liệu sản phẩm
    private function validateProductData($data, $isUpdate = false)
    {
        $errors = [];

        if (!$isUpdate) {
            if (empty($data->name)) {
                $errors['name'] = 'Tên sản phẩm là bắt buộc';
            }

            if (empty($data->category_id) || !is_numeric($data->category_id)) {
                $errors['category_id'] = 'ID danh mục là bắt buộc và phải là số';
            }

            if (empty($data->brand_id) || !is_numeric($data->brand_id)) {
                $errors['brand_id'] = 'ID thương hiệu là bắt buộc và phải là số';
            }
        } else {
            if (isset($data->name) && empty($data->name)) {
                $errors['name'] = 'Tên sản phẩm không được để trống';
            }

            if (isset($data->category_id) && (!is_numeric($data->category_id) || $data->category_id <= 0)) {
                $errors['category_id'] = 'ID danh mục phải là số hợp lệ';
            }

            if (isset($data->brand_id) && (!is_numeric($data->brand_id) || $data->brand_id <= 0)) {
                $errors['brand_id'] = 'ID thương hiệu phải là số hợp lệ';
            }
        }

        if (isset($data->status) && !in_array($data->status, [0, 1])) {
            $errors['status'] = 'Trạng thái phải là 0 hoặc 1';
        }

        return $errors;
    }
}