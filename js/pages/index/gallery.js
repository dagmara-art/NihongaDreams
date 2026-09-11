// Gallery: load artworks, render grid, lightbox with zoom/pan/swipe

import { trackEvent, trackEventAndNavigate } from '../../shared/analytics.js';
import { ASSET_VERSION } from '../../shared/version.js';
import { escapeHtml, trapFocus, makeBackgroundInert } from '../../shared/utils.js';

let artworks = [];
let currentIndex = 0;
let lastFocusedElement = null;
const prefetchedImages = new Set();

// Zoom/pan state
let zoomLevel = 1;
const minZoom = 1;
const maxZoom = 4;
let isDragging = false;
let wasDragging = false;
let startX = 0;
let startY = 0;
let translateX = 0;
let translateY = 0;

// DOM references (set in init)
let gallery, lightbox, lightboxImage, lightboxPlaceholder, lightboxContainer, lightboxLoader, lightboxSoldRibbon, closeBtn, prevBtn, nextBtn;
let lightboxCta, lightboxCtaButton;

function shouldShowSoldRibbon(artwork) {
    return (artwork?.status || '').toLowerCase() === 'sold';
}

function getDisplaySrc(artwork) {
    if (artwork.presentationFilename) {
        return `Data/Lightbox_new/Presentation/${artwork.presentationFilename}.webp`;
    }
    return `Data/Lightbox_new/Preview/${artwork.filename}.webp`;
}

function setLightboxImageSrc(src) {
    if (src && lightboxImage.getAttribute('src') !== src) {
        lightboxImage.src = src;
    }
}

function applyZoomTransform() {
    lightboxImage.style.transform = `scale(${zoomLevel}) translate(${translateX}px, ${translateY}px)`;
}

function enterZoom() {
    lightboxContainer.classList.add('zoomed');
    setLightboxImageSrc(lightboxImage.dataset.highres);
}

function exitZoom() {
    zoomLevel = 1;
    translateX = 0;
    translateY = 0;
    lightboxContainer.classList.remove('zoomed');
    setLightboxImageSrc(lightboxImage.dataset.displaySrc);
    applyZoomTransform();
}

function resetZoom() {
    isDragging = false;
    wasDragging = false;
    exitZoom();
}

function updateLightboxImage({ translations, getLang }) {
    const artwork = artworks[currentIndex];
    const displaySrc = getDisplaySrc(artwork);

    lightboxPlaceholder.src = `Data/Lightbox_new/Thumbnails/${artwork.filename}.webp`;
    lightboxPlaceholder.alt = artwork.title;
    lightboxPlaceholder.classList.remove('hidden');

    lightboxLoader.classList.add('active');
    lightboxImage.classList.remove('loaded');
    lightboxImage.classList.add('loading');

    lightboxImage.src = displaySrc;
    lightboxImage.alt = artwork.title;
    lightboxImage.dataset.displaySrc = displaySrc;
    lightboxImage.dataset.highres = `Data/Lightbox_new/Original/${artwork.filename}.webp`;

    document.getElementById('caption-title').textContent = artwork.title;
    document.getElementById('caption-dimensions').textContent = artwork.dimensions;

    let paperText = artwork.paper;
    if (artwork.paper.startsWith('Japanese paper ')) {
        const paperName = artwork.paper.replace('Japanese paper ', '');
        const currentLang = getLang();
        paperText = `${translations[currentLang]['lightbox.japanesePaper']} ${paperName}`;
    }
    document.getElementById('caption-paper').textContent = paperText;
    updateLightboxCta(artwork, { translations, getLang });
    lightboxContainer.classList.toggle('has-sold-ribbon', shouldShowSoldRibbon(artwork));
    lightboxContainer.classList.toggle('has-presentation-image', Boolean(artwork.presentationFilename));
    if (lightboxSoldRibbon) {
        lightboxSoldRibbon.hidden = !shouldShowSoldRibbon(artwork);
    }

    resetZoom();
}

function updateLightboxCta(artwork, { translations, getLang }) {
    if (!lightboxCta || !lightboxCtaButton) return;

    const statusKey = (artwork?.status || 'available').toLowerCase();
    const shouldShow = artwork && statusKey === 'available';

    if (!shouldShow) {
        lightboxCtaButton.href = '#';
        lightboxCtaButton.removeAttribute('aria-label');
        lightboxCta.hidden = true;
        return;
    }

    const detailParams = new URLSearchParams();
    if (artwork.slug) detailParams.set('slug', artwork.slug);
    else detailParams.set('id', artwork.id);
    detailParams.set('src', 'lightbox_cta');
    const href = `artwork.html?${detailParams.toString()}`;
    const currentLang = getLang();
    const activeTranslations = translations[currentLang] || translations.en;
    const ctaLabel = activeTranslations['lightbox.ctaButton']
        || translations.en['lightbox.ctaButton']
        || 'Make me yours';
    const ctaAria = (activeTranslations['lightbox.ctaAria']
        || translations.en['lightbox.ctaAria']
        || 'Open inquiry page for {title}').replace('{title}', artwork.title);

    lightboxCtaButton.href = href;
    lightboxCtaButton.textContent = ctaLabel;
    lightboxCtaButton.setAttribute('aria-label', ctaAria);
    lightboxCta.hidden = false;
}

