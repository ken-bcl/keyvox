// 本コードは未完成です。特に月末にガチャがされますが、月末に出勤した人の回数分ガチャが実行されます。ガチャは一度だけ実行されるように変更する必要があります。


// グローバルスコープに変数を配置
var EMAIL_ADDRESS = "YOUR_EMAIL_ADDRESS";
var DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/YOUR＿DISCORD_POST_URL";

// APIキーとシークレットキーを保存する関数（一度だけ実行）
function storeKeys() {
  var scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('API_KEY', 'YOUR_API_KEY');
  scriptProperties.setProperty('SECRET_KEY', 'YOUR_SECRET_KEY');
}

// デバイス名とdeviceIDのマッピングテーブル
var DEVICE_MAPPING = {
  "BCL-QR1#外側": "YOUR_DEVICE_ID",  // 入り口のデバイスID
  "BCL-QR1#内側": "YOUR_DEVICE_ID"    // 出口のデバイスID（必要に応じて）
};

// 入り口と出口のdeviceID
var ENTRY_DEVICE_ID = DEVICE_MAPPING["BCL-QR1#外側"]; // 必要に応じて変更
var EXIT_DEVICE_ID = DEVICE_MAPPING["BCL-QR1#内側"];  // 必要に応じて変更

var lastReceived = {};

function getDeviceNameByDeviceId(deviceId) {
  for (var key in DEVICE_MAPPING) {
    if (DEVICE_MAPPING[key] === deviceId) {
      return key;
    }
  }
  return null; // 該当するdeviceNameが見つからない場合
}

function isFirstWebhookToday(name, deviceName) {
  var scriptProperties = PropertiesService.getScriptProperties();
  var currentTime = new Date().getTime();

  // JSTで現在の日付を取得
  var jstToday = Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy-MM-dd");
  var key = name + "_" + deviceName; // ユーザー名とデバイス名を組み合わせてキーを作成
  var todayCountKey = jstToday + "_count"; // 今日の出社カウント用のキー

  // JSTで今日の朝6時のタイムスタンプを計算
  var startOfDay = new Date(Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy-MM-dd'T'06:00:00"));
  
  var lastTimestamp = scriptProperties.getProperty(key);

  if (!lastTimestamp || Number(lastTimestamp) < startOfDay.getTime()) {
    scriptProperties.setProperty(key, currentTime.toString());
    // 今日の出社者数を更新
    var todayCount = Number(scriptProperties.getProperty(todayCountKey)) || 0;
    todayCount++;
    scriptProperties.setProperty(todayCountKey, todayCount.toString());

    postToDiscord(name + "さん、今日は" + todayCount + "番目の出社ですね！素晴らしい！");
    return true;
  }
  
  return false;
}



function unlockEntryDevice() {
  // APIキーとシークレットキーを読み込む
  var scriptProperties = PropertiesService.getScriptProperties();
  var apiKey = scriptProperties.getProperty('API_KEY');
  var secret = scriptProperties.getProperty('SECRET_KEY');
  
  // Define the API name and other parameters
  var apiName = "unlock";
  var postParam = JSON.stringify({
    "lockId": ENTRY_DEVICE_ID,
    "flag": "1" // 0 -> lock, 1 -> unlock
  });
  
  // Generate the date and digest
  var d = new Date();
  var date = d.toUTCString();
  var digestHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, postParam, Utilities.Charset.UTF_8);
  var digest = "SHA-256=" + Utilities.base64Encode(digestHash);
  
  // Generate the string to sign
  var stringToSign = "date: " + date + "\nPOST /api/eagle-pms/v1/" + apiName + " HTTP/1.1\ndigest: " + digest;
  
  // Generate the signature
  var signatureHash = Utilities.computeHmacSha256Signature(stringToSign, secret, Utilities.Charset.UTF_8);
  var signature = Utilities.base64Encode(signatureHash);
  
  // Prepare the headers
  var headers = {
    "date": date,
    "authorization": 'hmac username="' + apiKey + '", algorithm="hmac-sha256", headers="date request-line digest", signature="' + signature + '"',
    "x-target-host": "default.pms",
    "digest": digest,
    "Content-Type": "application/json"
  };
  
  // Prepare the options for the fetch call
  var options = {
    "method": "POST",
    "headers": headers,
    "payload": postParam,
    "muteHttpExceptions": true
  };
  
  // Make the API call
  var url = "https://eco.blockchainlock.io/api/eagle-pms/v1/" + apiName;
  var response = UrlFetchApp.fetch(url, options);
  
  // Log the response
  Logger.log(response.getContentText());
}


