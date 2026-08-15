<?php
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        sendJson(['error' => 'Restaurant ID is required'], 400);
    }

    $db = getDb();
    $stmt = $db->prepare('SELECT r.*, c.name AS category_name, c.icon AS category_icon
                          FROM restaurants r
                          LEFT JOIN categories c ON r.category_id = c.id
                          WHERE r.id = ?');
    $stmt->execute([$id]);
    $restaurant = $stmt->fetch();

    if (!$restaurant) {
        sendJson(['error' => 'Restaurant not found'], 404);
    }

    $restaurant['categories'] = $restaurant['category_name'] ? ['name' => $restaurant['category_name'], 'icon' => $restaurant['category_icon']] : null;
    unset($restaurant['category_name'], $restaurant['category_icon']);

    // Add rating summary
    $stmt = $db->prepare('SELECT AVG(rating) AS avg_rating, COUNT(*) AS review_count FROM reviews WHERE restaurant_id = ?');
    $stmt->execute([$id]);
    $ratingData = $stmt->fetch();
    $restaurant['avg_rating'] = $ratingData['avg_rating'] ? round((float)$ratingData['avg_rating'], 1) : 0;
    $restaurant['review_count'] = (int)$ratingData['review_count'];

    sendJson($restaurant);
} else {
    sendJson(['error' => 'Method not allowed'], 405);
}
