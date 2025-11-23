<?php
function get_datetime()
{
    return date('Y-m-d H:i:s');
}

function create_slug($string, $checkExistsCallback = null, $excludeId = null)
{
    $search = array(
        '#(à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ)#',
        '#(è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ)#',
        '#(ì|í|ị|ỉ|ĩ)#',
        '#(ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ)#',
        '#(ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ)#',
        '#(ỳ|ý|ỵ|ỷ|ỹ)#',
        '#(đ)#',
        '#(À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ)#',
        '#(È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ)#',
        '#(Ì|Í|Ị|Ỉ|Ĩ)#',
        '#(Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ)#',
        '#(Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ)#',
        '#(Ỳ|Ý|Ỵ|Ỷ|Ỹ)#',
        '#(Đ)#',
        "/[^a-zA-Z0-9\-\_]/",
    );
    $replace = array(
        'a',
        'e',
        'i',
        'o',
        'u',
        'y',
        'd',
        'A',
        'E',
        'I',
        'O',
        'U',
        'Y',
        'D',
        '-',
    );
    $string = preg_replace($search, $replace, $string);
    $string = preg_replace('/(-)+/', '-', $string);
    $string = strtolower($string);
    $string = trim($string, '-');
    
    if ($checkExistsCallback && is_callable($checkExistsCallback)) {
        $baseSlug = $string;
        $counter = 1;
        
        while (call_user_func($checkExistsCallback, $string, $excludeId)) {
            $string = $baseSlug . '-' . $counter;
            $counter++;
        }
    }
    
    return $string;
}

function slug_exists($conn, $table_name, $slug, $excludeId = null)
{
    $query = "SELECT id FROM " . $table_name . " WHERE slug = :slug";
    if ($excludeId) {
        $query .= " AND id != :exclude_id";
    }
    $query .= " LIMIT 1";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':slug', $slug);
    if ($excludeId) {
        $stmt->bindParam(':exclude_id', $excludeId, PDO::PARAM_INT);
    }
    $stmt->execute();
    
    return $stmt->rowCount() > 0;
}


function insert($conn, $table_name, $data)
{
    try {
        if (!is_array($data) || empty($data)) {
            throw new Exception("Dữ liệu không hợp lệ");
        }

        if (!isset($data['created_at'])) {
            $data['created_at'] = get_datetime();
        }

        $fields = array_keys($data);
        $placeholders = [];
        foreach ($fields as $field) {
            $placeholders[] = ':' . $field;
        }

        $query = "INSERT INTO " . $table_name . " 
                  (" . implode(', ', $fields) . ") 
                  VALUES 
                  (" . implode(', ', $placeholders) . ")";

        $stmt = $conn->prepare($query);

        foreach ($data as $key => $value) {
            if (is_int($value)) {
                $type = PDO::PARAM_INT;
            } elseif (is_bool($value)) {
                $type = PDO::PARAM_BOOL;
            } elseif (is_null($value)) {
                $type = PDO::PARAM_NULL;
            } else {
                $type = PDO::PARAM_STR;
            }
            
            $stmt->bindValue(':' . $key, $value, $type);
        }

        if ($stmt->execute()) {
            return $conn->lastInsertId();
        }

        return false;
    } catch (PDOException $e) {
        throw new Exception("Lỗi insert: " . $e->getMessage());
    }
}


function update($conn, $table_name, $data, $where)
{
    try {
        if (!is_array($data) || empty($data)) {
            throw new Exception("Dữ liệu không hợp lệ");
        }

        if (!isset($data['updated_at'])) {
            $data['updated_at'] = get_datetime();
        }

        if (is_array($where)) {
            $whereConditions = [];
            $whereBindings = [];
            
            foreach ($where as $field => $value) {
                $whereConditions[] = $field . " = :where_" . $field;
                $whereBindings[':where_' . $field] = $value;
            }
        } else {
            $whereConditions = ["id = :where_id"];
            $whereBindings = [':where_id' => $where];
        }

        $setParts = [];
        foreach (array_keys($data) as $field) {
            $setParts[] = $field . " = :" . $field;
        }

        $query = "UPDATE " . $table_name . " SET 
                  " . implode(', ', $setParts) . "
                  WHERE " . implode(' AND ', $whereConditions);

        $stmt = $conn->prepare($query);

        foreach ($data as $key => $value) {
            if (is_int($value)) {
                $type = PDO::PARAM_INT;
            } elseif (is_bool($value)) {
                $type = PDO::PARAM_BOOL;
            } elseif (is_null($value)) {
                $type = PDO::PARAM_NULL;
            } else {
                $type = PDO::PARAM_STR;
            }
            $stmt->bindValue(':' . $key, $value, $type);
        }

        foreach ($whereBindings as $key => $value) {
            if (is_int($value)) {
                $type = PDO::PARAM_INT;
            } elseif (is_bool($value)) {
                $type = PDO::PARAM_BOOL;
            } elseif (is_null($value)) {
                $type = PDO::PARAM_NULL;
            } else {
                $type = PDO::PARAM_STR;
            }
            $stmt->bindValue($key, $value, $type);
        }

        return $stmt->execute();
    } catch (PDOException $e) {
        throw new Exception("Lỗi update: " . $e->getMessage());
    }
}