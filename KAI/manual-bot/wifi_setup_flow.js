const chatLog = document.getElementById('scrollable-content');

let currentFlow = null; // "wifi_setup" など。nullは通常会話モード。

function startWifiSetupFlow() {
  currentFlow = 'wifi_setup';
  runWifiSetupFlow();
}

let wifiSetupContext = {
  active: false,
  step: null,
  data: {}
};

async function runWifiSetupFlow() {
  wifiSetupContext.active = true;

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
  wifiSetupContext.step = 'ssid';
}

function askWithOptions(question, options) {
  return new Promise((resolve) => {
    addMessage('ai', question);
    setTimeout(() => {
      const container = document.createElement('div');
      container.className = 'flex flex-wrap gap-2 mt-2 dynamic-message';
      options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.className = 'bg-indigo-500 text-white px-4 py-2 rounded-full text-sm hover:bg-indigo-600 transition duration-200';
        btn.onclick = () => {
          addMessage('user', opt);
          container.remove();
          resolve(opt);
        };
        container.appendChild(btn);
      });
      chatLog.appendChild(container);
      chatLog.scrollTop = chatLog.scrollHeight;
    }, 300);
  });
}

// ユーザーのテキスト入力ハンドラー
function handleUserTextInput(value) {
  // Wi-Fiフロー中はそちらを優先
  if (currentFlow === 'wifi_setup' && wifiSetupContext.active && wifiSetupContext.step) {
    handleWifiSetupStep(value);
    return;
  }

  // 通常会話処理
  sendPromptToServer(value);
}

// Wi-Fi設定ステップ処理
function handleWifiSetupStep(value) {
  const step = wifiSetupContext.step;
  const data = wifiSetupContext.data;

  addMessage('user', value);

  if (step === 'ssid') {
    data.ssid = value;
    addMessage('ai', 'Wi-Fiのパスワードを入力してください。');
    wifiSetupContext.step = 'password';
  } else if (step === 'password') {
    data.password = value;
    wifiSetupContext.active = false;
    wifiSetupContext.step = null;
    currentFlow = null; // フロー終了
    generateAndShowQr(data);
  }
}

function generateAndShowQr(data) {
  const { ssid, password } = data;
  const qrText = `WIFI_SSID:${ssid}_PASS:${password}`;
  const qrUrl = `https://placehold.co/256x256/000/FFF?text=${encodeURIComponent(qrText)}`;

  addMessage('ai', `
    下記のQRコードをQR1にかざしてください。
    <img src="${qrUrl}" class="w-36 h-36 mx-auto my-4 rounded-lg border border-gray-300 shadow-md cursor-pointer" onclick="showQrModal('${qrUrl}')"/>
    <p class="text-sm mt-2 text-center">タップで拡大・再タップで閉じます</p>
  `);

  setTimeout(() => {
    addMessage('ai', 'クラウドの接続を待っています...');
    setTimeout(() => {
      addMessage('ai', 'KEYVOXクラウドへの接続が完了しました🚀');
    }, 2000);
  }, 1000);
}

// 汎用的なメッセージ追加関数（既存のものがあれば併用可）
function addMessage(sender, text) {
  const msg = document.createElement('div');
  msg.className = `message ${sender}`;
  msg.innerHTML = `<strong>${sender === 'ai' ? 'KAI' : 'あなた'}:</strong> ${text}`;
  chatLog.appendChild(msg);
  chatLog.scrollTop = chatLog.scrollHeight;
}

// サーバー送信関数（通常会話モード用）
function sendPromptToServer(prompt) {
  fetch('/api', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
    headers: { 'Content-Type': 'application/json' }
  })
  .then(res => res.json())
  .then(data => {
    addMessage("ai", data.text);
  });
}

document.getElementById("chat-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const inputEl = document.getElementById("user-input");
  const value = inputEl.value.trim();
  if (value === "") return;
  inputEl.value = "";

  handleUserTextInput(value);
});
