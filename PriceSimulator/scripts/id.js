document.addEventListener('DOMContentLoaded', () => {
    // === 言語設定の初期化 ===
    let currentLang = localStorage.getItem('lang') || ((navigator.language || navigator.userLanguage).startsWith('en') ? 'en' : 'ja');
    const hash = window.location.hash.toLowerCase();
    if (hash === '#en') currentLang = 'en';
    else if (hash === '#jp' || hash === '#ja') currentLang = 'ja';

    // === DOM要素の取得 ===
    const loginView = document.getElementById('login-view');
    const signupView = document.getElementById('signup-view');
    const forgotPasswordModal = document.getElementById('forgot-password-modal');
    const forgotPasswordModalContent = forgotPasswordModal.querySelector('div');
    const langToggle = document.getElementById('language-toggle');
    const langDropdown = document.getElementById('language-dropdown');
    const phoneBtn = document.getElementById('login-method-phone');
    const accountBtn = document.getElementById('login-method-account');
    const fieldContainer = document.getElementById('login-field-container');
    
    // --- メッセージ表示用の要素 ---
    const signupSuccessMessage = document.getElementById('signup-success-message');
    const resetSuccessMessage = document.getElementById('reset-success-message');
    const sendCodeSignupButton = document.getElementById('send-code-signup');
    const sendCodeResetButton = document.getElementById('send-code-reset');


    // === i18n（国際化）関連の関数 ===
    const getI18nText = (key) => {
        if (typeof i18n !== 'undefined' && i18n[key] && i18n[key][currentLang]) {
            return i18n[key][currentLang];
        }
        if (key) console.warn(`i18n key not found: ${key} for lang: ${currentLang}`);
        return '';
    };

    // 選択された言語を太字にするための関数を追加
    const updateLanguageSwitcherStyle = (lang) => {
        if (!langDropdown) return;
        const links = langDropdown.querySelectorAll('a[data-lang]');
        links.forEach(link => {
            if (link.dataset.lang === lang) {
                link.classList.add('font-bold', 'text-primary-blue');
                link.classList.remove('text-gray-700');
            } else {
                link.classList.remove('font-bold', 'text-primary-blue');
                link.classList.add('text-gray-700');
            }
        });
    };

    const updateUI = (lang) => {
        document.documentElement.lang = lang;
        currentLang = lang;
        localStorage.setItem('lang', lang);

        document.querySelectorAll('[data-i18n]').forEach(el => {
            el.innerHTML = getI18nText(el.getAttribute('data-i18n'));
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            el.placeholder = getI18nText(el.getAttribute('data-i18n-placeholder'));
        });
        
        // 言語スイッチャーのスタイルを更新
        updateLanguageSwitcherStyle(lang);
        validateAllForms();
    };

    // === 言語スイッチャーのロジック ===
    const toggleLangDropdown = (show) => {
        if (show) {
            langDropdown.classList.remove('hidden');
            setTimeout(() => langDropdown.classList.remove('opacity-0', 'scale-95'), 10);
        } else {
            langDropdown.classList.add('opacity-0', 'scale-95');
            setTimeout(() => langDropdown.classList.add('hidden'), 200);
        }
    };
    langToggle?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleLangDropdown(langDropdown.classList.contains('hidden'));
    });
    document.addEventListener('click', (e) => {
        if (langToggle && !langToggle.parentElement.contains(e.target)) {
            toggleLangDropdown(false);
        }
    });
    langDropdown?.addEventListener('click', (e) => {
        e.preventDefault();
        const target = e.target.closest('a');
        if (target?.dataset.lang) {
            updateUI(target.dataset.lang);
            toggleLangDropdown(false);
        }
    });

    // === モーダルとビューの表示切り替え ===
    const openModal = (modal, content) => {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            content.classList.remove('scale-95');
        }, 10);
    };
    const closeModal = (modal, content) => {
        modal.classList.add('opacity-0');
        content.classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    };
    const showView = (viewToShow) => {
        loginView.classList.add('hidden');
        signupView.classList.add('hidden');
        viewToShow.classList.remove('hidden');
        viewToShow.classList.add('flex');
    };

    document.getElementById('go-to-signup-page')?.addEventListener('click', (e) => { e.preventDefault(); showView(signupView); });
    document.getElementById('go-to-login')?.addEventListener('click', (e) => { e.preventDefault(); showView(loginView); });
    document.getElementById('go-to-forgot-password')?.addEventListener('click', (e) => { e.preventDefault(); openModal(forgotPasswordModal, forgotPasswordModalContent); });
    document.getElementById('close-forgot-password-modal')?.addEventListener('click', () => closeModal(forgotPasswordModal, forgotPasswordModalContent));
    forgotPasswordModal?.addEventListener('click', (e) => { if (e.target === forgotPasswordModal) closeModal(forgotPasswordModal, forgotPasswordModalContent); });

    // === バリデーションロジック ===
    const updateError = (inputElement, messageKey) => {
        const wrapper = inputElement.closest('.input-wrapper');
        if (!wrapper) return;
        const errorDiv = wrapper.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.textContent = messageKey ? getI18nText(messageKey) : '';
            inputElement.classList.toggle('border-red-500', !!messageKey);
        }
    };

    const forms = {
        login: {
            fields: {
                'login-identifier': {
                    rules: [
                        { test: (val) => val.trim() !== '', key: () => phoneBtn.classList.contains('active') ? 'validationPhoneRequired' : 'validationUsernameRequired' },
                        { test: (val) => !phoneBtn.classList.contains('active') || /^[0-9]+$/.test(val), key: 'validationPhoneNumeric' }
                    ]
                },
                'login-password': {
                    rules: [{ test: (val) => val.trim() !== '', key: 'validationPasswordRequired' }]
                }
            },
            button: 'login-submit-button'
        },
        signup: {
            fields: {
                'signup-phone': {
                    rules: [
                        { test: (val) => val.trim() !== '', key: 'validationPhoneRequired' },
                        { test: (val) => /^[0-9]+$/.test(val), key: 'validationPhoneNumeric' }
                    ]
                },
                'signup-verify-code': {
                    rules: [{ test: (val) => val.trim() !== '', key: 'validationCodeRequired' }]
                },
                'signup-password-field': {
                    rules: [{ test: (val) => val.trim() !== '', key: 'validationPasswordRequired' }]
                },
                'signup-password-confirm': {
                    rules: [
                        { test: (val) => val.trim() !== '', key: 'validationPasswordConfirmRequired' },
                        { test: (val) => val === document.getElementById('signup-password-field').value, key: 'validationPasswordMismatch' }
                    ]
                }
            },
            buttons: {
                'send-code-signup': ['signup-phone', 'signup-recaptcha'],
                'submit-signup': ['signup-phone', 'signup-recaptcha', 'signup-verify-code', 'signup-password-field', 'signup-password-confirm']
            }
        },
        'forgot-password': {
            fields: {
                'reset-phone': {
                    rules: [
                        { test: (val) => val.trim() !== '', key: 'validationPhoneRequired' },
                        { test: (val) => /^[0-9]+$/.test(val), key: 'validationPhoneNumeric' }
                    ]
                },
                'reset-verify-code': {
                    rules: [{ test: (val) => val.trim() !== '', key: 'validationCodeRequired' }]
                },
                'password-reset-field': {
                    rules: [{ test: (val) => val.trim() !== '', key: 'validationPasswordRequired' }]
                },
                'password-reset-confirm': {
                    rules: [
                        { test: (val) => val.trim() !== '', key: 'validationPasswordConfirmRequired' },
                        { test: (val) => val === document.getElementById('password-reset-field').value, key: 'validationPasswordMismatch' }
                    ]
                }
            },
            buttons: {
                'send-code-reset': ['reset-phone', 'reset-recaptcha'],
                'submit-reset-password': ['reset-phone', 'reset-recaptcha', 'reset-verify-code', 'password-reset-field', 'password-reset-confirm']
            }
        }
    };

    const validateForm = (formName) => {
        const formConfig = forms[formName];
        if (!formConfig) return;

        let isFormCompletelyValid = true;
        for (const id in formConfig.fields) {
            const input = document.getElementById(id);
            if (!input) continue;

            const config = formConfig.fields[id];
            let isFieldValid = true;
            let errorKey = '';
            for (const rule of config.rules) {
                if (!rule.test(input.value, input)) {
                    errorKey = typeof rule.key === 'function' ? rule.key() : rule.key;
                    isFieldValid = false;
                    break;
                }
            }
            if (input.dataset.touched === 'true') {
                updateError(input, errorKey);
            }
            if (!isFieldValid) isFormCompletelyValid = false;
        }
        
        if (formConfig.button) {
            const button = document.getElementById(formConfig.button);
            if(button) button.disabled = !isFormCompletelyValid;
        } else if (formConfig.buttons) {
            for (const buttonId in formConfig.buttons) {
                const button = document.getElementById(buttonId);
                if (!button) continue;
                const requiredFieldIds = formConfig.buttons[buttonId];
                let areFieldsValidForButton = true;
                for (const fieldId of requiredFieldIds) {
                    const fieldInput = document.getElementById(fieldId);
                    if (!fieldInput) {
                        areFieldsValidForButton = false;
                        break;
                    }
                    if (fieldInput.type === 'checkbox') {
                        if (!fieldInput.checked) areFieldsValidForButton = false;
                    } else {
                        const fieldConf = forms[formName].fields[fieldId];
                        if (fieldConf) {
                           for (const rule of fieldConf.rules) {
                                if (!rule.test(fieldInput.value, fieldInput)) {
                                    areFieldsValidForButton = false;
                                    break;
                                }
                            }
                        } else {
                           areFieldsValidForButton = false;
                        }
                    }
                    if (!areFieldsValidForButton) break;
                }
                button.disabled = !areFieldsValidForButton;
            }
        }
    };

    const validateAllForms = () => {
        validateForm('login');
        validateForm('signup');
        validateForm('forgot-password');
    };

    const setupValidationForInput = (input) => {
        const form = input.closest('form');
        if (!form || input.dataset.validationAttached) return;

        const formName = form.id.replace('-form', '');
        if (!forms[formName]) return;

        const handleValidation = () => validateForm(formName);

        const onFocusOut = () => {
            if (!input.dataset.touched) {
                input.dataset.touched = 'true';
            }
            handleValidation();
        };

        const onInput = () => {
            // ▼▼▼ このロジックを修正 ▼▼▼
            const isLoginPasswordField = formName === 'login' && input.id === 'login-password';
            const isPasswordFieldInSignup = formName === 'signup' && (input.id === 'signup-password-field' || input.id === 'signup-password-confirm');
            const isPasswordFieldInReset = formName === 'forgot-password' && (input.id === 'password-reset-field' || input.id === 'password-reset-confirm');

            if (input.dataset.touched === 'true' || isLoginPasswordField || isPasswordFieldInSignup || isPasswordFieldInReset) {
                handleValidation();
            }
            // ▲▲▲ 修正はここまで ▲▲▲
        };

        if (input.type === 'checkbox' || input.tagName === 'SELECT') {
            input.addEventListener('change', handleValidation);
        } else {
            input.addEventListener('focusout', onFocusOut);
            input.addEventListener('input', onInput);
        }
        input.dataset.validationAttached = 'true';
    };

    function switchLoginMethod(method) {
        phoneBtn.classList.toggle('active', method === 'phone');
        accountBtn.classList.toggle('active', method !== 'phone');
        
        const html = method === 'phone' ? `
            <label for="login-identifier" class="block text-sm font-bold text-gray-700 mb-2" data-i18n="loginMethodPhone"></label>
            <div class="flex">
                <select id="login-phone-country" class="custom-select pl-3 pr-10 py-3 text-base bg-gray-50 border border-r-0 border-gray-300 rounded-l-md focus:outline-none focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/25 transition" required>
                    <option data-i18n="countryJapan"></option><option data-i18n="countryUS"></option><option data-i18n="countryUK"></option>
                </select>
                <input type="tel" id="login-identifier" name="identifier" inputmode="numeric" class="w-full px-4 py-3 text-base border border-gray-300 rounded-r-md focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/25 transition" data-i18n-placeholder="phonePlaceholder" required>
            </div>
            <p class="text-xs text-gray-500 mt-2" data-i18n="phoneInputNote"></p>
            <div class="error-message"></div>`
            : `
            <label for="login-identifier" class="block text-sm font-bold text-gray-700 mb-2" data-i18n="loginMethodUsername"></label>
            <input type="text" id="login-identifier" name="identifier" class="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/25 transition" data-i18n-placeholder="usernamePlaceholder" required>
            <div class="error-message"></div>`;
        
        fieldContainer.innerHTML = html;
        document.querySelectorAll('#login-field-container input, #login-field-container select').forEach(setupValidationForInput);
        updateUI(currentLang);
        validateForm('login');
    }
    phoneBtn?.addEventListener('click', () => switchLoginMethod('phone'));
    accountBtn?.addEventListener('click', () => switchLoginMethod('account'));
    
    const showTemporarySuccessMessage = (messageElement, messageKey) => {
        if (!messageElement) return;
        messageElement.innerHTML = getI18nText(messageKey);
        messageElement.classList.remove('hidden');
        setTimeout(() => {
            messageElement.classList.add('hidden');
        }, 4000);
    };

    sendCodeSignupButton?.addEventListener('click', () => {
        showTemporarySuccessMessage(signupSuccessMessage, 'resetSuccessMessage');
    });

    sendCodeResetButton?.addEventListener('click', () => {
        showTemporarySuccessMessage(resetSuccessMessage, 'resetSuccessMessage');
    });

    function handleFormSubmit(formId, redirectUrl) {
        const form = document.getElementById(formId);
        form?.addEventListener('submit', function(e) {
            e.preventDefault();
            document.getElementById('loading-overlay').classList.remove('hidden');
            setTimeout(() => { 
                if (redirectUrl === '#') {
                    closeModal(forgotPasswordModal, forgotPasswordModalContent);
                    document.getElementById('loading-overlay').classList.add('hidden');
                } else {
                    window.location.href = redirectUrl; 
                }
            }, 1200);
        });
    }
    handleFormSubmit('login-form', 'index.html#autherror');
    handleFormSubmit('signup-form', 'keyvox-ps.html#step3');
    handleFormSubmit('forgot-password-form', '#');

    // === 初期化処理 ===
    updateUI(currentLang);
    switchLoginMethod('phone'); 
    showView((window.location.hash.includes('signup')) ? signupView : loginView);
    document.querySelectorAll('form input, form select').forEach(setupValidationForInput);
    validateAllForms();

    // === トラッキング: ソーシャルログイン・ログイン方法切替 ===
    // ソーシャルログインボタン（Google, Appleなど）クリックイベントのトラッキング
    document.querySelectorAll('.form-panel > div.flex.justify-between > button').forEach(button => {
      button.addEventListener('click', () => {
        const provider = button.textContent.trim().toLowerCase();
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'social_login_click',
          provider: provider,
        });
      });
    });

    // ログイン方法切替ボタンのトラッキング
    document.getElementById('login-method-phone')?.addEventListener('click', () => {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'login_method_select',
        method: 'phone',
      });
    });

    document.getElementById('login-method-account')?.addEventListener('click', () => {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'login_method_select',
        method: 'account',
      });
    });
});
