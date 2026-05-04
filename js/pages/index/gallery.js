// Gallery: load artworks, render grid, lightbox with zoom/pan/swipe

import { trackEvent, trackEventAndNavigate } from '../../shared/analytics.js';

const fallbackArtworks = [
    { id: "01", slug: "mokuren-ichi", filename: "mokuren-ichi", title: "Mokuren \u4e00 Ichi", dimensions: "40 \u00d7 30 cm", paper: "Japanese paper Torinoko Gampi", priceDisplay: "1 500 PLN", currency: "PLN", status: "sold", year: "", series: "Mokuren" },
    { id: "02", slug: "mokuren-ni", filename: "mokuren-ni", title: "Mokuren \u4e8c Ni", dimensions: "40 \u00d7 30 cm", paper: "Japanese paper Torinoko Gampi", priceDisplay: "1 500 PLN", currency: "PLN", status: "available", year: "", series: "Mokuren" },
    { id: "03", slug: "mokuren-san", filename: "mokuren-san", title: "Mokuren \u4e09 San", dimensions: "40 \u00d7 30 cm", paper: "Japanese paper Torinoko Gampi", priceDisplay: "1 500 PLN", currency: "PLN", status: "sold", year: "", series: "Mokuren" },
    { id: "04", slug: "mokuren-ju", filename: "mokuren-ju", title: "Mokuren \u5341 J\u016b", dimensions: "87 \u00d7 60 cm", paper: "Japanese paper Kumohada-mashi", priceDisplay: "8 000 PLN", currency: "PLN", status: "available", year: "", series: "Mokuren" },
    { id: "05", slug: "mokuren-go", filename: "mokuren-go", title: "Mokuren \u4e94 Go", dimensions: "87 \u00d7 60 cm", paper: "Japanese paper Shiromashi", priceDisplay: "7 000 PLN", currency: "PLN", status: "available", year: "", series: "Mokuren" },
    { id: "06", slug: "mokuren-roku", filename: "mokuren-roku", title: "Mokuren \u516d Roku", dimensions: "50 \u00d7 20 cm", paper: "Japanese paper Mitsumata Torinoko", priceDisplay: "1 500 PLN", currency: "PLN", status: "available", year: "", series: "Mokuren" },
    { id: "07", slug: "mokuren-shichi", filename: "mokuren-shichi", title: "Mokuren \u4e03 Shichi", dimensions: "50 \u00d7 20 cm", paper: "Japanese paper Mitsumata Torinoko", priceDisplay: "1 500 PLN", currency: "PLN", status: "available", year: "", series: "Mokuren" },
    { id: "08", slug: "mokuren-hachi", filename: "mokuren-hachi", title: "Mokuren \u516b Hachi", dimensions: "50 \u00d7 20 cm", paper: "Japanese paper Mitsumata Torinoko", priceDisplay: "1 500 PLN", currency: "PLN", status: "available", year: "", series: "Mokuren" },
    { id: "09", slug: "sakura-ichi", filename: "sakura-ichi", title: "Sakura \u4e00 Ichi", dimensions: "93 \u00d7 63 cm", paper: "Japanese paper Tosa-washi", priceDisplay: "7 000 PLN", currency: "PLN", status: "available", year: "", series: "Sakura" },
    { id: "10", slug: "sakura-ni", filename: "sakura-ni", title: "Sakura \u4e8c Ni", dimensions: "93 \u00d7 63 cm", paper: "Japanese paper Tosa-washi", priceDisplay: "7 000 PLN", currency: "PLN", status: "available", year: "", series: "Sakura" },
    { id: "11", slug: "sakura-san", filename: "sakura-san", title: "Sakura \u4e09 San", dimensions: "93 \u00d7 63 cm", paper: "Japanese paper Tosa-washi", priceDisplay: "7 000 PLN", currency: "PLN", status: "available", year: "", series: "Sakura" },
    { id: "12", slug: "kiku-ichi", filename: "kiku-ichi", title: "Kiku \u4e00 Ichi", dimensions: "87 \u00d7 60 cm", paper: "Japanese paper Kumohada-mashi", priceDisplay: "7 000 PLN", currency: "PLN", status: "available", year: "", series: "Kiku" },
    { id: "13", slug: "kiku-ni", filename: "kiku-ni", title: "Kiku \u4e8c Ni", dimensions: "87 \u00d7 60 cm", paper: "Japanese paper Kumohada-mashi", priceDisplay: "7 000 PLN", currency: "PLN", status: "available", year: "", series: "Kiku" },
    { id: "14", slug: "tsubaki-ichi", filename: "tsubaki-ichi", title: "Tsubaki \u4e00 Ichi", dimensions: "42 \u00d7 30 cm", paper: "Japanese paper Kumohada-mashi", priceDisplay: "1 500 PLN", currency: "PLN", status: "available", year: "", series: "Tsubaki" },
    { id: "15", slug: "tsubaki-ni", filename: "tsubaki-ni", title: "Tsubaki \u4e8c Ni", dimensions: "42 \u00d7 30 cm", paper: "Japanese paper Shiromashi", priceDisplay: "1 500 PLN", currency: "PLN", status: "available", year: "", series: "Tsubaki" },
    { id: "16", slug: "tsubaki-san", filename: "tsubaki-san", title: "Tsubaki \u4e09 San", dimensions: "87 \u00d7 60 cm", paper: "Japanese paper Kumohada-mashi", priceDisplay: "7 000 PLN", currency: "PLN", status: "available", year: "", series: "Tsubaki" },
    { id: "17", slug: "tsubaki-yon", filename: "tsubaki-yon", title: "Tsubaki \u56db Yon", dimensions: "21 \u00d7 15 cm", paper: "Japanese paper Shiromashi", priceDisplay: "", currency: "PLN", status: "available", year: "", series: "Tsubaki" },
    { id: "18", slug: "yuri-ichi", filename: "yuri-ichi", title: "Yuri \u4e00 Ichi", dimensions: "87 \u00d7 60 cm", paper: "Japanese paper Shiromashi", priceDisplay: "7 000 PLN", currency: "PLN", status: "available", year: "", series: "Yuri" },
    { id: "19", slug: "egonoki-ichi", filename: "egonoki-ichi", title: "Egonoki \u4e00 Ichi", dimensions: "40 \u00d7 30 cm", paper: "Japanese paper Kumohada-mashi", priceDisplay: "1 500 PLN", currency: "PLN", status: "available", year: "", series: "Egonoki" },
    { id: "20", slug: "suiren-ichi", filename: "suiren-ichi", title: "Suiren \u4e00 Ichi", dimensions: "40 \u00d7 30 cm", paper: "Japanese paper Torinoko Gampi", priceDisplay: "1 500 PLN", currency: "PLN", status: "available", year: "", series: "Suiren" },
    { id: "21", slug: "suiren-ni", filename: "suiren-ni", title: "Suiren \u4e8c Ni", dimensions: "42 \u00d7 30 cm", paper: "Japanese paper Torinoko Gampi", priceDisplay: "1 500 PLN", currency: "PLN", status: "available", year: "", series: "Suiren" },
    { id: "22", slug: "suiren-san", filename: "suiren-san", title: "Suiren \u4e09 San", dimensions: "40 \u00d7 30 cm", paper: "Japanese paper Torinoko Gampi", priceDisplay: "1 500 PLN", currency: "PLN", status: "available", year: "", series: "Suiren" },
    { id: "23", slug: "ayame-ichi", filename: "ayame-ichi", title: "Ayame \u4e00 Ichi", dimensions: "40 \u00d7 30 cm", paper: "Japanese paper Kumohada-mashi", priceDisplay: "", currency: "PLN", status: "sold", year: "", series: "Ayame" },
    { id: "24", slug: "suiren-roku", filename: "suiren-roku", title: "Suiren \u516d Roku", dimensions: "40 \u00d7 30 cm", paper: "Japanese paper Kumohada-mashi", priceDisplay: "2 000 PLN", currency: "PLN", status: "available", year: "", series: "Suiren" },
    { id: "25", slug: "suiren-go", filename: "suiren-go", title: "Suiren \u4e94 Go", dimensions: "42 \u00d7 30 cm", paper: "Japanese paper Torinoko Gampi", priceDisplay: "1 500 PLN", currency: "PLN", status: "available", year: "", series: "Suiren" },
    { id: "26", slug: "yuri-ni", filename: "yuri-ni", title: "Yuri \u4e8c Ni", dimensions: "87 \u00d7 60 cm", paper: "Japanese paper Shiromashi", priceDisplay: "7 000 PLN", currency: "PLN", status: "available", year: "", series: "Yuri" },
    { id: "27", slug: "shidare-1", filename: "shidare-1", title: "Shidare 1", dimensions: "50 \u00d7 50 cm", paper: "Japanese paper Kumohada-mashi", priceDisplay: "2 500 PLN", currency: "PLN", status: "sold", year: "", series: "Shidare" },
    { id: "28", slug: "shidare-2", filename: "shidare-2", title: "Shidare 2", dimensions: "50 \u00d7 50 cm", paper: "Japanese paper Kumohada-mashi", priceDisplay: "2 500 PLN", currency: "PLN", status: "available", year: "", series: "Shidare" },
    { id: "29", slug: "shidare-3", filename: "shidare-3", title: "Shidare 3", dimensions: "50 \u00d7 50 cm", paper: "Japanese paper Kumohada-mashi", priceDisplay: "2 500 PLN", currency: "PLN", status: "available", year: "", series: "Shidare" },
    { id: "30", slug: "shidare-5", filename: "shidare-5", title: "Shidare 5", dimensions: "50 \u00d7 50 cm", paper: "Japanese paper Tosa-washi", priceDisplay: "2 500 PLN", currency: "PLN", status: "available", year: "", series: "Shidare" },
    { id: "31", slug: "mokuren-11", filename: "mokuren-11", title: "Mokuren 11 \u5341\u4e00\u756a", dimensions: "100 \u00d7 50 cm", paper: "Japanese paper Torinoko", priceDisplay: "6 000 PLN", currency: "PLN", status: "available", year: "", series: "Mokuren" },
    { id: "32", slug: "mokuren-12", filename: "mokuren-12", title: "Mokuren 12 \u5341\u4e8c\u756a", dimensions: "100 \u00d7 50 cm", paper: "Japanese paper Torinoko", priceDisplay: "6 000 PLN", currency: "PLN", status: "available", year: "", series: "Mokuren" },
    { id: "33", slug: "mokuren-13", filename: "mokuren-13", title: "Mokuren 13 \u5341\u4e09\u756a", dimensions: "100 \u00d7 50 cm", paper: "Japanese paper Torinoko", priceDisplay: "6 000 PLN", currency: "PLN", status: "available", year: "", series: "Mokuren" },
    { id: "34", slug: "ayame-2", filename: "ayame-2", title: "Ayame 2 \u4e8c\u756a", dimensions: "100 \u00d7 50 cm", paper: "Japanese paper Torinoko", priceDisplay: "6 000 PLN", currency: "PLN", status: "available", year: "", series: "Ayame" },
    { id: "35", slug: "ayame-3", filename: "ayame-3", title: "Ayame 3 \u4e09\u756a", dimensions: "100 \u00d7 50 cm", paper: "Japanese paper Torinoko", priceDisplay: "6 000 PLN", currency: "PLN", status: "available", year: "", series: "Ayame" },
    { id: "36", slug: "ayame-5", filename: "ayame-5", title: "Ayame 5 \u4e94\u756a", dimensions: "100 \u00d7 50 cm", paper: "Japanese paper Torinoko", priceDisplay: "6 000 PLN", currency: "PLN", status: "available", year: "", series: "Ayame" },
    { id: "37", slug: "hanafubuki-1", filename: "hanafubuki-1", title: "Hanafubuki 1 \u4e00\u756a", dimensions: "140 \u00d7 100 cm", paper: "Japanese paper Torinoko", priceDisplay: "10 000 PLN", currency: "PLN", status: "available", year: "", series: "Hanafubuki" },
    { id: "38", slug: "hanafubuki-2", filename: "hanafubuki-2", title: "Hanafubuki 2 \u4e8c\u756a", dimensions: "140 \u00d7 100 cm", paper: "Japanese paper Torinoko", priceDisplay: "10 000 PLN", currency: "PLN", status: "available", year: "", series: "Hanafubuki" },
    { id: "39", slug: "hanafubuki-3", filename: "hanafubuki-3", title: "Hanafubuki 3 \u4e09\u756a", dimensions: "140 \u00d7 100 cm", paper: "Japanese paper Torinoko", priceDisplay: "10 000 PLN", currency: "PLN", status: "available", year: "", series: "Hanafubuki" },
    { id: "40", slug: "hanafubuki-5", filename: "hanafubuki-5", title: "Hanafubuki 5 \u4e94\u756a", dimensions: "140 \u00d7 100 cm", paper: "Japanese paper Torinoko", priceDisplay: "10 000 PLN", currency: "PLN", status: "available", year: "", series: "Hanafubuki" },
    { id: "41", slug: "hanafubuki-6", filename: "hanafubuki-6", title: "Hanafubuki 6 \u516d\u756a", dimensions: "140 \u00d7 100 cm", paper: "Japanese paper Torinoko", priceDisplay: "10 000 PLN", currency: "PLN", status: "available", year: "", series: "Hanafubuki" },
    { id: "42", slug: "tsubaki-5", filename: "tsubaki-5", title: "Tsubaki 5 \u4e94\u756a", dimensions: "42 \u00d7 30 cm", paper: "Japanese paper Torinoko", priceDisplay: "1 500 PLN", currency: "PLN", status: "available", year: "", series: "Tsubaki" },
    { id: "43", slug: "tsubaki-6", filename: "tsubaki-6", title: "Tsubaki 6 \u516d\u756a", dimensions: "42 \u00d7 30 cm", paper: "Japanese paper Torinoko", priceDisplay: "1 500 PLN", currency: "PLN", status: "available", year: "", series: "Tsubaki" },
    { id: "44", slug: "tsubaki-7", filename: "tsubaki-7", title: "Tsubaki 7 \u4e03\u756a", dimensions: "42 \u00d7 30 cm", paper: "Japanese paper Torinoko", priceDisplay: "1 500 PLN", currency: "PLN", status: "available", year: "", series: "Tsubaki" },
    { id: "45", slug: "kohaku-1", filename: "kohaku-1", title: "Kohaku 1 \u4e00\u756a", dimensions: "100 \u00d7 140 cm", paper: "Japanese paper Torinoko", priceDisplay: "10 000 PLN", currency: "PLN", status: "available", year: "", series: "Kohaku" },
    { id: "46", slug: "kohaku-2", filename: "kohaku-2", title: "Kohaku 2 \u4e8c\u756a", dimensions: "100 \u00d7 140 cm", paper: "Japanese paper Torinoko", priceDisplay: "10 000 PLN", currency: "PLN", status: "available", year: "", series: "Kohaku" },
    { id: "47", slug: "kiku-3", filename: "kiku-3", title: "Kiku 3 \u4e09\u756a", dimensions: "100 \u00d7 50 cm", paper: "Japanese paper Kumohada-mashi", priceDisplay: "6 000 PLN", currency: "PLN", status: "available", year: "", series: "Kiku" },
    { id: "48", slug: "kiku-5", filename: "kiku-5", title: "Kiku 5 \u4e94\u756a", dimensions: "100 \u00d7 50 cm", paper: "Japanese paper Kumohada-mashi", priceDisplay: "6 000 PLN", currency: "PLN", status: "available", year: "", series: "Kiku" },
    { id: "49", slug: "kiku-6", filename: "kiku-6", title: "Kiku 6 \u516d\u756a", dimensions: "100 \u00d7 50 cm", paper: "Japanese paper Kumohada-mashi", priceDisplay: "6 000 PLN", currency: "PLN", status: "available", year: "", series: "Kiku" }
];

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
let gallery, lightbox, lightboxImage, lightboxPlaceholder, lightboxContainer, lightboxLoader, closeBtn, prevBtn, nextBtn;
let lightboxCta, lightboxCtaButton;

