<?php 

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);



require 'vendor/autoload.php';

use Aws\Sts\StsClient;
use Aws\Ec2\Ec2Client;

// Информация для аутентификации
$awsAccount = '974784501693'; // ID аккаунта AWS клиента
$roleArn = 'arn:aws:iam::974784501693:role/cloudvert'; // ARN роли
$externalId = 'Cloudvert-20231213-SpecialAccess'; // External ID, предоставленный клиентом
$region = 'eu-central-1'; // Регион, в котором находятся EC2 инстансы

// Создание клиента STS для получения учетных данных
/**
$stsClient = new StsClient([
    'version' => 'latest',
    'region' => $region
]);
**/
// Получение временных учетных данных с использованием External ID
/**
$result = $stsClient->assumeRole([
    'RoleArn' => $roleArn,
    'RoleSessionName' => 'session-name', // Имя сессии для идентификации в логах AWS
    'ExternalId' => $externalId  // Предоставление External ID
]);
**/
//$credentials = $result->get('Credentials');

// конец аутентификаций



// Создание клиента EC2 с использованием временных учетных данных
$ec2Client = new Ec2Client([
    'version' => 'latest',
    'region' => $region,
    'credentials' => [
        'role_arn' => $roleArn,
    ]
]);

// Получение списка EC2 инстансов
try {
    $result = $ec2Client->describeInstances();
    foreach ($result['Reservations'] as $reservation) {
        foreach ($reservation['Instances'] as $instance) {
            // Вывод информации об инстансе
            echo "Instance ID: " . $instance['InstanceId'] . "\n";
            echo "Instance State: " . $instance['State']['Name'] . "\n";
            echo "Instance Type: " . $instance['InstanceType'] . "\n";
            echo "Public DNS: " . ($instance['PublicDnsName'] ?? 'N/A') . "\n";
            // Дополнительные данные об инстансе...
        }
    }
} catch (Aws\Exception\AwsException $e) {
    // Вывод ошибки, если запрос не удался
    echo "Error: " . $e->getMessage();
}



 ?>
