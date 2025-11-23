<?php 
require_once __DIR__ . '/../../../models/Categories.php';
require_once __DIR__ . '/../../../models/Products.php';
require_once __DIR__ . '/../../../core/Response.php';


class CategoriesController{
    
    private $categoriesModel;
    private $productsModel;
    private $response;


    public function __construct(){
        $this->categoriesModel = new Categories();
        $this->productsModel = new Products();
        $this->response = new Response();
    }


    public function index()
    {
        try {
            $categories = $this->categoriesModel->getAll();
            $this->response->json($categories, 200);
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

            $category = $this->categoriesModel->getById($id);

            if (!$category) {
                $this->response->json(['error' => 'Danh mục không tồn tại'], 404);
                return;
            }

            $this->response->json($category, 200);
        } catch (Exception $e) {
            $this->response->json(['error' => $e->getMessage()], 500);
        }
    }


    public function store($data)
    {
        try {
            $errors = $this->validateCategoryData($data, false);
            if (!empty($errors)) {
                $this->response->json(['errors' => $errors], 400);
                return;
            }

            if (empty($data->slug)) {
                $slug = create_slug($data->name);
            } else {
                $slug = create_slug($data->slug);
            }

            $result = $this->categoriesModel->insert(
                $data->name,
                $slug,
                $data->status ?? 1
            );

            if ($result) {
                $this->response->json([
                    'message' => 'Tạo danh mục thành công',
                    'data' => $result
                ], 201);
            } else {
                $this->response->json(['error' => 'Không thể tạo danh mục'], 500);
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

            $category = $this->categoriesModel->getById($id);
            if (!$category) {
                $this->response->json(['error' => 'Danh mục không tồn tại'], 404);
                return;
            }

            $data = json_decode(file_get_contents("php://input"));
            if (!$data) {
                $this->response->json(['error' => 'Dữ liệu không hợp lệ'], 400);
                return;
            }

            $errors = $this->validateCategoryData($data, true);
            if (!empty($errors)) {
                $this->response->json(['errors' => $errors], 400);
                return;
            }

            $name = $data->name ?? $category['name'];
            
            if (isset($data->slug) && !empty($data->slug) && $data->slug !== $category['slug']) {
                $slug = create_slug($data->slug);
            } elseif (isset($data->name) && $data->name !== $category['name']) {
                $slug = create_slug($data->name);
            } else {
                $slug = $category['slug'];
            }
            
            $status = $data->status ?? $category['status'];
            $result = $this->categoriesModel->update($id, $name, $slug, $status);

            if ($result) {
                $this->response->json([
                    'message' => 'Cập nhật danh mục thành công',
                    'data' => $result
                ], 200);
            } else {
                $this->response->json(['error' => 'Không thể cập nhật danh mục'], 500);
            }
        } catch (Exception $e) {
            $this->response->json(['error' => $e->getMessage()], 500);
        }
    }


    public function destroy($id){
        try {
            if (!is_numeric($id)) {
                $this->response->json(['error' => 'ID không hợp lệ'], 400);
                return;
            }

            $category = $this->categoriesModel->getById($id);

            if (!$category) {
                $this->response->json(['error' => 'Danh mục không tồn tại'], 404);
                return;
            }

            $productCount = $this->productsModel->countByCategory($id);

            if ($productCount > 0) {
                $confirm = isset($_GET['confirm']) && $_GET['confirm'] === 'true';
                
                if (!$confirm) {
                    $this->response->json([
                        'message' => 'Danh mục này đang có ' . $productCount . ' sản phẩm. Bạn có muốn xóa tất cả sản phẩm và danh mục này không?',
                        'product_count' => $productCount,
                        'requires_confirmation' => true,
                        'category' => $category
                    ], 200);
                    return;
                } else {
                    $deleteProducts = $this->productsModel->deleteByCategory($id);
                    
                    if (!$deleteProducts) {
                        $this->response->json(['error' => 'Không thể xóa sản phẩm'], 500);
                        return; 
                    }
                }
            }

            $result = $this->categoriesModel->delete($id);

            if ($result) {
                $message = $productCount > 0 
                    ? "Đã xóa $productCount sản phẩm và danh mục thành công" 
                    : 'Xóa danh mục thành công';
                $this->response->json(['message' => $message], 200);
            } else {
                $this->response->json(['error' => 'Không thể xóa danh mục'], 500);
            }
        } catch (Exception $e) {
            $this->response->json(['error' => $e->getMessage()], 500);
        }
    }


    private function validateCategoryData($data, $isUpdate = false)
    {
        $errors = [];

        if (!$isUpdate) {
            if (empty($data->name)) {
                $errors['name'] = 'Tên danh mục là bắt buộc';
            }
        } else {
            if (isset($data->name) && empty($data->name)) {
                $errors['name'] = 'Tên danh mục không được để trống';
            }
        }

        if (isset($data->status) && !in_array($data->status, [0, 1])) {
            $errors['status'] = 'Trạng thái phải là 0 hoặc 1';
        }

        return $errors;
    }
}