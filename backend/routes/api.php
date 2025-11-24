<?php

use App\Core\Router;
use App\Controllers\Api\HomeController;

$router = new Router();

// Home API Routes
$router->get('/api/home', [HomeController::class, 'index']);
$router->get('/api/home/banners', [HomeController::class, 'getBanners']);
$router->get('/api/home/new-products', [HomeController::class, 'getNewProducts']);
$router->get('/api/home/featured-products', [HomeController::class, 'getFeaturedProducts']);

return $router;