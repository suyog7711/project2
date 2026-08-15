<?php
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Login
    $body = getJsonBody();
    $email = trim($body['email'] ?? '');
    $password = $body['password'] ?? '';

    if (!$email || !$password) {
        sendJson(['error' => 'Email and password are required'], 400);
    }

    $db = getDb();
    $stmt = $db->prepare('SELECT id, name, email, password, created_at FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        sendJson(['error' => 'Invalid email or password'], 401);
    }

    $token = generateToken($user['id']);
    $userData = [
        'id' => $user['id'],
        'email' => $user['email'],
        'created_at' => date('c', strtotime($user['created_at'])),
        'user_metadata' => ['full_name' => $user['name']],
    ];

    sendJson([
        'user' => $userData,
        'token' => $token,
    ]);
} else {
    sendJson(['error' => 'Method not allowed'], 405);
}
