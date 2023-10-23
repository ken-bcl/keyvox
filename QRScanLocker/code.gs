//Google認証をしたユーザーがQRコードをスキャンしてロッカーを解錠するサンプルコードです。
/*
Google認証をGoogle Cloud PlatformのAPI and Service> Credentialで事前に設定します。
スプレッドシートを作成して、それぞれ、log, box, group, user, accessのシートを作ります。

box シート配列例
deviceId	boxNum	encodedQr	number
F822xxxxxxxxxxxx	00-00	Rjxxxxxxxxxxxxxxxxxxxxxxxxxxx1==	1
F822xxxxxxxxxxxx	00-01	Rjxxxxxxxxxxxxxxxxxxxxxxxxxxx2==	2
F822xxxxxxxxxxxx	00-02	Rjxxxxxxxxxxxxxxxxxxxxxxxxxxx3==	3


user シート配列例
User	Group
taro.block@blockchainlock.io	1,2,3,4
hanako.blocka@blockchainlock.io	1,2,3

accesシート配列例
Box	Group
00-00	1,2
00-01	1
00-02	2

groupシート配列例
1	sec
2	biz
3	dev
4	all
*/

function storeKeys() {
  var scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('API_KEY', 'YOUR_API_KEY');
  scriptProperties.setProperty('SECRET_KEY', 'YOUR_SECRET_KEY');
  scriptProperties.setProperty('CLIENT_ID', 'YOUR_CLIENT_ID');
  scriptProperties.setProperty('CLIENT_SECRET', 'YOUR_CLIENT_SECRET');
}

// 変数を宣言
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
const AUTH_BASE_URL = 'https://accounts.google.com/o/oauth2/auth';
const TOKEN_URL = 'https://accounts.google.com/o/oauth2/token';
const EMAIL_SCOPE = 'https://www.googleapis.com/auth/userinfo.email';

// OAuth2.0の設定
function createOAuthService() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const CLIENT_ID = scriptProperties.getProperty('CLIENT_ID');
  const CLIENT_SECRET = scriptProperties.getProperty('CLIENT_SECRET');

  return OAuth2.createService('ScanLocker')
    .setAuthorizationBaseUrl(AUTH_BASE_URL)
    .setTokenUrl(TOKEN_URL)
    .setClientId(CLIENT_ID)
    .setClientSecret(CLIENT_SECRET)
    .setCallbackFunction('authCallback')
    .setPropertyStore(PropertiesService.getUserProperties())
    .setScope(EMAIL_SCOPE);
}

// その他の設定
function setup() {
  const service = createOAuthService();
  Logger.log("CLIENT_ID: " + service.getClientId());
  Logger.log("CLIENT_SECRET: " + service.getClientSecret());
}



function doGet() {
  return HtmlService.createHtmlOutputFromFile('CameraPage')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

function isUserFromDomain(email) {
  return email.endsWith('@yourdomain.com');
}

function isAuthenticated() {
  var service = getOAuthService();
  if (service.hasAccess()) {
    var userEmail = Session.getActiveUser().getEmail();
    if (isUserFromDomain(userEmail)) {
      return true; // 認証済みかつ yourdomain.com ドメインのユーザー
    }
  }
  return false; // 認証済みでないか、yourdomain.com ドメインでないユーザー
}

function checkTokenExpiration() {
  var service = getOAuthService();
  if (service.hasAccess()) {
    var token = service.getAccessToken();
    var tokenInfo = JSON.parse(UrlFetchApp.fetch('https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=' + token));
    Logger.log(tokenInfo);  // ここでtokenInfoをログに出力していますが、必要に応じて適切な処理を行ってください。
  }
}



// コールバック関数名をsetCallbackFunctionに追加
function getOAuthService() {
  return createOAuthService();
}


function getAuthorizationUrl() {
  var service = getOAuthService();
  return service.getAuthorizationUrl();
}


// コールバック関数
function authCallback(request) {
  var service = getOAuthService();
  var authorized = service.handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutputFromFile('CameraPage')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } else {
    return HtmlService.createHtmlOutput('Denied.');
  }
}


function canUnlock(authenticatedUser, boxNum) {
  try {
    var userGroupData = getSpreadsheetData("user");
    var boxAccessData = getSpreadsheetData("access");
    var boxGroups = [];

    if (!userGroupData || !boxAccessData) {
      return false;
    }

    var userGroups = [];
    for (var i = 0; i < userGroupData.length; i++) {
      if (userGroupData[i][0] === authenticatedUser) {
        var userGroupString = userGroupData[i][1].toString();
        if (userGroupString) {
          userGroups = userGroupString.split(',').map(Number);
        }
        break;
      }
    }

    for (var i = 0; i < boxAccessData.length; i++) {
      if (boxAccessData[i][0] === boxNum) {
        var boxGroupString = boxAccessData[i][1].toString();
        if (boxGroupString) {
          boxGroups = boxGroupString.split(',').map(Number);
        }
        break;
      }
    }

    var accessAllowed = false;
    for (var i = 0; i < userGroups.length; i++) {
      if (boxGroups.includes(userGroups[i])) {
        accessAllowed = true;
        break;
      }
    }

    Logger.log("User: " + authenticatedUser + " belongs to groups: " + userGroups.join(", "));
    Logger.log("Box: " + boxNum + " can be accessed by groups: " + boxGroups.join(", "));

    if (accessAllowed) {
      Logger.log("Access allowed for User: " + authenticatedUser + ", Box: " + boxNum);
      return true;
    } else {
      Logger.log("Access denied for User: " + authenticatedUser + ", Box: " + boxNum);
      return false;
    }
  } catch (e) {
    Logger.log("Error in canUnlock: " + e.toString());
    return false;
  }
}



