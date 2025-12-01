<?php
require_once __DIR__ . '/../../../models/LoginWithFacebook.php';
require_once __DIR__ . '/../../../models/LoginWithGoogle.php';
require_once __DIR__ . '/../../../core/Response.php';

class SocialAuthController
{
    private $fbModel;
    private $ggModel;
    private $response;
    private $frontendUrl;

    public function __construct()
    {
        $this->response = new Response();
        $this->frontendUrl = $_ENV['FRONTEND_URL'] ?? 'https://rudo-watch.vercel.app';
    }

    // ============ FACEBOOK ============

    public function facebookStart($data)
    {
        try {
            $this->fbModel = new LoginWithFacebook();
            $loginUrl = $this->fbModel->getLoginUrl();
            return $this->response->json([
                'success' => true,
                'needsRedirect' => true,
                'login_url' => $loginUrl
            ]);
        } catch (Exception $e) {
            return $this->response->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function facebookCallback($data)
    {
        try {
            $this->fbModel = new LoginWithFacebook();
            $token = $this->fbModel->getAccessToken();

            if (!$token) {
                header("Location: {$this->frontendUrl}/login.html?error=no_token");
                exit;
            }

            $fbUser = $this->fbModel->getFacebookUser($token);
            if (empty($fbUser['email'])) {
                header("Location: {$this->frontendUrl}/login.html?error=no_email");
                exit;
            }

            $result = $this->fbModel->findOrCreateUser($fbUser);
            if (isset($result['error'])) {
                header("Location: {$this->frontendUrl}/login.html?error=create_failed");
                exit;
            }

            $userToken = $result['user']['api_token'];
            $userData = urlencode(json_encode($result['user']));
            header("Location: {$this->frontendUrl}/login.html?token={$userToken}&user={$userData}");
            exit;
        } catch (Exception $e) {
            header("Location: {$this->frontendUrl}/login.html?error=" . urlencode($e->getMessage()));
            exit;
        }
    }

    // ============ GOOGLE ============

    public function googleStart($data)
    {
        try {
            $this->ggModel = new LoginWithGoogle();
            $loginUrl = $this->ggModel->getLoginUrl();
            return $this->response->json([
                'success' => true,
                'needsRedirect' => true,
                'login_url' => $loginUrl
            ]);
        } catch (Exception $e) {
            return $this->response->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function googleCallback($data)
    {
        try {
            $this->ggModel = new LoginWithGoogle();
            $code = $_GET['code'] ?? null;

            if (!$code) {
                header("Location: {$this->frontendUrl}/login.html?error=no_code");
                exit;
            }

            $token = $this->ggModel->getAccessToken($code);
            if (!$token) {
                header("Location: {$this->frontendUrl}/login.html?error=no_token");
                exit;
            }

            $ggUser = $this->ggModel->getGoogleUser($token);
            if (empty($ggUser['email'])) {
                header("Location: {$this->frontendUrl}/login.html?error=no_email");
                exit;
            }

            $result = $this->ggModel->findOrCreateUser($ggUser);
            if (isset($result['error'])) {
                header("Location: {$this->frontendUrl}/login.html?error=create_failed");
                exit;
            }

            $userToken = $result['user']['api_token'];
            $userData = urlencode(json_encode($result['user']));
            header("Location: {$this->frontendUrl}/login.html?token={$userToken}&user={$userData}");
            exit;
        } catch (Exception $e) {
            header("Location: {$this->frontendUrl}/login.html?error=" . urlencode($e->getMessage()));
            exit;
        }
    }
}
