<?php
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

// All favorite operations require authentication
$user = requireAuth();

if ($method === 'GET') {
    // List user's favorites with restaurant data
    $db = getDb();
    $stmt = $db->prepare('SELECT f.id AS favorite_id, f.created_at AS favorite_created,
                          r.*, c.name AS category_name, c.icon AS category_icon
                          FROM favorites f
                          JOIN restaurants r ON f.restaurant_id = r.id
                          LEFT JOIN categories c ON r.category_id = c.id
                          WHERE f.user_id = ?
                          ORDER BY f.created_at DESC');
    $stmt->execute([$user['id']]);
    $favorites = $stmt->fetchAll();

    foreach ($favorites as &$fav) {
        // Add rating summary
        $stmt2 = $db->prepare('SELECT AVG(rating) AS avg_rating, COUNT(*) AS review_count FROM reviews WHERE restaurant_id = ?');
        $stmt2->execute([$fav['id']]);
        $ratingData = $stmt2->fetch();
        $fav['avg_rating'] = $ratingData['avg_rating'] ? round((float)$ratingData['avg_rating'], 1) : 0;
        $fav['review_count'] = (int)$ratingData['review_count'];
        $fav['categories'] = $fav['category_name'] ? ['name' => $fav['category_name'], 'icon' => $fav['category_icon']] : null;
        unset($fav['category_name'], $fav['category_icon']);
    }

    sendJson($favorites);

} else if ($method === 'POST') {
    // Add a favorite
    $body = getJsonBody();
    $restaurantId = $body['restaurant_id'] ?? null;

    if (!$restaurantId) {
        sendJson(['error' => 'Restaurant ID is required'], 400);
    }

    $db = getDb();

    // Check if already favorited
    $stmt = $db->prepare('SELECT id FROM favorites WHERE user_id = ? AND restaurant_id = ?');
    $stmt->execute([$user['id'], $restaurantId]);
    if ($stmt->fetch()) {
        sendJson(['message' => 'Already favorited'], 200);
    }

    $stmt = $db->prepare('INSERT INTO favorites (user_id, restaurant_id) VALUES (?, ?)');
    $stmt->execute([$user['id'], $restaurantId]);

    sendJson(['message' => 'Added to favorites'], 201);

} else if ($method === 'DELETE') {
    // Remove a favorite
    $restaurantId = $_GET['restaurant_id'] ?? null;

    if (!$restaurantId) {
        sendJson(['error' => 'Restaurant ID is required'], 400);
    }

    $db = getDb();
    $stmt = $db->prepare('DELETE FROM favorites WHERE user_id = ? AND restaurant_id = ?');
    $stmt->execute([$user['id'], $restaurantId]);

    sendJson(['message' => 'Removed from favorites']);

} else {
    sendJson(['error' => 'Method not allowed'], 405);
}
