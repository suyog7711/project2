<?php
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $db = getDb();

    // Build query with optional filters
    $sql = 'SELECT r.*, c.name AS category_name, c.icon AS category_icon
            FROM restaurants r
            LEFT JOIN categories c ON r.category_id = c.id
            WHERE 1=1';
    $params = [];

    if (!empty($_GET['category_id'])) {
        $sql .= ' AND r.category_id = ?';
        $params[] = $_GET['category_id'];
    }

    if (!empty($_GET['search'])) {
        $sql .= ' AND (r.name LIKE ? OR r.description LIKE ?)';
        $search = '%' . $_GET['search'] . '%';
        $params[] = $search;
        $params[] = $search;
    }

    if (!empty($_GET['price'])) {
        $sql .= ' AND r.price_range = ?';
        $params[] = $_GET['price'];
    }

    $sql .= ' ORDER BY r.name';

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $restaurants = $stmt->fetchAll();

    // Add average rating for each restaurant
    foreach ($restaurants as &$r) {
        $stmt = $db->prepare('SELECT AVG(rating) AS avg_rating, COUNT(*) AS review_count FROM reviews WHERE restaurant_id = ?');
        $stmt->execute([$r['id']]);
        $ratingData = $stmt->fetch();
        $r['avg_rating'] = $ratingData['avg_rating'] ? round((float)$ratingData['avg_rating'], 1) : 0;
        $r['review_count'] = (int)$ratingData['review_count'];

        // Convert is_vegetarian to boolean
        $r['categories'] = $r['category_name'] ? ['name' => $r['category_name'], 'icon' => $r['category_icon']] : null;
        unset($r['category_name'], $r['category_icon']);
    }

    // Sort by rating if requested
    if (!empty($_GET['sort']) && $_GET['sort'] === 'rating') {
        usort($restaurants, function ($a, $b) {
            return $b['avg_rating'] <=> $a['avg_rating'];
        });
    }

    sendJson($restaurants);
} else {
    sendJson(['error' => 'Method not allowed'], 405);
}
