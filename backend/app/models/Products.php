<?php 
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../core/Response.php';

class Products
{
    private $conn;
    private $table_name = 'products';
    public $response;

    // Các thuộc tính của sản phẩm
    public $id;
    public $category_id;
    public $brand_id;
    public $name;
    public $slug;
    public $description;
    public $image;
    public $create_at;
    public $status;

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->getConnection();
        $this->response = new Response();
    }

    /**
     * Lấy tất cả sản phẩm
     * @param array $params - Các tham số tìm kiếm, phân trang
     * @return array
     */
    public function getAll($params = [])
    {
        try {
            $query = "SELECT * FROM " . $this->table_name . " WHERE 1=1";
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
            $orderBy = "ORDER BY create_at DESC";
            if (isset($params['sort_by'])) {
                $sortOrder = isset($params['sort_order']) && strtoupper($params['sort_order']) === 'ASC' ? 'ASC' : 'DESC';
                $allowedSorts = ['name', 'create_at', 'status'];
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

            // Bind các tham số
            foreach ($bindings as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

            $stmt->execute();
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Đếm tổng số bản ghi (không phân trang)
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

    /**
     * Lấy sản phẩm theo ID
     * @param int $id
     * @return array|null
     */
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

    /**
     * Tạo slug từ tên sản phẩm
     * @param string $name
     * @return string
     */
    private function generateSlug($name)
    {
        // Chuyển đổi tiếng Việt có dấu sang không dấu
        $name = mb_strtolower($name, 'UTF-8');
        $name = preg_replace('/[àáạảãâầấậẩẫăằắặẳẵ]/u', 'a', $name);
        $name = preg_replace('/[èéẹẻẽêềếệểễ]/u', 'e', $name);
        $name = preg_replace('/[ìíịỉĩ]/u', 'i', $name);
        $name = preg_replace('/[òóọỏõôồốộổỗơờớợởỡ]/u', 'o', $name);
        $name = preg_replace('/[ùúụủũưừứựửữ]/u', 'u', $name);
        $name = preg_replace('/[ỳýỵỷỹ]/u', 'y', $name);
        $name = preg_replace('/đ/u', 'd', $name);
        
        // Chuyển khoảng trắng thành dấu gạch ngang
        $name = preg_replace('/[^a-z0-9]+/', '-', $name);
        $name = trim($name, '-');
        
        return $name;
    }

    /**
     * Kiểm tra slug đã tồn tại chưa
     * @param string $slug
     * @param int $excludeId - ID sản phẩm cần loại trừ (khi update)
     * @return bool
     */
    private function slugExists($slug, $excludeId = null)
    {
        $query = "SELECT id FROM " . $this->table_name . " WHERE slug = :slug";
        if ($excludeId) {
            $query .= " AND id != :exclude_id";
        }
        $query .= " LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':slug', $slug);
        if ($excludeId) {
            $stmt->bindParam(':exclude_id', $excludeId, PDO::PARAM_INT);
        }
        $stmt->execute();
        
        return $stmt->rowCount() > 0;
    }

    /**
     * Tạo slug duy nhất
     * @param string $name
     * @param int $excludeId
     * @return string
     */
    private function createUniqueSlug($name, $excludeId = null)
    {
        $baseSlug = $this->generateSlug($name);
        $slug = $baseSlug;
        $counter = 1;
        
        while ($this->slugExists($slug, $excludeId)) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }
        
        return $slug;
    }

    /**
     * Tạo sản phẩm mới
     * @param object $data
     * @return array
     */
    public function create($data)
    {
        try {
            // Tạo slug nếu chưa có
            if (empty($data->slug)) {
                $slug = $this->createUniqueSlug($data->name);
            } else {
                $slug = $this->createUniqueSlug($data->slug);
            }

            $query = "INSERT INTO " . $this->table_name . " 
                      (category_id, brand_id, name, slug, description, image, status, create_at) 
                      VALUES 
                      (:category_id, :brand_id, :name, :slug, :description, :image, :status, NOW())";

            $stmt = $this->conn->prepare($query);

            // Bind các tham số
            $stmt->bindParam(':category_id', $data->category_id, PDO::PARAM_INT);
            $stmt->bindParam(':brand_id', $data->brand_id, PDO::PARAM_INT);
            $stmt->bindParam(':name', $data->name);
            $stmt->bindParam(':slug', $slug);
            $stmt->bindParam(':description', $data->description);
            $stmt->bindParam(':image', $data->image);
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

    /**
     * Cập nhật sản phẩm
     * @param int $id
     * @param object $data
     * @return array|null
     */
    public function update($id, $data)
    {
        try {
            // Kiểm tra sản phẩm có tồn tại không
            $existing = $this->getById($id);
            if (!$existing) {
                return null;
            }

            // Xử lý slug
            $slug = $existing['slug'];
            if (isset($data->slug) && !empty($data->slug) && $data->slug !== $existing['slug']) {
                $slug = $this->createUniqueSlug($data->slug, $id);
            } elseif (isset($data->name) && $data->name !== $existing['name']) {
                $slug = $this->createUniqueSlug($data->name, $id);
            }

            $query = "UPDATE " . $this->table_name . " SET 
                      category_id = :category_id,
                      brand_id = :brand_id,
                      name = :name,
                      slug = :slug,
                      description = :description,
                      image = :image,
                      status = :status
                      WHERE id = :id";

            $stmt = $this->conn->prepare($query);

            // Bind các tham số
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->bindParam(':category_id', $data->category_id, PDO::PARAM_INT);
            $stmt->bindParam(':brand_id', $data->brand_id, PDO::PARAM_INT);
            $stmt->bindParam(':name', $data->name);
            $stmt->bindParam(':slug', $slug);
            $stmt->bindParam(':description', $data->description);
            $stmt->bindParam(':image', $data->image);
            $stmt->bindParam(':status', $data->status, PDO::PARAM_INT);

            if ($stmt->execute()) {
                return $this->getById($id);
            }

            return null;
        } catch (PDOException $e) {
            throw $e;
        }
    }

    /**
     * Xóa sản phẩm
     * @param int $id
     * @return bool
     */
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

    /**
     * Lấy sản phẩm theo slug
     * @param string $slug
     * @return array|null
     */
    public function getBySlug($slug)
    {
        try {
            $query = "SELECT * FROM " . $this->table_name . " WHERE slug = :slug LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':slug', $slug);
            $stmt->execute();

            $product = $stmt->fetch(PDO::FETCH_ASSOC);
            return $product ? $product : null;
        } catch (PDOException $e) {
            throw $e;
        }
    }

    /**
     * Lấy sản phẩm nổi bật
     * @param int $limit
     * @return array
     */
    public function getFeatured($limit = 10)
    {
        try {
            $query = "SELECT * FROM " . $this->table_name . " 
                      WHERE status = 1 
                      ORDER BY create_at DESC 
                      LIMIT :limit";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw $e;
        }
    }

    /**
     * Lấy sản phẩm mới nhất
     * @param int $limit
     * @return array
     */
    public function getLatest($limit = 10)
    {
        try {
            $query = "SELECT * FROM " . $this->table_name . " 
                      WHERE status = 1 
                      ORDER BY create_at DESC 
                      LIMIT :limit";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw $e;
        }
    }

    /**
     * Lấy sản phẩm theo category
     * @param int $categoryId
     * @param int $limit
     * @return array
     */
    public function getByCategory($categoryId, $limit = null)
    {
        try {
            $query = "SELECT * FROM " . $this->table_name . " 
                      WHERE category_id = :category_id AND status = 1 
                      ORDER BY create_at DESC";
            
            if ($limit) {
                $query .= " LIMIT :limit";
            }
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':category_id', $categoryId, PDO::PARAM_INT);
            if ($limit) {
                $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            }
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw $e;
        }
    }

    /**
     * Lấy sản phẩm theo brand
     * @param int $brandId
     * @param int $limit
     * @return array
     */
    public function getByBrand($brandId, $limit = null)
    {
        try {
            $query = "SELECT * FROM " . $this->table_name . " 
                      WHERE brand_id = :brand_id AND status = 1 
                      ORDER BY create_at DESC";
            
            if ($limit) {
                $query .= " LIMIT :limit";
            }
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':brand_id', $brandId, PDO::PARAM_INT);
            if ($limit) {
                $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            }
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw $e;
        }
    }

    /**
     * Tìm kiếm sản phẩm
     * @param string $keyword
     * @return array
     */
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

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw $e;
        }
    }
}