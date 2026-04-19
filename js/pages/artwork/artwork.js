// Artwork page: data loading, rendering, and lightbox

import { escapeHtml, getEmail } from '../../shared/utils.js';
import { trackEvent, trackEventOnce } from '../../shared/analytics.js';
import { setupReservationForm } from './reservation.js';

let artwork = null;
let allArtworks = [];
let lightboxAC = null;

export function getArtwork() {
    return artwork;
}

export async function loadArtworks({ t, getLang }) {
    try {
        const response = await fetch('Data/artworks.json');
        if (!response.ok) throw new Error('Fetch failed');
        allArtworks = await response.json();
    } catch (err) {
        allArtworks = [];
    }

    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    const id = params.get('id');

    if (slug) {
        artwork = allArtworks.find(a => a.slug === slug);
    } else if (id) {
        artwork = allArtworks.find(a => a.id === id);
    }

    renderArtwork({ t, getLang });
}

export function renderArtwork({ t, getLang }) {
    const currentLang = getLang();
    const page = document.getElementById('artwork-page');

    if (!artwork) {
        page.innerHTML = `
            <div class="page-state">
                <h1>${t('page.notFoundTitle')}</h1>
                <p>${t('page.notFoundText')}</p>
                <a href="index.html#catalog">${t('page.backLink')}</a>
            </div>`;
        document.title = `${t('page.notFoundTitle')} \u2014 Dagmara Dreams of Nihonga`;
        return;
    }

    const art = artwork;
    document.title = `${art.title} \u2014 Dagmara Dreams of Nihonga`;

    const statusKey = (art.status || 'available').toLowerCase();
    const statusLabels = {
        available: t('artwork.statusAvailable'),
        reserved: t('artwork.statusReserved'),
        sold: t('artwork.statusSold')
    };

    const description = currentLang === 'pl' ? (art.descriptionPl || art.descriptionEn || '') : (art.descriptionEn || '');

    const priceText = (!art.priceDisplay || art.priceDisplay.trim() === '')
        ? t('artwork.priceOnRequest')
        : art.priceDisplay;

    let paperText = art.paper || '';
    if (paperText.startsWith('Japanese paper ')) {
        const paperName = paperText.replace('Japanese paper ', '');
        paperText = currentLang === 'pl' ? `Papier japo\u0144ski ${paperName}` : `Japanese paper ${paperName}`;
    }

    // Escape all data for XSS protection
    const safeArtTitle = escapeHtml(art.title);
    const safeArtSeries = escapeHtml(art.series);
    const safeArtFilename = escapeHtml(art.filename);
    const safeDescription = escapeHtml(description);
    const safePriceText = escapeHtml(priceText);
    const safePaperText = escapeHtml(paperText);
    const safeDimensions = escapeHtml(art.dimensions);
    const safeYear = escapeHtml(art.year);
    const safeStatusLabel = escapeHtml(statusLabels[statusKey] || statusLabels.available);

    let detailsHtml = `
        <span class="detail-label">${escapeHtml(t('artwork.dimensions'))}</span>
        <span class="detail-value">${safeDimensions}</span>`;

    if (paperText) {
        detailsHtml += `
        <span class="detail-label">${escapeHtml(t('artwork.paper'))}</span>
        <span class="detail-value">${safePaperText}</span>`;
    }

    if (art.year) {
        detailsHtml += `
        <span class="detail-label">${escapeHtml(t('artwork.year'))}</span>
        <span class="detail-value">${safeYear}</span>`;
    }

    // Reservation section
    let reservationHtml = '';

    if (statusKey === 'sold') {
        reservationHtml = `
            <div class="reservation-sold">
                <p>${t('reservation.soldTitle')}</p>
                <small>${t('reservation.soldText')}</small>
            </div>`;
    } else {
        const notice = statusKey === 'reserved'
            ? t('reservation.reservedNotice')
            : t('reservation.notice');

        const safeTitle = escapeHtml(art.title);
        const safeSlug = escapeHtml(art.slug || '');

        const formHtml = `
          <form class="reservation-form" id="reservation-form" novalidate>
            <input type="hidden" name="artworkTitle" value="${safeTitle}">
            <input type="hidden" name="artworkSlug" value="${safeSlug}">
            <input type="hidden" name="language" value="${currentLang}">
            <input type="hidden" name="_timestamp" value="">

            <div class="form-field">
              <label for="rf-name">${escapeHtml(t('form.name'))} <span class="required-mark">*</span></label>
              <input type="text" id="rf-name" name="name" required
                     placeholder="${escapeHtml(t('form.namePlaceholder'))}" autocomplete="name"
                     aria-describedby="rf-name-error">
              <span class="form-error-msg" id="rf-name-error" role="alert">${escapeHtml(t('form.required'))}</span>
            </div>

            <div class="form-field">
              <label for="rf-email">${escapeHtml(t('form.email'))} <span class="required-mark">*</span></label>
              <input type="email" id="rf-email" name="email" required
                     placeholder="${escapeHtml(t('form.emailPlaceholder'))}" autocomplete="email"
                     aria-describedby="rf-email-error">
              <span class="form-error-msg" id="rf-email-error" role="alert">${escapeHtml(t('form.invalidEmail'))}</span>
            </div>

            <div class="form-field">
              <label for="rf-phone">${escapeHtml(t('form.phone'))}</label>
              <input type="tel" id="rf-phone" name="phone"
                     placeholder="${escapeHtml(t('form.phonePlaceholder'))}" autocomplete="tel">
            </div>

            <div class="form-field">
              <label for="rf-message">${escapeHtml(t('form.message'))}</label>
              <textarea id="rf-message" name="message" rows="3"
                        placeholder="${escapeHtml(t('form.messagePlaceholder'))}"></textarea>
            </div>

            <!-- Honeypot - hidden from users and assistive tech -->
            <div class="form-hp" aria-hidden="true" inert>
              <label for="rf-website">Website</label>
              <input type="text" id="rf-website" name="website" autocomplete="off">
            </div>

            <div class="form-consent" id="form-consent-wrapper">
              <input type="checkbox" id="rf-consent" name="consent" required
                     aria-describedby="rf-consent-error">
              <label for="rf-consent">
                ${escapeHtml(t('form.consent'))}
                <a href="privacy.html">${escapeHtml(t('form.consentLink'))}</a>
              </label>
              <span class="form-error-msg" id="rf-consent-error" role="alert" style="display:none;">${escapeHtml(t('form.consentRequired'))}</span>
            </div>

            <button type="submit" class="form-submit-btn" id="form-submit-btn">${escapeHtml(t('form.submit'))}</button>

            <div class="form-status" id="form-status" role="status" aria-live="polite"></div>
          </form>`;

        trackEventOnce('reservation_form_loaded', {
            'artwork_title': art.title,
            'artwork_slug': art.slug || '',
            'artwork_status': statusKey,
            'language': currentLang
        });

        reservationHtml = `
            <p class="reservation-notice">${notice}</p>
            ${formHtml}
            <div class="privacy-note">
                ${escapeHtml(t('privacy.note'))} <a href="privacy.html">${escapeHtml(t('privacy.linkText'))}</a>.
            </div>
            <div class="fallback-contact">
                ${escapeHtml(t('fallback.text'))} <a href="mailto:${getEmail()}">${escapeHtml(t('fallback.linkText'))}</a>
            </div>`;
    }

    page.innerHTML = `
        <!-- Artwork header -->
        <div class="artwork-header">
            ${safeArtSeries ? `<div class="artwork-series">${safeArtSeries}</div>` : ''}
            <h1 class="artwork-title">${safeArtTitle}</h1>
            <span class="status-badge ${statusKey}">${safeStatusLabel}</span>
        </div>

        <!-- Image -->
        <div class="artwork-image-wrapper" id="artwork-image-trigger" role="button" tabindex="0" aria-label="${currentLang === 'pl' ? 'Kliknij aby powi\u0119kszy\u0107' : 'Click to enlarge'}">
            <img src="Data/Lightbox_new/Preview/${safeArtFilename}.webp"
                 alt="${safeArtTitle} \u2014 Nihonga painting"
                 id="artwork-main-image"
                 data-fullsrc="Data/Lightbox_new/Original/${safeArtFilename}.webp">
        </div>
        <div class="image-hint">${escapeHtml(t('artwork.tapToEnlarge'))}</div>

        <!-- Price -->
        <div class="artwork-price">
            ${safePriceText}
            ${(!art.priceDisplay || art.priceDisplay.trim() === '') ? '' : `<span class="artwork-price-note">${currentLang === 'pl' ? 'Cena zawiera certyfikat autentyczno\u015bci' : 'Price includes certificate of authenticity'}</span>`}
        </div>

        <!-- Details -->
        <div class="artwork-details">
            ${detailsHtml}
        </div>

        <!-- Description -->
        ${safeDescription ? `<p class="artwork-description">${safeDescription}</p>` : ''}

        <hr class="section-divider">

        <!-- Reservation -->
        <div class="reservation-section">
            <h2 class="reservation-title">${escapeHtml(t('reservation.title'))}</h2>
            ${reservationHtml}
        </div>
    `;

    // Re-attach listeners
    setupLightbox();
    setupReservationForm({ t, getLang, artwork });
    updateFooterText({ t, getLang });

    trackEventOnce('artwork_view', {
        'artwork_title': art.title,
        'artwork_slug': art.slug || '',
        'artwork_status': statusKey,
        'artwork_series': art.series || '',
        'language': currentLang,
        'referrer': document.referrer
    });
}

