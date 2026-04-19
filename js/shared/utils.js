// Shared utility functions

const htmlEscapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => htmlEscapeMap[c]);
}

export function sanitizeUrl(url) {
    if (!url) return '#';
    const value = String(url).trim();
    if (/^javascript:/i.test(value) || /^data:/i.test(value) || /^vbscript:/i.test(value)) return '#';
    // Allow same-document relative paths so local file:// previews can load images.
    if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value) && !value.startsWith('//')) return value;
    try {
        const parsed = new URL(value, window.location.href);
        if (['http:', 'https:', 'mailto:', 'file:'].includes(parsed.protocol)) return value;
    } catch (e) { /* invalid URL */ }
    return '#';
}

export function getEmail() {
    const parts = ['dagmaraokla', '.', 'art', '@', 'gmail', '.', 'com'];
    return parts.join('');
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
