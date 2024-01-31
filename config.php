<?php
// config.php

return [
    // AWS конфигурация
    'aws' => [
        'region' => 'eu-central-1', // Регион AWS
        'credentials' => [
            'key'    => getenv('AWS_ACCESS_KEY_ID'),      // AWS Access Key ID
            'secret' => getenv('AWS_SECRET_ACCESS_KEY'),  // AWS Secret Access Key
        ],
        'ec2' => [
            'version' => 'latest',
            'role_arn' => 'arn:aws:iam::974784501693:role/cloudvert', // ARN роли
            'external_id' => 'Cloudvert-20231213-SpecialAccess',     // External ID
        ],
    ],

    // SSH конфигурация
    'ssh' => [
        'username' => 'ec2-user',   // Имя пользователя для SSH
        'private_key_path' => '/var/wwww/', // Путь к приватному ключу
    ],
];
?>