function unlockLocker(encodedText) {
  // 現在日時を取得
  var currentDateTime = new Date();
  
  // 認証されたユーザー名（メールアドレス）を取得
  var authenticatedUser = Session.getActiveUser().getEmail();
  
  // Base64でデコード
  var decodedText = Utilities.newBlob(Utilities.base64Decode(encodedText)).getDataAsString();
  console.log("Decoded Text: " + decodedText);

  // ";"で分割
  var splitText = decodedText.split(";");
  var deviceId = splitText[0];
  var boxNum = splitText[1];
  console.log("Device ID: " + deviceId);
  console.log("Box Number: " + boxNum);

  // 権限確認
  if (!canUnlock(authenticatedUser, boxNum)) {
    console.error("権限がありません。");
    saveResponseToSpreadsheet({code: "1", msg: "No Permission"}, currentDateTime, authenticatedUser, boxNum);
    return `${authenticatedUser}さんには権限がありません。サポートにお問い合わせください。`;
  }
  
  // 以下、権限が確認された後の処理
  const postParam = {
    "deviceId": deviceId,
    "boxNum": boxNum
  };

  // APIヘルパーを呼び出す
  var response = callApi("unlockLocker", JSON.stringify(postParam));

  // レスポンスの内容をパースしてオブジェクトとして利用
  let responseObject = JSON.parse(response);
  
  // スプレッドシートにレスポンスを保存
  saveResponseToSpreadsheet(responseObject, currentDateTime, authenticatedUser, boxNum);

  if (responseObject.code === "0" && responseObject.msg === "success") {
    console.log("ロッカー番号 " + boxNum + " が正常にアンロックされました。");
    return `${authenticatedUser}さんが解錠しました。荷物を取り出してください。`;
  } else {
    console.error("ロッカー番号 " + boxNum + " のアンロックに失敗しました：", responseObject.msg);
    return "ロッカーの解錠に失敗しました。サポートにお問い合わせください。";
  }
}


function getSpreadsheetData(sheetName) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      Logger.log("Sheet not found: " + sheetName);
      return null;
    }
    // ここでカラム数を動的に取得しても良い
    var lastColumn = sheet.getLastColumn();
    return sheet.getRange("A2:" + columnToLetter(lastColumn) + sheet.getLastRow()).getValues();
  } catch (e) {
    Logger.log("Error in getSpreadsheetData: " + e.toString());
    return null;
  }
}

// カラム番号をアルファベットに変換する補助関数
function columnToLetter(column) {
  var temp, letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
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



function saveResponseToSpreadsheet(responseObject, currentDateTime, authenticatedUser, boxNum) {

  // スプレッドシートのシート名を指定
  var sheetName = 'log';

  // スプレッドシートを開いてシートを取得
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(sheetName);

  // レスポンス情報と日付を新しい行に追加して保存
  var rowData = [
    currentDateTime,  // A列に現在の日時を追加
    responseObject.code, // B列にコードを追加
    responseObject.msg, // C列にメッセージを追加
    authenticatedUser,  // D列に解錠者（OAuthしたユーザー）を追加
    "'" + String(boxNum)     // E列にboxNumを文字列として追加、シングルクォートを前置

  ];

  // 新しい行にデータを追加
  sheet.appendRow(rowData);
}



function getLatestTenUnlockRecords() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("log");
  const lastRow = sheet.getLastRow();
  
  // データが10行未満の場合は、1行目から最後の行までを取得
  const startRow = Math.max(1, lastRow - 9);
  const numRows = lastRow - startRow + 1;
  
  // 最新の numRows 行を取得（5列目まで取得）
  const range = sheet.getRange(startRow, 1, numRows, 5);
  const values = range.getValues();
  
  const messages = values.map((row) => {
    const rawDate = row[0];
    const status = row[2];
    const email = row[3];
    const boxNum = row[4];  // 5列目をboxNumとして取得

    // 日付を指定のフォーマットに変更
    const formattedDate = Utilities.formatDate(new Date(rawDate), "GMT+09:00", "yyyy/MM/dd HH:mm");
    
    if (status === "success") {
      return `${email}が${formattedDate}に${boxNum}を解錠しました。`;  
    } else {
      return `${email}が${formattedDate}に${boxNum}の解錠に失敗しました。`;
    }
    
  }).reverse(); // 最新のレコードが最初に来るように配列を逆転
  
  Logger.log("About to return: " + JSON.stringify(messages)); 
  return messages;
}
