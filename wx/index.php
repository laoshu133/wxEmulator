<?php
require_once 'lib/WxEmulator.php';

// $WxEmulator = new WxEmulator('http://test.wx2.07340.com/index.php/api/qdophw1416743234', 'qdophw1416743234');
// $WxEmulator->handlePost();
// exit;


if($_SERVER['REQUEST_METHOD'] == 'GET') {
    echo 'Not support get action!';
    exit;
}


$mpUrl = $_POST['mpurl'];
$mpToken = $_POST['mptoken'];

$WxEmulator = new WxEmulator($mpUrl, $mpToken);


$action = isset($_POST['a']) ? $_POST['a'] : 'post';
if($action == 'post') {
    $WxEmulator->handlePost();
}
else if($action == 'checkSignature') {
    $WxEmulator->checkSignature();
}
else {
    echo 'Not defined action!';
}




?>