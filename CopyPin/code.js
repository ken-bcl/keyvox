/*
本コードは、下記YouTubeで実際にAIとコーディングした内容です。
API KEYなど必要な情報を投入後、GASでデプロイします。
デプロイ後アプリURLをZapierのActionに追加することで、Zapierで読み取ったGmailをWebhookで受け取り、GASでパース後、KEYVOX APIにてカギが発行されます。
参照：　https://youtu.be/vYjEJOA7GUM
*/


// APIキーとシークレットキーを保存する関数（一度だけ実行）
function storeKeys() {
  var scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('API_KEY', 'YOUR_API_KEY');
  scriptProperties.setProperty('SECRET_KEY', 'YOUR_SECRET_KEY');
}



function doPost(e) {
    console.log("doPostが開始されました。");
    console.info("受け取ったイベント: ", e);

    try {
        // リクエストのボディを取得し、JSONにパース
        var requestBody = e.postData.contents;
        console.info("受け取ったボディ: ", requestBody);

        var parsedData = JSON.parse(requestBody);
        if (!parsedData || !parsedData.body) {
            console.error("Error: ボディに'data'や'data.body'が見当たりません。");
            return ContentService.createTextOutput("Invalid request");
        }

        // メールの本文を解析
        var mailBody = parsedData.body;
        var result = parseGmailBody(mailBody);
        console.info("メール本文の解析結果: ", result);

        if(result && result.pin && result.startTime && result.endTime && result.targetName) {
       createLockPinFromGmail(result.pin, result.startTime, result.endTime, result.targetName);
        }


        return ContentService.createTextOutput("Success");
    } catch (error) {
        console.error("Error encountered: ", error.toString(), "Stack: ", error.stack);
        return ContentService.createTextOutput("Internal server error: " + error.toString()).setMimeType(ContentService.MimeType.TEXT);
    }
}




function parseGmailBody(body) {
    console.log("parseGmailBody関数が開始されました。");

    var pinMatch = body.match(/暗証番号：(\d+)/);
    var pin = pinMatch ? pinMatch[1] : undefined;

    var matchDuration = body.match(/利用期間：(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2})~(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2})/);
    var stime, etime;
    if (matchDuration) {
        stime = new Date(matchDuration[1]).getTime() / 1000;
        etime = new Date(matchDuration[2]).getTime() / 1000;
    }

    var targetNameMatch = body.match(/予約者名：([\s\S]+?)\n/);
    var targetName = targetNameMatch ? targetNameMatch[1].replace(/<br>/g, '').trim() : undefined;

    console.log("Parsed PIN: " + pin);
    console.log("Parsed Start Time: " + stime);
    console.log("Parsed End Time: " + etime);
    console.log("Parsed Target Name: " + targetName);

    var parsedResult = {
        pin: pin,
        startTime: stime,
        endTime: etime,
        targetName: targetName
    };

    console.log("parseGmailBody関数が終了しました。");
    return parsedResult;
}






var UNIT_ID = "YOUR_UNIT_ID"; // ここに取得したunitId（ドアIDを）を設定してください

function createLockPinFromGmail(pin, stime, etime, targetName) {
    var postParam = JSON.stringify({
        unitId: UNIT_ID,
        pinCode: pin,
        sTime: stime.toString(),
        eTime: etime.toString(),
        targetName: targetName
    });

    // ログにAPIコールのデータを出力
    Logger.log("API Call Data:");
    Logger.log(postParam);

    var response = callApi('createLockPin', postParam);

    // ログにAPIからのレスポンスを出力
    Logger.log("API Response:");
    Logger.log(response);

    // スプレッドシートにデータを保存
    saveResponseToSpreadsheet(response, pin, stime, etime, targetName);

    return response;
}


function unixTimeToDateTime(unixTime) {
    // UNIX時間をミリ秒に変換してDateオブジェクトを作成
    var date = new Date(unixTime * 1000);

    // 日付と時刻を文字列に変換
    var formattedDate = Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");

    return formattedDate;
}




function saveResponseToSpreadsheet(response, pin, stime, etime, targetName) {
    // スプレッドシートのIDを指定
    var spreadsheetId = 'YOUR_SPREADSHEET_ID';

    // スプレッドシートのシート名を指定
    var sheetName = 'YOUR_SHEET_NAME';

    // スプレッドシートを開いてシートを取得
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    var sheet = spreadsheet.getSheetByName(sheetName);

    // レスポンス情報を新しい行に追加して保存
    var rowData = [
        pin, // A列に暗証番号を追加
        unixTimeToDateTime(stime), // B列にStimeを追加
        unixTimeToDateTime(etime), // C列にEtimeを追加
        targetName // D列にtargetNameを追加
    ];

    // 新しい行にデータを追加
    sheet.appendRow(rowData);
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
