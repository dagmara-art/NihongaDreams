// Navbar scroll effect, parallax backgrounds, scroll depth analytics

import { trackEvent } from '../../shared/analytics.js';

export function initScroll() {
    const navbar = document.getElementById('navbar');
    const bgImages = Array.from(document.querySelectorAll('.bg-image'));
    const mobileMediaQuery = window.matchMedia('(max-width: 768px)');
    let ticking = false;
    let maxScrollDepth = 0;
    let viewportHeight = window.innerHeight;
    let docScrollHeight = document.body.scrollHeight;

    // Per-frame layout reads cause jank. Cache section geometry and
    // recompute only on resize / orientation change / load.
    let sectionGeom = [];
    function recomputeGeometry() {
        viewportHeight = window.innerHeight;
        docScrollHeight = document.body.scrollHeight;
        sectionGeom = bgImages.map(bg => {
            const section = bg.parentElement;
            return { bg, top: section.offsetTop, height: section.offsetHeight };
        });
    }
    recomputeGeometry();

    function handleScroll() {
        const scrollY = window.scrollY;

        navbar.classList.toggle('scrolled', scrollY > 100);

        if (!mobileMediaQuery.matches) {
            for (const g of sectionGeom) {
                if (scrollY >= g.top - viewportHeight && scrollY <= g.top + g.height) {
                    g.bg.style.transform = `translateY(${(scrollY - g.top) * 0.3}px) scale(1.1)`;
                }
            }
        }

        const denom = docScrollHeight - viewportHeight;
        if (denom > 0) {
            const scrollPercent = Math.round((scrollY / denom) * 100);
            for (const milestone of [25, 50, 75, 100]) {
                if (scrollPercent >= milestone && maxScrollDepth < milestone) {
                    maxScrollDepth = milestone;
                    trackEvent('scroll_depth', { 'percent': milestone });
                }
            }
        }

        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(handleScroll);
            ticking = true;
        }
    }, { passive: true });

    let resizeRaf = 0;
    window.addEventListener('resize', () => {
        cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(recomputeGeometry);
    }, { passive: true });
    window.addEventListener('load', recomputeGeometry);
    window.addEventListener('orientationchange', recomputeGeometry);

    handleScroll();
}
