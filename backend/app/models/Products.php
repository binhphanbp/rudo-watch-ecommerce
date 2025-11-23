<?php 
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../../config/function.php';

class Products
{
    private $conn;
    private $table_name = 'products';
    public $response;

    // Các thuộc tính của sản phẩm
    public $id;
    public $model_code;
    public $category_id;
    public $brand_id;
    public $name;
    public $slug;
    public $specifications;
    public $description;
    public $image;
    public $thumbnail;
    public $created_at;
    public $status;

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->getConnection();
        $this->response = new Response();
    }

    // Lấy tất cả sản phẩm
    public function getAll($params = [])
    {
        try {
            $query = "SELECT * FROM " . $this->table_name . "";
            $conditions = [];
            $bindings = [];

            // Tìm kiếm theo tên
            if (isset($params['search']) && !empty($params['search'])) {
                $conditions[] = "name LIKE :search";
                $bindings[':search'] = '%' . $params['search'] . '%';
            }

            // Lọc theo category
            if (isset($params['category_id']) && !empty($params['category_id'])) {
                $conditions[] = "category_id = :category_id";
                $bindings[':category_id'] = $params['category_id'];
            }

            // Lọc theo brand
            if (isset($params['brand_id']) && !empty($params['brand_id'])) {
                $conditions[] = "brand_id = :brand_id";
                $bindings[':brand_id'] = $params['brand_id'];
            }

            // Lọc theo status
            if (isset($params['status']) && $params['status'] !== '') {
                $conditions[] = "status = :status";
                $bindings[':status'] = $params['status'];
            }

            // Sắp xếp
            $orderBy = "ORDER BY created_at DESC";
            if (isset($params['sort_by'])) {
                $sortOrder = isset($params['sort_order']) && strtoupper($params['sort_order']) === 'ASC' ? 'ASC' : 'DESC';
                $allowedSorts = ['name', 'created_at', 'status'];
                if (in_array($params['sort_by'], $allowedSorts)) {
                    $orderBy = "ORDER BY " . $params['sort_by'] . " " . $sortOrder;
                }
            }

            // Thêm điều kiện vào query
            if (!empty($conditions)) {
                $query .= " AND " . implode(" AND ", $conditions);
            }

            $query .= " " . $orderBy;

            // Phân trang
            $page = isset($params['page']) ? (int)$params['page'] : 1;
            $limit = isset($params['limit']) ? (int)$params['limit'] : 10;
            $offset = ($page - 1) * $limit;
            $query .= " LIMIT :limit OFFSET :offset";

            $stmt = $this->conn->prepare($query);


            foreach ($bindings as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

            $stmt->execute();
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Decode specification từ JSON cho mỗi sản phẩm
            foreach ($products as &$product) {
                $product = $this->decodeSpecification($product);
            }

            $countQuery = "SELECT COUNT(*) as total FROM " . $this->table_name . " WHERE 1=1";
            if (!empty($conditions)) {
                $countQuery .= " AND " . implode(" AND ", $conditions);
            }
            $countStmt = $this->conn->prepare($countQuery);
            foreach ($bindings as $key => $value) {
                $countStmt->bindValue($key, $value);
            }
            $countStmt->execute();
            $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

            return [
                'data' => $products,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $limit,
                    'total' => (int)$total,
                    'total_pages' => ceil($total / $limit)
                ]
            ];
        } catch (PDOException $e) {
            throw $e;
        }
    }

    // Lấy sản phẩm theo ID
    public function getById($id)
    {
        try {
            $query = "SELECT * FROM " . $this->table_name . " WHERE id = :id LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();

            $product = $stmt->fetch(PDO::FETCH_ASSOC);
            return $product ? $product : null;
        } catch (PDOException $e) {
            throw $e;
        }
    }

    // Decode specifications và thumbnail từ JSON và trim các giá trị
    private function decodeSpecification($product)
    {
        // Decode specifications
        if (isset($product['specifications']) && !empty($product['specifications'])) {
            $decoded = json_decode($product['specifications'], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                // Trim các giá trị nếu là array
                if (is_array($decoded)) {
                    $product['specifications'] = array_map('trim', $decoded);
                } else {
                    $product['specifications'] = trim($decoded);
                }
            }
        } else {
            $product['specifications'] = null;
        }

        // Decode thumbnail
        if (isset($product['thumbnail']) && !empty($product['thumbnail'])) {
            $decoded = json_decode($product['thumbnail'], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                // Trim các giá trị nếu là array
                if (is_array($decoded)) {
                    $product['thumbnail'] = array_map('trim', $decoded);
                } else {
                    $product['thumbnail'] = trim($decoded);
                }
            }
        } else {
            $product['thumbnail'] = null;
        }

        return $product;
    }

    // Tạo sản phẩm mới
    public function create($data)
    {
        try {
            if (empty($data->slug)) {
                $slug = create_slug($data->name, function($slug) {
                    return slug_exists($this->conn, $this->table_name, $slug);
                });
            } else {
                $slug = create_slug($data->slug, function($slug) {
                    return slug_exists($this->conn, $this->table_name, $slug);
                });
            }

            $specifications = null;
            if (isset($data->specifications)) {
                if (is_string($data->specifications)) {
                    $decoded = json_decode($data->specifications);
                    $specifications = (json_last_error() === JSON_ERROR_NONE) ? $data->specifications : json_encode($data->specifications);
                } else {
                    $specifications = json_encode($data->specifications);
                }
            }

            // Xử lý thumbnail - encode thành JSON nếu là array/object
            $thumbnail = null;
            if (isset($data->thumbnail)) {
                if (is_string($data->thumbnail)) {
                    $decoded = json_decode($data->thumbnail);
                    $thumbnail = (json_last_error() === JSON_ERROR_NONE) ? $data->thumbnail : json_encode($data->thumbnail);
                } else {
                    // Nếu là Array, encode thành JSON
                    $thumbnail = json_encode($data->thumbnail);
                }
            }

            $query = "INSERT INTO " . $this->table_name . " 
                      (model_code, category_id, brand_id, name, slug, specifications, description, image, thumbnail, status, created_at) 
                      VALUES 
                      (:model_code, :category_id, :brand_id, :name, :slug, :specifications, :description, :image, :thumbnail, :status, NOW())";

            $stmt = $this->conn->prepare($query);

            $stmt->bindParam(':model_code', $data->model_code);
            $stmt->bindParam(':category_id', $data->category_id, PDO::PARAM_INT);
            $stmt->bindParam(':brand_id', $data->brand_id, PDO::PARAM_INT);
            $stmt->bindParam(':name', $data->name);
            $stmt->bindParam(':slug', $slug);
            $stmt->bindParam(':specifications', $specifications);
            $stmt->bindParam(':description', $data->description);
            $stmt->bindParam(':image', $data->image);
            $stmt->bindParam(':thumbnail', $thumbnail);
            $status = isset($data->status) ? $data->status : 1;
            $stmt->bindParam(':status', $status, PDO::PARAM_INT);

            if ($stmt->execute()) {
                $lastId = $this->conn->lastInsertId();
                return $this->getById($lastId);
            }

            return null;
        } catch (PDOException $e) {
            throw $e;
        }
    }

    // Cập nhật sản phẩm
    public function update($id, $data)
    {
        try {
            $existing = $this->getById($id);
            if (!$existing) {
                return null;
            }

            $slug = $existing['slug'];
            if (isset($data->slug) && !empty($data->slug) && $data->slug !== $existing['slug']) {
                $slug = create_slug($data->slug, function($slug) use ($id) {
                    return slug_exists($this->conn, $this->table_name, $slug, $id);
                }, $id);
            } elseif (isset($data->name) && $data->name !== $existing['name']) {
                $slug = create_slug($data->name, function($slug) use ($id) {
                    return slug_exists($this->conn, $this->table_name, $slug, $id);
                }, $id);
            }

            // Encode thành JSON nếu là Array
            $specifications = $existing['specifications']; 
            if (isset($data->specifications)) {
                if (is_string($data->specifications)) {
                    $decoded = json_decode($data->specifications);
                    $specifications = (json_last_error() === JSON_ERROR_NONE) ? $data->specifications : json_encode($data->specifications);
                } else {
                    // Nếu là Array, encode thành JSON
                    $specifications = json_encode($data->specifications);
                }
            }

            // Xử lý thumbnail - encode thành JSON nếu là array/object
            $thumbnail = $existing['thumbnail']; // Giữ nguyên giá trị cũ nếu không có update
            if (isset($data->thumbnail)) {
                if (is_string($data->thumbnail)) {
                    $decoded = json_decode($data->thumbnail);
                    $thumbnail = (json_last_error() === JSON_ERROR_NONE) ? $data->thumbnail : json_encode($data->thumbnail);
                } else {
                    // Nếu là Array, encode thành JSON
                    $thumbnail = json_encode($data->thumbnail);
                }
            }

            $query = "UPDATE " . $this->table_name . " SET 
                      model_code = :model_code,
                      category_id = :category_id,
                      brand_id = :brand_id,
                      name = :name,
                      slug = :slug,
                      specifications = :specifications,
                      description = :description,
                      image = :image,
                      thumbnail = :thumbnail,
                      status = :status
                      WHERE id = :id";

            $stmt = $this->conn->prepare($query);

            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->bindParam(':model_code', $data->model_code);
            $stmt->bindParam(':category_id', $data->category_id, PDO::PARAM_INT);
            $stmt->bindParam(':brand_id', $data->brand_id, PDO::PARAM_INT);
            $stmt->bindParam(':name', $data->name);
            $stmt->bindParam(':slug', $slug);
            $stmt->bindParam(':specifications', $specifications);
            $stmt->bindParam(':description', $data->description);
            $stmt->bindParam(':image', $data->image);
            $stmt->bindParam(':thumbnail', $thumbnail);
            $stmt->bindParam(':status', $data->status, PDO::PARAM_INT);

            if ($stmt->execute()) {
                return $this->getById($id);
            }

            return null;
        } catch (PDOException $e) {
            throw $e;
        }
    }

    // Xóa sản phẩm
    public function delete($id)
    {
        try {
            $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);

            return $stmt->execute();
        } catch (PDOException $e) {
            throw $e;
        }
    }

    // Lấy sản phẩm theo slug
    public function getBySlug($slug)
    {
        try {
            $query = "SELECT * FROM " . $this->table_name . " WHERE slug = :slug LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':slug', $slug);
            $stmt->execute();

            $product = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($product) {
                $product = $this->decodeSpecification($product);
            }
            return $product ? $product : null;
        } catch (PDOException $e) {
            throw $e;
        }
    }

    // Lấy sản phẩm nổi bật
    public function getFeatured($limit = 10)
    {
        try {
            $query = "SELECT * FROM " . $this->table_name . " 
                      WHERE status = 1 
                      ORDER BY created_at DESC 
                      LIMIT :limit";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();

            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($products as &$product) {
                $product = $this->decodeSpecification($product);
            }
            return $products;
        } catch (PDOException $e) {
            throw $e;
        }
    }

    // Lấy sản phẩm mới nhất
    public function getLatest($limit = 10)
    {
        try {
            $query = "SELECT * FROM " . $this->table_name . " 
                      WHERE status = 1 
                      ORDER BY created_at DESC 
                      LIMIT :limit";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();

            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($products as &$product) {
                $product = $this->decodeSpecification($product);
            }
            return $products;
        } catch (PDOException $e) {
            throw $e;
        }
    }

    // Lấy sản phẩm theo category
    public function getByCategory($categoryId, $limit = null)
    {
        try {
            $query = "SELECT * FROM " . $this->table_name . " 
                      WHERE category_id = :category_id AND status = 1 
                      ORDER BY created_at DESC";
            
            if ($limit) {
                $query .= " LIMIT :limit";
            }
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':category_id', $categoryId, PDO::PARAM_INT);
            if ($limit) {
                $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            }
            $stmt->execute();

            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($products as &$product) {
                $product = $this->decodeSpecification($product);
            }
            return $products;
        } catch (PDOException $e) {
            throw $e;
        }
    }

    // Lấy sản phẩm theo brand
    public function getByBrand($brandId, $limit = null)
    {
        try {
            $query = "SELECT * FROM " . $this->table_name . " 
                      WHERE brand_id = :brand_id AND status = 1 
                      ORDER BY created_at DESC";
            
            if ($limit) {
                $query .= " LIMIT :limit";
            }
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':brand_id', $brandId, PDO::PARAM_INT);
            if ($limit) {
                $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            }
            $stmt->execute();

            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($products as &$product) {
                $product = $this->decodeSpecification($product);
            }
            return $products;
        } catch (PDOException $e) {
            throw $e;
        }
    }

    // Tìm kiếm sản phẩm
    public function search($keyword)
    {
        try {
            $query = "SELECT * FROM " . $this->table_name . " 
                      WHERE (name LIKE :keyword OR description LIKE :keyword) 
                      AND status = 1
                      ORDER BY name ASC";
            
            $stmt = $this->conn->prepare($query);
            $searchTerm = '%' . $keyword . '%';
            $stmt->bindParam(':keyword', $searchTerm);
            $stmt->execute();

            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($products as &$product) {
                $product = $this->decodeSpecification($product);
            }
            return $products;
        } catch (PDOException $e) {
            throw $e;
        }
    }

    // Đếm số sản phẩm theo category_id
    public function countByCategory($categoryId)
    {
        try {
            $query = "SELECT COUNT(*) as total FROM " . $this->table_name . " WHERE category_id = :category_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':category_id', $categoryId, PDO::PARAM_INT);
            $stmt->execute();
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int)$result['total'];
        } catch (PDOException $e) {
            throw $e;
        }
    }

    // Xóa tất cả sản phẩm theo category_id
    public function deleteByCategory($categoryId)
    {
        try {
            $query = "DELETE FROM " . $this->table_name . " WHERE category_id = :category_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':category_id', $categoryId, PDO::PARAM_INT);
            
            return $stmt->execute();
        } catch (PDOException $e) {
            throw $e;
        }
    }

    public function getByCategorySlug($categorySlug, $limit = null)
    {
        try {
            $query = "SELECT p.* FROM " . $this->table_name . " p
                      INNER JOIN categories c ON p.category_id = c.id
                      WHERE c.slug = :category_slug AND p.status = 1
                      ORDER BY p.created_at DESC";
            
            if ($limit) {
                $query .= " LIMIT :limit";
            }
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':category_slug', $categorySlug);
            if ($limit) {
                $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            }
            $stmt->execute();
            
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($products as &$product) {
                $product = $this->decodeSpecification($product);
            }
            return $products;
        } catch (PDOException $e) {
            throw $e;
        }
    }
}