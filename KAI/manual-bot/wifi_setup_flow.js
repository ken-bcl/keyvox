// DOM要素の取得
// ファイル1と2でIDが異なっていたため、IDを統一しました。
// HTML側のチャットログのIDを 'chat-log' にしてください。
const chatLog = document.getElementById('chat-log');
const sendButton = document.getElementById('send-button');
const inputBox = document.getElementById('chat-input');

// Wi-Fiセットアップの状態を管理する変数
let wifiSetupContext = {
  active: false,
  step: null,
  data: {}
};

/**
 * チャットログにメッセージを追加する関数
 * @param {string} sender - 'user' または 'ai'
 * @param {string} text - 表示するメッセージ（HTML可）
 */
function addMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('chat-message', sender);
  msg.innerHTML = text; // QRコードのimgタグを表示するためにinnerHTMLを使用
  chatLog.appendChild(msg);
  chatLog.scrollTop = chatLog.scrollHeight; // 自動で一番下までスクロール
}

// 送信ボタンのクリックイベント
sendButton.onclick = () => {
  const input = inputBox.value.trim();
  if (input !== '') {
    // Wi-Fiセットアップ中であれば、その処理にテキストを渡す
    if (wifiSetupContext.active && wifiSetupContext.step) {
      handleUserTextInput(input);
    } else {
      // 通常のチャット機能（必要であればここに記述）
      addMessage('user', input);
    }
    inputBox.value = ''; // 入力欄をクリア
  }
};

// Enterキーでも送信できるように設定
inputBox.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    sendButton.onclick();
  }
});

/**
 * Wi-Fiセットアップフローを開始する
 */
function startWifiSetupFlow() {
  runWifiSetupFlow();
}

/**
 * Wi-Fiセットアップのメインフロー
 */
async function runWifiSetupFlow() {
  // コンテキストを初期化
  wifiSetupContext = {
    active: true,
    step: null,
    data: {}
  };

  const powerType = await askWithOptions(
    'Wi-Fi設定を開始します。使用するQR1は電池式（LE）ですか？それともAC電源式ですか？',
    ['電池式', 'AC電源式']
  );
  wifiSetupContext.data.powerType = powerType;

  const frequency = await askWithOptions(
    powerType === '電池式'
      ? '接続頻度を選んでください。おすすめは「1日1回」です。'
      : '接続頻度は「常時」が推奨されます。',
    ['常時', '1時間ごと', '6時間ごと', '12時間ごと', '1日1回', 'なし']
  );
  wifiSetupContext.data.frequency = frequency;

  addMessage('ai', '接続するWi-FiのSSIDを入力してください。');
  wifiSetupContext.step = 'ssid'; // SSID入力待ち状態に設定
}

/**
 * 質問と選択肢ボタンを表示し、ユーザーの選択を待つ
 * @param {string} question - AIからの質問文
 * @param {string[]} options - 選択肢の配列
 * @returns {Promise<string>} ユーザーが選択した文字列
 */
function askWithOptions(question, options) {
  return new Promise((resolve) => {
    addMessage('ai', question);
    setTimeout(() => { // 少し遅れてボタンを表示
      const container = document.createElement('div');
      container.className = 'flex flex-wrap gap-2 mt-2 dynamic-message';
      options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.className = 'bg-indigo-500 text-white px-4 py-2 rounded-full text-sm hover:bg-indigo-600 transition duration-200';
        btn.onclick = () => {
          addMessage('user', opt); // ユーザーの選択をログに表示
          container.remove(); // 選択肢ボタンを削除
          resolve(opt);
        };
        container.appendChild(btn);
      });
      chatLog.appendChild(container);
      chatLog.scrollTop = chatLog.scrollHeight;
    }, 300);
  });
}

/**
 * ユーザーからのテキスト入力を処理する
 * @param {string} value - 入力されたテキスト
 */
function handleUserTextInput(value) {
  if (!wifiSetupContext.active || !wifiSetupContext.step) return;

  const step = wifiSetupContext.step;
  const data = wifiSetupContext.data;

  addMessage('user', value); // ユーザーの入力をログに表示

  if (step === 'ssid') {
    data.ssid = value;
    addMessage('ai', 'Wi-Fiのパスワードを入力してください。');
    wifiSetupContext.step = 'password'; // 次のステップへ
  } else if (step === 'password') {
    data.password = value;
    wifiSetupContext.active = false; // フローを終了
    wifiSetupContext.step = null;
    generateAndShowQr(data); // QRコードを生成
  }
}

/**
 * QRコードを生成してチャットに表示する
 * @param {object} data - SSIDとパスワードを含むデータオブジェクト
 */
function generateAndShowQr(data) {
  const { ssid, password } = data;
  const qrText = `WIFI_SSID:${ssid}_PASS:${password}`;
  const qrUrl = `https://placehold.co/256x256/000/FFF?text=${encodeURIComponent(qrText)}`;

  addMessage('ai', `
    下記のQRコードをQR1にかざしてください。
    <img src="${qrUrl}" class="w-36 h-36 mx-auto my-4 rounded-lg border border-gray-300 shadow-md cursor-pointer" onclick="showQrModal('${qrUrl}')"/>
    <p class="text-sm mt-2 text-center">タップで拡大・再タップで閉じます</p>
  `);

  // 接続待機中のメッセージを順次表示
  setTimeout(() => {
    addMessage('ai', 'クラウドの接続を待っています...');
    setTimeout(() => {
      addMessage('ai', 'KEYVOXクラウドへの接続が完了しました🚀');
    }, 2000);
  }, 1000);
}
