// Exhibitions: load data, render cards, detail modal, photo lightbox

import { escapeHtml, sanitizeUrl, trapFocus } from '../../shared/utils.js';
import { trackEvent } from '../../shared/analytics.js';

let exhibitionsData = [];
let currentExhPhotoIndex = 0;
let currentExhGallery = [];
let exhDetailTrigger = null;
let exhDetailFocusTrapHandler = null;
let exhPhotoTrigger = null;
let exhPhotoFocusTrapHandler = null;

const fallbackExhibitions = [
    { id: "2025-12-aki", status: "past", title_pl: "Nihonga w Aki", title_en: "Nihonga at Aki", venue_pl: "Aki Restauracja Japo\u0144ska, Kielce", venue_en: "Aki Japanese Restaurant, Kielce", venue_link: "https://maps.app.goo.gl/LWca63u3hhcpX3yg6", date_start: "2025-12-09", date_end: "2025-12-09", date_display_en: "December 9, 2025", date_display_pl: "9 grudnia 2025", event_link: "https://www.facebook.com/events/1550008932787541/", hero: "Data/Exhibitions/9.12.2025/Aki 0.webp", gallery: ["Data/Exhibitions/9.12.2025/Aki 0.webp","Data/Exhibitions/9.12.2025/Aki 1.webp","Data/Exhibitions/9.12.2025/Aki 2.webp","Data/Exhibitions/9.12.2025/Aki 3.webp","Data/Exhibitions/9.12.2025/Aki 4.webp","Data/Exhibitions/9.12.2025/Aki 5.webp","Data/Exhibitions/9.12.2025/Aki 6.webp"] },
    { id: "2026-02-smolna", status: "past", title_pl: "Japonia \u2013 forma i do\u015bwiadczenie | Dagmara Ok\u0142a \u201eNihonga \u2013 w japo\u0144skim ogrodzie\u201d", title_en: "Japan \u2013 Form and Experience | Dagmara Ok\u0142a \u201cNihonga \u2013 Inside the Japanese Garden\u201d", venue_pl: "Galeria na Smolnej, Warszawa", venue_en: "Galeria na Smolnej, Warsaw", venue_link: "https://maps.app.goo.gl/WLxyPTH2UeunoX956", date_start: "2026-02-06", date_end: "2026-02-28", date_display_en: "February 6 \u2013 28, 2026", date_display_pl: "6 \u2013 28 lutego 2026", event_link: "https://www.facebook.com/events/906417675128074/", hero: "Data/Exhibitions/9.2.2026/Smolna 0.webp", gallery: ["Data/Exhibitions/9.2.2026/Smolna 0.webp","Data/Exhibitions/9.2.2026/Smolna 01.webp","Data/Exhibitions/9.2.2026/Smolna 02.webp","Data/Exhibitions/9.2.2026/Smolna 03.webp","Data/Exhibitions/9.2.2026/Smolna 5.webp","Data/Exhibitions/9.2.2026/Smolna 6.webp","Data/Exhibitions/9.2.2026/Smolna 8.webp","Data/Exhibitions/9.2.2026/Smolna 9.webp","Data/Exhibitions/9.2.2026/Smolna 10.webp","Data/Exhibitions/9.2.2026/Smolna 11.webp","Data/Exhibitions/9.2.2026/Smolna 40.webp","Data/Exhibitions/9.2.2026/Smolna 41.webp","Data/Exhibitions/9.2.2026/Smolna 42.webp","Data/Exhibitions/9.2.2026/Smolna 43.webp"] },
    { id: "2026-04-wojslawice", status: "current", title_pl: "Dagmara Ok\u0142a \u201eNihonga \u2013 w japo\u0144skim ogrodzie\u201d", title_en: "Dagmara Ok\u0142a \u201cNihonga \u2013 Inside the Japanese Garden\u201d", venue_pl: "Arboretum Wojs\u0142awice", venue_en: "Arboretum Wojs\u0142awice", venue_link: "https://maps.app.goo.gl/5yf1QaTn9PbN5wkB6", date_start: "2026-04-11", date_end: "2026-05-14", date_display_en: "April 11 \u2013 May 14, 2026", date_display_pl: "11 kwietnia \u2013 14 maja 2026", hero: "Data/Lightbox_new/Thumbnails/suiren-ichi.webp", gallery: [] },
    { id: "2026-05-siruwia", status: "upcoming", title_pl: "Dagmara Ok\u0142a \u201eNihonga \u2013 w japo\u0144skim ogrodzie\u201d", title_en: "Dagmara Ok\u0142a \u201cNihonga \u2013 Inside the Japanese Garden\u201d", venue_pl: "Ogr\u00f3d Japo\u0144ski Siruwia", venue_en: "Siruwia Japanese Garden", venue_link: "https://maps.app.goo.gl/3xq7LRYPpnrg4rgL9", date_start: "2026-05-01", date_end: "2026-05-03", date_display_en: "May 1 \u2013 3, 2026", date_display_pl: "1 \u2013 3 maja 2026", hero: "Data/Lightbox_new/Thumbnails/mokuren-ichi.webp", gallery: [] },
    { id: "2026-05-wroclaw", status: "upcoming", title_pl: "Dagmara Ok\u0142a \u201eNihonga \u2013 w japo\u0144skim ogrodzie\u201d", title_en: "Dagmara Ok\u0142a \u201cNihonga \u2013 Inside the Japanese Garden\u201d", venue_pl: "Muzeum Miejskie Wroc\u0142awia", venue_en: "Wroc\u0142aw City Museum", venue_link: "https://maps.app.goo.gl/E1oKPSK3X8S7c96F7", date_start: "2026-05-06", date_end: "2026-05-31", date_display_en: "May 6 \u2013 31, 2026", date_display_pl: "6 \u2013 31 maja 2026", hero: "Data/Lightbox_new/Thumbnails/yuri-ichi.webp", gallery: [] },
    { id: "2026-05-fama", status: "upcoming", title_pl: "Dagmara Ok\u0142a \u201eNihonga \u2013 w japo\u0144skim ogrodzie\u201d", title_en: "Dagmara Ok\u0142a \u201cNihonga \u2013 Inside the Japanese Garden\u201d", venue_pl: "Centrum Biblioteczno-Kulturalne FAMA", venue_en: "FAMA Library & Cultural Center", venue_link: "https://maps.app.goo.gl/ALdLZ9v2JCY3TfVRA", date_start: "2026-05-14", date_end: "2026-05-31", date_display_en: "May 14 \u2013 31, 2026", date_display_pl: "14 \u2013 31 maja 2026", hero: "Data/Lightbox_new/Thumbnails/tsubaki-ichi.webp", gallery: [] },
    { id: "2026-06-konskie", status: "upcoming", title_pl: "Dagmara Ok\u0142a \u201eNihonga \u2013 w japo\u0144skim ogrodzie\u201d", title_en: "Dagmara Ok\u0142a \u201cNihonga \u2013 Inside the Japanese Garden\u201d", venue_pl: "Koneckie Centrum Kultury", venue_en: "Ko\u0144skie Cultural Center", venue_link: "https://maps.app.goo.gl/eQzYBpQ5UE8CoeVY7", date_start: "2026-06-12", date_end: "2026-06-12", date_display_en: "June 12, 2026", date_display_pl: "12 czerwca 2026", hero: "Data/Lightbox_new/Thumbnails/kiku-ichi.webp", gallery: [] },
    { id: "2026-10-skarzysko", status: "upcoming", title_pl: "Dagmara Ok\u0142a \u201eNihonga \u2013 w japo\u0144skim ogrodzie\u201d", title_en: "Dagmara Ok\u0142a \u201cNihonga \u2013 Inside the Japanese Garden\u201d", venue_pl: "Miejskie Centrum Kultury w Skar\u017cysku-Kamiennej", venue_en: "Municipal Cultural Center in Skar\u017cysko-Kamienna", venue_link: "https://maps.app.goo.gl/SCN6G184J8B5PBxJ6", date_start: "2026-10-09", date_end: "2026-10-31", date_display_en: "October 9 \u2013 31, 2026", date_display_pl: "9 \u2013 31 pa\u017adziernika 2026", hero: "Data/Lightbox_new/Thumbnails/egonoki-ichi.webp", gallery: [] }
];

