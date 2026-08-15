<?php
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $restaurantId = $_GET['restaurant_id'] ?? null;
    if (!$restaurantId) {
        sendJson(['error' => 'Restaurant ID is required'], 400);
    }

    $db = getDb();
    $stmt = $db->prepare('SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY FIELD(category, "Appetizers", "Mains", "Sides", "Desserts", "Drinks"), name');
    $stmt->execute([$restaurantId]);
    $items = $stmt->fetchAll();

    // Convert is_vegetarian to boolean
    foreach ($items as &$item) {
        $item['is_vegetarian'] = (bool)$item['is_vegetarian'];
        $item['price'] = (float)$item['price'];
    }

    sendJson($items);
} else {
    sendJson(['error' => 'Method not allowed'], 405);
}
