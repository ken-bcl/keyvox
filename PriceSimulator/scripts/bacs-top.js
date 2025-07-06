/* ==========================================
   bacs-top.js – JS for BACS Top
   Author: Ken Okamoto
   Last updated: 2025-07-05
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    // === Language Switcher ===
    let currentLang = localStorage.getItem('lang') 
        || ((navigator.language || navigator.userLanguage).startsWith('en') ? 'en' : 'ja');

    const updateUI = (lang) => {
        document.documentElement.lang = lang;
        currentLang = lang;
        localStorage.setItem('lang', lang);

        if (typeof i18n === 'undefined') {
            console.error('i18n dictionary not loaded. Make sure dic-signup.js is loaded correctly.');
            return;
        }

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (i18n[key] && i18n[key][lang]) {
                if (el.tagName === 'TITLE') {
                    el.textContent = i18n[key][lang];
                } else {
                    el.innerHTML = i18n[key][lang];
                }
            }
        });

        document.querySelectorAll('[data-i18n-href]').forEach(el => {
            const key = el.getAttribute('data-i18n-href');
            if (i18n[key] && i18n[key][lang]) {
                el.href = i18n[key][lang];
            }
        });

        // Highlight active language in dropdown
        document.querySelectorAll('#language-dropdown a[data-lang]').forEach(link => {
            link.classList.toggle('active', link.dataset.lang === currentLang);
        });
    };
    
    // === Language Dropdown Logic ===
    const langSwitcher = document.getElementById('language-switcher');
    const langToggle = document.getElementById('language-toggle');
    const langDropdown = document.getElementById('language-dropdown');

    const toggleLangDropdown = (show) => {
        if (show) {
            langDropdown.classList.remove('hidden');
            setTimeout(() => langDropdown.classList.remove('opacity-0', 'scale-95'), 10);
        } else {
            langDropdown.classList.add('opacity-0', 'scale-95');
            setTimeout(() => langDropdown.classList.add('hidden'), 200);
        }
    };
    
    langToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleLangDropdown(langDropdown.classList.contains('hidden'));
    });

    document.addEventListener('click', (e) => {
        if (!langSwitcher.contains(e.target)) {
            toggleLangDropdown(false);
        }
    });

    langDropdown.addEventListener('click', (e) => {
        e.preventDefault();
        const target = e.target.closest('a');
        if (target && target.dataset.lang) {
            updateUI(target.dataset.lang);
            toggleLangDropdown(false);
        }
    });

    // === Modal Dialog Logic ===
    const authErrorModal = document.getElementById('autherror-modal');
    const modalContent = authErrorModal.querySelector('.modal-content');
    const closeModalButton = document.getElementById('close-modal-button');
    const closeModalButtonX = document.getElementById('close-modal-button-x');

    const showModal = () => {
        authErrorModal.classList.remove('hidden');
        setTimeout(() => {
            modalContent.classList.remove('opacity-0', 'scale-95');
        }, 10);
    };

    const hideModal = () => {
        modalContent.classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
            authErrorModal.classList.add('hidden');
        }, 200);
    };

    closeModalButton.addEventListener('click', hideModal);
    closeModalButtonX.addEventListener('click', hideModal);
    authErrorModal.addEventListener('click', (e) => {
        if (e.target === authErrorModal) {
            hideModal();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !authErrorModal.classList.contains('hidden')) {
            hideModal();
        }
    });

    // === Initialization ===
    updateUI(currentLang);
    
    if (window.location.hash === '#autherror') {
        showModal();
    }
});