function resetZoom() {
    zoomLevel = 1;
    translateX = 0;
    translateY = 0;
    isDragging = false;
    lightboxContainer.classList.remove('zoomed');
    lightboxImage.style.transform = 'scale(1) translate(0px, 0px)';
}

function updateLightboxImage({ translations, getLang }) {
    const artwork = artworks[currentIndex];

    lightboxPlaceholder.src = `Data/Lightbox_new/Thumbnails/${artwork.filename}.webp`;
    lightboxPlaceholder.alt = artwork.title;
    lightboxPlaceholder.classList.remove('hidden');

    lightboxLoader.classList.add('active');
    lightboxImage.classList.remove('loaded');
    lightboxImage.classList.add('loading');

    lightboxImage.src = `Data/Lightbox_new/Preview/${artwork.filename}.webp`;
    lightboxImage.alt = artwork.title;
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

function openLightbox(index) {
    lastFocusedElement = document.activeElement;
    currentIndex = index;
    updateLightboxImage(_ctx);
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
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
    gallery.innerHTML = artworks.map((artwork, index) => `
        <a class="gallery-item" href="artwork.html?slug=${encodeURIComponent(artwork.slug)}" data-index="${index}" role="listitem" aria-label="View ${artwork.title}">
            <img src="Data/Lightbox_new/Thumbnails/${artwork.filename}.webp" alt="${artwork.title} - Nihonga painting" loading="lazy">
            <div class="gallery-item-overlay" aria-hidden="true">
                <span class="gallery-item-title">${artwork.title}</span>
            </div>
        </a>
    `).join('');

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
    closeBtn = document.querySelector('.lightbox-close');
    prevBtn = document.querySelector('.lightbox-prev');
    nextBtn = document.querySelector('.lightbox-next');
    lightboxCta = document.getElementById('lightbox-cta');
    lightboxCtaButton = document.getElementById('lightbox-cta-button');

    // Load artworks
    try {
        const response = await fetch('Data/artworks.json?v=lightbox-cta-live-1');
        if (!response.ok) throw new Error('Fetch failed');
        artworks = await response.json();
    } catch (error) {
        artworks = fallbackArtworks;
    }

    // Only show artworks whose thumbnails exist
    const checks = artworks.map(a =>
        fetch(`Data/Lightbox_new/Thumbnails/${a.filename}.webp`, { method: 'HEAD' })
            .then(r => r.ok)
            .catch(() => false)
    );
    const hasImage = await Promise.all(checks);
    artworks = artworks.filter((_, i) => hasImage[i]);

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
                lightboxContainer.classList.add('zoomed');
                const highresSrc = lightboxImage.dataset.highres;
                if (highresSrc && lightboxImage.src !== highresSrc) {
                    lightboxImage.src = highresSrc;
                }
            } else {
                zoomLevel = 1;
                translateX = 0;
                translateY = 0;
                lightboxContainer.classList.remove('zoomed');
            }
            lightboxImage.style.transform = `scale(${zoomLevel}) translate(${translateX}px, ${translateY}px)`;
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
            lightboxContainer.classList.add('zoomed');
            const highresSrc = lightboxImage.dataset.highres;
            if (highresSrc && lightboxImage.src !== highresSrc) {
                lightboxImage.src = highresSrc;
            }
        } else {
            lightboxContainer.classList.remove('zoomed');
            translateX = 0;
            translateY = 0;
        }
        lightboxImage.style.transform = `scale(${zoomLevel}) translate(${translateX}px, ${translateY}px)`;
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
        lightboxImage.style.transform = `scale(${zoomLevel}) translate(${translateX}px, ${translateY}px)`;
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            lightboxContainer.style.cursor = 'grab';
            setTimeout(() => { wasDragging = false; }, 10);
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
            lightboxImage.style.transform = `scale(${zoomLevel}) translate(${translateX}px, ${translateY}px)`;
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
