<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/function.php';
require_once __DIR__ . '/UserModel.php';

// Tắt warning khi load Facebook SDK
error_reporting(E_ALL & ~E_DEPRECATED & ~E_WARNING);
require_once __DIR__ . '/../../vendor/facebook/graph-sdk/src/Facebook/autoload.php';

use Facebook\Facebook;

class LoginWithFacebook
{
    private $conn;
    private $fb;

    public function __construct()
    {
        // Start session cho Facebook CSRF
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }

        $this->conn = (new Database())->getConnection();
        $this->fb = new Facebook([
            'app_id' => $_ENV['FB_APP_ID'],
            'app_secret' => $_ENV['FB_APP_SECRET'],
            'default_graph_version' => 'v18.0',
        ]);
    }

    // Lấy Facebook login URL
    public function getLoginUrl()
    {
        $helper = $this->fb->getRedirectLoginHelper();
        $redirectUri = $_ENV['FB_REDIRECT_URI'] ?? $_ENV['FB_REDIRECT_URL'] ?? '';
        return $helper->getLoginUrl($redirectUri, ['public_profile', 'email']);
    }

    // Lấy access token từ callback
    public function getAccessToken()
    {
        if (isset($_SESSION['facebook_access_token'])) {
            return $_SESSION['facebook_access_token'];
        }

        $helper = $this->fb->getRedirectLoginHelper();

        // Fix CSRF cho redirect từ domain khác
        if (isset($_GET['state'])) {
            $helper->getPersistentDataHandler()->set('state', $_GET['state']);
        }

        $token = $helper->getAccessToken();

        if ($token) {
            // Đổi sang long-lived token
            $oAuth = $this->fb->getOAuth2Client();
            if (!$token->isLongLived()) {
                $token = $oAuth->getLongLivedAccessToken($token);
            }
            $_SESSION['facebook_access_token'] = (string)$token;
        }

        return $token ? (string)$token : null;
    }

    // Lấy thông tin user từ Facebook
    public function getFacebookUser($token)
    {
        $this->fb->setDefaultAccessToken($token);
        $response = $this->fb->get('/me?fields=id,name,email,picture.width(300).height(300)');
        $user = $response->getGraphUser();

        return [
            'fb_id' => $user->getId(),
            'fullname' => $user->getName() ?? '',
            'email' => $user->getEmail(),
            'picture' => $user->getField('picture') ? $user->getField('picture')->getUrl() : null
        ];
    }

    // Tìm hoặc tạo user trong DB
    public function findOrCreateUser($fbData)
    {
        $email = $fbData['email'];

        if (empty($email)) {
            return ['error' => 'Không có email từ Facebook'];
        }

        // Tìm user theo email
        $stmt = $this->conn->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            // User đã tồn tại - tạo token nếu chưa có
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
            'fullname' => $fbData['fullname'] ?: 'Facebook User',
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