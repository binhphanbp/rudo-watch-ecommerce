<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/function.php';
require_once __DIR__ . '/UserModel.php';
require_once __DIR__ . '/../../vendor/autoload.php';


use Google\Client;
use Google\Service\Oauth2;

class LoginWithGoogle
{
    private $conn;
    private $client;

    public function __construct()
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }

        $this->conn = (new Database())->getConnection();

        $this->client = new Client();
        $this->client->setClientId($_ENV['GOOGLE_CLIENT_ID']);
        $this->client->setClientSecret($_ENV['GOOGLE_CLIENT_SECRET']);
        $this->client->setRedirectUri($_ENV['GOOGLE_REDIRECT_URI']);
        $this->client->addScope('email');
        $this->client->addScope('profile');
    }

    // Lấy Google login URL
    public function getLoginUrl()
    {
        return $this->client->createAuthUrl();
    }

    // Lấy access token từ callback
    public function getAccessToken($code)
    {
        $token = $this->client->fetchAccessTokenWithAuthCode($code);

        if (isset($token['error'])) {
            return null;
        }

        $this->client->setAccessToken($token);
        return $token;
    }

    // Lấy thông tin user từ Google
    public function getGoogleUser($token)
    {
        $this->client->setAccessToken($token);
        $oauth = new Oauth2($this->client);
        $user = $oauth->userinfo->get();

        return [
            'google_id' => $user->getId(),
            'fullname' => $user->getName() ?? '',
            'email' => $user->getEmail(),
            'picture' => $user->getPicture()
        ];
    }

    // Tìm hoặc tạo user trong DB
    public function findOrCreateUser($googleData)
    {
        $email = $googleData['email'];

        if (empty($email)) {
            return ['error' => 'Không có email từ Google'];
        }

        // Tìm user theo email
        $stmt = $this->conn->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            // User đã tồn tại
            if (empty($user['api_token'])) {
                $token = bin2hex(random_bytes(32));
                update($this->conn, 'users', ['api_token' => $token], $user['id']);
                $user['api_token'] = $token;
            }
            return ['user' => $user, 'is_new' => false];
        }

        // Tạo user mới
        $token = bin2hex(random_bytes(32));
        $userId = insert($this->conn, 'users', [
            'fullname' => $googleData['fullname'] ?: 'Google User',
            'email' => $email,
            'password' => password_hash(bin2hex(random_bytes(8)), PASSWORD_DEFAULT),
            'role' => 0,
            'status' => 1,
            'api_token' => $token
        ]);

        if (!$userId) {
            return ['error' => 'Không thể tạo user'];
        }

        $newUser = (new Users())->getById($userId);
        return ['user' => $newUser, 'is_new' => true];
    }
}