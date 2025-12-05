<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Suppress display of errors to prevent JSON corruption
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Start output buffering to catch any stray output
ob_start();

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_clean();
    http_response_code(200);
    exit();
}

// Include required libraries
require_once 'config/database_factory.php';

// Create cache directory if it doesn't exist
$cache_dir = 'cache';
if (!file_exists($cache_dir)) {
    mkdir($cache_dir, 0777, true);
}

// Initialize database connection using factory
try {
    $db = DatabaseFactory::getInstance()->getDatabase();
} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed',
        'details' => $e->getMessage()
    ]);
    exit();
}

// Function to generate QR code data based on type
function generateQRData($type, $data) {
    switch ($type) {
        case 'url':
            return $data['url'] ?? $data['text'] ?? $data['input'] ?? '';
            
        case 'text':
            return $data['text'] ?? $data['content'] ?? $data['input'] ?? '';
            
        case 'email':
            $email = $data['email'] ?? $data['input'] ?? '';
            $subject = $data['subject'] ?? '';
            $body = $data['body'] ?? '';
            
            if (empty($email)) return '';
            
            $mailto = "mailto:$email";
            $params = [];
            if (!empty($subject)) $params[] = "subject=" . urlencode($subject);
            if (!empty($body)) $params[] = "body=" . urlencode($body);
            
            if (!empty($params)) {
                $mailto .= "?" . implode("&", $params);
            }
            return $mailto;
            
        case 'phone':
            $phone = $data['phone'] ?? $data['text'] ?? $data['input'] ?? '';
            return empty($phone) ? '' : "tel:$phone";
            
        case 'wifi':
            $ssid = $data['ssid'] ?? $data['input'] ?? '';
            $password = $data['password'] ?? '';
            $security = $data['security'] ?? 'WPA';
            
            if (empty($ssid)) return '';
            
            $wifi_string = "WIFI:S:$ssid";
            if (!empty($password) && $security !== 'nopass') {
                $wifi_string .= ";P:$password;T:$security";
            } elseif ($security === 'nopass') {
                $wifi_string .= ";T:nopass";
            }
            $wifi_string .= ";;";
            
            return $wifi_string;
            
        case 'sms':
            $phone = $data['phone'] ?? $data['number'] ?? $data['input'] ?? '';
            $message = $data['message'] ?? $data['text'] ?? '';
            
            if (empty($phone)) return '';
            
            $sms = "sms:$phone";
            if (!empty($message)) {
                $sms .= "?body=" . urlencode($message);
            }
            return $sms;
            
        default:
            return is_string($data) ? $data : (is_array($data) ? json_encode($data) : '');
    }
}

// Function to hex to RGB conversion
function hexToRgb($hex) {
    $hex = str_replace('#', '', $hex);
    if (strlen($hex) == 3) {
        $hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
    }
    return [
        'r' => hexdec(substr($hex, 0, 2)),
        'g' => hexdec(substr($hex, 2, 2)),
        'b' => hexdec(substr($hex, 4, 2))
    ];
}

// Main processing
try {
    $start_time = microtime(true);
    
    // Get input data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        // Try to get data from POST if JSON decode fails
        $input = $_POST;
    }
    
    // Debug logging
    error_log("QR Generation Request: " . json_encode($input));
    
    // Validate required fields
    if (empty($input['type'])) {
        throw new Exception('Missing required field: type');
    }
    
    if (empty($input['data'])) {
        throw new Exception('Missing required field: data');
    }
    
    $type = $input['type'];
    $data = $input['data'];
    
    // Handle different data formats
    if (is_string($data)) {
        $data = ['text' => $data];
    }
    
    $size = isset($input['size']) ? intval($input['size']) : 200;
    $ecc = isset($input['ecc']) ? strtoupper($input['ecc']) : 'M';
    $fg_color = isset($input['fg_color']) ? $input['fg_color'] : '#000000';
    $bg_color = isset($input['bg_color']) ? $input['bg_color'] : '#ffffff';
    $format = isset($input['format']) ? strtolower($input['format']) : 'png';
    
    // Generate QR code data
    $qr_data = generateQRData($type, $data);
    
    if (empty($qr_data)) {
        throw new Exception('Invalid or missing data for QR code generation. Data: ' . json_encode($data));
    }
    
    // Generate unique filename
    $filename = uniqid('qr_') . '_' . time() . '.' . $format;
    $filepath = $cache_dir . '/' . $filename;
    
    // Save image from base64 data
    if (isset($input['image_data'])) {
        $image_data = $input['image_data'];
        // Remove header if present (e.g., "data:image/png;base64,")
        $image_data = preg_replace('#^data:image/\w+;base64,#i', '', $image_data);
        $decoded_image = base64_decode($image_data);
        
        if ($decoded_image === false) {
            throw new Exception('Failed to decode base64 image data');
        }
        
        if (file_put_contents($filepath, $decoded_image) === false) {
            throw new Exception('Failed to save QR code image');
        }
    } else {
        throw new Exception('Missing image data');
    }
    
    // Get file info
    $file_size = filesize($filepath);
    $file_url = $cache_dir . '/' . $filename;
    
    // Calculate processing time
    $processing_time = microtime(true) - $start_time;
    
    // Save to database
    $db_data = [
        'filename' => $filename,
        'file_path' => $filepath,
        'type' => $type,
        'original_data' => $data,
        'generated_data' => $qr_data,
        'size' => $size,
        'fg_color' => $fg_color,
        'bg_color' => $bg_color,
        'format' => $format,
        'ecc' => $ecc,
        'template' => $input['template'] ?? 'classic',
        'dot_style' => $input['dot_style'] ?? 'square',
        'corner_style' => $input['corner_style'] ?? 'square'
    ];
    
    $qr_id = $db->saveQRCode($db_data);
    
    // Log analytics event
    $db->logAnalytics([
        'qr_id' => $qr_id,
        'event_type' => 'generate',
        'data_type' => $type,
        'size' => $size,
        'format' => $format,
        'processing_time' => $processing_time
    ]);
    
    // Clear any buffered output
    ob_clean();
    
    // Return success response
    echo json_encode([
        'success' => true,
        'id' => $qr_id,
        'filename' => $filename,
        'filepath' => $filepath,
        'url' => $file_url,
        'size' => $file_size,
        'format' => $format,
        'data' => $qr_data,
        'type' => $type,
        'message' => 'QR code generated successfully',
        'processing_time' => round($processing_time, 3)
    ]);

    // Probability-based cleanup (1% chance) to ensure files are cleared even without cron
    if (rand(1, 100) === 1) {
        // Run cleanup script
        // We use output buffering to ensure no stray output breaks the JSON response
        ob_start();
        include __DIR__ . '/scripts/cleanup.php';
        ob_end_clean();
    }
    
} catch (Exception $e) {
    // Return error response
    ob_clean();
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'details' => 'An error occurred while generating the QR code',
        'input_received' => $input ?? null
    ]);
}
?>