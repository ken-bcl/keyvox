// WixのEC機能で注文完了時のWebhookを受けて指定のロッカーボックスを開けるサンプルコードv2

// 変数を宣言
const DEVICE_ID = "KEYVOX Web管理画面で取得できるロッカーのMACアドレス";
const EMAIL = '通知先メールアドレス';
// ペイロードに含まれる商品名とロッカー番号をマッピングしてください
const PRODUCT_BOX_MAP = {
  "商品名A": "00-00",
  "商品名B": "00-01",
  "商品名C": "00-02"
};

// APIキーとシークレットキーを保存する（一度だけ実行）
function storeKeys() {
  var scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('API_KEY', 'KEYVOX Web管理画面から取得したAPIキー');
  scriptProperties.setProperty('SECRET_KEY', 'KEYVOX Web管理画面から取得したシークレットキー');
}



//ログをメールする
function sendMail(subject, body, email = EMAIL) {
    try {
        MailApp.sendEmail(email, subject, body);
        Logger.log(`Email sent with subject: ${subject}`);
    } catch (error) {
        Logger.log(`Error sending email: ${error.toString()}`);
    }
}


//Wixの注文情報Webhookを受けてパースする
function doPost(e) {
    try {
        Logger.log("Received object: " + JSON.stringify(e));

        if (!e || !e.postData || !e.postData.contents) {
            sendMail('Webhook Error', 'postData is undefined.');
            return;
        }

        var payload = JSON.parse(e.postData.contents);
        var productID = payload.data.productID.trim();  // スペースを削除
        var email = payload.data.email.trim();  // スペースを削除
        var boxNum = PRODUCT_BOX_MAP[productID];
        
        //Wix側で指定したペイロードをを確認のため記録する
        Logger.log("Product ID: " + productID);
        Logger.log("Email: " + email);

        // デバッグ用のメールを送信
        sendMail('Debug Log', 'Webhook received with payload: ' + JSON.stringify(payload));

        if (PRODUCT_BOX_MAP.hasOwnProperty(productID)) {
            Logger.log("Condition matched for productID: " + productID);

            // 条件が合致したことをログに記録
            sendMail('Condition Matched', 'Condition matched for productID: ' + productID);

            var response = createLockerPin(boxNum);
            Logger.log("Received response from createLockerPin: " + JSON.stringify(response));

            if (response) {
                var contentText = response.getContentText();
                if (contentText) {
                    var parsedResponse = JSON.parse(contentText);
                    if (parsedResponse && parsedResponse.data) {
                        var pinCode = parsedResponse.data.pinCode;
                        var qrCode = parsedResponse.data.qrCode;
                        if (pinCode) {
                            Logger.log("Generated Pin Code: " + pinCode);
                            Logger.log("Generated QR Code: " + qrCode);
                            // ユーザー向けの通知を送信
                            sendEmailWithQRCode(qrCode, pinCode, email);
                        } else {
                            sendMail('Error Log', 'Error extracting pinCode: pinCode is null');
                        }
                    } else {
                        sendMail('Error Log', 'Error extracting data: data is null');
                    }
                } else {
                    sendMail('Error Log', 'Error: getContentText returned undefined');
                }
            } else {
                sendMail('Error Log', 'Error: Response is undefined');
            }
        }

    } catch (error) {
        sendMail('Error Log', `An error occurred: ${error.toString()}`);
    }

    return ContentService.createTextOutput(JSON.stringify({"status": "success"}))
        .setMimeType(ContentService.MimeType.JSON);
}


//ロッカーの暗証番号・QRコードをゲストにメールする
function sendEmailWithQRCode(qrCode, pinCode, email) {
    try {
        // QRコードを生成（Google Chart APIを使用）
        var qrCodeUrl = "https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=" + qrCode;
        var blob = UrlFetchApp.fetch(qrCodeUrl).getBlob().setName("QRCode.png");

        // メール送信先と内容
        var subject = "ロッカー解錠コード";
        var body = "ロッカー解錠の暗証番号は " + pinCode + " です。\n以下のQRコードも使用できます。";

        // メールを送信
        sendMail(subject, body, email, blob);

        Logger.log("Email sent successfully.");
    } catch (error) {
        sendMail('Error Log', `An error occurred: ${error.toString()}`);
    }
}



