<?php
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $restaurantId = $_GET['restaurant_id'] ?? null;
    if (!$restaurantId) {
        sendJson(['error' => 'Restaurant ID is required'], 400);
    }

    $db = getDb();
    $stmt = $db->prepare('SELECT rv.*, u.name AS user_name, u.email AS user_email
                          FROM reviews rv
                          JOIN users u ON rv.user_id = u.id
                          WHERE rv.restaurant_id = ?
                          ORDER BY rv.created_at DESC');
    $stmt->execute([$restaurantId]);
    $reviews = $stmt->fetchAll();

    foreach ($reviews as &$review) {
        $review['rating'] = (int)$review['rating'];
        $review['user_id'] = (int)$review['user_id'];
    }

    sendJson($reviews);

} else if ($method === 'POST') {
    // Submit a review (requires auth)
    $user = requireAuth();
    $body = getJsonBody();

    $restaurantId = $body['restaurant_id'] ?? null;
    $rating = $body['rating'] ?? null;
    $comment = trim($body['comment'] ?? '');

    if (!$restaurantId || !$rating) {
        sendJson(['error' => 'Restaurant ID and rating are required'], 400);
    }

    $rating = (int)$rating;
    if ($rating < 1 || $rating > 5) {
        sendJson(['error' => 'Rating must be between 1 and 5'], 400);
    }

    $db = getDb();
    $stmt = $db->prepare('INSERT INTO reviews (restaurant_id, user_id, rating, comment) VALUES (?, ?, ?, ?)');
    $stmt->execute([$restaurantId, $user['id'], $rating, $comment]);
    $reviewId = $db->lastInsertId();

    // Return the created review
    $stmt = $db->prepare('SELECT rv.*, u.name AS user_name FROM reviews rv JOIN users u ON rv.user_id = u.id WHERE rv.id = ?');
    $stmt->execute([$reviewId]);
    $review = $stmt->fetch();
    $review['rating'] = (int)$review['rating'];
    $review['user_id'] = (int)$review['user_id'];

    sendJson($review, 201);

} else {
    sendJson(['error' => 'Method not allowed'], 405);
}
