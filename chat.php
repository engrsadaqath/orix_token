<?php
// Set content type to ensure proper handling
header('Content-Type: text/plain');

// Prevent direct access to this file
if (!isset($_SERVER['HTTP_X_REQUESTED_WITH']) || strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) !== 'xmlhttprequest') {
    // Redirect to index page or show access denied
    header('Location: index.html');
    exit;
}

// Deepseek API configuration
$api_key = "sk-8d7ff942f5f5499cb2749e33d4d93256";

// Check if this is an AJAX request for chat
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['message']) && isset($_POST['wallet_address'])) {
    $message = $_POST['message'];
    $wallet_address = $_POST['wallet_address'];
    
    // Call Deepseek API
    $response = callDeepseekAPI($message, $api_key);
    
    // Only return the API response for AJAX requests, then exit
    echo $response;
    exit; // This is crucial - it prevents the rest of the page from being sent
}

// Function to call Deepseek API
function callDeepseekAPI($message, $api_key) {
    $url = 'https://api.deepseek.com/v1/chat/completions';
    
    // Optimize for speed with shorter responses and more focused answers
    $data = [
        'model' => 'deepseek-chat',
        'messages' => [
            ['role' => 'system', 'content' => 'You are a helpful, concise AI assistant. Provide brief responses. If someone ask you who you are, you must be answer like: I am AI Agent ORIX.'],
            ['role' => 'user', 'content' => $message]
        ],
        'max_tokens' => 250, // Reduced max tokens for faster responses
        'temperature' => 0.5, // Lower temperature for more focused responses
        'stream' => false
    ];
    
    $options = [
        'http' => [
            'header' => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $api_key
            ],
            'method' => 'POST',
            'content' => json_encode($data),
            'timeout' => 10 // Add 10 second timeout for faster feedback
        ]
    ];
    
    $context = stream_context_create($options);
    
    try {
        // Set a timeout for the entire operation
        set_time_limit(12); // Allow 12 seconds for the entire PHP execution
        
        $result = @file_get_contents($url, false, $context); // Use @ to suppress warnings
        if ($result === false) {
            $error = error_get_last();
            if (strpos($error['message'] ?? '', 'timed out') !== false) {
                return "Response taking too long. Please try again with a simpler question.";
            }
            return "Error: Unable to connect to the API. Please try again.";
        }
        
        $response = json_decode($result, true);
        
        // Check if the response structure matches what we expect
        if (isset($response['choices'][0]['message']['content'])) {
            return $response['choices'][0]['message']['content'];
        } else {
            // Log the response for debugging
            error_log('Unexpected API response: ' . json_encode($response));
            return "Error: Unexpected API response format. Please try again.";
        }
    } catch (Exception $e) {
        return "Error: " . $e->getMessage() . ". Please try again.";
    }
}
// This file should only be accessed via AJAX. 
// If you need the HTML interface, please use index.html