        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        // GAS Web App URL
        // ステップ1でデプロイしたウェブアプリのURLをここに貼り付けてください
        const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxzml5onddDpDyqbh4Aen6F0MC2TykWhgIpQak6mkodmrPU0WpUgcIRmSELrmCylgxM2g/exec';
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★


        // Global variable to track the current active view/screen
        let currentView = 'main'; // 'main', 'myPage', 'login', 'register'

        // Helper function to add a message to the chat area
       // Helper function to add a message to the chat area
      function addMessage(sender, textOrHtml) {
          const chatArea = document.getElementById('scrollable-content');
          const messageDiv = document.createElement('div');
          // Add a class for easy removal of dynamic messages
          messageDiv.classList.add('dynamic-message', 'flex', 'items-start', 'space-x-2');

          if (!chatArea || currentView !== 'main') {
              console.warn('Attempted to add message to a non-main chat view. Suppressing.');
              return;
          }

          // ★★★★★★★★★ ここからが変更点 ★★★★★★★★★

          // URLを検出するための正規表現
          const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
          
          // 渡されたテキストにHTMLタグが既に含まれているか簡易的にチェック
          const containsHtml = /<[a-z][\s\S]*>/i.test(textOrHtml);
          
          let processedContent = textOrHtml;
          // HTMLタグが含まれていないプレーンテキストの場合のみ、URLをリンクに置換
          if (!containsHtml) {
              processedContent = textOrHtml.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${url}</a>`);
          }
          
          // ★★★★★★★★★ ここまでが変更点 ★★★★★★★★★

          if (sender === 'ai') {
              messageDiv.innerHTML = `
                  <div class="flex-shrink-0">
                      <img src="https://placehold.co/40x40/6366F1/FFFFFF?text=KAI" alt="KAI Avatar" class="rounded-full">
                  </div>
                  <div class="bg-indigo-200 text-indigo-900 p-3 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl max-w-[75%] animate-fade-in">
                      ${processedContent}
                  </div>
              `;
          } else { // sender === 'user'
              messageDiv.classList.remove('items-start');
              messageDiv.classList.add('justify-end');
              messageDiv.innerHTML = `
                  <div class="bg-green-200 text-green-900 p-3 rounded-tl-2xl rounded-bl-2xl rounded-br-2xl rounded-tr-2xl max-w-[75%] animate-fade-in">
                      ${processedContent}
                  </div>
              `;
          }
          chatArea.appendChild(messageDiv);
          chatArea.scrollTop = chatArea.scrollHeight;
      }

        // Show loading indicator
        function showLoadingIndicator() {
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator && currentView === 'main') { // Only show in main chat view
                loadingIndicator.classList.remove('hidden');
                document.getElementById('scrollable-content').scrollTop = document.getElementById('scrollable-content').scrollHeight;
            }
        }

        // Hide loading indicator
        function hideLoadingIndicator() {
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.classList.add('hidden');
            }
        }

        // Function to call GAS backend which then calls Gemini API
        async function callGeminiViaGAS(prompt, callback = null) {
            showLoadingIndicator();

            if (GAS_WEB_APP_URL === 'ここにデプロイしたGASのURLを貼り付け') {
                 addMessage('ai', 'バックエンド（Google Apps Script）が設定されていません。HTMLファイル内の `GAS_WEB_APP_URL` を設定してください。');
                 hideLoadingIndicator();
                 return;
            }
            
            try {
                const response = await fetch(GAS_WEB_APP_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain;charset=utf-8', // GASで正しく受け取るため
                    },
                    body: JSON.stringify({ prompt: prompt }) // プロンプトをJSONで送信
                });
                
                const result = await response.json();

                if (result.success && result.text) {
                    addMessage('ai', result.text); 
                    if (callback) {
                        callback(result.text);
                    }
                } else {
                    const errorMessage = result.error || '不明なエラーが発生しました。';
                    addMessage('ai', `申し訳ありません、応答を生成できませんでした。エラー: ${errorMessage}`);
                    console.error('GAS/Gemini API Error:', result);
                }
            } catch (error) {
                addMessage('ai', 'バックエンドとの通信でエラーが発生しました。もう一度お試しください。');
                console.error('Error calling GAS backend:', error);
            } finally {
                hideLoadingIndicator();
            }
        }

        // --- View Management Functions ---
        function switchView(newView) {
            // Hide all potential full-screen views first
            const allViews = ['main-content', 'my-page', 'login-screen', 'register-screen'];
            allViews.forEach(id => document.getElementById(id).classList.add('hidden'));

            document.getElementById('chat-input-area').classList.add('hidden');
            document.getElementById('modal-backdrop').style.display = 'none';

            // Header button visibility and text
            document.getElementById('back-button').classList.add('hidden');
            document.getElementById('options-button').classList.add('hidden');
            document.getElementById('header-title').textContent = 'KEYVOX KAI'; // Default title

            // Show the requested view
            if (newView === 'main') {
                document.getElementById('main-content').classList.remove('hidden');
                document.getElementById('chat-input-area').classList.remove('hidden');
                document.getElementById('options-button').classList.remove('hidden'); 
            } else {
                const viewToShow = document.getElementById(newView === 'myPage' ? 'my-page' : newView + '-screen');
                viewToShow.classList.remove('hidden');
                document.getElementById('modal-backdrop').style.display = 'block';
                document.getElementById('back-button').classList.remove('hidden'); 

                if(newView === 'myPage') document.getElementById('header-title').textContent = 'マイページ';
                if(newView === 'login') document.getElementById('header-title').textContent = 'ログイン';
                if(newView === 'register') document.getElementById('header-title').textContent = '新規登録';
            }
            
            currentView = newView; // Update global state
        }

        // Resets the chat area content to initial state, clearing dynamic messages
        function resetChatViewState() {
            const chatArea = document.getElementById('scrollable-content');
            
            document.getElementById('my-locks-section-wrapper').classList.remove('hidden');
            document.getElementById('initial-ai-greeting').classList.remove('hidden');
            document.getElementById('initial-quick-actions').classList.remove('hidden');
            document.getElementById('initial-notifications').classList.remove('hidden');

            chatArea.querySelectorAll('.dynamic-message').forEach(msg => msg.remove());

            chatArea.scrollTop = 0;

            window.currentInitialSetupStep = null;
            window.initialSetupData = {};
            window.currentKeyRegisterStep = null;
        }
        
        // Returns to home state but keeps chat history
        function returnToHomeState() {
            document.getElementById('my-locks-section-wrapper').classList.remove('hidden');
            document.getElementById('initial-ai-greeting').classList.remove('hidden');
            document.getElementById('initial-quick-actions').classList.remove('hidden');
            document.getElementById('initial-notifications').classList.remove('hidden');
            
            // Scroll to top to see the home elements
             document.getElementById('scrollable-content').scrollTop = 0;
        }


        function goBack() {
             switchView('main');
             returnToHomeState();
        }

        window.currentInitialSetupStep = null;
        window.initialSetupData = {}; 

        function startChatFlow() {
            document.getElementById('my-locks-section-wrapper').classList.add('hidden');
            document.getElementById('initial-ai-greeting').classList.add('hidden');
            document.getElementById('initial-quick-actions').classList.add('hidden');
            document.getElementById('initial-notifications').classList.add('hidden');
        }

        // Handle sending messages (user input)
        async function handleSend(userInput) {
            const chatInput = document.getElementById('chat-input');
            const finalUserInput = userInput || chatInput.value.trim();

            if (finalUserInput === '') return;
            
            startChatFlow();

            addMessage('user', finalUserInput);
            chatInput.value = '';

            if (window.currentKeyRegisterStep === 'awaiting_key_data') {
                const qrCodeData = finalUserInput; 
                window.currentKeyRegisterStep = null; 
                await registerSharedKey(qrCodeData);
                return;
            }

            const menuKeywords = ['メニュー', 'ホーム', '最初の画面', 'トップ画面', '最初に戻る', 'ホームに戻る', 'home', 'menu'];
            if (menuKeywords.some(keyword => finalUserInput.toLowerCase().includes(keyword))) {
                addMessage('ai', 'メニュー画面に戻ります。');
                setTimeout(returnToHomeState, 500);
                return; 
            }

            if (window.currentInitialSetupStep) {
                // Initial setup flow is handled locally and does not call the AI
                handleInitialSetupFlow(finalUserInput);
                return;
            }
            
            // For all other conversations, call the AI
            await callGeminiViaGAS(finalUserInput);
        }

        function handleInitialSetupFlow(finalUserInput) {
            const currentStep = window.currentInitialSetupStep;
            window.currentInitialSetupStep = null;

            if (currentStep === 'awaiting_current_admin_pin') {
                if (finalUserInput.length === 12 && /^\d+$/.test(finalUserInput)) {
                    window.initialSetupData.currentAdminPin = finalUserInput;
                    addMessage('ai', '現在の管理者暗証番号を確認しました。次に、新しい管理者暗証番号12桁を入力してください。');
                    window.currentInitialSetupStep = 'awaiting_new_admin_pin';
                } else {
                    addMessage('ai', '管理者暗証番号は12桁の数字で入力してください。もう一度お願いします。');
                    window.currentInitialSetupStep = 'awaiting_current_admin_pin';
                }
            } else if (currentStep === 'awaiting_new_admin_pin') {
                if (finalUserInput.length === 12 && /^\d+$/.test(finalUserInput)) {
                    window.initialSetupData.newAdminPin = finalUserInput;
                    addMessage('ai', '新しい管理者暗証番号を確認しました。確認のため、もう一度新しい管理者暗証番号12桁を入力してください。');
                    window.currentInitialSetupStep = 'awaiting_new_admin_pin_confirm';
                } else {
                    addMessage('ai', '新しい管理者暗証番号は12桁の数字で入力してください。もう一度お願いします。');
                    window.currentInitialSetupStep = 'awaiting_new_admin_pin';
                }
            } else if (currentStep === 'awaiting_new_admin_pin_confirm') {
                if (finalUserInput === window.initialSetupData.newAdminPin) {
                    addMessage('ai', '新しい管理者暗証番号が確認されました。ロックに設定するためのQRコードを表示します。');
                    const qrData = `ADMIN_PIN_SETUP_${window.initialSetupData.newAdminPin}`;
                    const qrUrl = `https://placehold.co/256x256/000/FFF?text=${encodeURIComponent(qrData)}`;
                    const smallQrUrl = `https://placehold.co/150x150/000/FFF?text=${encodeURIComponent(qrData)}`;
                    addMessage('ai', `
                        <img src="${smallQrUrl}" alt="管理者暗証番号設定用QRコード" class="w-36 h-36 mx-auto my-4 rounded-lg border border-gray-300 shadow-md cursor-pointer" onclick="showQrModal('${qrUrl}')"/>
                        <p class="text-sm mt-2">このQRコードをQR1でスキャンしてください。</p>
                    `);
                    setTimeout(() => {
                        addMessage('ai', `
                            QRコードのスキャン後、ロック本体のLEDはどの色に点灯しましたか？
                            <div class="flex flex-col gap-2 mt-2">
                                <button class="bg-green-500 text-white px-4 py-2 rounded-full text-sm hover:bg-green-600 transition duration-200" onclick="handleLedConfirmation('green')">🟢 LEDが緑に点灯した</button>
                                <button class="bg-red-500 text-white px-4 py-2 rounded-full text-sm hover:bg-red-600 transition duration-200" onclick="handleLedConfirmation('red')">🔴 LEDが赤に点灯した</button>
                            </div>
                        `);
                    }, 1500);
                } else {
                    addMessage('ai', '入力されたパスワードが一致しません。もう一度新しい管理者暗証番号12桁を入力してください。');
                    window.currentInitialSetupStep = 'awaiting_new_admin_pin';
                }
            } else if (currentStep === 'awaiting_ssid') {
                window.initialSetupData.ssid = finalUserInput;
                addMessage('ai', `SSID「${finalUserInput}」を確認しました。次に、そのWi-Fiのパスワードを入力してください。`);
                window.currentInitialSetupStep = 'awaiting_password';
            } else if (currentStep === 'awaiting_password') {
                window.initialSetupData.password = finalUserInput;
                addMessage('ai', 'パスワードを確認しました。インターネット接続用のQRコードを表示します。');
                const qrData = `WIFI_SETUP_${window.initialSetupData.ssid}_${window.initialSetupData.password}`;
                const qrUrl = `https://placehold.co/256x256/000/FFF?text=${encodeURIComponent(qrData)}`;
                const smallQrUrl = `https://placehold.co/150x150/000/FFF?text=${encodeURIComponent(qrData)}`;
                addMessage('ai', `
                    <img src="${smallQrUrl}" alt="Wi-Fi設定用QRコード" class="w-36 h-36 mx-auto my-4 rounded-lg border border-gray-300 shadow-md cursor-pointer" onclick="showQrModal('${qrUrl}')"/>
                    <p class="text-sm mt-2">このQRコードをQR1でスキャンしてください。</p>
                `);
                setTimeout(() => {
                    addMessage('ai', 'インターネットに繋がればクラウド経由で検知後＞無事に設定終了しました！KEYVOX AIを快適にご利用ください。');
                    window.initialSetupData = {};
                    window.currentInitialSetupStep = null;
                    setTimeout(returnToHomeState, 1500);
                }, 2000);
            }
        }

        let keyIssueFlowData = {};

        function simulateQuickAction(scenario) {
            startChatFlow();
            
            addMessage('ai', 'こんにちは！何をお手伝いしましょうか？'); 

            if (scenario === 'key_issue') {
                keyIssueFlowData = {};
                setTimeout(() => { addMessage('user', '合鍵を発行したい'); }, 500);
                setTimeout(() => { addMessage('ai', '承知いたしました。合鍵を発行する方の**お名前**を教えてください。'); }, 1000);
                setTimeout(() => { addMessage('user', '田中さん'); keyIssueFlowData.recipientName = '田中さん'; }, 1500);
                setTimeout(() => {
                    addMessage('ai', `
                        田中様に、いつからいつまで、または何回までアクセスを許可しますか？例：**『来週の月曜日から水曜日まで』**、**『本日中』**、**『5回まで』**
                        <div class="flex flex-col gap-2 mt-2">
                            <button class="bg-indigo-500 text-white px-4 py-2 rounded-full text-sm hover:bg-indigo-600 transition duration-200" onclick="addMessage('user', '本日中'); simulateKeyIssueStep('duration_selected_today');">本日中</button>
                            <button class="bg-indigo-500 text-white px-4 py-2 rounded-full text-sm hover:bg-indigo-600 transition duration-200" onclick="addMessage('user', '日時を指定'); simulateKeyIssueStep('duration_selected_datetime');">日時を指定</button>
                            <button class="bg-indigo-500 text-white px-4 py-2 rounded-full text-sm hover:bg-indigo-600 transition duration-200" onclick="addMessage('user', '回数を指定'); simulateKeyIssueStep('duration_selected_count');">回数を指定</button>
                        </div>
                    `);
                }, 2000);
            } else if (scenario === 'settings') {
                setTimeout(() => { handleSend('最適な自動施錠時間を提案してほしい'); }, 500);
            } else if (scenario === 'troubleshooting') {
                setTimeout(() => { handleSend('鍵が突然開かなくなったんだけど'); }, 500);
            } else if (scenario === 'history') {
                setTimeout(() => { addMessage('user', '先週、誰が何時に玄関に入ったか知りたい'); }, 500);
                setTimeout(() => {
                    addMessage('ai', '承知いたしました。先週の玄関ドアの利用履歴を表示しますね。');
                    addMessage('ai', `
                        <div class="bg-white p-3 rounded-lg shadow-sm border border-gray-200 mt-2 text-sm text-gray-800">
                            <p class="font-semibold mb-1">利用履歴（玄関ドア：先週）</p>
                            <ul class="list-disc list-inside space-y-1">
                                <li>6/10 18:30 - ケンさん (解錠)</li>
                                <li>6/10 08:00 - ケンさん (施錠)</li>
                                <li>6/09 20:15 - 田中さん (解錠 - 一時鍵)</li>
                                <li>6/08 10:00 - ケンさん (解錠)</li>
                            </ul>
                        </div>
                    `);
                    addMessage('ai', '特定の期間や人物で絞り込みますか？');
                }, 1000);
            } else if (scenario === 'initial_setup') {
                window.initialSetupData = {};
                window.currentInitialSetupStep = 'awaiting_current_admin_pin';
                setTimeout(() => { addMessage('user', '初期設定を開始したい'); }, 500);
                setTimeout(() => { addMessage('ai', 'KEYVOXスマートロックの初期設定を開始しますね！まず、現在の**管理者暗証番号12桁**を入力してください。'); }, 1000);
            }else if (scenario === 'wifi_setup') {
                if (typeof startWifiSetupFlow === 'function') {
                startWifiSetupFlow();
                } else {
                console.error("startWifiSetupFlow 関数が読み込まれていません。");
                addMessage('ai', 'Wi-Fi設定の手順を開始できませんでした。もう一度お試しください。');
                }
            } else if (scenario === 'register_shared_key') {
                setTimeout(() => { addMessage('user', '受け取った合鍵を登録したい'); }, 500);
                setTimeout(() => { addMessage('ai', '承知いたしました。登録したい合鍵の情報をQRコードから読み取るか、直接入力してください。QRコードのスキャンが必要な場合は、**『QRコードをスキャン』**ボタンを押してください。'); }, 1000);
                setTimeout(() => {
                    addMessage('ai', `
                        <div class="flex flex-col gap-2 mt-2">
                            <button class="bg-indigo-500 text-white px-4 py-2 rounded-full text-sm hover:bg-indigo-600 transition duration-200" onclick="addMessage('user', 'QRコードをスキャン'); simulateRegisterKeyStep('scan_qr');">QRコードをスキャン</button>
                            <button class="bg-indigo-500 text-white px-4 py-2 rounded-full text-sm hover:bg-indigo-600 transition duration-200" onclick="addMessage('user', '直接入力'); simulateRegisterKeyStep('direct_input');">直接入力</button>
                        </div>
                    `);
                }, 1500);
            }
        }

        function simulateKeyIssueStep(step) {
            if (step === 'duration_selected_today') {
                keyIssueFlowData.validity = '本日午後3時から夜8時まで有効';
                setTimeout(() => { addMessage('ai', '承知いたしました。アクセスを許可する**ドア**はどちらにしますか？ **『玄関ドアのみ』**、または**『全てのドア』**など。'); addMessage('ai', `
                    <div class="flex flex-col gap-2 mt-2">
                        <button class="bg-indigo-500 text-white px-4 py-2 rounded-full text-sm hover:bg-indigo-600 transition duration-200" onclick="addMessage('user', '玄関ドアのみ'); simulateKeyIssueStep('door_selected_and_proceed_to_type', '玄関ドア');">玄関ドアのみ</button>
                        <button class="bg-indigo-500 text-white px-4 py-2 rounded-full text-sm hover:bg-indigo-600 transition duration-200" onclick="addMessage('user', '全てのドア'); simulateKeyIssueStep('door_selected_and_proceed_to_type', '全てのドア');">全てのドア</button>
                    </div>
                `); }, 500);
            } else if (step === 'duration_selected_datetime') {
                keyIssueFlowData.validity = '今日の午後3時から夜8時まで有効';
                setTimeout(() => { addMessage('user', '今日の午後3時から夜8時まで'); }, 500);
                setTimeout(() => { addMessage('ai', '承知いたしました。アクセスを許可する**ドア**はどちらにしますか？ **『玄関ドアのみ』**、または**『全てのドア』**など。'); addMessage('ai', `
                    <div class="flex flex-col gap-2 mt-2">
                        <button class="bg-indigo-500 text-white px-4 py-2 rounded-full text-sm hover:bg-indigo-600 transition duration-200" onclick="addMessage('user', '玄関ドアのみ'); simulateKeyIssueStep('door_selected_and_proceed_to_type', '玄関ドア');">玄関ドアのみ</button>
                        <button class="bg-indigo-500 text-white px-4 py-2 rounded-full text-sm hover:bg-indigo-600 transition duration-200" onclick="addMessage('user', '全てのドア'); simulateKeyIssueStep('door_selected_and_proceed_to_type', '全てのドア');">全てのドア</button>
                    </div>
                `); }, 1000);
            } else if (step === 'duration_selected_count') {
                keyIssueFlowData.validity = '5回まで有効';
                setTimeout(() => { addMessage('ai', '承知いたしました。アクセスを許可する**ドア**はどちらにしますか？ **『玄関ドアのみ』**、または**『全てのドア』』**など。'); addMessage('ai', `
                    <div class="flex flex-col gap-2 mt-2">
                        <button class="bg-indigo-500 text-white px-4 py-2 rounded-full text-sm hover:bg-indigo-600 transition duration-200" onclick="addMessage('user', '玄関ドアのみ'); simulateKeyIssueStep('door_selected_and_proceed_to_type', '玄関ドア');">玄関ドアのみ</button>
                        <button class="bg-indigo-500 text-white px-4 py-2 rounded-full text-sm hover:bg-indigo-600 transition duration-200" onclick="addMessage('user', '全てのドア'); simulateKeyIssueStep('door_selected_and_proceed_to_type', '全てのドア');">全てのドア</button>
                    </div>
                `); }, 500);
            } else if (step === 'door_selected_and_proceed_to_type') {
                keyIssueFlowData.lockName = arguments[1];
                setTimeout(() => { addMessage('user', keyIssueFlowData.lockName); }, 500);
                setTimeout(() => { addMessage('ai', '承知いたしました。発行する鍵の種類を教えてください。**QRコード**、**暗証番号**、または**アプリ**から選択いただけます。'); addMessage('ai', `
                    <div class="flex flex-col gap-2 mt-2">
                        <button class="bg-indigo-500 text-white px-4 py-2 rounded-full text-sm hover:bg-indigo-600 transition duration-200" onclick="addMessage('user', 'QRコード'); simulateKeyIssueStep('key_type_selected', 'QRコード');">QRコード</button>
                        <button class="bg-indigo-500 text-white px-4 py-2 rounded-full text-sm hover:bg-indigo-600 transition duration-200" onclick="addMessage('user', '暗証番号'); simulateKeyIssueStep('key_type_selected', '暗証番号');">暗証番号</button>
                        <button class="bg-indigo-500 text-white px-4 py-2 rounded-full text-sm hover:bg-indigo-600 transition duration-200" onclick="addMessage('user', 'アプリ'); simulateKeyIssueStep('key_type_selected', 'アプリ');">アプリ</button>
                    </div>
                `); }, 1000);
            } else if (step === 'key_type_selected') {
                keyIssueFlowData.keyType = arguments[1];
                setTimeout(() => { simulateKeyIssueStep('confirm_issue'); }, 500);
            } else if (step === 'confirm_issue') {
                let confirmationText;
                let qrCodeContentForShare = '';
                if (keyIssueFlowData.keyType === 'QRコード') {
                    confirmationText = `${keyIssueFlowData.recipientName}様に、${keyIssueFlowData.validity}有効な${keyIssueFlowData.lockName}の**QRコード鍵**を発行します。よろしいでしょうか？`;
                    qrCodeContentForShare = `KEYVOX_QR_${keyIssueFlowData.lockName}_${Math.random().toString(36).substring(2, 9)}`;
                } else if (keyIssueFlowData.keyType === '暗証番号') {
                    const pin = Math.floor(1000 + Math.random() * 9000);
                    confirmationText = `${keyIssueFlowData.recipientName}様に、${keyIssueFlowData.validity}有効な${keyIssueFlowData.lockName}の**暗証番号鍵**（パスコード: ${pin}）を発行します。よろしいでしょうか？`;
                    qrCodeContentForShare = `KEYVOX_PIN_${keyIssueFlowData.lockName}_${pin}`;
                } else if (keyIssueFlowData.keyType === 'アプリ') {
                    confirmationText = `${keyIssueFlowData.recipientName}様に、${keyIssueFlowData.validity}有効な${keyIssueFlowData.lockName}の**アプリ鍵**を発行します。よろしいでしょうか？`;
                    qrCodeContentForShare = `https://example.com/keyvox/appkey/register?token=${Math.random().toString(36).substring(2, 15)}`;
                }

                addMessage('ai', confirmationText);
                addMessage('ai', `
                    <div class="flex flex-wrap gap-2 mt-2">
                        <button class="bg-green-500 text-white px-4 py-2 rounded-full text-sm hover:bg-green-600 transition duration-200" onclick="addMessage('user', 'はい'); simulateKeyIssueStep('final_sharing_options', '${qrCodeContentForShare}');">はい</button>
                        <button class="bg-red-500 text-white px-4 py-2 rounded-full text-sm hover:bg-red-600 transition duration-200" onclick="addMessage('user', 'いいえ');">いいえ</button>
                    </div>
                `);
            } else if (step === 'final_sharing_options') {
                const qrCodeContentForShare = arguments[1];
                keyIssueFlowData.generatedKeyData = qrCodeContentForShare;
                setTimeout(() => { addMessage('ai', '合鍵発行が完了しました。共有オプションを選択してください。'); addMessage('ai', `
                    <div class="flex flex-col gap-2 mt-2">
                        <button class="bg-indigo-500 text-white px-4 py-2 rounded-full text-sm hover:bg-indigo-600 transition duration-200" onclick="shareKeyvoxKey('${keyIssueFlowData.recipientName}', '${keyIssueFlowData.lockName}', '${qrCodeContentForShare}', '${keyIssueFlowData.keyType}');">共有する (OS共有機能)</button>
                        <button class="bg-indigo-500 text-white px-4 py-2 rounded-full text-sm hover:bg-indigo-600 transition duration-200" onclick="addMessage('ai', '${keyIssueFlowData.recipientName}様のメールアドレスまたはSMSに送付します。連絡先を教えていただけますか？');">連絡先に送付する (アプリ内機能)</button>
                    </div>
                `); }, 500);
            }
        }
        
        function simulateQrCodeDisplay(lockName, qrCodeData) {
            const largeQrUrl = `https://placehold.co/256x256/000/FFF?text=${encodeURIComponent('KEYVOX\\n' + qrCodeData)}`;
            showQrModal(largeQrUrl);
        }

        async function shareKeyvoxKey(recipientName, lockName, keyContent, keyType) {
            if (navigator.share) {
                try {
                    let shareTitle = `KEYVOX ${lockName}の${keyType}鍵`;
                    let shareText = `${recipientName}様へ、KEYVOXスマートロック「${lockName}」の${keyType}鍵です。`;
                    let shareUrl = '';

                    if (keyType === 'QRコード' || keyType === 'アプリ') {
                        shareUrl = `https://example.com/keyvox/share?data=${encodeURIComponent(keyContent)}`;
                        shareText += `\n以下のリンクからアクセスしてください: ${shareUrl}`;
                    } else if (keyType === '暗証番号') {
                        shareText += `\nパスコード: ${keyContent}\nご案内をご確認ください: https://example.com/keyvox/pin_guide`;
                        shareUrl = `https://example.com/keyvox/pin_share?code=${encodeURIComponent(keyContent)}`;
                    }

                    await navigator.share({
                        title: shareTitle,
                        text: shareText,
                        url: shareUrl
                    });
                    addMessage('ai', `合鍵の共有リクエストが送信されました。`);
                } catch (error) {
                    if (error.name === 'AbortError') {
                        addMessage('ai', '合鍵の共有がキャンセルされました。');
                    } else {
                        addMessage('ai', `共有に失敗しました: ${error.message}`);
                        console.error('Sharing failed:', error);
                    }
                }
            } else {
                addMessage('ai', 'お使いのブラウザは共有機能をサポートしていません。リンクや情報をコピーして手動で共有してください: ' + keyContent);
            }
        }

        let registrationFlowData = {};

        function simulateRegisterKeyStep(step) {
            if (step === 'scan_qr') {
                addMessage('ai', 'QRコードをスキャンする準備ができました。カメラをQRコードにかざしてください。');
                setTimeout(() => {
                    addMessage('ai', '（デモのため、代わりにQRコードのデータ文字列を直接入力してください。）');
                    window.currentKeyRegisterStep = 'awaiting_key_data';
                }, 1500);
            } else if (step === 'direct_input') {
                addMessage('ai', '合鍵のデータ文字列を直接入力してください。（例: KEYVOX_TANAKA_TEMPORARY_QR または https://example.com/keyvox/appkey/register?token=...）');
                window.currentKeyRegisterStep = 'awaiting_key_data';
            }
        }

        async function registerSharedKey(qrCodeData) {
            const keyInfo = parseQrCodeData(qrCodeData);

            if (!keyInfo) {
                addMessage('ai', '入力された合鍵の形式が正しくありません。もう一度お試しください。');
                return;
            }

            registrationFlowData = keyInfo;

            const prompt = `あなたはKEYVOX AIアシスタントの「KAI（カイ）」です。以下の合鍵情報をユーザーに分かりやすく説明し、アプリに登録するかどうかを尋ねてください。
            合鍵情報: ${JSON.stringify(keyInfo)}

            例: その合鍵は、〇〇様が〇〇ドアにアクセスするために発行された一時的な鍵（〇月〇日から〇月〇日まで有効）のようですね。この鍵をあなたのKEYVOX AIアプリに登録しますか？`;

            await callGeminiViaGAS(prompt, (llmResponse) => {
                setTimeout(() => {
                    addMessage('ai', `
                        <div class="flex flex-wrap gap-2 mt-2">
                            <button class="bg-green-500 text-white px-4 py-2 rounded-full text-sm hover:bg-green-600 transition duration-200" onclick="confirmRegisterSharedKey(true);">はい、登録します</button>
                            <button class="bg-red-500 text-white px-4 py-2 rounded-full text-sm hover:bg-red-600 transition duration-200" onclick="confirmRegisterSharedKey(false);">いいえ、キャンセルします</button>
                        </div>
                    `);
                }, 500);
            });
        }

        let newLockCounter = 0;

        function parseQrCodeData(data) {
            if (data.startsWith('https://example.com/keyvox/appkey/register?token=')) {
                return {
                    id: `new_app_lock_${++newLockCounter}`,
                    issuer: 'ケン様',
                    lockName: '共有されたアプリ鍵',
                    type: 'アプリ',
                    validity: '提供者による'
                };
            } else if (data === 'KEYVOX_TANAKA_TEMPORARY_QR') {
                return {
                    id: `temp_qr_lock_${++newLockCounter}`,
                    issuer: '田中様',
                    lockName: '玄関ドア',
                    type: 'QRコード',
                    validity: '本日午後3時から夜8時まで有効'
                };
            } else if (data === 'KEYVOX_MANAGER_FULLACCESS_QR') {
                return {
                    id: `full_access_qr_lock_${++newLockCounter}`,
                    issuer: 'ケン様',
                    lockName: '書斎',
                    type: 'QRコード',
                    validity: '常に有効'
                };
            }
            return null;
        }

        function confirmRegisterSharedKey(isConfirmed) {
            if (isConfirmed) {
                addMessage('user', 'はい、登録します');
                setTimeout(() => {
                    addNewLockCardToUI(
                        registrationFlowData.id,
                        registrationFlowData.lockName,
                        '施錠済み'
                    );
                    addMessage('ai', `合鍵の登録が完了しました。新しい鍵「${registrationFlowData.lockName}」がマイロックに追加されました。`);
                    registrationFlowData = {};
                }, 500);
            } else {
                addMessage('user', 'いいえ、キャンセルします');
                setTimeout(() => {
                    addMessage('ai', '合鍵の登録をキャンセルしました。何か他に用件はありますか？');
                    registrationFlowData = {};
                }, 500);
            }
        }

        function addNewLockCardToUI(lockId, lockName, status) {
            const myLocksSectionGrid = document.getElementById('my-locks-section');
            document.getElementById('my-locks-section-wrapper').classList.remove('hidden');

            const isLocked = status === '施錠済み';
            const bgColor = isLocked ? 'bg-indigo-100' : 'bg-green-100';
            const textColor = isLocked ? 'text-indigo-800' : 'text-green-800';
            const iconColor = isLocked ? 'text-indigo-700' : 'text-green-700';
            const statusColor = isLocked ? 'text-indigo-600' : 'text-green-600';
            const lockIconPath = isLocked ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>' : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path>';

            const newLockCardHtml = `
                <div id="${lockId}" class="${bgColor} p-3 rounded-lg flex flex-col items-center justify-center text-center shadow-sm">
                    <svg class="w-8 h-8 ${iconColor} mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${lockIconPath}</svg>
                    <p class="text-sm font-medium ${textColor}">${lockName}</p>
                    <span class="text-xs ${statusColor}">${status}</span>
                    <button class="mt-2 bg-purple-500 text-white text-xs px-3 py-1 rounded-full hover:bg-purple-600 transition duration-200" onclick="simulateQrCodeDisplay('${lockName}', '${lockId}_QR')">QRコード表示</button>
                </div>
            `;
            myLocksSectionGrid.insertAdjacentHTML('beforeend', newLockCardHtml);
        }
        
        // --- Modal Functions (QR) ---
        function showQrModal(qrUrl) {
            const qrModal = document.getElementById('qr-modal');
            const qrModalImage = document.getElementById('qr-modal-image');
            qrModalImage.src = qrUrl;
            qrModal.classList.remove('hidden');
            qrModal.classList.add('flex');
        }

        function hideQrModal() {
            const modal = document.getElementById('qr-modal');
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        
        // --- Initial Setup LED Confirmation ---
        function handleLedConfirmation(status) {
            if (status === 'green') {
                addMessage('user', 'LEDが緑に点灯した');
                setTimeout(() => {
                    addMessage('ai', 'はい、承知いたしました。インターネット接続を開始します。接続したい2.4GhzのSSIDを教えてください。');
                    window.currentInitialSetupStep = 'awaiting_ssid';
                }, 500);
            } else if (status === 'red') {
                addMessage('user', 'LEDが赤に点灯した');
                setTimeout(() => {
                    addMessage('ai', '設定に失敗しました。QRコードのスキャンに問題があったか、入力された情報に誤りがあった可能性があります。もう一度、新しい管理者暗証番号を12桁で入力してください。');
                    window.currentInitialSetupStep = 'awaiting_new_admin_pin';
                }, 500);
            }
        }

        // --- App Launch Simulation ---
        function simulateAppLaunch() {
            const appContainer = document.getElementById('app-container');
            const launchModal = document.getElementById('launch-face-id-modal');
            const scanIcon = document.getElementById('launch-face-id-scan-icon');
            const successIcon = document.getElementById('launch-face-id-success-icon');
            const statusText = document.getElementById('launch-face-id-status');
            
            // 1. Simulate scan
            setTimeout(() => {
                // 2. Show success state
                scanIcon.classList.add('hidden');
                successIcon.classList.remove('hidden');
                statusText.textContent = '認証成功';
                
                // 3. Hide modal and show app
                setTimeout(() => {
                    launchModal.style.opacity = '0';
                    launchModal.addEventListener('transitionend', () => {
                       launchModal.classList.add('hidden'); 
                    });
                    
                    appContainer.classList.remove('hidden');
                    appContainer.classList.add('flex');
                    switchView('main');
                }, 500); 
                
            }, 2000); 
        }

        // Event listener for send button click
        document.getElementById('send-button').addEventListener('click', () => handleSend());

        // Event listener for Enter key in input field
        document.getElementById('chat-input').addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                handleSend();
            }
        });

        // Event listener for options button (to toggle My Page)
        document.getElementById('options-button').addEventListener('click', () => switchView('myPage'));

        // Event listener for the global back button in the header
        document.getElementById('back-button').addEventListener('click', goBack);


        // Initial setup for the app when loaded
        window.onload = function() {
            simulateAppLaunch();
        };
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

// チャット欄からの入力フック
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


