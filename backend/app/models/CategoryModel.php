<?php 
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../../config/function.php';

class Categories
{
    private $conn;
    private $table_name = 'categories';
    public $response;

    public $id;
    public $name;
    public $slug;
    public $status;
    public $created_at;

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->getConnection();
        $this->response = new Response();
    }

    public function getAll()
    {
        try {
            $query = "SELECT * FROM " . $this->table_name . " ORDER BY id DESC";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
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

    public function insert($name, $slug, $status)
    {
        try {
            $data = [
                'name' => $name,
                'slug' => $slug,
                'status' => $status
            ];
            $id = insert($this->conn, $this->table_name, $data);
            return $id ? $this->getById($id) : null;
        } catch (PDOException $e) {
            throw $e;
        }
    }

    public function update($id, $name, $slug, $status)
    {
        try {
            $data = [
                'name' => $name,
                'slug' => $slug,
                'status' => $status
            ];
            $result = update($this->conn, $this->table_name, $data, $id);
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
}