function prefetchAdjacentImages() {
    if (artworks.length === 0) return;
    const prevIndex = (currentIndex - 1 + artworks.length) % artworks.length;
    const nextIndex = (currentIndex + 1) % artworks.length;

    [prevIndex, nextIndex].forEach(idx => {
        const src = `Data/Lightbox_new/Preview/${artworks[idx].filename}.webp`;
        if (!prefetchedImages.has(src)) {
            const img = new Image();
            img.src = src;
            prefetchedImages.add(src);
        }
    });
}

let _ctx; // stored context for showNext/showPrev
let lightboxFocusTrapHandler = null;
let restoreInert = null;

function openLightbox(index) {
    lastFocusedElement = document.activeElement;
    currentIndex = index;
    updateLightboxImage(_ctx);
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    restoreInert = makeBackgroundInert(lightbox);
    lightboxFocusTrapHandler = trapFocus(lightbox);
    document.addEventListener('keydown', lightboxFocusTrapHandler);

    setTimeout(() => closeBtn.focus(), 100);
    prefetchAdjacentImages();
    const artwork = artworks[index];
    if (artwork) {
        trackEvent('artwork_view', { 'artwork_id': artwork.id, 'artwork_title': artwork.title });
    }
}

export function closeLightbox() {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    resetZoom();
    document.body.style.overflow = '';

    if (lightboxFocusTrapHandler) {
        document.removeEventListener('keydown', lightboxFocusTrapHandler);
        lightboxFocusTrapHandler = null;
    }
    if (restoreInert) { restoreInert(); restoreInert = null; }

    if (lastFocusedElement) lastFocusedElement.focus();
}

export function showNext() {
    currentIndex = (currentIndex + 1) % artworks.length;
    updateLightboxImage(_ctx);
    prefetchAdjacentImages();
}

export function showPrev() {
    currentIndex = (currentIndex - 1 + artworks.length) % artworks.length;
    updateLightboxImage(_ctx);
    prefetchAdjacentImages();
}

export function isLightboxActive() {
    return lightbox.classList.contains('active');
}

function renderGallery() {
    gallery.innerHTML = artworks.map((artwork, index) => {
        const safeTitle = escapeHtml(artwork.title);
        const safeFilename = escapeHtml(artwork.filename);
        const safeSlug = encodeURIComponent(artwork.slug || '');
        return `
        <a class="gallery-item" href="artwork.html?slug=${safeSlug}" data-index="${index}" aria-label="View ${safeTitle}">
            <img src="Data/Lightbox_new/Thumbnails/${safeFilename}.webp" alt="${safeTitle} - Nihonga painting" loading="lazy">
            <div class="gallery-item-overlay" aria-hidden="true">
                <span class="gallery-item-title">${safeTitle}</span>
            </div>
        </a>`;
    }).join('');

    setupGalleryEvents();
    setupImageLoading();
}

function setupImageLoading() {
    const galleryImages = document.querySelectorAll('.gallery-item img');
    galleryImages.forEach(img => {
        if (img.complete && img.naturalHeight !== 0) {
            img.classList.add('loaded');
            img.parentElement.classList.add('loaded');
        } else {
            img.addEventListener('load', function () {
                this.classList.add('loaded');
                this.parentElement.classList.add('loaded');
            });
            img.addEventListener('error', function () {
                this.closest('.gallery-item').style.display = 'none';
            });
        }
    });
}

function setupGalleryEvents() {
    document.querySelectorAll('.gallery-item').forEach((item) => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            openLightbox(parseInt(item.dataset.index));
        });
    });
}