function computeExhibitionStatus(ex) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(ex.date_start + 'T00:00:00');
    const end = ex.date_end ? new Date(ex.date_end + 'T23:59:59') : start;
    if (today > end) return 'past';
    if (today >= start && today <= end) return 'current';
    return 'upcoming';
}

function getExhibitionYears() {
    const years = new Set();
    exhibitionsData.forEach(ex => {
        years.add(ex.date_start.substring(0, 4));
        if (ex.date_end) years.add(ex.date_end.substring(0, 4));
    });
    return Array.from(years).sort();
}

function getDefaultFilter() {
    const hasCurrent = exhibitionsData.some(ex => ex.status === 'current');
    if (hasCurrent) return 'current';
    const hasUpcoming = exhibitionsData.some(ex => ex.status === 'upcoming');
    if (hasUpcoming) return 'upcoming';
    return getExhibitionYears().pop() || '2026';
}

function renderYearNav(years, activeFilter, { getLang, translations }) {
    const nav = document.getElementById('exhibitions-year-nav');
    if (!nav) return;
    const t = translations[getLang()] || translations.en;

    const hasCurrent = exhibitionsData.some(ex => ex.status === 'current');
    const hasUpcoming = exhibitionsData.some(ex => ex.status === 'upcoming');

    let html = '';
    if (hasCurrent) {
        html += `<button class="exhibitions-year-btn${activeFilter === 'current' ? ' active' : ''}" data-year="current" aria-pressed="${activeFilter === 'current'}">${t['exhibitions.currentFilter'] || 'Current'}</button>`;
    }
    if (hasUpcoming) {
        html += `<button class="exhibitions-year-btn${activeFilter === 'upcoming' ? ' active' : ''}" data-year="upcoming" aria-pressed="${activeFilter === 'upcoming'}">${t['exhibitions.upcomingFilter'] || 'Upcoming'}</button>`;
    }
    years.forEach(y => {
        html += `<button class="exhibitions-year-btn${activeFilter === y ? ' active' : ''}" data-year="${y}" aria-pressed="${activeFilter === y}">${y}</button>`;
    });
    nav.innerHTML = html;
    nav.querySelectorAll('.exhibitions-year-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            trackEvent('exhibition_filter', { filter: btn.dataset.year });
            renderExhibitions(btn.dataset.year, { getLang, translations });
        });
    });
}

