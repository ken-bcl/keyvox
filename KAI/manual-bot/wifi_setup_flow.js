const chatLog = document.getElementById('scrollable-content');

function startWifiSetupFlow() {
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

function handleUserTextInput(value) {
  if (!wifiSetupContext.active || !wifiSetupContext.step) return;

  const step = wifiSetupContext.step;
  const data = wifiSetupContext.data;

  if (step === 'ssid') {
    data.ssid = value;
    addMessage('user', value);
    addMessage('ai', 'Wi-Fiのパスワードを入力してください。');
    wifiSetupContext.step = 'password';
  } else if (step === 'password') {
    data.password = value;
    addMessage('user', value);
    wifiSetupContext.active = false;
    wifiSetupContext.step = null;
    generateAndShowQr(data);
    callGASWithSetupData(data);  // ← 追加ポイント
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

// ↓↓↓ GAS連携部分 ↓↓↓

async function callGASWithSetupData(data) {
  const prompt = `
QR1のWi-Fi設定情報：
- 電源方式：${data.powerType}
- 接続頻度：${data.frequency}
- SSID：${data.ssid}
- パスワード：${data.password}
  `.trim();

  addMessage('ai', '設定内容を確認しています...');

  try {
    const res = await fetch('https://script.google.com/macros/s/あなたのGASデプロイURL/exec', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        type: 'chat'
      })
    });

    const result = await res.json();

    if (result.success && result.text) {
      addMessage('ai', result.text);
    } else {
      addMessage('ai', `GASからの応答が不完全です：${JSON.stringify(result)}`);
    }
  } catch (e) {
    addMessage('ai', `GASへの接続中にエラーが発生しました：${e.message}`);
  }
}

// チャットにメッセージ追加
function addMessage(sender, text) {
  const bubble = document.createElement('div');
  bubble.className = sender === 'ai' ? 'bg-gray-200 p-3 my-2 rounded-lg text-sm' : 'bg-blue-500 text-white p-3 my-2 rounded-lg text-sm self-end';
  bubble.innerHTML = text;
  chatLog.appendChild(bubble);
  chatLog.scrollTop = chatLog.scrollHeight;
}
