<?php
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Get current user from token
    $user = requireAuth();
    sendJson(['user' => $user]);
} else {
    sendJson(['error' => 'Method not allowed'], 405);
}