export function renderExhibitions(filterYear, { getLang, translations }) {
    if (!filterYear) filterYear = getDefaultFilter();
    const years = getExhibitionYears();
    renderYearNav(years, filterYear, { getLang, translations });

    const grid = document.getElementById('exhibitions-grid');
    if (!grid) return;

    const lang = getLang();
    const t = translations[lang] || translations.en;

    const sorted = [...exhibitionsData].sort((a, b) => {
        const statusOrder = { current: 0, upcoming: 1, past: 2 };
        const sa = statusOrder[a.status] ?? 1;
        const sb = statusOrder[b.status] ?? 1;
        if (sa !== sb) return sa - sb;
        if (a.status === 'past') return b.date_start.localeCompare(a.date_start);
        return a.date_start.localeCompare(b.date_start);
    });

    let filtered;
    if (filterYear === 'current') {
        filtered = sorted.filter(ex => ex.status === 'current');
    } else if (filterYear === 'upcoming') {
        filtered = sorted.filter(ex => ex.status === 'upcoming');
    } else {
        filtered = sorted.filter(ex => ex.date_start.startsWith(filterYear) || (ex.date_end && ex.date_end.startsWith(filterYear)));
    }

    const pinSvg = '<svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>';
    const arrowSvg = '<svg viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>';

    let html = '';
    filtered.forEach(ex => {
        const fullTitle = lang === 'pl' ? ex.title_pl : ex.title_en;
        const title = fullTitle.includes('|') ? fullTitle.split('|')[0].trim() : fullTitle;
        const venue = lang === 'pl' ? ex.venue_pl : ex.venue_en;
        const dateStr = lang === 'pl' ? ex.date_display_pl : ex.date_display_en;

        let badgeClass = 'badge-upcoming';
        let badgeText = t['exhibitions.upcoming'] || 'Upcoming';
        if (ex.status === 'past') { badgeClass = 'badge-past'; badgeText = t['exhibitions.past'] || 'Past'; }
        else if (ex.status === 'current') { badgeClass = 'badge-current'; badgeText = t['exhibitions.current'] || 'Now'; }

        const hasGallery = ex.gallery && ex.gallery.length > 0;
        const ctaText = hasGallery ? (t['exhibitions.viewDetails'] || 'View Details') : (t['exhibitions.learnMore'] || 'Learn More');

        const safeTitle = escapeHtml(title);
        const safeVenue = escapeHtml(venue);
        const safeDate = escapeHtml(dateStr);
        const safeHero = sanitizeUrl(ex.hero);
        const safeId = escapeHtml(ex.id);

        html += `
        <article class="exhibition-card" data-exh-id="${safeId}" tabindex="0" role="button" aria-label="${safeTitle} \u2013 ${safeVenue}">
            <div class="exhibition-card-hero">
                <img src="${safeHero}" alt="${safeTitle}" loading="lazy">
                <span class="exhibition-status-badge ${badgeClass}">${escapeHtml(badgeText)}</span>
            </div>
            <div class="exhibition-card-body">
                <div class="exhibition-card-date">${safeDate}</div>
                <div class="exhibition-card-title">${safeTitle}</div>
                <div class="exhibition-card-venue">${pinSvg}<span>${safeVenue}</span></div>
                <div class="exhibition-card-cta">${escapeHtml(ctaText)} ${arrowSvg}</div>
            </div>
        </article>`;
    });

    grid.innerHTML = html;

    grid.querySelectorAll('.exhibition-card').forEach(card => {
        const handler = () => openExhibitionDetail(card.dataset.exhId, { getLang, translations });
        card.addEventListener('click', handler);
        card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); } });
    });
}

