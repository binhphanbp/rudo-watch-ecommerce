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
            $query = "SELECT p.*, b.name as brand_name, b.slug as brand_slug, c.name as category_name, c.slug as category_slug 
                      FROM " . $this->table_name . " p
                      LEFT JOIN brands b ON p.brand_id = b.id
                      LEFT JOIN categories c ON p.category_id = c.id";
            $conditions = [];
            $bindings = [];

            // Tìm kiếm theo tên
            if (isset($params['search']) && !empty($params['search'])) {
                $conditions[] = "p.name LIKE :search";
                $bindings[':search'] = '%' . $params['search'] . '%';
            }

            // Lọc theo category
            if (isset($params['category_id']) && !empty($params['category_id'])) {
                $conditions[] = "p.category_id = :category_id";
                $bindings[':category_id'] = $params['category_id'];
            }

            // Lọc theo brand
            if (isset($params['brand_id']) && !empty($params['brand_id'])) {
                $conditions[] = "p.brand_id = :brand_id";
                $bindings[':brand_id'] = $params['brand_id'];
            }

            // Lọc theo status
            if (isset($params['status']) && $params['status'] !== '') {
                $conditions[] = "p.status = :status";
                $bindings[':status'] = $params['status'];
            }

            // Sắp xếp
            $orderBy = "ORDER BY p.created_at DESC";
            if (isset($params['sort_by'])) {
                $sortOrder = isset($params['sort_order']) && strtoupper($params['sort_order']) === 'ASC' ? 'ASC' : 'DESC';
                $allowedSorts = ['name', 'created_at', 'status'];
                if (in_array($params['sort_by'], $allowedSorts)) {
                    $orderBy = "ORDER BY p." . $params['sort_by'] . " " . $sortOrder;
                }
            }

            // Thêm điều kiện vào query
            if (!empty($conditions)) {
                $query .= " WHERE " . implode(" AND ", $conditions);
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

            // Decode specification và lấy variants cho mỗi sản phẩm
            if (!empty($products)) {
                require_once __DIR__ . '/ProductVariantModel.php';
                $variantsModel = new ProductVariants();

                // Lấy tất cả product IDs
                $productIds = array_column($products, 'id');

                // Lấy tất cả variants cho các products này trong 1 query
                $allVariants = $variantsModel->getByProductIds($productIds);

                // Group variants theo product_id
                $variantsByProduct = [];
                foreach ($allVariants as $variant) {
                    $variantsByProduct[$variant['product_id']][] = $variant;
                }

                foreach ($products as &$product) {
                    $product = $this->decodeSpecification($product);
                    // Gán variants cho mỗi sản phẩm
                    $product['variants'] = isset($variantsByProduct[$product['id']])
                        ? $variantsByProduct[$product['id']]
                        : [];
                }
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
            $query = "SELECT p.*, b.name as brand_name, b.slug as brand_slug, c.name as category_name, c.slug as category_slug "
                . "FROM " . $this->table_name . " p "
                . "LEFT JOIN brands b ON p.brand_id = b.id "
                . "LEFT JOIN categories c ON p.category_id = c.id "
                . "WHERE p.id = :id LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();

            $product = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$product) {
                return null;
            }

            // Decode JSON fields (specifications / thumbnail) so controller returns arrays/values
            $product = $this->decodeSpecification($product);

            // Lấy tất cả variants của sản phẩm này theo product_id
            require_once __DIR__ . '/ProductVariantModel.php';
            $variantsModel = new ProductVariants();
            $product['variants'] = $variantsModel->getByProductId($id);

            return $product;
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
                $slug = create_slug($data->name, function ($slug) {
                    return slug_exists($this->conn, $this->table_name, $slug);
                });
            } else {
                $slug = create_slug($data->slug, function ($slug) {
                    return slug_exists($this->conn, $this->table_name, $slug);
                });
            }

            // Xử lý specifications với giá trị mặc định
            $specifications = null;
            if (isset($data->specifications)) {
                if (is_string($data->specifications)) {
                    $decoded = json_decode($data->specifications);
                    $specifications = (json_last_error() === JSON_ERROR_NONE) ? $data->specifications : json_encode($data->specifications);
                } else {
                    $specifications = json_encode($data->specifications);
                }
            } else {
                // Giá trị mặc định cho specifications
                $defaultSpecs = [
                    "brand" => "",
                    "model" => "",
                    "color" => "",
                    "material" => "",
                    "size" => "",
                    "weight" => "",
                    "warranty" => "12 tháng"
                ];
                $specifications = json_encode($defaultSpecs);
            }

            // Xử lý thumbnail - encode thành JSON nếu là array/object với giá trị mặc định
            $thumbnail = null;
            if (isset($data->thumbnail)) {
                if (is_string($data->thumbnail)) {
                    $decoded = json_decode($data->thumbnail);
                    $thumbnail = (json_last_error() === JSON_ERROR_NONE) ? $data->thumbnail : json_encode($data->thumbnail);
                } else {
                    // Nếu là Array, encode thành JSON
                    $thumbnail = json_encode($data->thumbnail);
                }
            } else {
                // Giá trị mặc định cho thumbnail
                $defaultThumbnails = [
                    "uploads/products/place-holder-1.png",
                    "uploads/products/place-holder-2.png"
                ];
                $thumbnail = json_encode($defaultThumbnails);
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
                $slug = create_slug($data->slug, function ($slug) use ($id) {
                    return slug_exists($this->conn, $this->table_name, $slug, $id);
                }, $id);
            } elseif (isset($data->name) && $data->name !== $existing['name']) {
                $slug = create_slug($data->name, function ($slug) use ($id) {
                    return slug_exists($this->conn, $this->table_name, $slug, $id);
                }, $id);
            }

            // Xử lý specifications - encode thành JSON nếu là Array với fallback
            $specifications = $existing['specifications'];
            if (isset($data->specifications)) {
                if (is_string($data->specifications)) {
                    $decoded = json_decode($data->specifications);
                    $specifications = (json_last_error() === JSON_ERROR_NONE) ? $data->specifications : json_encode($data->specifications);
                } else {
                    // Nếu là Array, encode thành JSON
                    $specifications = json_encode($data->specifications);
                }
            } else if (empty($existing['specifications']) || $existing['specifications'] === 'null') {
                // Nếu không có specifications cũ, thêm mặc định
                $defaultSpecs = [
                    "Kích thước: 45mm",
                    "Chống nước: 100m",
                    "Chất liệu: Thép không gỉ",
                    "Máy: Quartz"
                ];
                $specifications = json_encode($defaultSpecs);
            }

            // Xử lý thumbnail - encode thành JSON nếu là array/object với fallback
            $thumbnail = $existing['thumbnail']; // Giữ nguyên giá trị cũ nếu không có update
            if (isset($data->thumbnail)) {
                if (is_string($data->thumbnail)) {
                    $decoded = json_decode($data->thumbnail);
                    $thumbnail = (json_last_error() === JSON_ERROR_NONE) ? $data->thumbnail : json_encode($data->thumbnail);
                } else {
                    // Nếu là Array, encode thành JSON
                    $thumbnail = json_encode($data->thumbnail);
                }
            } else if (empty($existing['thumbnail']) || $existing['thumbnail'] === 'null') {
                // Nếu không có thumbnail cũ, thêm mặc định
                $defaultThumbnails = [
                    "uploads/products/place-holder-1.png",
                    "uploads/products/place-holder-2.png"
                ];
                $thumbnail = json_encode($defaultThumbnails);
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
            $query = "SELECT p.*, b.name as brand_name, b.slug as brand_slug, c.name as category_name, c.slug as category_slug "
                . "FROM " . $this->table_name . " p "
                . "LEFT JOIN brands b ON p.brand_id = b.id "
                . "LEFT JOIN categories c ON p.category_id = c.id "
                . "WHERE p.slug = :slug LIMIT 1";
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
            $query = "SELECT p.*, b.name as brand_name, b.slug as brand_slug, c.name as category_name, c.slug as category_slug "
                . "FROM " . $this->table_name . " p "
                . "LEFT JOIN brands b ON p.brand_id = b.id "
                . "LEFT JOIN categories c ON p.category_id = c.id "
                . "WHERE p.status = 1 "
                . "ORDER BY p.created_at DESC "
                . "LIMIT :limit";

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
            $query = "SELECT p.*, b.name as brand_name, b.slug as brand_slug, c.name as category_name, c.slug as category_slug "
                . "FROM " . $this->table_name . " p "
                . "LEFT JOIN brands b ON p.brand_id = b.id "
                . "LEFT JOIN categories c ON p.category_id = c.id "
                . "WHERE p.status = 1 "
                . "ORDER BY p.created_at DESC "
                . "LIMIT :limit";

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
            $query = "SELECT p.*, b.name as brand_name, b.slug as brand_slug, c.name as category_name, c.slug as category_slug "
                . "FROM " . $this->table_name . " p "
                . "LEFT JOIN brands b ON p.brand_id = b.id "
                . "LEFT JOIN categories c ON p.category_id = c.id "
                . "WHERE p.category_id = :category_id AND p.status = 1 "
                . "ORDER BY p.created_at DESC";

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
            $query = "SELECT p.*, b.name as brand_name, b.slug as brand_slug, c.name as category_name, c.slug as category_slug "
                . "FROM " . $this->table_name . " p "
                . "LEFT JOIN brands b ON p.brand_id = b.id "
                . "LEFT JOIN categories c ON p.category_id = c.id "
                . "WHERE p.brand_id = :brand_id AND p.status = 1 "
                . "ORDER BY p.created_at DESC";

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
            $query = "SELECT p.*, b.name as brand_name, b.slug as brand_slug, c.name as category_name, c.slug as category_slug "
                . "FROM " . $this->table_name . " p "
                . "LEFT JOIN brands b ON p.brand_id = b.id "
                . "LEFT JOIN categories c ON p.category_id = c.id "
                . "WHERE (p.name LIKE :keyword OR p.description LIKE :keyword) "
                . "AND p.status = 1 "
                . "ORDER BY p.name ASC";

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

    // Xóa tất cả sản phẩm theo brand_id
    public function deleteByBrand($brandId)
    {
        try {
            $query = "DELETE FROM " . $this->table_name . " WHERE brand_id = :brand_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':brand_id', $brandId, PDO::PARAM_INT);

            return $stmt->execute();
        } catch (PDOException $e) {
            throw $e;
        }
    }

    public function getByCategorySlug($categorySlug, $limit = null)
    {
        try {
            $query = "SELECT p.*, b.name as brand_name, b.slug as brand_slug, c.name as category_name, c.slug as category_slug FROM " . $this->table_name . " p\n                      INNER JOIN categories c ON p.category_id = c.id\n                      LEFT JOIN brands b ON p.brand_id = b.id\n                      WHERE c.slug = :category_slug AND p.status = 1\n                      ORDER BY p.created_at DESC";

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
