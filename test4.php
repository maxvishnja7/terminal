<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require 'vendor/autoload.php';

use Aws\Sts\StsClient;
use Aws\Ec2\Ec2Client;
use phpseclib3\Net\SSH2;
use phpseclib3\Crypt\PublicKeyLoader;

// Информация для аутентификации...
// [Ваш код для аутентификации и создания клиентов AWS]

/*
// Получение списка EC2 инстансов
try {
    $result = $ec2Client->describeInstances();
    // ... Код обработки результатов
} catch (Aws\Exception\AwsException $e) {
    echo "Error: " . $e->getMessage();
}
*/

// Подключение к инстансу EC2 по SSH и выполнение команды
// Предположим, что $instance содержит данные о нужном инстансе EC2
$instanceIpAddress = '18.234.101.94'; // Укажите IP адрес или Public DNS имя EC2 инстанса

$ssh = new SSH2($instanceIpAddress);

// Загрузка приватного ключа 
$key = PublicKeyLoader::load(file_get_contents('/var/www/lab-max/ssh-phpseclib.pem'));

if (!$ssh->login('admin', $key)) {
    exit('SSH login failed');
}

// Выполнение команды на удаленном сервере
echo $ssh->exec('sudo cat /etc/os-release'); // Пример команды

?>

