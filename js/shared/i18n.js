// Shared i18n factory — each page creates its own instance with its translations

export function createI18n({ translations }) {
    let currentLang = 'en';

    // Mutable callback — wired by the page's init after all modules are ready
    let onLanguageChange = null;

    function t(key) {
        return (translations[currentLang] && translations[currentLang][key]) || translations.en[key] || key;
    }

    function getLang() {
        return currentLang;
    }

    function updateLangToggle() {
        document.querySelectorAll('.lang-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.lang === currentLang);
        });
    }

    function initLanguage() {
        const saved = localStorage.getItem('lang');
        if (saved && translations[saved]) {
            currentLang = saved;
        } else {
            const browserLang = (navigator.language || '').toLowerCase();
            if (browserLang.startsWith('pl')) {
                currentLang = 'pl';
            }
        }
        document.documentElement.lang = currentLang;
        updateLangToggle();
    }

    function setLanguage(lang, savePreference = true) {
        currentLang = lang;
        if (savePreference) {
            localStorage.setItem('lang', lang);
        }
        document.documentElement.lang = lang;
        updateLangToggle();
        if (onLanguageChange) {
            onLanguageChange(lang);
        }
    }

    function setOnLanguageChange(fn) {
        onLanguageChange = fn;
    }

    return { t, getLang, setLanguage, initLanguage, updateLangToggle, setOnLanguageChange };
}