function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    // sendLogToEmail("Payload parsed successfully.");

    var textData = payload.text.split("\n");
    var name = textData[0].split(":")[1].trim().replace("*", "").trim();
    var action = textData[2].split(":")[1].trim().replace("*", "").trim();
    var deviceName = textData[4].split(":")[1].trim().replace("*", "").trim();
    var unlockTime = new Date(); // 現在の時刻を取得

    if (unlockTime.getHours() >= 6 && action === "解錠" && deviceName === getDeviceNameByDeviceId(ENTRY_DEVICE_ID)) {
      if (isFirstWebhookToday(name, deviceName)) {
        var monthlyCount = countMonthlyArrivals(name); // 月間出社回数を取得
        // 月間出社回数に基づいたメッセージの送信
        postToDiscord(name + "さん、今日は今月" + monthlyCount + "日目の出社です！");

        if (unlockTime.getDate() === new Date(unlockTime.getFullYear(), unlockTime.getMonth() + 1, 0).getDate()) {
          endOfMonthGacha(); // 月末にガチャを実行
        }
        // 出社メッセージの送信
        if (name.trim() === "") {
          postToDiscord("名無しさんが出社しました！");
        } else {
          postToDiscord(name + "さんが出社しました！");
        }
      }
    } else if (action === "クラウド連携" && deviceName === getDeviceNameByDeviceId(EXIT_DEVICE_ID)) {
      if (name.trim() === "") {
        postToDiscord("名無しさんが退社しました！");
      } else {
        postToDiscord(name + "さんが退社しました！");
      }
      unlockEntryDevice();
    }

  } catch (error) {
    sendLogToEmail("Error: " + error.toString());
  }

  return ContentService.createTextOutput(JSON.stringify({"status": "success"}))
    .setMimeType(ContentService.MimeType.JSON);
}




// Discordにメッセージを送る関数
function postToDiscord(message) {
  Logger.log("Sending message to Discord: " + message);
  var payload = {
    "content": message
  };
  var params = {
    "method": "post",
    "payload": JSON.stringify(payload),
    "headers": {
      "Content-Type": "application/json"
    }
  };
  
  try {
    UrlFetchApp.fetch(DISCORD_WEBHOOK_URL, params);
    Logger.log("Message successfully sent to Discord.");
  } catch (error) {
    Logger.log("Error sending message to Discord: " + error.toString());
  }
}
function sendLogToEmail(logMessage) {
  var subject = "GAS Log Notification";
  var body = logMessage;

  MailApp.sendEmail(EMAIL_ADDRESS, subject, body);
}


// 月間出社回数をカウントする関数
// 月間出社回数をカウントし、カウント数を返す関数
function countMonthlyArrivals(name) {
  var scriptProperties = PropertiesService.getScriptProperties();
  var monthKey = new Date().toISOString().split('T')[0].substring(0, 7); // YYYY-MM形式の今月
  var monthlyCountKey = monthKey + "_" + name;
  var currentCount = scriptProperties.getProperty(monthlyCountKey);

  if (currentCount) {
    currentCount = Number(currentCount) + 1;
    scriptProperties.setProperty(monthlyCountKey, currentCount.toString());
  } else {
    currentCount = 1;
    scriptProperties.setProperty(monthlyCountKey, "1");
  }
  return currentCount; // カウント数を返す
}


// 月末ガチャを行う関数
function endOfMonthGacha() {
  var scriptProperties = PropertiesService.getScriptProperties();
  var allKeys = scriptProperties.getKeys();
  var monthKey = new Date().toISOString().split('T')[0].substring(0, 7); // YYYY-MM形式の今月
  var monthlyArrivals = {};

  // 月間出社回数を集計
  allKeys.forEach(function(key) {
    if (key.startsWith(monthKey)) {
      var name = key.split("_")[1];
      var count = scriptProperties.getProperty(key);
      monthlyArrivals[name] = Number(count);
    }
  });

  // ガチャのロジック（ここでは簡単なランダム選択を実行）
  var totalArrivals = Object.values(monthlyArrivals).reduce((acc, val) => acc + val, 0);
  var randomIndex = Math.floor(Math.random() * totalArrivals);
  var cumulative = 0;
  var firstPrize, secondPrize;

  for (var name in monthlyArrivals) {
    cumulative += monthlyArrivals[name];
    if (cumulative > randomIndex && !firstPrize) {
      firstPrize = name;
    } else if (cumulative > randomIndex && firstPrize && !secondPrize) {
      secondPrize = name;
      break;
    }
  }

  // 1等と2等の受賞者を発表
  postToDiscord(firstPrize + "さんが今月の1等の当選者です！おめでとうございます！");
  postToDiscord(secondPrize + "さんが今月の2等の当選者です！おめでとうございます！");
}
