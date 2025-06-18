// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
// GAS Web App URL
// GASをデプロイした際に発行される、新しいウェブアプリのURLをここに貼り付けてください
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxzml5onddDpDyqbh4Aen6F0MC2TykWhgIpQak6mkodmrPU0WpUgcIRmSELrmCylgxM2g/exec';
// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

// --- DOM要素の取得 ---
// HTMLファイル内のIDに対応
const chatLog = document.getElementById('scrollable-content');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
const loadingIndicator = document.getElementById('loading-indicator');

// --- 状態管理 ---
let wifiSetupContext = {
    active: false,
    step: null,
    data: {}
};

// --- 基本的なUI関数 ---

/**
 * チャットログにメッセージを追加する
 * @param {string} sender - 送信者 ('user' または 'ai')
 * @param {string} textOrHtml - 表示するテキストまたはHTML
 */
function addMessage(sender, textOrHtml) {
    const msg = document.createElement('div');
    // dynamic-message クラスを追加して、後から削除しやすくする
    msg.classList.add('dynamic-message', 'flex', 'items-start', 'space-x-2', 'mt-4'); 

    if (sender === 'ai') {
        msg.innerHTML = `<div class="flex-shrink-0"><img src="https://placehold.co/40x40/6366F1/FFFFFF?text=KAI" alt="KAI Avatar" class="rounded-full"></div><div class="bg-indigo-200 text-indigo-900 p-3 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl max-w-[75%] animate-fade-in">${textOrHtml}</div>`;
    } else { // sender === 'user'
        msg.classList.remove('items-start');
        msg.classList.add('justify-end');
        msg.innerHTML = `<div class="bg-green-200 text-green-900 p-3 rounded-tl-2xl rounded-bl-2xl rounded-br-2xl max-w-[75%] animate-fade-in">${textOrHtml}</div>`;
    }
    chatLog.appendChild(msg);
    chatLog.scrollTop = chatLog.scrollHeight;
}

/**
 * ローディングインジケーターを表示する
 */
function showLoadingIndicator() { 
    if (loadingIndicator) {
        loadingIndicator.classList.remove('hidden'); 
        // スクロールを最下部に移動してローディング表示を見やすくする
        chatLog.scrollTop = chatLog.scrollHeight;
    }
}

/**
 * ローディングインジケーターを非表示にする
 */
function hideLoadingIndicator() { 
    if (loadingIndicator) {
        loadingIndicator.classList.add('hidden'); 
    }
}

/**
 * QRコードモーダルを表示する
 * @param {string} qrUrl - 表示するQRコード画像のURL
 */
function showQrModal(qrUrl) {
    const qrModal = document.getElementById('qr-modal');
    const qrModalImage = document.getElementById('qr-modal-image');
    if (qrModal && qrModalImage) {
        qrModalImage.src = qrUrl;
        qrModal.classList.remove('hidden');
    }
}

/**
 * QRコードモーダルを非表示にする
 */
function hideQrModal() {
    const qrModal = document.getElementById('qr-modal');
    if (qrModal) {
        qrModal.classList.add('hidden');
    }
}

/**
 * 初期状態（マイロック、挨拶、クイックアクション）を表示し、動的メッセージをクリアする
 */
function returnToHomeState() {
    ['my-locks-section-wrapper', 'initial-ai-greeting', 'initial-quick-actions', 'initial-notifications'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('hidden'); // hiddenクラスを削除して表示
    });
    // これまでの動的に追加されたチャットメッセージを全て削除
    document.querySelectorAll('.dynamic-message').forEach(msg => msg.remove());
    chatLog.scrollTop = 0; // スクロール位置を一番上に戻す
    wifiSetupContext.active = false; // Wi-Fi設定フローをリセット
    wifiSetupContext.step = null;
    wifiSetupContext.data = {};
}

/**
 * 初期状態（マイロック、挨拶、クイックアクション）を非表示にする
 */
function startChatFlow() {
    ['my-locks-section-wrapper', 'initial-ai-greeting', 'initial-quick-actions', 'initial-notifications'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.add('hidden'); // hiddenクラスを追加して非表示
    });
}

// --- 外部との通信（GAS経由でGemini APIを呼び出す） ---

/**
 * Google Apps Script（GAS）経由でGemini APIを呼び出す
 * @param {object} payload - GASに送信するペイロード（promptとtypeを含む）
 */
