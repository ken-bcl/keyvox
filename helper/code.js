/*
■ ■ ■　本関数の説明　■ ■ ■
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

// 呼び出しサンプル　//
// 必要な定数の宣言
const UNIT_ID = "your_unit_id_value"; //ドアのIDをgetUnitAPIで取得
const LOCK_ID = "your_lock_id_value"; //ロックのIDをgetUnitAPIで取得
const DEVICE_ID = "your_device_id_value"; //ロッカーのIDをgetUnitAPIで取得

// サンプル１．ロックAPI - createLockPinの呼び出し例
function createLockPinFromGmail(pin, stime, etime, targetName) {
    const postParam = {
        unitId: UNIT_ID,
        pinCode: pin,
        sTime: stime.toString(),
        eTime: etime.toString(),
        targetName: targetName
    };

    return callApi('createLockPin', JSON.stringify(postParam));
}


// サンプル２．ロックAPI - unlockの呼び出し例

function unlockLock() {
    const postParam = {
        lockId: LOCK_ID,
        flag: "1" // 0 -> lock, 1 -> unlock
    };

    return callApi("unlock", JSON.stringify(postParam));
}



// サンプル３．ロッカーAPI - unlockLockerの呼び出し例
function unlockLocker(boxNum) {
    const postParam = {
        deviceId: DEVICE_ID,
        boxNum: boxNum
    };

    let response = callApi("unlockLocker", JSON.stringify(postParam));
    let responseObject = JSON.parse(response);

    if (responseObject.code === "0" && responseObject.msg === "success") {
        return "解錠しました。荷物を取り出してください。";
    } else {
        return "ロッカーの解錠に失敗しました。サポートにお問い合わせください。";
    }
}




// KEYVOX APIヘルパー
function callApi(apiName, postParam) {
    var scriptProperties = PropertiesService.getScriptProperties();
    var API_KEY = scriptProperties.getProperty('API_KEY');
    var SECRET_KEY = scriptProperties.getProperty('SECRET_KEY');
    
    if (!API_KEY || !SECRET_KEY) {
        Logger.log("API_KEY or SECRET_KEY is not set");
        return null;
    }

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

    try {
        return UrlFetchApp.fetch(url, options);
    } catch (e) {
        Logger.log(`API呼び出しエラー: ${e}`);
        return null;
    }
}
