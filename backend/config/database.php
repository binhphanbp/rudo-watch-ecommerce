<?php require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

class Database {
    private $conn;

    public function __construct() {
        try {
            $host = $_ENV['DB_HOST'];
            $port = isset($_ENV['DB_PORT']) ? $_ENV['DB_PORT'] : '3306';
            $database = $_ENV['DB_DATABASE'];
            $dsn = "mysql:host=" . $host . ";port=" . $port . ";dbname=" . $database . ";charset=utf8mb4";
            $this->conn = new PDO($dsn, $_ENV['DB_USERNAME'], $_ENV['DB_PASSWORD'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ]);
            // echo "Kết nối thành công";
        } catch (PDOException $e) {
            echo "Kết nối thất bại: " . $e->getMessage();
        }
    }

    public function getConnection() {
        return $this->conn;
    }

    public function disconnect() {
        $this->conn = null;
    }
}