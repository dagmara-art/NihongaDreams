// Index page entry point — wires all modules together

import { createI18n } from '../../shared/i18n.js';
import { trackEvent } from '../../shared/analytics.js';
import { getEmail } from '../../shared/utils.js';
import { initImageProtection } from '../../shared/image-protection.js';
import { translations } from './translations.js?v=lightbox-cta-live-1';
import { initMobileMenu } from './mobile-menu.js';
import { initScroll } from './scroll.js';
import { loadExhibitions, renderExhibitions, closeExhibitionDetail, closeExhibitionPhoto, nextExhibitionPhoto, prevExhibitionPhoto, isExhPhotoActive, isExhDetailActive } from './exhibitions.js';
import { initGallery, closeLightbox, showNext, showPrev, isLightboxActive } from './gallery.js?v=lightbox-cta-live-1';

// i18n setup
const i18n = createI18n({ translations });

// Context object passed to exhibitions and gallery
const ctx = { getLang: i18n.getLang, translations };

// Wire language change to update DOM and re-render exhibitions
i18n.setOnLanguageChange((lang) => {
    // Update all translatable elements
    const currentYear = new Date().getFullYear();
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        let translation = translations[lang][key];
        if (translation) {
            translation = translation.replace('{year}', currentYear);
            if (el.hasAttribute('data-i18n-html')) {
                el.innerHTML = translation;
            } else {
                el.textContent = translation;
            }
        }
    });

    // Re-render exhibitions with new language
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

// Initialize language (triggers setLanguage -> onLanguageChange -> DOM update)
i18n.initLanguage();
// Run initial DOM translation since initLanguage sets lang without calling onLanguageChange for default 'en'
const initialLang = i18n.getLang();
const currentYear = new Date().getFullYear();
document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    let translation = translations[initialLang][key];
    if (translation) {
        translation = translation.replace('{year}', currentYear);
        if (el.hasAttribute('data-i18n-html')) {
            el.innerHTML = translation;
        } else {
            el.textContent = translation;
        }
    }
});

// Reveal animations via IntersectionObserver
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            revealObserver.unobserve(entry.target);
        }
    });
}, { rootMargin: '0px 0px -100px 0px', threshold: 0 });

function activateVisibleReveals() {
    const scrollY = window.scrollY;
    const viewportBottom = scrollY + window.innerHeight;
    document.querySelectorAll('.reveal:not(.active)').forEach(el => {
        const elTop = el.getBoundingClientRect().top + scrollY;
        if (elTop < viewportBottom + 100) {
            el.classList.add('active');
            revealObserver.unobserve(el);
        } else {
            revealObserver.observe(el);
        }
    });
}

activateVisibleReveals();
setTimeout(activateVisibleReveals, 100);
if (window.location.hash) {
    setTimeout(activateVisibleReveals, 400);
    setTimeout(activateVisibleReveals, 800);
}

window.addEventListener('hashchange', () => {
    setTimeout(activateVisibleReveals, 100);
    setTimeout(activateVisibleReveals, 500);
});

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
