// Prevent right-click saving and drag of images

export function initImageProtection(selectors = []) {
    document.addEventListener('contextmenu', (e) => {
        if (e.target.tagName === 'IMG' || selectors.some(s => e.target.closest(s))) {
            e.preventDefault();
        }
    });

    document.addEventListener('dragstart', (e) => {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
        }
    });
}
