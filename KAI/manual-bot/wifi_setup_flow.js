
async function runWifiSetupFlow() {
  addMessage('bot', 'Wi-Fi設定を開始します。使用するQR1は電池式（LE）ですか？それともAC電源式ですか？');

  await waitUserInput(['電池式', 'AC電源式']).then(async (powerType) => {
    if (powerType === '電池式') {
      addMessage('bot', '接続頻度を選んでください。おすすめは「1日1回」です。');
    } else {
      addMessage('bot', '接続頻度は「常時」が推奨されます。');
    }

    await waitUserInput(['常時', '1時間ごと', '6時間ごと', '12時間ごと', '1日1回', 'なし']).then(() => {
      addMessage('bot', '接続するWi-FiのSSIDとパスワードを設定してください。');
      setTimeout(() => {
        addMessage('bot', '設定内容からQRコードが生成されます。本体にスキャンしてください。');
        setTimeout(() => {
          addMessage('bot', '緑のLEDが点灯すれば接続成功です。失敗した場合はSSIDやパスワードを再確認してください。');
        }, 2000);
      }, 2000);
    });
  });
}

function waitUserInput(options) {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    container.className = 'button-container';
    options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.innerText = opt;
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
