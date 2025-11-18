<?php
// core/Response.php

class Response {
    /**
     * Trả về phản hồi JSON
     * @param mixed $data - Dữ liệu cần trả về
     * @param int $statusCode - Mã HTTP status (ví dụ: 200, 404)
     */
    public function json($data, $statusCode = 200) {
        // Xóa mọi output đã có trước đó (nếu có)
        ob_clean(); 
        
        // Thiết lập header
        header_remove();
        header("Content-Type: application/json");
        http_response_code($statusCode);

        // Chuẩn hóa cấu trúc response
        $response = [
            'status' => ($statusCode >= 200 && $statusCode < 300) ? 'success' : 'error',
            'data' => $data
        ];

        // In ra JSON và kết thúc
        echo json_encode($response);
        exit();
    }
}
?>