function setupLightbox() {
    if (lightboxAC) lightboxAC.abort();
    lightboxAC = new AbortController();
    const sig = { signal: lightboxAC.signal };

    const trigger = document.getElementById('artwork-image-trigger');
    const lightbox = document.getElementById('artwork-lightbox');
    const lightboxImg = document.getElementById('lightbox-full-image');
    const closeBtn = lightbox.querySelector('.artwork-lightbox-close');

    if (!trigger) return;

    function openLightbox() {
        const mainImg = document.getElementById('artwork-main-image');
        const fullSrc = mainImg.dataset.fullsrc || mainImg.src;
        lightboxImg.src = fullSrc;
        lightboxImg.alt = mainImg.alt;
        lightbox.classList.add('active');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        closeBtn.focus();
        if (artwork) {
            trackEvent('artwork_image_enlarge', {
                'artwork_title': artwork.title,
                'artwork_slug': artwork.slug || ''
            });
        }
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        trigger.focus();
    }

    trigger.addEventListener('click', openLightbox, sig);
    trigger.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openLightbox();
        }
    }, sig);

    closeBtn.addEventListener('click', closeLightbox, sig);
    lightbox.addEventListener('click', e => {
        if (e.target === lightbox) closeLightbox();
    }, sig);

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    }, sig);
}

function updateFooterText({ t, getLang }) {
    const link = document.getElementById('footer-privacy-link');
    if (link) link.textContent = t('footer.privacy');

    const backNav = document.getElementById('back-link');
    if (backNav) backNav.textContent = getLang() === 'pl' ? '\u2190 Powr\u00f3t do galerii' : '\u2190 Back to gallery';
}
