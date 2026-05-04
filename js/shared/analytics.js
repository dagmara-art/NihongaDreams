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

export function trackEventAndNavigate(eventName, params = {}, url, timeoutMs = 500) {
    if (!url) {
        trackEvent(eventName, params);
        return;
    }

    let navigated = false;
    const navigate = () => {
        if (navigated) return;
        navigated = true;
        window.location.assign(url);
    };

    if (typeof gtag === 'function') {
        gtag('event', eventName, {
            ...params,
            event_callback: navigate,
            event_timeout: timeoutMs
        });
        window.setTimeout(navigate, timeoutMs);
        return;
    }

    navigate();
}