async function callGAS(payload) {
    showLoadingIndicator();
    if (GAS_WEB_APP_URL === 'ここにデプロイしたGASのURLを貼り付け') {
        addMessage('ai', 'バックエンドURLが設定されていません。GAS_WEB_APP_URLを設定してください。');
        hideLoadingIndicator();
        return;
    }
    try {
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
        });
        
        if (!response.ok) {
            // エラーレスポンスの本文を読み込んで詳細を表示
            const errorText = await response.text();
            throw new Error(`HTTPエラー！ステータス: ${response.status}, 詳細: ${errorText}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.text) {
            addMessage('ai', result.text); 
        } else {
            addMessage('ai', `申し訳ありません、応答を生成できませんでした: ${result.error || '不明なエラー'}`);
        }
    } catch (error) {
        addMessage('ai', `バックエンドとの通信でエラーが発生しました。もう一度お試しください。 (${error.message})`);
        console.error('GAS backend communication error:', error);
    } finally {
        hideLoadingIndicator();
    }
}

// --- メインのチャット入力とフロー管理 ---

/**
 * ユーザーのテキスト入力またはクイックアクションを処理する
 * @param {string} userInput - ユーザーが入力したテキスト
 */
function handleSend(userInput) {
    const finalUserInput = userInput || chatInput.value.trim();
    if (finalUserInput === '') return;
    
    // 現在Wi-Fi設定フローがアクティブな場合
    if (wifiSetupContext.active && wifiSetupContext.step) {
        handleUserTextInput(finalUserInput);
    } else {
        // 通常のチャット処理
        startChatFlow(); // 初期UIを非表示にする
        addMessage('user', finalUserInput); // ユーザーメッセージをチャットログに追加
        chatInput.value = ''; // 入力フィールドをクリア

        // RAGへの振り分けキーワード
        const ragKeywords = ['使い方', '設定', 'トラブル', 'マニュアル', '方法', '開かない', '接続', 'できない', 'パスワード', '合鍵', 'Wi-Fi'];
        const isRagQuery = ragKeywords.some(keyword => finalUserInput.includes(keyword));
        
        // GASへ送信するペイロードを決定
        callGAS({ 
            prompt: finalUserInput, 
            type: isRagQuery ? 'rag' : 'chat' 
        });
    }
}

// --- Wi-Fi設定フローの関数群（ユーザー提供の「1番」のコードを統合） ---

/**
 * Wi-Fi設定フローを開始する
 */
async function startWifiSetupFlow() {
    startChatFlow(); // 初期UIを非表示にする
    wifiSetupContext = { active: true, step: null, data: {} }; // コンテキストをリセットしアクティブに
    addMessage('ai', 'Wi-Fi設定を開始します。'); // フロー開始メッセージ

    const powerType = await askWithOptions('使用するQR1は電池式（LE）ですか？それともAC電源式ですか？', ['電池式', 'AC電源式']);
    wifiSetupContext.data.powerType = powerType;

    const freqMessage = powerType === '電池式' ? '接続頻度を選んでください。おすすめは「1日1回」です。' : '接続頻度は「常時」が推奨されます。';
    const frequency = await askWithOptions(freqMessage, ['常時', '1時間ごと', '6時間ごと', '12時間ごと', '1日1回', 'なし']);
    wifiSetupContext.data.frequency = frequency;

    addMessage('ai', '接続するWi-FiのSSIDを入力してください。');
    wifiSetupContext.step = 'ssid'; // 次のステップを設定
}

/**
 * オプション選択肢付きの質問をユーザーに提示し、選択を待つ
 * @param {string} question - ユーザーに表示する質問
 * @param {string[]} options - ユーザーが選択できるオプションの配列
 * @returns {Promise<string>} ユーザーが選択したオプション
 */
function askWithOptions(question, options) {
    return new Promise((resolve) => {
        addMessage('ai', question);
        setTimeout(() => {
            const container = document.createElement('div');
            container.className = 'flex flex-wrap gap-2 mt-2 dynamic-message'; // dynamic-messageクラスを追加
            options.forEach((opt) => {
                const btn = document.createElement('button');
                btn.innerText = opt;
                btn.className = 'bg-indigo-500 text-white px-4 py-2 rounded-full text-sm hover:bg-indigo-600 transition duration-200';
                // イベントリスナーを直接割り当てて、解決時にボタンを削除
                btn.onclick = () => {
                    addMessage('user', opt);
                    container.remove(); // ボタンコンテナをDOMから削除
                    resolve(opt); // Promiseを解決
                };
                container.appendChild(btn);
            });
            chatLog.appendChild(container);
            chatLog.scrollTop = chatLog.scrollHeight;
        }, 100);
    });
}

/**
 * Wi-Fi設定フロー中のユーザーテキスト入力を処理する
 * @param {string} value - ユーザーが入力したテキスト
 */
function handleUserTextInput(value) {
    if (!wifiSetupContext.active || !wifiSetupContext.step) return;

    const step = wifiSetupContext.step;
    const data = wifiSetupContext.data;

    addMessage('user', value); // ユーザーの入力をチャットログに表示

    if (step === 'ssid') {
        data.ssid = value;
        addMessage('ai', 'Wi-Fiのパスワードを入力してください。');
        wifiSetupContext.step = 'password';
    } else if (step === 'password') {
        data.password = value;
        wifiSetupContext.active = false; // フローを非アクティブにする
        wifiSetupContext.step = null;
        generateAndShowQr(data);
    }
}

/**
 * Wi-Fi設定用のQRコードを生成し、表示する
 * @param {object} data - SSIDとパスワードを含むデータオブジェクト
 */
function generateAndShowQr(data) {
    const { ssid, password } = data;
    const qrText = `WIFI_SSID:${ssid}_PASS:${password}`;
    const qrUrl = `https://placehold.co/256x256/000/FFF?text=${encodeURIComponent(qrText)}`;

    addMessage('ai', `下記のQRコードをQR1にかざしてください。<br><img src="${qrUrl}" class="w-36 h-36 mx-auto my-4 rounded-lg border border-gray-300 shadow-md cursor-pointer" onclick="showQrModal('${qrUrl}')"/><p class="text-sm mt-2 text-center">タップで拡大します</p>`);

    setTimeout(() => {
        addMessage('ai', 'クラウドの接続を待っています...');
        setTimeout(() => {
            addMessage('ai', 'KEYVOXクラウドへの接続が完了しました🚀');
            // Wi-Fi設定フロー完了後、ホーム状態に戻す（クイックアクション等を表示）
            returnToHomeState(); 
        }, 2000);
    }, 1000);
}

// --- クイックアクションの処理（HTMLのonclickから呼ばれる） ---
// HTMLのonclick属性から直接呼び出されるため、windowオブジェクトにアタッチ
window.simulateQuickAction = function(scenario) {
    startChatFlow(); // 現在のチャットログを隠す

    if (scenario === 'wifi_setup') {
        runWifiSetupFlow(); // Wi-Fi設定フローを開始
    } else {
        // その他のクイックアクション（Notion RAGやGeminiチャットに送る）
        // ボタンのテキストを取得してhandleSendに渡す
        const buttonText = document.querySelector(`button[onclick="simulateQuickAction('${scenario}')"]`).textContent.trim();
        handleSend(buttonText);
    }
};

// HTMLのonclick属性から呼ばれるため、windowオブジェクトにアタッチ
window.showQrModal = showQrModal;
window.hideQrModal = hideQrModal; // QRモーダルを閉じる関数

// --- アプリケーション起動時の初期設定 ---
document.addEventListener('DOMContentLoaded', () => {
    // イベントリスナーをDOMがロードされた後に設定
    sendButton.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });

    // 「HOME」ボタンと「My Page」ボタンのイベントリスナー
    // HTMLのonclick属性を使っているため、ここでは再設定しないが、
    // もし動かない場合は以下のようにaddEventListenerに切り替えることも検討
    // document.getElementById('home-button').addEventListener('click', returnToHomeState);
    // document.getElementById('options-button').addEventListener('click', () => { /* My Page logic */ });

    // アプリケーション起動時に実行される処理（Face IDなし版）
    // アプリコンテナを表示し、必要に応じて初期UIを再表示
    const appContainer = document.getElementById('app-container');
    appContainer.classList.remove('hidden');
    appContainer.classList.add('flex');
    // 必要に応じてreturnToHomeState()を呼び出し、初期UIを表示
    // （今回はHTMLの初期表示がそれに近いので、ここで直接は呼び出さない）
});