export async function initGallery({ translations, getLang }) {
    _ctx = { translations, getLang };

    gallery = document.getElementById('gallery');
    lightbox = document.getElementById('lightbox');
    lightboxImage = document.getElementById('lightbox-image');
    lightboxPlaceholder = document.getElementById('lightbox-placeholder');
    lightboxContainer = document.getElementById('lightbox-container');
    lightboxLoader = document.getElementById('lightbox-loader');
    lightboxSoldRibbon = document.getElementById('lightbox-sold-ribbon');
    closeBtn = document.querySelector('.lightbox-close');
    prevBtn = document.querySelector('.lightbox-prev');
    nextBtn = document.querySelector('.lightbox-next');
    lightboxCta = document.getElementById('lightbox-cta');
    lightboxCtaButton = document.getElementById('lightbox-cta-button');

    // Load artworks. On failure, render an empty gallery — onerror on each
    // <img> hides individual missing thumbnails.
    try {
        const response = await fetch(`Data/artworks.json?v=${ASSET_VERSION}`);
        if (!response.ok) throw new Error('Fetch failed');
        artworks = await response.json();
    } catch (error) {
        artworks = [];
    }

    renderGallery();

    // Lightbox image load handler
    lightboxImage.addEventListener('load', () => {
        lightboxLoader.classList.remove('active');
        lightboxImage.classList.remove('loading');
        lightboxImage.classList.add('loaded');
        lightboxPlaceholder.classList.add('hidden');
    });

    // Toggle zoom on container click
    lightboxContainer.addEventListener('click', (e) => {
        if (wasDragging) return;
        if (e.target === lightboxContainer || e.target === lightboxImage || e.target === lightboxPlaceholder) {
            if (zoomLevel === 1) {
                zoomLevel = 2;
                translateX = 0;
                translateY = 0;
                enterZoom();
                applyZoomTransform();
            } else {
                exitZoom();
            }
        }
    });

    // Scroll wheel zoom
    lightboxContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            zoomLevel = Math.min(maxZoom, zoomLevel + 0.25);
        } else {
            zoomLevel = Math.max(minZoom, zoomLevel - 0.25);
        }
        if (zoomLevel > 1) {
            enterZoom();
            applyZoomTransform();
        } else {
            exitZoom();
        }
    }, { passive: false });

    // Mouse drag for panning
    let dragStartX = 0;
    let dragStartY = 0;

    lightboxContainer.addEventListener('mousedown', (e) => {
        if (zoomLevel > 1 && (e.target === lightboxImage || e.target === lightboxContainer)) {
            isDragging = true;
            wasDragging = false;
            dragStartX = e.clientX - translateX;
            dragStartY = e.clientY - translateY;
            lightboxContainer.style.cursor = 'grabbing';
            e.preventDefault();
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        wasDragging = true;
        translateX = e.clientX - dragStartX;
        translateY = e.clientY - dragStartY;
        applyZoomTransform();
    });

    // Click-after-drag suppression: explicit one-shot capture-phase listener
    // consumes the synthetic click that follows the mouseup, instead of
    // relying on a 10ms timer race.
    document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        lightboxContainer.style.cursor = 'grab';
        if (wasDragging) {
            const swallow = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
            lightboxContainer.addEventListener('click', swallow, { capture: true, once: true });
            // Reset on next frame so the next genuine click is treated normally.
            requestAnimationFrame(() => { wasDragging = false; });
        }
    });

    // Touch swipe and pan
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let isTouchPanning = false;
    let touchDragStartX = 0;
    let touchDragStartY = 0;
    const swipeThreshold = 50;

    lightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        if (zoomLevel > 1) {
            isTouchPanning = true;
            touchDragStartX = touchStartX - translateX;
            touchDragStartY = touchStartY - translateY;
        }
    }, { passive: true });

    lightbox.addEventListener('touchmove', (e) => {
        if (zoomLevel > 1 && isTouchPanning) {
            const currentX = e.changedTouches[0].screenX;
            const currentY = e.changedTouches[0].screenY;
            translateX = currentX - touchDragStartX;
            translateY = currentY - touchDragStartY;
            applyZoomTransform();
        }
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        if (zoomLevel === 1) {
            const swipeDistance = touchEndX - touchStartX;
            if (Math.abs(swipeDistance) >= swipeThreshold) {
                if (swipeDistance > 0) showPrev();
                else showNext();
            }
        }
        isTouchPanning = false;
    }, { passive: true });

    // Button event listeners
    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', showPrev);
    nextBtn.addEventListener('click', showNext);

    if (lightboxCtaButton) {
        lightboxCtaButton.addEventListener('click', (e) => {
            const artwork = artworks[currentIndex];
            if (!artwork) return;

            const isModifiedClick = e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
            const eventParams = {
                'artwork_slug': artwork.slug || '',
                'artwork_title': artwork.title,
                'artwork_status': (artwork.status || 'available').toLowerCase(),
                'language': _ctx?.getLang?.() || 'en',
                'source_page': 'index_lightbox'
            };

            if (isModifiedClick) {
                trackEvent('lightbox_cta_click', eventParams);
                return;
            }

            e.preventDefault();
            trackEventAndNavigate('lightbox_cta_click', eventParams, lightboxCtaButton.href);
        });
    }

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
}
