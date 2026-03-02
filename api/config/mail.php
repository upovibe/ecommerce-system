<?php
// api/config/mail.php - Email configuration using central app_config.php

$config = require __DIR__ . '/app_config.php';
$mail = $config['mail'];

return [
    'smtp' => [
        'host' => $mail['host'],
        'port' => $mail['port'],
        'encryption' => $mail['encryption'],
        'username' => $mail['username'],
        'password' => $mail['password'],
        'timeout' => 30,
    ],
    'from' => [
        'address' => $mail['from_address'],
        'name' => $mail['from_name'],
    ],
]; 