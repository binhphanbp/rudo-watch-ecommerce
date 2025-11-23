<?php

class Response {

    public function json($data, $statusCode = 200) {
        ob_clean(); 
        header_remove();
        header("Content-Type: application/json");
        http_response_code($statusCode);

        $response = [
            'status' => ($statusCode >= 200 && $statusCode < 300) ? 'success' : 'error',
            'statusCode' => $statusCode,
            'data' => $data
        ];

        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        exit();
    }
}
?>