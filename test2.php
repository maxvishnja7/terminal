<?php

function getEc2InstanceMetadata($metadataPath) {
$baseUrl = 'http://169.254.169.254/latest/meta-data/';
    $url = $baseUrl . $metadataPath;

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    $response = curl_exec($ch);
    curl_close($ch);

    if ($response === FALSE) {
        return "Error getting metadata from {$url}";
    }

    return $response;
}

// Пример использования
$instanceId = getEc2InstanceMetadata('instance-id');
echo "Instance ID: " . $instanceId;
