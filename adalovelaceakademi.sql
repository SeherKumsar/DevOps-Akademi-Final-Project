use adalovelaceakademi;
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(10, 2) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `product_details` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `detail` TEXT NOT NULL,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
);


CREATE TABLE `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `quantity` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
);

-- Kullanıcılar tablosuna örnek veri ekle
INSERT INTO `users` (`username`, `email`, `password`) 
VALUES ('seher_kumsar', 'seherkumsar@adalovelaceakademi.com', 'password');

-- Ürünler tablosuna örnek veri ekle
INSERT INTO `products` (`name`, `description`, `price`) 
VALUES ('Akıllı Telefon', 'Yüksek performanslı akıllı telefon', 69.99);

-- Ürün detayları tablosuna örnek veri ekle
INSERT INTO `product_details` (`product_id`, `detail`) 
VALUES (1, '8 GB RAM, 128 GB depolama alanı');

-- Siparişler tablosuna örnek veri ekle
INSERT INTO `orders` (`user_id`, `product_id`, `quantity`) 
VALUES (1, 1, 2);