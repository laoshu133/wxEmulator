<?php

/***************************************************************************
 *
 * WxEmulator
 *
 **************************************************************************/

/**
 * @version 1.0
 * @author laoshu133
 */

require_once 'HttpClient.class.php';

class WxEmulator extends HttpClient {
    protected $mpUrl = '';
    protected $mpToken = '';
    protected $apiUrl = '';

    public function WxEmulator($mpUrl, $mpToken) {
        $this->mpUrl = $mpUrl;
        $this->mpToken = $mpToken;

        $this->apiUrl = $this->getApiUrl();
    }

    public function handlePost() {
        // $_POST['mpxml'] = "<xml><ToUserName><![CDATA[gh_204936aea56d]]></ToUserName><FromUserName><![CDATA[ojpX_jig-gyi3_Q9fHXQ4rdHniQs]]></FromUserName><CreateTime></CreateTime><MsgType><![CDATA[text]]></MsgType><Content><![CDATA[XXXXX]]></Content><MsgId>1234567890abcdef</MsgId></xml>";
        // $ret = $this->post($this->apiUrl, $_POST['mpxml']);
        // echo $ret['result'];
        // exit;

        $ret = $this->post($this->apiUrl, $_POST['mpxml']);
        $status = $ret['success'] ? 'success' : 'error';

        $this->echoJSON($status, array(
            'result' => trim($ret['result'])
        ));
    }

    public function checkSignature() {
        $ret = $this->get($this->apiUrl);

        $status = $ret['success'] ? 'success' : 'error';
        $this->echoJSON($status);
    }

    public function getApiUrl() {
        $timestamp = "".time();
        $nonce = "".rand(10000, 99999);
        $tmpArr = array($this->mpToken, $timestamp, $nonce);

        sort($tmpArr);
        $tmpStr = implode( $tmpArr );
        $signature = sha1( $tmpStr );

        $params = array(
            'signature'    => $signature,
            'timestamp'    => $timestamp,
            'nonce'        => $nonce,
            'echostr'      => '133'
        );

        $url = $this->mpUrl . '?';
        $url .= HttpClient::buildQueryString($params);
        return $url;
    }

    public function echoJSON($status, $data=array()) {
        $ret = array();
        $ret['status'] = $status;

        foreach ($data as $k => $val) {
            $ret[$k] = $val;
        }

        echo json_encode($ret);
    }
}
?>