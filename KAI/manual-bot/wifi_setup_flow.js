// main.js

const chatLog = document.getElementById('chat-log');

function addMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('chat-message', sender);
  msg.innerHTML = text;
  chatLog.appendChild(msg);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function simulateQuickAction(action) {
  if (action === 'wifi_setup') {
    startWifiSetupFlow();
  }
}

function startWifiSetupFlow() {
  runWifiSetupFlow();
}

async function runWifiSetupFlow() {
  addMessage('ai', 'Wi-Fi設定を開始します。使用するQR1は電池式（LE）ですか？それともAC電源式ですか？');

  const powerType = await waitUserInput(['電池式', 'AC電源式']);
  addMessage('user', powerType);

  if (powerType === '電池式') {
    addMessage('ai', '接続頻度を選んでください。おすすめは「1日1回」です。');
  } else {
    addMessage('ai', '接続頻度は「常時」が推奨されます。');
  }

  const frequency = await waitUserInput(['常時', '1時間ごと', '6時間ごと', '12時間ごと', '1日1回', 'なし']);
  addMessage('user', frequency);

  addMessage('ai', '接続するWi-FiのSSIDを入力してください。');
  const ssid = await waitUserTextInput();
  addMessage('user', ssid);

  addMessage('ai', 'Wi-Fiのパスワードを入力してください。');
  const password = await waitUserTextInput();
  addMessage('user', '（入力されました）');

  const qrText = `WIFI_SSID:${ssid}_PASS:${password}`;
  const qrUrl = `https://placehold.co/256x256/000/FFF?text=${encodeURIComponent(qrText)}`;

  addMessage('ai', `
    下記のQRコードをQR1にかざしてください。<br>
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

function waitUserInput(options) {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    container.className = 'flex flex-wrap gap-2 mt-2 dynamic-message';

    options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.innerText = opt;
      btn.className = 'bg-indigo-500 text-white px-4 py-2 rounded-full text-sm hover:bg-indigo-600 transition duration-200';
      btn.onclick = () => {
        container.remove();
        resolve(opt);
      };
      container.appendChild(btn);
    });

    chatLog.appendChild(container);
    chatLog.scrollTop = chatLog.scrollHeight;
  });
}

function waitUserTextInput() {
  return new Promise((resolve) => {
    const inputContainer = document.createElement('div');
    inputContainer.className = 'flex mt-2 items-center gap-2 dynamic-message';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'border px-3 py-2 rounded-md w-full';
    input.placeholder = 'ここに入力...';

    const submitBtn = document.createElement('button');
    submitBtn.innerText = '送信';
    submitBtn.className = 'bg-green-500 text-white px-4 py-2 rounded-full text-sm hover:bg-green-600 transition duration-200';
    submitBtn.onclick = () => {
      const value = input.value.trim();
      if (value !== '') {
        inputContainer.remove();
        resolve(value);
      }
    };

    inputContainer.appendChild(input);
    inputContainer.appendChild(submitBtn);
    chatLog.appendChild(inputContainer);
    chatLog.scrollTop = chatLog.scrollHeight;
  });
}
