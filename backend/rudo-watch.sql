-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: metro.proxy.rlwy.net    Database: railway
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `addresses`
--

DROP TABLE IF EXISTS `addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `addresses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `street` varchar(255) DEFAULT NULL,
  `ward` varchar(100) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `receiver_name` varchar(150) DEFAULT NULL,
  `receiver_phone` varchar(20) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  `is_default` tinyint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `addresses`
--

LOCK TABLES `addresses` WRITE;
/*!40000 ALTER TABLE `addresses` DISABLE KEYS */;
/*!40000 ALTER TABLE `addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `brands`
--

DROP TABLE IF EXISTS `brands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `brands` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_brand_slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `brands`
--

LOCK TABLES `brands` WRITE;
/*!40000 ALTER TABLE `brands` DISABLE KEYS */;
INSERT INTO `brands` VALUES (1,'Casio','casio','2025-11-24 08:03:23',NULL),(4,'Orient','orient','2025-11-24 08:03:23',NULL),(5,'Tissot','tissot','2025-11-24 08:03:23',NULL),(6,'Rolex','rolex','2025-11-24 08:03:23',NULL),(7,'Omega','omega','2025-11-24 08:03:23',NULL),(8,'Casio','casio-1','2025-11-28 16:47:13',NULL);
/*!40000 ALTER TABLE `brands` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cart_id` int NOT NULL,
  `variant_id` int NOT NULL,
  `quantity` int DEFAULT '1',
  `price_at_add` decimal(12,2) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_cart_item` (`cart_id`,`variant_id`),
  KEY `variant_id` (`variant_id`),
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carts`
--

DROP TABLE IF EXISTS `carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `carts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carts`
--

LOCK TABLES `carts` WRITE;
/*!40000 ALTER TABLE `carts` DISABLE KEYS */;
/*!40000 ALTER TABLE `carts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `status` tinyint DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_category_slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Đồng hồ Nam','dong-ho-nam',1,'2025-11-24 08:03:23'),(2,'Đồng hồ Nữ','dong-ho-nu',1,'2025-11-24 08:03:23'),(3,'Đồng hồ Đôi','dong-ho-doi',1,'2025-11-24 08:03:23'),(4,'Đồng hồ Thể thao','dong-ho-the-thao',1,'2025-11-24 08:03:23'),(5,'Đồng hồ Thông minh','dong-ho-thong-minh',1,'2025-11-24 08:03:23'),(6,'Đồng hồ Cao cấp','dong-ho-cao-cap',1,'2025-11-24 08:03:23');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comments`
--

DROP TABLE IF EXISTS `comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `post_id` int DEFAULT NULL,
  `content` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `post_id` (`post_id`),
  CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comments`
--

LOCK TABLES `comments` WRITE;
/*!40000 ALTER TABLE `comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `favorites`
--

DROP TABLE IF EXISTS `favorites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favorites` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `favorites_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `favorites`
--

LOCK TABLES `favorites` WRITE;
/*!40000 ALTER TABLE `favorites` DISABLE KEYS */;
/*!40000 ALTER TABLE `favorites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_detail`
--

DROP TABLE IF EXISTS `order_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_detail` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `variant_id` int NOT NULL,
  `quantity` int DEFAULT NULL,
  `price` decimal(12,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `variant_id` (`variant_id`),
  CONSTRAINT `order_detail_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `order_detail_ibfk_2` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_detail`
--

LOCK TABLES `order_detail` WRITE;
/*!40000 ALTER TABLE `order_detail` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_detail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `voucher_id` int DEFAULT NULL,
  `address` text,
  `status` varchar(50) DEFAULT 'pending',
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_status` varchar(50) DEFAULT NULL,
  `total` decimal(12,2) DEFAULT NULL,
  `note` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `voucher_id` (`voucher_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `gateway_name` varchar(100) DEFAULT NULL,
  `gateway_transaction_id` varchar(150) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `post_category_id` int NOT NULL,
  `name` varchar(200) DEFAULT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `content` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_post_slug` (`slug`),
  KEY `user_id` (`user_id`),
  KEY `post_category_id` (`post_category_id`),
  CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `posts_ibfk_2` FOREIGN KEY (`post_category_id`) REFERENCES `posts_categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `posts_categories`
--

DROP TABLE IF EXISTS `posts_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posts_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posts_categories`
--

LOCK TABLES `posts_categories` WRITE;
/*!40000 ALTER TABLE `posts_categories` DISABLE KEYS */;
INSERT INTO `posts_categories` VALUES (1,'Tin tức đồng hồ','tin-tuc','2025-11-24 08:03:29'),(2,'Kiến thức đồng hồ','kien-thuc','2025-11-24 08:03:29'),(3,'Hướng dẫn sử dụng','huong-dan','2025-11-24 08:03:29'),(4,'Đánh giá sản phẩm','danh-gia','2025-11-24 08:03:29');
/*!40000 ALTER TABLE `posts_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_variants`
--

DROP TABLE IF EXISTS `product_variants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_variants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `size` varchar(50) DEFAULT NULL,
  `sku` varchar(100) DEFAULT NULL,
  `quantity` int DEFAULT '0',
  `image` varchar(255) DEFAULT NULL,
  `colors` json DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_variant_sku` (`sku`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `product_variants_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_variants`
--

LOCK TABLES `product_variants` WRITE;
/*!40000 ALTER TABLE `product_variants` DISABLE KEYS */;
INSERT INTO `product_variants` VALUES (1,1,3500000.00,'45mm','CAS-EDF-001-45',15,NULL,NULL,NULL),(2,1,3500000.00,'42mm','CAS-EDF-001-42',10,NULL,NULL,NULL),(7,4,2800000.00,'38mm','CAS-BG-004-38',25,NULL,NULL,NULL),(8,4,2800000.00,'36mm','CAS-BG-004-36',18,NULL,NULL,NULL),(11,6,3200000.00,'Nam 40mm + Nữ 36mm','CAS-CPL-006-SET',12,NULL,NULL,NULL),(12,6,3200000.00,'Nam 42mm + Nữ 38mm','CAS-CPL-006-SET2',8,NULL,NULL,NULL),(15,8,4500000.00,'40.5mm','ORI-BAM-008-40',20,NULL,NULL,NULL),(16,8,4500000.00,'38mm','ORI-BAM-008-38',15,NULL,NULL,NULL),(17,9,18500000.00,'39mm','TIS-TCL-009-39',10,NULL,NULL,NULL),(18,9,18500000.00,'41mm','TIS-TCL-009-41',8,NULL,NULL,NULL),(19,10,250000000.00,'41mm','ROL-SUB-010-41',2,NULL,NULL,NULL),(20,11,180000000.00,'42mm','OMG-SEA-011-42',3,NULL,NULL,NULL),(21,12,4200000.00,'48mm','CAS-GSK-012-48',15,NULL,NULL,NULL),(22,12,4200000.00,'45mm','CAS-GSK-012-45',12,NULL,NULL,NULL);
/*!40000 ALTER TABLE `product_variants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `model_code` varchar(255) NOT NULL,
  `category_id` int DEFAULT NULL,
  `brand_id` int DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `slug` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `specifications` json NOT NULL,
  `thumbnail` json NOT NULL,
  `description` text,
  `image` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` tinyint DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `category_id` (`category_id`),
  KEY `brand_id` (`brand_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `products_ibfk_2` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'RD-W-001',1,1,'Casio Edifice EQB-1000D-1A','casio-edifice-eqb-1000d-1a','[\"Kích thước: 45mm\", \"Chống nước: 100m\", \"Chất liệu: Thép không gỉ\", \"Máy: Quartz\"]','[\"uploads/products/casio-edifice-eqb-1000d-1a-1.png\", \"uploads/products/casio-edifice-eqb-1000d-1a-2.png\"]','Đồng hồ nam Casio Edifice với thiết kế thể thao năng động, phù hợp cho nam giới hiện đại','uploads/products/casio-edifice-eqb-1000d-1a.png','2025-11-24 08:03:24',1),(4,'RD-W-004',2,1,'Casio Baby-G BGA-240-7B','casio-baby-g-bga-240-7b','[\"Kích thước: 38mm\", \"Chống nước: 100m\", \"Màu sắc: Hồng\", \"Máy: Quartz\"]','[\"uploads/products/casio-baby-g-bga-240-7b-1.png\", \"uploads/products/casio-baby-g-bga-240-7b-2.png\"]','Đồng hồ nữ Casio Baby-G với thiết kế nữ tính, màu hồng dễ thương','uploads/products/casio-baby-g-bga-240-7b.png','2025-11-24 08:03:24',1),(6,'RD-W-006',3,1,'Casio Couple MTP-1374D-7AVDF','casio-couple-mtp-1374d-7avdf','[\"Bộ đôi: Nam + Nữ\", \"Chống nước: 50m\", \"Thiết kế: Đồng bộ\", \"Máy: Quartz\"]','[\"uploads/products/casio-couple-mtp-1374d-7avdf-1.png\", \"uploads/products/casio-couple-mtp-1374d-7avdf-2.png\"]','Bộ đồng hồ đôi Casio với thiết kế đồng bộ, lý tưởng cho cặp đôi','uploads/products/casio-couple-mtp-1374d-7avdf.png','2025-11-24 08:03:24',1),(8,'RD-W-008',1,4,'Orient Bambino FAC00009N0','orient-bambino-fac00009n0','[\"Kích thước: 40.5mm\", \"Chống nước: 30m\", \"Máy: Automatic\", \"Phong cách: Cổ điển\"]','[\"uploads/products/orient-bambino-fac00009n0-1.png\", \"uploads/products/orient-bambino-fac00009n0-2.png\"]','Orient Bambino với thiết kế cổ điển, máy automatic Nhật Bản','uploads/products/orient-bambino-fac00009n0.png','2025-11-24 08:03:24',1),(9,'RD-W-009',6,5,'Tissot T-Classic T063.610.16.037.00','tissot-t-classic-t063-610-16-037-00','[\"Kích thước: 39mm\", \"Chống nước: 30m\", \"Máy: Automatic\", \"Thương hiệu: Thụy Sĩ\"]','[\"uploads/products/tissot-t-classic-t063-610-16-037-00-1.png\", \"uploads/products/tissot-t-classic-t063-610-16-037-00-2.png\"]','Tissot T-Classic thương hiệu Thụy Sĩ, thiết kế thanh lịch','uploads/products/tissot-t-classic-t063-610-16-037-00.png','2025-11-24 08:03:24',1),(10,'RD-W-010',1,6,'Rolex Submariner 126610LN','rolex-submariner-126610ln','[\"Kích thước: 41mm\", \"Chống nước: 300m\", \"Máy: Automatic\", \"Thương hiệu: Thụy Sĩ cao cấp\"]','[\"uploads/products/rolex-submariner-126610ln-1.png\", \"uploads/products/rolex-submariner-126610ln-2.png\"]','Rolex Submariner biểu tượng của đồng hồ cao cấp, chống nước 300m','uploads/products/rolex-submariner-126610ln.png','2025-11-24 08:03:24',1),(11,'RD-W-011',2,7,'Omega Seamaster 210.30.42.20.03.001','omega-seamaster-210-30-42-20-03-001','[\"Kích thước: 42mm\", \"Chống nước: 300m\", \"Máy: Automatic\", \"Thương hiệu: Thụy Sĩ\"]','[\"uploads/products/omega-seamaster-210-30-42-20-03-001-1.png\", \"uploads/products/omega-seamaster-210-30-42-20-03-001-2.png\"]','Omega Seamaster với máy Co-Axial, chống nước 300m','uploads/products/omega-seamaster-210-30-42-20-03-001.png','2025-11-24 08:03:24',1),(12,'RD-W-012',5,1,'Casio G-Shock GBD-200-1ER','casio-g-shock-gbd-200-1er','[\"Kích thước: 48mm\", \"Chống nước: 200m\", \"Tính năng: Bluetooth\", \"Màn hình: LCD\"]','[\"uploads/products/casio-g-shock-gbd-200-1er-1.png\", \"uploads/products/casio-g-shock-gbd-200-1er-2.png\"]','G-Shock thông minh với kết nối Bluetooth, theo dõi sức khỏe','uploads/products/casio-g-shock-gbd-200-1er.png','2025-11-24 08:03:24',1);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `content` text,
  `rating` int DEFAULT '5',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (1,NULL,1,'Đồng hồ đẹp, chất lượng tốt, giao hàng nhanh. Rất hài lòng!',5,'2025-11-20 08:03:28',NULL),(5,NULL,12,'G-Shock thông minh rất tiện, kết nối Bluetooth tốt. Phù hợp thể thao.',5,'2025-11-18 08:03:28',NULL),(6,NULL,4,'Baby-G màu hồng dễ thương, chất lượng Casio luôn đảm bảo.',5,'2025-11-21 08:03:28',NULL),(7,NULL,8,'Orient Bambino thiết kế cổ điển đẹp, máy automatic Nhật Bản tốt.',4,'2025-11-19 08:03:28',NULL);
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shipping_method`
--

DROP TABLE IF EXISTS `shipping_method`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipping_method` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `cost` decimal(10,0) NOT NULL,
  `status` enum('0','1') NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipping_method`
--

LOCK TABLES `shipping_method` WRITE;
/*!40000 ALTER TABLE `shipping_method` DISABLE KEYS */;
INSERT INTO `shipping_method` VALUES (1,'Giao hàng tiêu chuẩn',30000,'1','2025-11-24 08:03:26',NULL),(2,'Giao hàng nhanh',50000,'1','2025-11-24 08:03:26',NULL),(3,'Giao hàng siêu tốc',80000,'1','2025-11-24 08:03:26',NULL),(4,'Giao hàng miễn phí (đơn trên 500k)',0,'1','2025-11-24 08:03:26',NULL);
/*!40000 ALTER TABLE `shipping_method` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fullname` varchar(150) DEFAULT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` tinyint DEFAULT '0',
  `status` tinyint DEFAULT '1',
  `api_token` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (7,'Phan Bình','phanbinhfedev150504@gmail.com','$2y$10$5UkQSUz1xiSqnNVqaoWP5ekCGGVaqS8hQcSP6IFMRLccJZeIt5EeW','0393159478',1,1,'1b7bdc70aeec5420ba452fe88c8dac6933f434e2a7bdf73af9e2cb100c12a050','2025-11-24',NULL),(8,'Toàn đẹp trai','pductoandev@gmail.com','$2y$10$DWy/hc/p7EgiDbp3tZVx6uxVznox5mB/y5q3ee8NAJ4CyHDT6Rmku','0916110241',0,1,'36c25ee1542a1582a3cb728ea0e50eb93a84987244ac63b915db58dc9ee1d1e8','2025-11-24','2025-11-28'),(9,'Nguyen Anh Khoi','tuyetnhng010193@gmail.com','$2y$10$YjMK6K2PSn1E6.2WMFEHV.2L/ICaNAGHnYZZxoWVkBzbC0HSfiVQO','0393159438',0,1,'b26c61b626a82dec5d97f9cf24269920229bd774d9bfd5236f8e6d6c87271999','2025-11-24',NULL),(11,'Bình Phan Đức','phanbinh150504@gmail.com','$2y$10$MYUVcgDyXPbNUHtLjUjpTOa8cHmUxfCppui/lCads0OgvVWhE0y2C','0382832609',0,1,'56d83e61b177f0e0c547e2bfeb7b792d79b650f980f58769de31d8a28b6b85af','2025-11-26',NULL),(12,'Phan Đức Toàn','pductoandevv@gmail.com','y0.Opp/sB.HrDfpwt6kLGK.4CRoCWMblDkhs..UVG','0916110241',1,1,'28a83a5c7579f170444c1061c38af877bd186f40038a8dd0c8f0adda0f09fa21','2025-11-28','2025-11-28'),(17,'Phan Đức Toàn','pductoandebvv@gmail.com','y0VVtwmc1TL8KVgrLX1tH.urFhdC08XUIR27i0ICvpyebTMMmpTBa6','0916110241',0,1,'5d87799c07f24f777ef983189f773424d8de1a685b75275693597b123c031421','2025-11-28',NULL),(18,'Phan Đức Toàn','pductoandevvvv@gmail.com','$2y$10$xDXVQygizlKAaFREXo9cROpCigHesa34bNG8lntI7LDmnn36kh2by','0916110241',1,1,'37852d5257098a5e8a6e688bd39c3296f0707ae5da8f1d217ffbb5b6409d095b','2025-11-29',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vouchers`
--

DROP TABLE IF EXISTS `vouchers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vouchers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `discount` int DEFAULT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `expired_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `api_token` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vouchers`
--

LOCK TABLES `vouchers` WRITE;
/*!40000 ALTER TABLE `vouchers` DISABLE KEYS */;
INSERT INTO `vouchers` VALUES (1,'SALE10','percent',10,NULL,'2025-11-24 08:03:26','2026-02-24 08:03:26',NULL,NULL),(2,'DISCOUNT200','money',NULL,200000.00,'2025-11-24 08:03:26','2026-02-24 08:03:26',NULL,NULL),(3,'WELCOME50','percent',50,NULL,'2025-11-24 08:03:26','2025-12-24 08:03:26',NULL,NULL),(4,'FREESHIP','money',NULL,50000.00,'2025-11-24 08:03:26','2026-05-24 08:03:26',NULL,NULL),(5,'VIP20','percent',20,NULL,'2025-11-24 08:03:26','2026-11-24 08:03:26',NULL,NULL);
/*!40000 ALTER TABLE `vouchers` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-29 15:21:05
