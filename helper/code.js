/*
このヘルパーはKEYVOX APIをGASから簡単にコールするためのものです。
呼び出したい関数からcallApi関数を呼び出します。
利用の前にスクリプトエディタ上で、storeKeys関数を実行することで、安全にAPIキーがGAS側に保管されます。
*/


// APIキーとシークレットキーを保存する関数（一度だけ実行）
function storeKeys() {
  var scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('API_KEY', 'ここに自分のAPIキーを貼り付ける');
  scriptProperties.setProperty('SECRET_KEY', 'ここに自分のAPIシークレットキー貼り付ける');
}




// サンプル１．ロックAPI - unlock の呼び出し例
function unlockLock() {
    var postParam = JSON.stringify({
        "lockId": ENTRY_DEVICE_ID,
        "flag": "1" // 0 -> lock, 1 -> unlock
    });

    // APIの名前
    var apiName = "unlock";

    // ヘルパー関数を使ってAPIを呼び出す
    var response = callApi(apiName, postParam);

    // レスポンスをログに記録
    Logger.log(response.getContentText());

    // JSONとしてレスポンスを返す
    return JSON.parse(response.getContentText());
}




// サンプル２．ロッカーAPI - unlockLockerの呼び出し例
function unlockLocker(boxNum) {
    console.log("unlockLocker関数が呼び出されました。ロッカー番号:", boxNum);

    const postParam = {
      "deviceId": DEVICE_ID,
      "boxNum": boxNum
    };

    // APIヘルパーを呼び出す
    var response = callApi("unlockLocker", JSON.stringify(postParam));

    // レスポンスの内容をパースしてオブジェクトとして利用
    let responseObject = JSON.parse(response);

    if (responseObject.code === "0" && responseObject.msg === "success") {
        console.log("ロッカー番号 " + boxNum + " が正常にアンロックされました。");
        return "解錠しました。荷物を取り出してください。";  // ユーザーに向けたメッセージを返す
    } else {
        console.error("ロッカー番号 " + boxNum + " のアンロックに失敗しました：", responseObject.msg);
        return "ロッカーの解錠に失敗しました。サポートにお問い合わせください。";  // エラーメッセージを返す
    }
}




// KEYVOX APIヘルパー
function callApi(apiName, postParam) {
    var scriptProperties = PropertiesService.getScriptProperties();
    var API_KEY = scriptProperties.getProperty('API_KEY');
    var SECRET_KEY = scriptProperties.getProperty('SECRET_KEY');

    var d = new Date();
    var date = d.toUTCString();
    
    var digestHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, postParam, Utilities.Charset.UTF_8);
    var digest = "SHA-256=" + Utilities.base64Encode(digestHash);

    var stringToSign = "date: " + date + "\nPOST /api/eagle-pms/v1/" + apiName + " HTTP/1.1\ndigest: " + digest;
    var signatureHash = Utilities.computeHmacSha256Signature(stringToSign, SECRET_KEY, Utilities.Charset.UTF_8);
    var signature = Utilities.base64Encode(signatureHash);

    var headers = {
        "date": date,
        "authorization": 'hmac username="' + API_KEY + '", algorithm="hmac-sha256", headers="date request-line digest", signature="' + signature + '"',
        "x-target-host": "default.pms",
        "digest": digest,
        "Content-Type": "application/json"
    };

    var options = {
        "method": "POST",
        "headers": headers,
        "payload": postParam,
        "muteHttpExceptions": true
    };

    var url = "https://eco.blockchainlock.io/api/eagle-pms/v1/" + apiName;
    return UrlFetchApp.fetch(url, options);
}