function openExhibitionDetail(id, { getLang, translations }) {
    const ex = exhibitionsData.find(e => e.id === id);
    if (!ex) return;

    exhDetailTrigger = document.activeElement;
    const lang = getLang();
    const modal = document.getElementById('exhibition-detail-modal');
    const fullTitle = lang === 'pl' ? ex.title_pl : ex.title_en;
    const title = fullTitle.replace(' | ', '\n');
    const venue = lang === 'pl' ? ex.venue_pl : ex.venue_en;
    const dateStr = lang === 'pl' ? ex.date_display_pl : ex.date_display_en;

    document.getElementById('exh-detail-date').textContent = dateStr;
    document.getElementById('exh-detail-title').textContent = title;

    const venueEl = document.getElementById('exh-detail-venue');
    venueEl.textContent = '';
    if (ex.venue_link) {
        const venueLink = document.createElement('a');
        venueLink.href = sanitizeUrl(ex.venue_link);
        venueLink.target = '_blank';
        venueLink.rel = 'noopener noreferrer';
        venueLink.textContent = venue;
        venueLink.addEventListener('click', () => {
            trackEvent('exhibition_venue_click', { exhibition_id: id, venue });
        });
        venueEl.appendChild(venueLink);
    } else {
        venueEl.textContent = venue;
    }

    const eventLink = document.getElementById('exh-detail-link');
    if (ex.event_link) {
        eventLink.href = sanitizeUrl(ex.event_link);
        eventLink.style.display = 'inline-flex';
        eventLink.onclick = () => {
            trackEvent('exhibition_event_page_click', { exhibition_id: id, url: ex.event_link });
        };
    } else {
        eventLink.href = '#';
        eventLink.style.display = 'none';
        eventLink.onclick = null;
    }

    const gallerySection = document.getElementById('exh-detail-gallery-section');
    const galleryGrid = document.getElementById('exh-detail-gallery');
    const comingSoon = document.getElementById('exh-detail-coming-soon');
    const t = translations[lang] || translations.en;

    if (ex.gallery && ex.gallery.length > 0) {
        gallerySection.style.display = 'block';
        comingSoon.style.display = 'none';
        currentExhGallery = ex.gallery;
        let galleryHtml = '';
        ex.gallery.forEach((src, i) => {
            galleryHtml += `<button type="button" class="exhibition-gallery-thumb" data-photo-index="${i}" aria-label="View photo ${i + 1}"><img src="${sanitizeUrl(src)}" alt="Exhibition photo ${i + 1}" loading="lazy"></button>`;
        });
        galleryGrid.innerHTML = galleryHtml;
        galleryGrid.querySelectorAll('.exhibition-gallery-thumb').forEach(thumb => {
            thumb.addEventListener('click', () => {
                openExhibitionPhoto(parseInt(thumb.dataset.photoIndex));
            });
        });
    } else {
        gallerySection.style.display = 'none';
        currentExhGallery = [];
        comingSoon.style.display = 'block';
        document.getElementById('exh-coming-soon-text').textContent = t['exhibitions.comingSoon'] || 'More details coming soon!';
    }

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (exhDetailFocusTrapHandler) document.removeEventListener('keydown', exhDetailFocusTrapHandler);
    exhDetailFocusTrapHandler = trapFocus(modal);
    document.addEventListener('keydown', exhDetailFocusTrapHandler);

    const closeBtn = modal.querySelector('.exhibition-detail-close');
    if (closeBtn) closeBtn.focus();

    trackEvent('exhibition_view', { exhibition_id: id, exhibition_title: title });
}

