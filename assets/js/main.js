/**
 * CPJ Theme - Main JavaScript
 * Handles mobile menu, smooth scrolling, and other interactions
 */

(function() {
    'use strict';

    // DOM Ready
    document.addEventListener('DOMContentLoaded', function() {
        initMobileMenu();
        initSmoothScroll();
        initNewsletterForms();
        initChapterProgress();
        initNumberedLinks();
    });

    /**
     * Mobile Menu Toggle
     */
    function initMobileMenu() {
        const menuToggle = document.getElementById('menu-toggle');
        const siteNav = document.getElementById('site-nav');

        if (!menuToggle || !siteNav) return;

        menuToggle.addEventListener('click', function() {
            const isOpen = siteNav.classList.toggle('is-open');
            menuToggle.setAttribute('aria-expanded', isOpen);

            // Update icon
            const menuIcon = menuToggle.querySelector('svg');
            if (menuIcon) {
                if (isOpen) {
                    menuIcon.innerHTML = '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>';
                } else {
                    menuIcon.innerHTML = '<line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>';
                }
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && siteNav.classList.contains('is-open')) {
                siteNav.classList.remove('is-open');
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!siteNav.contains(e.target) && !menuToggle.contains(e.target)) {
                siteNav.classList.remove('is-open');
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    /**
     * Smooth Scroll for Anchor Links
     */
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');

                // Skip if it's a Ghost portal link
                if (targetId.startsWith('#/portal')) return;

                const target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    /**
     * Newsletter Form Handling
     * Ghost handles the actual submission, this just adds UX feedback
     */
    function initNewsletterForms() {
        document.querySelectorAll('[data-members-form]').forEach(function(form) {
            form.addEventListener('submit', function() {
                const button = form.querySelector('button[type="submit"]');
                if (button) {
                    button.textContent = 'Subscribing...';
                    button.disabled = true;
                }
            });
        });
    }

    /**
     * Chapter Reading Progress
     * Shows progress indicator for book chapters
     */
    function initChapterProgress() {
        const chapterContent = document.querySelector('.chapter-content');
        if (!chapterContent) return;

        // Create progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'reading-progress';
        progressBar.innerHTML = '<div class="reading-progress-bar"></div>';
        document.body.appendChild(progressBar);

        const progressBarInner = progressBar.querySelector('.reading-progress-bar');

        // Update progress on scroll
        function updateProgress() {
            const contentRect = chapterContent.getBoundingClientRect();
            const contentTop = contentRect.top + window.scrollY;
            const contentHeight = chapterContent.offsetHeight;
            const windowHeight = window.innerHeight;
            const scrollTop = window.scrollY;

            const progress = Math.min(100, Math.max(0,
                ((scrollTop - contentTop + windowHeight) / (contentHeight + windowHeight)) * 100
            ));

            progressBarInner.style.width = progress + '%';
        }

        window.addEventListener('scroll', updateProgress, { passive: true });
        updateProgress();
    }

    /**
     * Numbered Links in Chapter Content
     * Adds small-caps styling to links containing numbers (e.g., footnote references)
     * Only applies to chapter pages, in the main content area
     */
    function initNumberedLinks() {
        // Only run on chapter pages (check for chapter-specific elements)
        const chapterBody = document.querySelector('.page-template .post-body .content');
        if (!chapterBody) return;

        // Find all links in the chapter content
        const links = chapterBody.querySelectorAll('a');

        links.forEach(function(link) {
            // Check if link text contains a number
            if (/\d/.test(link.textContent)) {
                link.classList.add('numbered-link');
            }
        });
    }

    /**
     * Add reading progress styles dynamically
     */
    const progressStyles = document.createElement('style');
    progressStyles.textContent = `
        .reading-progress {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            z-index: 1000;
            background: rgba(0, 0, 0, 0.1);
        }
        .reading-progress-bar {
            height: 100%;
            width: 0;
            background: var(--color-accent, #FF3252);
            transition: width 100ms ease-out;
        }
    `;
    document.head.appendChild(progressStyles);

})();
