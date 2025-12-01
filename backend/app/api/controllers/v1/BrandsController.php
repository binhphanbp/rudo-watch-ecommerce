<?php
require_once __DIR__ . '/../../../models/BrandModel.php';
require_once __DIR__ . '/../../../models/ProductModel.php';
require_once __DIR__ . '/../../../core/Response.php';

class BrandsController
{
    private $brandsModel;
    private $productsModel;
    private $response;

    public function __construct()
    {
        $this->brandsModel = new Brands();
        $this->productsModel = new Products();
        $this->response = new Response();
    }

    public function index()
    {
        try {
            $result = $this->brandsModel->getAll();
            $this->response->json($result, 200);
        } catch (Exception $e) {
            $this->response->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        try {
            if (!is_numeric($id)) {
                $this->response->json(['error' => 'ID không hợp lệ'], 400);
                return;
            }

            $brand = $this->brandsModel->getById($id);

            if (!$brand) {
                $this->response->json(['error' => 'Thương hiệu không tồn tại'], 404);
                return;
            }

            $brand['product_count'] = $this->brandsModel->countProducts($id);
            $this->response->json($brand, 200);
        } catch (Exception $e) {
            $this->response->json(['error' => $e->getMessage()], 500);
        }
    }

    public function showBySlug($slug)
    {
        try {
            if (empty($slug)) {
                $this->response->json(['error' => 'Slug không hợp lệ'], 400);
                return;
            }

            $brand = $this->brandsModel->getBySlug($slug);
            if (!$brand) {
                $this->response->json(['error' => 'Thương hiệu không tồn tại'], 404);
                return;
            }

            $brand['product_count'] = $this->brandsModel->countProducts($brand['id']);
            $this->response->json($brand, 200);
        } catch (Exception $e) {
            $this->response->json(['error' => $e->getMessage()], 500);
        }
    }

    public function store($data)
    {
        try {
            $errors = $this->validateBrandData($data, false);

            if (!empty($errors)) {
                $this->response->json(['errors' => $errors], 400);
                return;
            }

            $result = $this->brandsModel->create($data);

            if ($result) {
                $this->response->json([
                    'message' => 'Tạo thương hiệu thành công',
                    'data' => $result
                ], 201);
            } else {
                $this->response->json(['error' => 'Không thể tạo thương hiệu'], 500);
            }
        } catch (Exception $e) {
            $this->response->json(['error' => $e->getMessage()], 500);
        }
    }

    public function update($id)
    {
        try {
            if (!is_numeric($id)) {
                $this->response->json(['error' => 'ID không hợp lệ'], 400);
                return;
            }

            $brand = $this->brandsModel->getById($id);
            if (!$brand) {
                $this->response->json(['error' => 'Thương hiệu không tồn tại'], 404);
                return;
            }

            $data = json_decode(file_get_contents("php://input"));
            if (!$data) {
                $this->response->json(['error' => 'Dữ liệu không hợp lệ'], 400);
                return;
            }

            $errors = $this->validateBrandData($data, true);
            if (!empty($errors)) {
                $this->response->json(['errors' => $errors], 400);
                return;
            }

            if (!isset($data->name) && !isset($data->slug)) {
                $this->response->json(['error' => 'Cần ít nhất một trường để cập nhật (name hoặc slug)'], 400);
                return;
            }

            if (!isset($data->name)) {
                $data->name = $brand['name'];
            }

            $result = $this->brandsModel->update($id, $data);

            if ($result) {
                $this->response->json([
                    'message' => 'Cập nhật thương hiệu thành công',
                    'data' => $result
                ], 200);
            } else {
                $this->response->json(['error' => 'Không thể cập nhật thương hiệu'], 500);
            }
        } catch (Exception $e) {
            $this->response->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            if (!is_numeric($id)) {
                $this->response->json(['error' => 'ID không hợp lệ'], 400);
                return;
            }

            $brand = $this->brandsModel->getById($id);
            if (!$brand) {
                $this->response->json(['error' => 'Thương hiệu không tồn tại'], 404);
                return;
            }

            $productCount = $this->brandsModel->countProducts($id);
            if ($productCount > 0) {
                $confirm = isset($_GET['confirm']) && $_GET['confirm'] === 'true';

                if (!$confirm) {
                    $this->response->json([
                        'message' => 'Thương hiệu này đang có ' . $productCount . ' sản phẩm. Bạn có muốn xóa tất cả sản phẩm và thương hiệu này không?',
                        'product_count' => $productCount,
                        'requires_confirmation' => true,
                        'brand' => $brand
                    ], 200);
                    return;
                }

                // Xóa tất cả sản phẩm của brand
                $deleteResult = $this->productsModel->deleteByBrand($id);

                if (!$deleteResult) {
                    $this->response->json(['error' => 'Không thể xóa sản phẩm của thương hiệu'], 500);
                    return;
                }
            }

            $result = $this->brandsModel->delete($id);
            if ($result) {
                $message = $productCount > 0
                    ? "Đã xóa $productCount sản phẩm và thương hiệu thành công"
                    : 'Xóa thương hiệu thành công';
                $this->response->json(['message' => $message], 200);
            } else {
                $this->response->json(['error' => 'Không thể xóa thương hiệu'], 500);
            }
        } catch (Exception $e) {
            $this->response->json(['error' => $e->getMessage()], 500);
        }
    }

    private function validateBrandData($data, $isUpdate = false)
    {
        $errors = [];

        if (!$isUpdate) {
            if (empty($data->name)) {
                $errors['name'] = 'Tên thương hiệu là bắt buộc';
            } elseif (strlen($data->name) > 255) {
                $errors['name'] = 'Tên thương hiệu không được vượt quá 255 ký tự';
            }
        } else {
            if (isset($data->name)) {
                if (empty(trim($data->name))) {
                    $errors['name'] = 'Tên thương hiệu không được để trống';
                } elseif (strlen($data->name) > 255) {
                    $errors['name'] = 'Tên thương hiệu không được vượt quá 255 ký tự';
                }
            }
        }
        return $errors;
    }
}