export function closeExhibitionDetail() {
    const modal = document.getElementById('exhibition-detail-modal');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    if (exhDetailFocusTrapHandler) {
        document.removeEventListener('keydown', exhDetailFocusTrapHandler);
        exhDetailFocusTrapHandler = null;
    }
    if (exhDetailTrigger) { exhDetailTrigger.focus(); exhDetailTrigger = null; }
}

function openExhibitionPhoto(index) {
    if (currentExhGallery.length === 0) return;
    exhPhotoTrigger = document.activeElement;
    currentExhPhotoIndex = index;
    const lb = document.getElementById('exhibition-photo-lightbox');
    const img = document.getElementById('exhibition-photo-img');
    img.src = sanitizeUrl(currentExhGallery[index]);
    img.alt = `Exhibition photo ${index + 1}`;
    document.getElementById('exhibition-photo-counter').textContent = `${index + 1} / ${currentExhGallery.length}`;
    lb.classList.add('active');
    lb.setAttribute('aria-hidden', 'false');

    if (exhPhotoFocusTrapHandler) document.removeEventListener('keydown', exhPhotoFocusTrapHandler);
    exhPhotoFocusTrapHandler = trapFocus(lb);
    document.addEventListener('keydown', exhPhotoFocusTrapHandler);

    lb.querySelector('.exhibition-photo-close').focus();

    trackEvent('exhibition_photo_view', { photo_index: index + 1, total_photos: currentExhGallery.length });
}

export function closeExhibitionPhoto() {
    const lb = document.getElementById('exhibition-photo-lightbox');
    lb.classList.remove('active');
    lb.setAttribute('aria-hidden', 'true');

    if (exhPhotoFocusTrapHandler) {
        document.removeEventListener('keydown', exhPhotoFocusTrapHandler);
        exhPhotoFocusTrapHandler = null;
    }
    if (exhPhotoTrigger) { exhPhotoTrigger.focus(); exhPhotoTrigger = null; }
}

export function nextExhibitionPhoto() {
    openExhibitionPhoto((currentExhPhotoIndex + 1) % currentExhGallery.length);
}

export function prevExhibitionPhoto() {
    openExhibitionPhoto((currentExhPhotoIndex - 1 + currentExhGallery.length) % currentExhGallery.length);
}

export function isExhPhotoActive() {
    const lb = document.getElementById('exhibition-photo-lightbox');
    return lb && lb.classList.contains('active');
}

export function isExhDetailActive() {
    const modal = document.getElementById('exhibition-detail-modal');
    return modal && modal.classList.contains('active');
}

export async function loadExhibitions({ getLang, translations }) {
    try {
        const response = await fetch('Data/exhibitions.json');
        if (!response.ok) throw new Error('Failed to load');
        exhibitionsData = await response.json();
    } catch (e) {
        exhibitionsData = fallbackExhibitions;
    }
    exhibitionsData.forEach(ex => { ex.status = computeExhibitionStatus(ex); });
    renderExhibitions(null, { getLang, translations });

    // Wire modal events
    document.querySelector('.exhibition-detail-close').addEventListener('click', closeExhibitionDetail);
    document.getElementById('exhibition-detail-modal').addEventListener('click', e => {
        if (e.target.id === 'exhibition-detail-modal') closeExhibitionDetail();
    });

    document.querySelector('.exhibition-photo-close').addEventListener('click', closeExhibitionPhoto);
    document.querySelector('.exhibition-photo-nav.prev').addEventListener('click', prevExhibitionPhoto);
    document.querySelector('.exhibition-photo-nav.next').addEventListener('click', nextExhibitionPhoto);
    document.getElementById('exhibition-photo-lightbox').addEventListener('click', e => {
        if (e.target.id === 'exhibition-photo-lightbox') closeExhibitionPhoto();
    });
}
