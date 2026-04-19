// Mobile hamburger menu with focus trap

export function initMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileOverlay = document.getElementById('mobile-overlay');

    const mobileMenuLinks = mobileMenu.querySelectorAll('a');
    const firstMenuLink = mobileMenuLinks[0];
    const lastMenuLink = mobileMenuLinks[mobileMenuLinks.length - 1];

    function toggleMobileMenu() {
        const isActive = hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        mobileOverlay.classList.toggle('active');
        hamburger.setAttribute('aria-expanded', isActive);
        mobileMenu.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        document.body.style.overflow = isActive ? 'hidden' : '';

        if (isActive && firstMenuLink) {
            setTimeout(() => firstMenuLink.focus(), 100);
        }
    }

    function closeMobileMenu() {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
        mobileOverlay.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        hamburger.focus();
    }

    function isMenuActive() {
        return mobileMenu.classList.contains('active');
    }

    hamburger.addEventListener('click', toggleMobileMenu);
    mobileOverlay.addEventListener('click', closeMobileMenu);

    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Focus trap
    mobileMenu.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        if (e.shiftKey) {
            if (document.activeElement === firstMenuLink) {
                e.preventDefault();
                lastMenuLink.focus();
            }
        } else {
            if (document.activeElement === lastMenuLink) {
                e.preventDefault();
                firstMenuLink.focus();
            }
        }
    });

    return { closeMobileMenu, isMenuActive };
}
