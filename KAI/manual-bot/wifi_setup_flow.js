/**
 * 統合されたチャットUIのJavaScript
 *
 * ファイル1のDOMイベント処理と、ファイル2の対話フローを統合しました。
 * - DOM要素の取得を冒頭に集約。
 * - 送信ボタンのクリックとEnterキーでの送信に対応。
 * - Wi-Fiセットアップ中かどうかで、入力テキストの処理を分岐。
 * - 関数名はファイル2のものを優先し、ロジックを整理。
 */

// --- DOM要素の取得 ---
// HTML側のIDと一致させてください。
const chatLog = document.getElementById('chat-log');
const sendButton = document.getElementById('send-button');
const inputBox = document.getElementById('chat-input');

// --- Wi-Fiセットアップの状態管理 ---
let wifiSetupContext = {
  active: false,
  step: null,
  data: {}
};

// --- イベントリスナーの設定 ---

// 送信ボタンがクリックされたときの処理
sendButton.onclick = () => {
  const input = inputBox.value.trim();
  if (input === '') return; // 入力が空なら何もしない

  // Wi-Fiセットアップフローが進行中の場合
  if (wifiSetupContext.active && wifiSetupContext.step) {
    handleUserTextInput(input);
  } else {
    // 通常のチャットとしてのメッセージ追加（現在は未実装）
    addMessage('user', input);
    // addMessage('ai', 'すみません、そのコマンドは認識できません。');
  }

  inputBox.value = ''; // 入力欄をクリア
};

// 入力欄でEnterキーが押されたときの処理
inputBox.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    // 送信ボタンのクリックイベントを発火させる
    sendButton.onclick();
  }
});


// --- 関数定義 ---

/**
 * チャットログにメッセージを追加する
 * @param {string} sender - 'user' または 'ai'
 * @param {string} text - 表示するメッセージ（HTML可）
 */
function addMessage(sender, text) {
  const msg = document.createElement('div');
  // メッセージのラッパー要素を作成
  const msgWrapper = document.createElement('div');
  msgWrapper.className = `flex mb-4 ${sender === 'user' ? 'justify-end' : 'justify-start'}`;

  // メッセージ本体の要素を作成
  msg.className = `p-3 rounded-lg max-w-xs lg:max-w-md shadow-md ${sender === 'user' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-800'}`;
  msg.innerHTML = text; // QRコードのimgタグなどを表示するためinnerHTMLを使用

  msgWrapper.appendChild(msg);
  chatLog.appendChild(msgWrapper);
  chatLog.scrollTop = chatLog.scrollHeight; // 自動で一番下までスクロール
}

/**
 * Wi-Fiセットアップフローを開始する（外部からの呼び出し用）
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

  const freqMessage = powerType === '電池式'
    ? '接続頻度を選んでください。おすすめは「1日1回」です。'
    : '接続頻度は「常時」が推奨されます。';

  const frequency = await askWithOptions(
    freqMessage,
    ['常時', '1時間ごと', '6時間ごと', '12時間ごと', '1日1回', 'なし']
  );
  wifiSetupContext.data.frequency = frequency;

  addMessage('ai', '接続するWi-FiのSSID（名前）を入力してください。');
  wifiSetupContext.step = 'ssid'; // SSID入力待ち状態に設定
}

/**
 * AIからの質問と選択肢ボタンを表示し、ユーザーの選択を待つ
 * @param {string} question - AIからの質問文
 * @param {string[]} options - 選択肢の配列
 * @returns {Promise<string>} ユーザーが選択した文字列
 */
function askWithOptions(question, options) {
  return new Promise((resolve) => {
    addMessage('ai', question);

    // 少し遅れてボタンを表示し、ユーザーが読みやすくする
    setTimeout(() => {
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'flex flex-wrap gap-2 mt-2 ml-12'; // AIメッセージの下にインデント

      options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.className = 'bg-indigo-500 text-white px-4 py-2 rounded-full text-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200';
        btn.onclick = () => {
          addMessage('user', opt); // ユーザーの選択をログに表示
          buttonContainer.remove(); // 選択後、ボタンを削除
          resolve(opt);
        };
        buttonContainer.appendChild(btn);
      });

      chatLog.appendChild(buttonContainer);
      chatLog.scrollTop = chatLog.scrollHeight;
    }, 300);
  });
}

/**
 * Wi-Fiセットアップ中のユーザーからのテキスト入力を処理する
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
    wifiSetupContext.step = 'password'; // 次のステップ（パスワード入力）へ
  } else if (step === 'password') {
    data.password = value;
    wifiSetupContext.active = false; // フローを非アクティブに
    wifiSetupContext.step = null;
    generateAndShowQr(data); // QRコードを生成・表示
  }
}

/**
 * 入力された情報からQRコードを生成してチャットに表示する
 * @param {object} data - SSIDとパスワードを含むデータオブジェクト
 */
function generateAndShowQr(data) {
  const { ssid, password } = data;
  // パスワードなどの機密情報がURLに含まれないように、より安全なテキストでQRコードを生成
  const qrText = `WIFI:T:WPA;S:${ssid};P:${password};;`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrText)}`;

  addMessage('ai', `
    <div class="text-center">
      <p class="mb-2">設定が完了しました。下記のQRコードをQR1にかざしてください。</p>
      <img src="${qrUrl}" alt="Wi-Fi設定用QRコード" class="w-40 h-40 mx-auto my-2 rounded-lg border border-gray-300 shadow-md cursor-pointer" onclick="showQrModal('${qrUrl}')"/>
      <p class="text-xs text-gray-500 mt-1">タップで拡大</p>
    </div>
  `);

  // 接続待機中のメッセージを順次表示
  setTimeout(() => {
    addMessage('ai', 'クラウドとの接続を確認しています...');
    setTimeout(() => {
      addMessage('ai', 'KEYVOXクラウドへの接続が完了しました🚀<br>ご利用いただけます。');
    }, 2500);
  }, 1500);
}

/**
 * （参考実装）QRコードをモーダルで拡大表示する関数
 * この関数はHTML側、またはこのスクリプト内に実装する必要があります。
 * @param {string} qrUrl - 表示するQRコードのURL
 */
function showQrModal(qrUrl) {
    // モーダル用の要素を動的に作成
    const modal = document.createElement('div');
    modal.id = 'qr-modal';
    modal.style.position = 'fixed';
    modal.style.left = '0';
    modal.style.top = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';

    const img = document.createElement('img');
    img.src = qrUrl;
    img.style.maxWidth = '80%';
    img.style.maxHeight = '80%';
    img.style.border = '3px solid white';
    img.style.borderRadius = '8px';

    modal.appendChild(img);

    // モーダルをクリックしたら閉じる
    modal.onclick = () => {
        document.body.removeChild(modal);
    };

    document.body.appendChild(modal);
}
