const chatLog = document.getElementById('chat-log');
const sendButton = document.getElementById('send-button');
const inputBox = document.getElementById('chat-input');

// グローバルなステート（再定義禁止）
window.wifiSetupContext = {
  active: false,
  step: null,
  data: {}
};

function addMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('chat-message', sender);
  msg.innerHTML = text;
  chatLog.appendChild(msg);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function simulateQuickAction(action) {
  if (action === 'wifi_setup') {
    runWifiSetupFlow();
  }
}

sendButton.onclick = () => {
  const input = inputBox.value.trim();
  if (input !== '') {
    addMessage('user', input);
    handleUserTextInput(input);
    inputBox.value = '';
  }
};

function handleUserTextInput(input) {
  if (!window.wifiSetupContext.active) return;

  const step = window.wifiSetupContext.step;

  if (step === 'ssid') {
    window.wifiSetupContext.data.ssid = input;
    window.wifiSetupContext.step = 'password';
    addMessage('ai', 'Wi-Fiのパスワードを入力してください。');
  } else if (step === 'password') {
    window.wifiSetupContext.data.password = input;
    window.wifiSetupContext.active = false;
    showWifiQr();
  }
}

function showWifiQr() {
  const { ssid, password } = window.wifiSetupContext.data;
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

async function runWifiSetupFlow() {
  window.wifiSetupContext.active = true;
  window.wifiSetupContext.step = null;
  window.wifiSetupContext.data = {};

  addMessage('ai', 'Wi-Fi設定を開始します。使用するQR1は電池式（LE）ですか？それともAC電源式ですか？');
  const powerType = await waitUserOption(['電池式', 'AC電源式']);
  window.wifiSetupContext.data.powerType = powerType;

  const freqMessage = powerType === '電池式'
    ? '接続頻度を選んでください。おすすめは「1日1回」です。'
    : '接続頻度は「常時」が推奨されます。';

  const frequency = await waitUserOption(['常時', '1時間ごと', '6時間ごと', '12時間ごと', '1日1回', 'なし'], freqMessage);
  window.wifiSetupContext.data.frequency = frequency;

  window.wifiSetupContext.step = 'ssid';
  addMessage('ai', '接続するWi-FiのSSIDを入力してください。');
}

function waitUserOption(options, prompt = '') {
  return new Promise((resolve) => {
    if (prompt) addMessage('ai', prompt);
    const container = document.createElement('div');
    container.className = 'flex flex-wrap gap-2 mt-2';

    options.forEach(opt => {
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
  });
}
