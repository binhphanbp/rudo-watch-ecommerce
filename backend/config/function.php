<?php
/**
 * Helper functions for the application
 */

/**
 * Tạo slug từ chuỗi tiếng Việt
 * Chuyển đổi tiếng Việt có dấu sang không dấu và tạo URL-friendly slug
 * 
 * @param string $text - Chuỗi cần chuyển đổi
 * @return string - Slug đã được tạo
 */
function generateSlug($text)
{
    if (empty($text)) {
        return '';
    }

    // Chuyển đổi tiếng Việt có dấu sang không dấu
    $text = mb_strtolower($text, 'UTF-8');
    
    // Chuyển đổi các ký tự đặc biệt tiếng Việt
    $text = preg_replace('/[àáạảãâầấậẩẫăằắặẳẵ]/u', 'a', $text);
    $text = preg_replace('/[èéẹẻẽêềếệểễ]/u', 'e', $text);
    $text = preg_replace('/[ìíịỉĩ]/u', 'i', $text);
    $text = preg_replace('/[òóọỏõôồốộổỗơờớợởỡ]/u', 'o', $text);
    $text = preg_replace('/[ùúụủũưừứựửữ]/u', 'u', $text);
    $text = preg_replace('/[ỳýỵỷỹ]/u', 'y', $text);
    $text = preg_replace('/đ/u', 'd', $text);
    
    // Chuyển khoảng trắng và ký tự đặc biệt thành dấu gạch ngang
    $text = preg_replace('/[^a-z0-9]+/', '-', $text);
    $text = trim($text, '-');
    
    return $text;
}

/**
 * Tạo slug duy nhất bằng cách thêm số đếm nếu slug đã tồn tại
 * 
 * @param string $text - Chuỗi cần tạo slug
 * @param callable $checkExists - Callback function để kiểm tra slug đã tồn tại chưa
 *                                Function nhận 2 tham số: (string $slug, int|null $excludeId)
 *                                Trả về true nếu slug đã tồn tại, false nếu chưa
 * @param int|null $excludeId - ID cần loại trừ khi kiểm tra (dùng khi update)
 * @return string - Slug duy nhất
 */
function createUniqueSlug($text, $checkExists, $excludeId = null)
{
    $baseSlug = generateSlug($text);
    
    if (empty($baseSlug)) {
        return '';
    }
    
    $slug = $baseSlug;
    $counter = 1;
    
    // Kiểm tra và tạo slug duy nhất
    while (call_user_func($checkExists, $slug, $excludeId)) {
        $slug = $baseSlug . '-' . $counter;
        $counter++;
    }
    
    return $slug;
}

