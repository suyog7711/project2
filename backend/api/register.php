<?php
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Sign up
    $body = getJsonBody();
    $name = trim($body['name'] ?? '');
    $email = trim($body['email'] ?? '');
    $password = $body['password'] ?? '';

    if (!$name || !$email || !$password) {
        sendJson(['error' => 'Name, email, and password are required'], 400);
    }

    if (strlen($password) < 6) {
        sendJson(['error' => 'Password must be at least 6 characters'], 400);
    }

    $db = getDb();

    // Check if email already exists
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        sendJson(['error' => 'An account with this email already exists'], 409);
    }

    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $db->prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
    $stmt->execute([$name, $email, $hashedPassword]);
    $userId = $db->lastInsertId();

    $token = generateToken($userId);
    $userData = [
        'id' => $userId,
        'email' => $email,
        'created_at' => date('c'),
        'user_metadata' => ['full_name' => $name],
    ];

    sendJson([
        'user' => $userData,
        'token' => $token,
    ]);
} else {
    sendJson(['error' => 'Method not allowed'], 405);
}
