// まず、必要なHTML要素を全て取得します
const chatLog = document.getElementById('chat-log');
const sendButton = document.getElementById('send-button');
const inputBox = document.getElementById('chat-input');

// その後で、要素が正しく取得できたか（nullでないか）を確認します
if (!chatLog || !inputBox || !sendButton) {
  alert('chat-log や inputBox、sendButton の要素が見つかりません。index.html に追加してください。');
}

window.wifiSetupContext = {
  active: false,
  step: null,
  data: {}
};

function addMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('chat-message', sender);
  msg.innerHTML = text;
  // chatLogがnullでないことを確認してからappendChildを呼び出す
  if (chatLog) {
    chatLog.appendChild(msg);
    chatLog.scrollTop = chatLog.scrollHeight;
  } else {
    console.error("chatLog要素が見つからないため、メッセージを追加できません。");
  }
}

function simulateQuickAction(action) {
  if (action === 'wifi_setup') {
    runWifiSetupFlow();
  }
}

// sendButtonもnullチェックをしてからイベントリスナーを設定する
if (sendButton) {
  sendButton.onclick = () => {
    const input = inputBox.value.trim();
    if (input !== '') {
      addMessage('user', input);
      handleUserTextInput(input);
      inputBox.value = '';
    }
  };
} else {
  console.error("sendButton要素が見つからないため、クリックイベントを設定できません。");
}


function handleUserTextInput(value) {
  if (!window.wifiSetupContext.active || !window.wifiSetupContext.step) return;

  const step = window.wifiSetupContext.step;
  const data = window.wifiSetupContext.data;

  if (step === 'ssid') {
    data.ssid = value;
    addMessage('user', value);
    addMessage('ai', 'Wi-Fiのパスワードを入力してください。');
    window.wifiSetupContext.step = 'password';
  } else if (step === 'password') {
    data.password = value;
    addMessage('user', '••••••••'); 
    window.wifiSetupContext.active = false;
    window.wifiSetupContext.step = null;
    generateAndShowQr(data);
  }
}

async function runWifiSetupFlow() {
  window.wifiSetupContext.active = true;
  window.wifiSetupContext.step = null;
  window.wifiSetupContext.data = {};

  const powerType = await askWithOptions(
    'Wi-Fi設定を開始します。使用するQR1は電池式（LE）ですか？それともAC電源式ですか？',
    ['電池式', 'AC電源式']
  );
  window.wifiSetupContext.data.powerType = powerType;

  const freqPrompt = powerType === '電池式'
    ? '接続頻度を選んでください。おすすめは「1日1回」です。'
    : '接続頻度は「常時」が推奨されます。';

  const frequency = await askWithOptions(freqPrompt, ['常時', '1時間ごと', '6時間ごと', '12時間ごと', '1日1回', 'なし']);
  window.wifiSetupContext.data.frequency = frequency;

  window.wifiSetupContext.step = 'ssid';
  addMessage('ai', '接続するWi-FiのSSIDを入力してください。');
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
      // chatLogがnullでないことを確認してからappendChildを呼び出す
      if (chatLog) {
        chatLog.appendChild(container);
        chatLog.scrollTop = chatLog.scrollHeight;
      } else {
        console.error("chatLog要素が見つからないため、オプションボタンを追加できません。");
      }
    }, 300);
  });
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
