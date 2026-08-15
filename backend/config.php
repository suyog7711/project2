<?php
// Database configuration
// Update these values to match your MySQL server settings

define('DB_HOST', 'localhost');
define('DB_NAME', 'food_finds');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// CORS headers - allow the Vite dev server to call this API
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database connection using PDO
function getDb() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
            exit;
        }
    }
    return $pdo;
}

// Helper: send JSON response
function sendJson($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

// Helper: get JSON body from request
function getJsonBody() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return $data ?: [];
}

// Helper: get Bearer token from Authorization header
function getBearerToken() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (preg_match('/Bearer\s+(.+)/i', $authHeader, $matches)) {
        return $matches[1];
    }
    return null;
}

// Simple token-based session: generates a token on login, stored in a session file
function generateToken($userId) {
    $token = bin2hex(random_bytes(32));
    $sessionsFile = __DIR__ . '/sessions.json';
    $sessions = [];
    if (file_exists($sessionsFile)) {
        $sessions = json_decode(file_get_contents($sessionsFile), true) ?: [];
    }
    $sessions[$token] = [
        'user_id' => $userId,
        'created_at' => time(),
    ];
    file_put_contents($sessionsFile, json_encode($sessions));
    return $token;
}

function getUserFromToken($token) {
    $sessionsFile = __DIR__ . '/sessions.json';
    if (!file_exists($sessionsFile)) return null;
    $sessions = json_decode(file_get_contents($sessionsFile), true) ?: [];
    if (!isset($sessions[$token])) return null;

    $userId = $sessions[$token]['user_id'];
    $db = getDb();
    $stmt = $db->prepare('SELECT id, name, email, created_at FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    if (!$user) return null;

    // Format created_at for consistency
    $user['created_at'] = date('c', strtotime($user['created_at']));
    $user['user_metadata'] = ['full_name' => $user['name']];
    return $user;
}

function requireAuth() {
    $token = getBearerToken();
    if (!$token) {
        sendJson(['error' => 'Authentication required'], 401);
    }
    $user = getUserFromToken($token);
    if (!$user) {
        sendJson(['error' => 'Invalid or expired token'], 401);
    }
    return $user;
}
