// Artwork page entry point

import { createI18n } from '../../shared/i18n.js';
import { trackEvent } from '../../shared/analytics.js';
import { initImageProtection } from '../../shared/image-protection.js';
import { translations } from './translations.js';
import { loadArtworks, renderArtwork, getArtwork } from './artwork.js';

// Initialize i18n
const i18n = createI18n({ translations });

// Wire language change to re-render artwork
i18n.setOnLanguageChange(() => {
    renderArtwork({ t: i18n.t, getLang: i18n.getLang });
});

// Language toggle
document.getElementById('lang-toggle').addEventListener('click', () => {
    const oldLang = i18n.getLang();
    const newLang = oldLang === 'en' ? 'pl' : 'en';
    trackEvent('language_switch', {
        'from_language': oldLang,
        'to_language': newLang,
        'page': 'artwork',
        'artwork_title': getArtwork() ? getArtwork().title : ''
    });
    i18n.setLanguage(newLang);
});

// Image protection
initImageProtection(['.artwork-image-wrapper', '.artwork-lightbox']);

// Boot
i18n.initLanguage();
loadArtworks({ t: i18n.t, getLang: i18n.getLang });
