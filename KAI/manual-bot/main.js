
const chatLog = document.getElementById('chat-log');

function addMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('chat-message', sender);
  msg.innerText = text;
  chatLog.appendChild(msg);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function simulateQuickAction(action) {
  if (action === 'wifi_setup') {
    runWifiSetupFlow();
  }
}
