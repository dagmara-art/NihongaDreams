// Shared utility functions

const htmlEscapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => htmlEscapeMap[c]);
}

export function sanitizeUrl(url) {
    if (!url) return '#';
    const value = String(url).trim();
    if (/^javascript:/i.test(value) || /^data:/i.test(value) || /^vbscript:/i.test(value) || /^file:/i.test(value)) return '#';
    // Same-document relative paths (e.g. "Data/foo.webp", "#section") pass through
    // without protocol parsing — they resolve relative to whatever origin serves the page.
    if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value) && !value.startsWith('//')) return value;
    try {
        const parsed = new URL(value, window.location.href);
        if (['http:', 'https:', 'mailto:'].includes(parsed.protocol)) return value;
    } catch (e) { /* invalid URL */ }
    return '#';
}

export function getEmail() {
    const parts = ['dagmaraokla', '.', 'art', '@', 'gmail', '.', 'com'];
    return parts.join('');
}

// Mark every direct child of <body> except `dialogEl` as inert + aria-hidden,
// so screen readers and Tab navigation stay inside the open dialog.
// Returns a function that restores the previous state.
export function makeBackgroundInert(dialogEl) {
    const restorers = [];
    Array.from(document.body.children).forEach(child => {
        if (child === dialogEl) return;
        if (child.tagName === 'SCRIPT' || child.tagName === 'STYLE') return;
        const hadInert = child.hasAttribute('inert');
        const prevAriaHidden = child.getAttribute('aria-hidden');
        child.setAttribute('inert', '');
        child.setAttribute('aria-hidden', 'true');
        restorers.push(() => {
            if (!hadInert) child.removeAttribute('inert');
            if (prevAriaHidden === null) child.removeAttribute('aria-hidden');
            else child.setAttribute('aria-hidden', prevAriaHidden);
        });
    });
    return () => restorers.forEach(fn => fn());
}

export function trapFocus(container) {
    return function (e) {
        if (e.key !== 'Tab') return;
        const focusable = container.querySelectorAll(
            'a[href]:not([style*="display:none"]):not([style*="display: none"]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
            if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
            if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    };
}
