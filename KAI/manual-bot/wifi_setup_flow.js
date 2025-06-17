/**
 * 統合されたチャットUIのJavaScript (修正版)
 *
 * 動作しなくなった問題を解決するため、不足していた関数や
 * イベントリスナーを再統合しました。
 * - `addMessage`関数を正しく定義。
 * - HTML側のID (`scrollable-content`) との整合性を確保。
 * - ボタンやテキスト入力のイベント処理を再実装。
 */

// --- DOM要素の取得 ---
// HTML側のIDと一致させてください。
// ★修正点: getElementByIdの対象を 'chat-log' から 'scrollable-content' に変更しました。
const chatLog = document.getElementById('scrollable-content');
const sendButton = document.getElementById('send-button');
const inputBox = document.getElementById('chat-input');

// --- Wi-Fiセットアップの状態管理 ---
let wifiSetupContext = {
  active: false,
  step: null,
  data: {}
};

// --- イベントリスナーの設定 ---
// この部分が抜けていると、テキスト入力や送信が機能しません。
if(sendButton && inputBox) {
    // 送信ボタンがクリックされたときの処理
    sendButton.onclick = () => {
      const input = inputBox.value.trim();
      if (input === '') return; // 入力が空なら何もしない

      // Wi-Fiセットアップフローが進行中の場合
      if (wifiSetupContext.active && wifiSetupContext.step) {
        handleUserTextInput(input);
      } else if (input.toLowerCase().includes('wi-fi設定')) {
        // 「Wi-Fi設定」というキーワードでフローを開始する
        startWifiSetupFlow();
      } else {
        // 通常のチャットとしてのメッセージ追加
        addMessage('user', input);
        addMessage('ai', 'すみません、そのコマンドは認識できません。「Wi-Fi設定」と入力するとセットアップを開始できます。');
      }

      inputBox.value = ''; // 入力欄をクリア
    };

    // 入力欄でEnterキーが押されたときの処理
    inputBox.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendButton.onclick();
      }
    });
}


// --- 関数定義 ---

/**
 * チャットログにメッセージを追加する (重要)
 * この関数が定義されていないと、AIもユーザーもメッセージを表示できません。
 * @param {string} sender - 'user' または 'ai'
 * @param {string} text - 表示するメッセージ（HTML可）
 */
function addMessage(sender, text) {
  if (!chatLog) {
      console.error("チャットログの要素が見つかりません。HTMLのIDが 'scrollable-content' になっているか確認してください。");
      return;
  }

  const msgWrapper = document.createElement('div');
  //動的に追加されたメッセージを後で識別しやすいようにクラスを追加
  msgWrapper.classList.add('dynamic-message'); 

  // ユーザーとAIでスタイルを分岐
  if(sender === 'user'){
      msgWrapper.className = 'dynamic-message flex justify-end mb-4';
      msgWrapper.innerHTML = `
        <div class="p-3 rounded-lg max-w-xs lg:max-w-md shadow-md bg-indigo-500 text-white">
            ${text}
        </div>`;
  } else { // sender === 'ai'
      msgWrapper.className = 'dynamic-message flex justify-start mb-4';
       msgWrapper.innerHTML = `
        <div class="p-3 rounded-lg max-w-xs lg:max-w-md shadow-md bg-white text-gray-800">
            ${text}
        </div>`;
  }

  chatLog.appendChild(msgWrapper);
  chatLog.scrollTop = chatLog.scrollHeight;
}

/**
 * Wi-Fiセットアップフローを開始する（外部からの呼び出し用）
 */
function startWifiSetupFlow() {
  // ホーム画面の要素を隠す
  document.getElementById('my-locks-section-wrapper').classList.add('hidden');
  document.getElementById('initial-ai-greeting').classList.add('hidden');
  document.getElementById('initial-quick-actions').classList.add('hidden');
  document.getElementById('initial-notifications').classList.add('hidden');

  // 既存の動的メッセージをクリア
  chatLog.querySelectorAll('.dynamic-message').forEach(el => el.remove());
  
  runWifiSetupFlow();
}

/**
 * Wi-Fiセットアップのメインフロー
 */
async function runWifiSetupFlow() {
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
  wifiSetupContext.step = 'ssid';
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

    setTimeout(() => {
      const buttonContainer = document.createElement('div');
      // ボタンも動的要素としてマーク
      buttonContainer.className = 'dynamic-message flex flex-wrap gap-2 mt-2 ml-0'; 

      options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.className = 'bg-indigo-500 text-white px-4 py-2 rounded-full text-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200';
        btn.onclick = () => {
          // ユーザーの選択をメッセージとして追加
          const userMsgWrapper = document.createElement('div');
          userMsgWrapper.className = 'dynamic-message flex justify-end mb-4';
          userMsgWrapper.innerHTML = `<div class="p-3 rounded-lg max-w-xs lg:max-w-md shadow-md bg-indigo-500 text-white">${opt}</div>`;
          chatLog.appendChild(userMsgWrapper);
          
          buttonContainer.remove();
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

  // ユーザーのテキスト入力はonclickハンドラで表示されるので、ここではAIの応答のみ
  // addMessage('user', value);

  if (step === 'ssid') {
    data.ssid = value;
    addMessage('ai', 'Wi-Fiのパスワードを入力してください。');
    wifiSetupContext.step = 'password';
  } else if (step === 'password') {
    data.password = value;
    wifiSetupContext.active = false;
    wifiSetupContext.step = null;
    generateAndShowQr(data);
  }
}

/**
 * 入力された情報からQRコードを生成してチャットに表示する
 * @param {object} data - SSIDとパスワードを含むデータオブジェクト
 */
function generateAndShowQr(data) {
  const { ssid, password } = data;
  const qrText = `WIFI:T:WPA;S:${ssid};P:${password};;`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrText)}`;
  const largeQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrText)}`;

  addMessage('ai', `
    <div class="text-center">
      <p class="mb-2">設定が完了しました。下記のQRコードをQR1にかざしてください。</p>
      <img src="${qrUrl}" alt="Wi-Fi設定用QRコード" class="w-40 h-40 mx-auto my-2 rounded-lg border border-gray-300 shadow-md cursor-pointer" onclick="showQrModal('${largeQrUrl}')"/>
      <p class="text-xs text-gray-500 mt-1">タップで拡大</p>
    </div>
  `);

  setTimeout(() => {
    addMessage('ai', 'クラウドとの接続を確認しています...');
    setTimeout(() => {
      addMessage('ai', 'KEYVOXクラウドへの接続が完了しました🚀<br>ご利用いただけます。');
      // フロー完了後、ホームに戻るボタンなどを表示しても良い
    }, 2500);
  }, 1500);
}

/**
 * QRコードをモーダルで拡大表示する関数
 * @param {string} qrUrl - 表示するQRコードのURL
 */
function showQrModal(qrUrl) {
    const existingModal = document.getElementById('dynamic-qr-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'dynamic-qr-modal';
    modal.style.cssText = 'position:fixed; left:0; top:0; width:100%; height:100%; background-color:rgba(0,0,0,0.7); display:flex; justify-content:center; align-items:center; z-index:1000;';

    const img = document.createElement('img');
    img.src = qrUrl;
    img.style.cssText = 'max-width:80%; max-height:80%; border:3px solid white; border-radius:8px;';

    modal.appendChild(img);
    modal.onclick = () => document.body.removeChild(modal);
    document.body.appendChild(modal);
}