//ロッカーの暗証番号・QRコードを発行する
function createLockerPin(boxNum) {
    try {
        // APIキーとシークレットキーを読み込む
        var scriptProperties = PropertiesService.getScriptProperties();
        var apiKey = scriptProperties.getProperty('API_KEY');
        var secret = scriptProperties.getProperty('SECRET_KEY');

        // 現在の日付と時刻を取得
        var now = new Date();
        // 現在時刻をUnixタイムスタンプ（秒）に変換
        var sTime = Math.floor(now.getTime() / 1000);
        // 現在時刻＋2時間（解錠させたい期限を指定）をUnixタイムスタンプ（秒）に変換
        var eTime = sTime + (2 * 60 * 60);  // 2時間は7200秒

        // ログに日付と時間を出力
        Logger.log("sTime (UNIX Timestamp): " + sTime);
        Logger.log("eTime (UNIX Timestamp): " + eTime);

        // API名と他のパラメータを定義
        var apiName = "createLockerPin";
        var postParam = JSON.stringify({
            "deviceId": DEVICE_ID,
            "boxNum": boxNum,
            "checkin": "0",
            "mode": "0",
            "reassign": "0",
            "targetName": "Wix暗証番号",
            "sTime": sTime.toString(),
            "eTime": eTime.toString()
        });

        // 日付とダイジェストを生成
        var d = new Date();
        var date = d.toUTCString();
        var digestHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, postParam, Utilities.Charset.UTF_8);
        var digest = "SHA-256=" + Utilities.base64Encode(digestHash);

        // 署名する文字列を生成
        var stringToSign = "date: " + date + "\nPOST /api/eagle-pms/v1/" + apiName + " HTTP/1.1\ndigest: " + digest;

        // 署名を生成
        var signatureHash = Utilities.computeHmacSha256Signature(stringToSign, secret, Utilities.Charset.UTF_8);
        var signature = Utilities.base64Encode(signatureHash);

        // ヘッダーを準備
        var headers = {
            "date": date,
            "authorization": 'hmac username="' + apiKey + '", algorithm="hmac-sha256", headers="date request-line digest", signature="' + signature + '"',
            "x-target-host": "default.pms",
            "digest": digest,
            "Content-Type": "application/json"
        };

        // fetch呼び出しのオプションを準備
        var options = {
            "method": "POST",
            "headers": headers,
            "payload": postParam,
            "muteHttpExceptions": true
        };

        // API呼び出しを行う
        var url = "https://eco.blockchainlock.io/api/eagle-pms/v1/" + apiName;
        var response = UrlFetchApp.fetch(url, options);

        // レスポンスをログに出力
        var rawResponse = response.getContentText();
        Logger.log("Raw Response: " + rawResponse);

        // レスポンスをメールで通知
        MailApp.sendEmail(EMAIL, 'Raw Response Log', 'Raw API Response: ' + rawResponse);

        // レスポンスをパース
        var parsedResponse;
        try {
            parsedResponse = JSON.parse(rawResponse);
            Logger.log("Parsed Response: " + JSON.stringify(parsedResponse));
        } catch (e) {
            Logger.log("Error parsing response: " + e.toString());
            MailApp.sendEmail(EMAIL, 'Error Log', 'Error parsing response: ' + e.toString());
            return;
        }

        // 暗証番号とQRコードを取得
        var pinCode;
        try {
            pinCode = parsedResponse.data.pinCode;
            Logger.log("Extracted Pin Code: " + pinCode);
        } catch (e) {
            Logger.log("Error extracting pinCode: " + e.toString());
            MailApp.sendEmail(EMAIL, 'Error Log', 'Error extracting pinCode: ' + e.toString());
            return;
        }

    } catch (error) {
        // エラーメールを送信
        MailApp.sendEmail(EMAIL, 'Error Log', 'An error occurred in createLockerPin: ' + error.toString());
    }
    return response;
}