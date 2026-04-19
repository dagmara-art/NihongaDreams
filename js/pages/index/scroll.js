// Navbar scroll effect, parallax backgrounds, scroll depth analytics

import { trackEvent } from '../../shared/analytics.js';

export function initScroll() {
    const navbar = document.getElementById('navbar');
    const bgImages = document.querySelectorAll('.bg-image');
    const mobileMediaQuery = window.matchMedia('(max-width: 768px)');
    let ticking = false;
    let maxScrollDepth = 0;

    function handleScroll() {
        const scrollY = window.scrollY;

        // Navbar scroll effect
        navbar.classList.toggle('scrolled', scrollY > 100);

        // Parallax effect for background images (desktop only)
        if (!mobileMediaQuery.matches) {
            const windowHeight = window.innerHeight;
            bgImages.forEach((bg) => {
                const section = bg.parentElement;
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                if (scrollY >= sectionTop - windowHeight && scrollY <= sectionTop + sectionHeight) {
                    bg.style.transform = `translateY(${(scrollY - sectionTop) * 0.3}px) scale(1.1)`;
                }
            });
        }

        // Analytics: Track scroll depth milestones
        const scrollPercent = Math.round((scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        [25, 50, 75, 100].forEach(milestone => {
            if (scrollPercent >= milestone && maxScrollDepth < milestone) {
                maxScrollDepth = milestone;
                trackEvent('scroll_depth', { 'percent': milestone });
            }
        });

        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(handleScroll);
            ticking = true;
        }
    }, { passive: true });
    handleScroll();
}
