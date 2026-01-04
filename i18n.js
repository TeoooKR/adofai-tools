let translations = typeof TRANSLATIONS !== 'undefined' ? TRANSLATIONS : {};
let currentLang = localStorage.getItem('lang') || (navigator.language.startsWith('ko') ? 'ko' : 'en');

function initI18n() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.getAttribute('data-lang') === currentLang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    applyTranslations();
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    applyTranslations();

    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    if (typeof calculate === 'function') calculate();
    if (typeof updateSplitterPreview === 'function') updateSplitterPreview();
}

function getTranslation(key, params = {}) {
    const keys = key.split('.');
    let result = translations[currentLang];

    for (const k of keys) {
        if (result && result[k]) {
            result = result[k];
        } else {
            return key;
        }
    }

    Object.keys(params).forEach(p => {
        result = result.replace(`{${p}}`, params[p]);
    });

    return result;
}

function applyTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = getTranslation(key);

        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            if (el.placeholder) {
                const placeholderKey = el.getAttribute('data-i18n-placeholder');
                if (placeholderKey) {
                    el.placeholder = getTranslation(placeholderKey);
                }
            } else {
                el.value = translation;
            }
        } else if (el.tagName === 'SELECT') {
        } else {
            el.innerText = translation;
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = getTranslation(key);
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        el.title = getTranslation(key);
    });
}

window.t = getTranslation;

document.addEventListener('DOMContentLoaded', () => {
    initI18n();
});
