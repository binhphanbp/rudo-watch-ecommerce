<?php 
require_once __DIR__ . '/../../../models/ProductModel.php';
require_once __DIR__ . '/../../../models/PostModel.php';
require_once __DIR__ . '/../../../core/Response.php';

class HomeController
{
    private $productModel;
    private $postModel;
    private $response;

    public function __construct()
    {
        $this->productModel = new Products();
        $this->postModel = new Posts();
        $this->response = new Response();
    }

    public function index()
    {
        try {
            $latestLimit = isset($_GET['latest_limit']) ? (int)$_GET['latest_limit'] : 8;
            $maleLimit = isset($_GET['male_limit']) ? (int)$_GET['male_limit'] : 4;
            $femaleLimit = isset($_GET['female_limit']) ? (int)$_GET['female_limit'] : 4;
            $postsLimit = isset($_GET['posts_limit']) ? (int)$_GET['posts_limit'] : 4;

            $maleCategorySlug = isset($_GET['male_category']) ? $_GET['male_category'] : 'dong-ho-nam';
            $femaleCategorySlug = isset($_GET['female_category']) ? $_GET['female_category'] : 'dong-ho-nu';

            $latestProducts = $this->productModel->getLatest($latestLimit);
            $maleProducts = $this->productModel->getByCategorySlug($maleCategorySlug, $maleLimit);
            $femaleProducts = $this->productModel->getByCategorySlug($femaleCategorySlug, $femaleLimit);
            $posts = $this->postModel->getAll($postsLimit);

            $this->response->json([
                'latest_products' => $latestProducts,
                'male_products' => $maleProducts,
                'female_products' => $femaleProducts,
                'posts' => $posts
            ], 200);
        } catch (Exception $e) {
            $this->response->json(['error' => $e->getMessage()], 500);
        }
    }
}