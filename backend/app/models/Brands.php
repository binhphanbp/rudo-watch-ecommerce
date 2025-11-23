<?php 
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../../config/function.php';

class Brands
{
    private $conn;
    private $table_name = 'brands';
    public $response;

    // Các thuộc tính của bảng brands
    public $id;
    public $name;
    public $slug;
    public $created_at;

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->getConnection();
        $this->response = new Response();
    }

    public function getAll($params = [])
    {
        try {
            $query = "SELECT * FROM " . $this->table_name . " WHERE 1=1";
            $conditions = [];
            $bindings = [];

            if (isset($params['search']) && !empty($params['search'])) {
                $conditions[] = "name LIKE :search";
                $bindings[':search'] = '%' . $params['search'] . '%';
            }

            if (!empty($conditions)) {
                $query .= " AND " . implode(" AND ", $conditions);
            }

            $query .= " ORDER BY id DESC";

            if (isset($params['page']) || isset($params['limit'])) {
                $page = isset($params['page']) ? (int)$params['page'] : 1;
                $limit = isset($params['limit']) ? (int)$params['limit'] : 10;
                $offset = ($page - 1) * $limit;
                $query .= " LIMIT :limit OFFSET :offset";
            }

            $stmt = $this->conn->prepare($query);

            foreach ($bindings as $key => $value) {
                $stmt->bindValue($key, $value);
            }

            if (isset($params['page']) || isset($params['limit'])) {
                $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
                $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            }

            $stmt->execute();
            $brands = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (isset($params['page']) || isset($params['limit'])) {
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
                    'data' => $brands,
                    'pagination' => [
                        'current_page' => $page,
                        'per_page' => $limit,
                        'total' => (int)$total,
                        'total_pages' => ceil($total / $limit)
                    ]
                ];
            }

            return $brands;
        } catch (PDOException $e) {
            throw $e;
        }
    }

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

    public function getBySlug($slug)
    {
        try {
            $query = "SELECT * FROM " . $this->table_name . " WHERE slug = :slug LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':slug', $slug);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (PDOException $e) {
            throw $e;
        }
    }

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

            $insertData = [
                'name' => $data->name,
                'slug' => $slug
            ];

            $id = insert($this->conn, $this->table_name, $insertData);
            return $id ? $this->getById($id) : null;
        } catch (PDOException $e) {
            throw $e;
        }
    }

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

            $updateData = [
                'name' => $data->name ?? $existing['name'],
                'slug' => $slug
            ];

            $result = update($this->conn, $this->table_name, $updateData, $id);
            return $result ? $this->getById($id) : null;
        } catch (PDOException $e) {
            throw $e;
        }
    }

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

    public function countProducts($brandId)
    {
        try {
            $query = "SELECT COUNT(*) as total FROM products WHERE brand_id = :brand_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':brand_id', $brandId, PDO::PARAM_INT);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int)$result['total'];
        } catch (PDOException $e) {
            throw $e;
        }
    }
}