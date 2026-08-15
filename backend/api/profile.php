<?php
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Requires authentication
$user = requireAuth();

if ($method === 'GET') {
    $db = getDb();

    // Get user's reviews with restaurant names
    $stmt = $db->prepare('SELECT rv.*, r.name AS restaurant_name
                          FROM reviews rv
                          JOIN restaurants r ON rv.restaurant_id = r.id
                          WHERE rv.user_id = ?
                          ORDER BY rv.created_at DESC');
    $stmt->execute([$user['id']]);
    $reviews = $stmt->fetchAll();

    foreach ($reviews as &$review) {
        $review['rating'] = (int)$review['rating'];
        $review['user_id'] = (int)$review['user_id'];
    }

    // Get favorite count
    $stmt = $db->prepare('SELECT COUNT(*) AS fav_count FROM favorites WHERE user_id = ?');
    $stmt->execute([$user['id']]);
    $favData = $stmt->fetch();

    sendJson([
        'user' => $user,
        'reviews' => $reviews,
        'favorite_count' => (int)$favData['fav_count'],
    ]);

} else {
    sendJson(['error' => 'Method not allowed'], 405);
}
