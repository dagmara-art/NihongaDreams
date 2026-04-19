// Shared analytics helpers wrapping Google Analytics gtag

const _firedOnce = {};

export function trackEvent(eventName, params = {}) {
    if (typeof gtag === 'function') {
        gtag('event', eventName, params);
    }
}

export function trackEventOnce(eventName, params = {}) {
    if (_firedOnce[eventName]) return;
    _firedOnce[eventName] = true;
    trackEvent(eventName, params);
}
