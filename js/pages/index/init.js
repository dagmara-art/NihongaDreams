// Index page entry point — wires all modules together

import { createI18n } from '../../shared/i18n.js';
import { trackEvent } from '../../shared/analytics.js';
import { getEmail } from '../../shared/utils.js';
import { initImageProtection } from '../../shared/image-protection.js';
import { ASSET_VERSION } from '../../shared/version.js';
import { translations } from './translations.js';
import { initMobileMenu } from './mobile-menu.js';
import { initScroll } from './scroll.js';
import { loadExhibitions, renderExhibitions, closeExhibitionDetail, closeExhibitionPhoto, nextExhibitionPhoto, prevExhibitionPhoto, isExhPhotoActive, isExhDetailActive } from './exhibitions.js';
import { initGallery, closeLightbox, showNext, showPrev, isLightboxActive } from './gallery.js';

// i18n setup
const i18n = createI18n({ translations });

// Context object passed to exhibitions and gallery
const ctx = { getLang: i18n.getLang, translations };

function applyTranslations(lang) {
    const dict = translations[lang] || translations.en;
    const currentYear = new Date().getFullYear();
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        let translation = dict[key];
        if (translation) {
            translation = translation.replace('{year}', currentYear);
            if (el.hasAttribute('data-i18n-html')) {
                el.innerHTML = translation;
            } else {
                el.textContent = translation;
            }
        }
    });
}

// Wire language change to update DOM and re-render exhibitions
i18n.setOnLanguageChange((lang) => {
    applyTranslations(lang);
    const activeYearBtn = document.querySelector('.exhibitions-year-btn.active');
    renderExhibitions(activeYearBtn ? activeYearBtn.dataset.year : null, ctx);
});

// Language toggle
const langToggle = document.getElementById('lang-toggle');
langToggle.addEventListener('click', () => {
    const oldLang = i18n.getLang();
    const newLang = oldLang === 'en' ? 'pl' : 'en';
    i18n.setLanguage(newLang, true);
    trackEvent('language_switch', {
        'from_language': oldLang,
        'to_language': newLang
    });
});

// initLanguage sets lang without calling onLanguageChange — translate manually.
i18n.initLanguage();
applyTranslations(i18n.getLang());

// Reveal animations via IntersectionObserver. rootMargin includes elements that
// are already on screen at load — they fire immediately. Top margin equal to
// viewport height covers initial-hash deep-links so reveals along the route
// don't sit hidden until the user scrolls.
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            revealObserver.unobserve(entry.target);
        }
    });
}, { rootMargin: '100% 0px -100px 0px', threshold: 0 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// Section view analytics
const trackedSections = new Set();
const sectionIds = ['hero', 'about', 'nihonga', 'exhibitions', 'catalog', 'contact'];
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.id;
            if (!trackedSections.has(id)) {
                trackedSections.add(id);
                trackEvent('section_view', { 'section': id });
            }
            sectionObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });
sectionIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) sectionObserver.observe(el);
});

// Mobile menu
const { closeMobileMenu, isMenuActive } = initMobileMenu();

// Scroll effects (navbar, parallax, depth tracking)
initScroll();

// Image protection
initImageProtection(['.gallery-item', '.lightbox-image-container']);

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#' || !href.startsWith('#')) return;
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Load exhibitions
loadExhibitions(ctx);

// Load gallery with lightbox
initGallery(ctx);

// Consolidated keyboard handler
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isMenuActive()) {
        closeMobileMenu();
        return;
    }

    if (isExhPhotoActive()) {
        if (e.key === 'Escape') closeExhibitionPhoto();
        if (e.key === 'ArrowRight') nextExhibitionPhoto();
        if (e.key === 'ArrowLeft') prevExhibitionPhoto();
        return;
    }

    if (isExhDetailActive()) {
        if (e.key === 'Escape') closeExhibitionDetail();
        return;
    }

    if (isLightboxActive()) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') showNext();
        if (e.key === 'ArrowLeft') showPrev();
    }
});

// Track CTA button clicks
document.querySelectorAll('.cta-button').forEach(btn => {
    btn.addEventListener('click', () => {
        const buttonText = btn.querySelector('[data-i18n]')?.textContent || btn.textContent.trim();
        trackEvent('cta_click', { 'button_text': buttonText, 'destination': btn.getAttribute('href') });
    });
});

// Track contact link clicks
document.querySelectorAll('.contact-item-link').forEach(link => {
    link.addEventListener('click', () => {
        const label = link.querySelector('.contact-label')?.textContent || 'unknown';
        trackEvent('contact_click', { 'contact_type': label, 'destination': link.getAttribute('href') });
    });
});

// Email obfuscation
(function () {
    const emailLink = document.getElementById('email-link');
    const emailDisplay = document.getElementById('email-display');
    if (emailLink && emailDisplay) {
        const assembled = getEmail();
        emailLink.href = 'mailto:' + assembled;
        emailDisplay.textContent = assembled;
    }
})();
