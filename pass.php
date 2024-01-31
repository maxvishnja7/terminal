<?php
$password = 'your_secure_password_here';
$salt = '3ff8a4bb728396f191bf5d69217315da'; // Генерация случайной соли
$iterations = 10000; // Количество итераций (увеличьте, чтобы усилить)
$key = hash_pbkdf2('sha256', $password, $salt, $iterations, 32, true);
echo "Generated Key: " . bin2hex($key) . "\n";
