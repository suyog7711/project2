<?php
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $db = getDb();
    $stmt = $db->query('SELECT * FROM categories ORDER BY name');
    $categories = $stmt->fetchAll();
    sendJson($categories);
} else {
    sendJson(['error' => 'Method not allowed'], 405);
}
