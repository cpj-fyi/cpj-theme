/**
 * CPJ Theme - Main JavaScript
 * Handles mobile menu, smooth scrolling, and other interactions
 */

(function() {
    'use strict';

    // DOM Ready
    document.addEventListener('DOMContentLoaded', function() {
        initRadarMode();
        initMobileMenu();
        initSmoothScroll();
        initNewsletterForms();
        initChapterProgress();
        initNumberedLinks();
        initDateTimeMoonphase();
        initCurrentChapter();
        initRadarScan();
        initChapterNavToggle();
    });

    /**
     * Current Chapter Highlighting
     * Highlights the current chapter in the sidebar navigation
     */
    function initCurrentChapter() {
        const chapterLinks = document.querySelectorAll('.chapter-list-link');
        if (!chapterLinks.length) return;

        const currentPath = window.location.pathname;

        chapterLinks.forEach(function(link) {
            if (link.getAttribute('href') === currentPath ||
                link.getAttribute('href') === currentPath.replace(/\/$/, '') ||
                link.getAttribute('href') + '/' === currentPath) {
                link.classList.add('is-current');
            }
        });
    }

    /**
     * Chapter Nav Toggle (Mobile)
     * Collapses/expands the chapter list on mobile with tap and swipe support
     */
    function initChapterNavToggle() {
        const toggle = document.getElementById('chapter-nav-toggle');
        const nav = document.getElementById('chapter-list-nav');

        if (!toggle || !nav) return;

        let startY = 0;
        let currentY = 0;
        let isDragging = false;
        const SWIPE_THRESHOLD = 30; // pixels needed to trigger open/close

        function openNav() {
            toggle.setAttribute('aria-expanded', 'true');
            nav.classList.add('is-open');
        }

        function closeNav() {
            toggle.setAttribute('aria-expanded', 'false');
            nav.classList.remove('is-open');
        }

        function isOpen() {
            return toggle.getAttribute('aria-expanded') === 'true';
        }

        // Click/tap toggle
        toggle.addEventListener('click', function(e) {
            // Ignore if this was the end of a drag
            if (isDragging) {
                isDragging = false;
                return;
            }

            if (isOpen()) {
                closeNav();
            } else {
                openNav();
            }
        });

        // Touch/drag support
        toggle.addEventListener('touchstart', function(e) {
            startY = e.touches[0].clientY;
            currentY = startY;
        }, { passive: true });

        toggle.addEventListener('touchmove', function(e) {
            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;

            // Visual feedback during drag
            if (Math.abs(deltaY) > 10) {
                isDragging = true;
            }
        }, { passive: true });

        toggle.addEventListener('touchend', function() {
            const deltaY = currentY - startY;

            if (isDragging) {
                // Swipe down to open, swipe up to close
                if (deltaY > SWIPE_THRESHOLD && !isOpen()) {
                    openNav();
                } else if (deltaY < -SWIPE_THRESHOLD && isOpen()) {
                    closeNav();
                }
            }

            startY = 0;
            currentY = 0;
            // isDragging is reset in click handler
        });
    }

    /**
     * Radar Scan Animation
     * Creates blip effects at random positions during sweep
     */
    function initRadarScan() {
        const radarDots = document.querySelectorAll('.radar-dot');
        if (!radarDots.length) return;

        radarDots.forEach(function(dot) {
            // Trigger blips at random intervals during the sweep
            function scheduleBlip() {
                // Random delay between 0.5s and 3.5s into the 4s animation
                const delay = 500 + Math.random() * 3000;

                setTimeout(function() {
                    dot.classList.add('blip');

                    // Remove blip class after animation completes
                    setTimeout(function() {
                        dot.classList.remove('blip');
                    }, 600);
                }, delay);
            }

            // Schedule blips for each sweep cycle
            scheduleBlip();
            setInterval(function() {
                // 1-3 blips per sweep
                const blipCount = 1 + Math.floor(Math.random() * 3);
                for (let i = 0; i < blipCount; i++) {
                    scheduleBlip();
                }
            }, 4000);
        });
    }

    /**
     * Radar Mode
     * Add body class for radar pages (collection route may not have tag-radar class)
     */
    function initRadarMode() {
        if (document.querySelector('.radar-feed')) {
            document.body.classList.add('tag-radar');
        }
    }

    /**
     * Mobile Menu Toggle
     */
    function initMobileMenu() {
        const menuToggle = document.getElementById('menu-toggle');
        const siteNav = document.getElementById('site-nav');

        if (!menuToggle || !siteNav) return;

        function openMenu() {
            siteNav.classList.add('is-open');
            document.body.classList.add('menu-open');
            menuToggle.setAttribute('aria-expanded', 'true');
        }

        function closeMenu() {
            siteNav.classList.remove('is-open');
            document.body.classList.remove('menu-open');
            menuToggle.setAttribute('aria-expanded', 'false');
        }

        menuToggle.addEventListener('click', function() {
            if (siteNav.classList.contains('is-open')) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && siteNav.classList.contains('is-open')) {
                closeMenu();
            }
        });

        // Close menu when clicking a nav link
        siteNav.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', closeMenu);
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
     * Date, Time, and Moonphase Display
     * Shows current date/time and watch-style moonphase indicator
     */
    function initDateTimeMoonphase() {
        const dateEl = document.querySelector('.header-date');
        const timeEl = document.querySelector('.header-time');
        const mobileDateEl = document.querySelector('.mobile-date');
        const mobileTimeEl = document.querySelector('.mobile-time');
        const moonDisc = document.getElementById('moonphase-disc');
        const mobileMoonDisc = document.querySelector('.moonphase-disc-mobile');
        const moonphaseEl = document.getElementById('header-moonphase');

        if (!dateEl || !timeEl) return;

        function updateDateTime() {
            const now = new Date();

            // Format date: "Mon, Jan 19"
            const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
            const dateStr = now.toLocaleDateString('en-US', dateOptions).toUpperCase();
            dateEl.textContent = dateStr;
            if (mobileDateEl) mobileDateEl.textContent = dateStr;

            // Format time: "10:30 AM"
            const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
            const timeStr = now.toLocaleTimeString('en-US', timeOptions);
            timeEl.textContent = timeStr;
            if (mobileTimeEl) mobileTimeEl.textContent = timeStr;
        }

        /**
         * Calculate moon phase using astronomical algorithm
         * Returns a value from 0 to 1 where:
         * 0 = New Moon, 0.25 = First Quarter, 0.5 = Full Moon, 0.75 = Last Quarter
         */
        function getMoonPhase(date) {
            // Known new moon: January 6, 2000 at 18:14 UTC
            const knownNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
            const synodicMonth = 29.53058867; // Average lunar cycle in days

            const daysSinceKnown = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
            const lunations = daysSinceKnown / synodicMonth;
            const phase = lunations - Math.floor(lunations);

            return phase;
        }

        /**
         * Position the moon disc based on current phase
         * Moon at cy=22 (below aperture). Dome aperture shows y=6 to y=16.
         * Moon rises into view, peeks up from bottom at crescent, fully visible at full moon.
         * Phase 0 (new moon) = moon just hidden (translateY = 2)
         * Phase 0.5 (full moon) = moon centered in dome (translateY = -11)
         */
        function updateMoonPhase(phase) {
            // Cosine wave: +2 at new moon (hidden), -11 at full moon (centered)
            const translateY = -4.5 + 6.5 * Math.cos(phase * 2 * Math.PI);

            if (moonDisc) {
                moonDisc.setAttribute('transform', `translate(0, ${translateY})`);
            }
            if (mobileMoonDisc) {
                mobileMoonDisc.setAttribute('transform', `translate(0, ${translateY})`);
            }

            // Update title with phase name
            if (moonphaseEl) {
                const phaseName = getMoonPhaseName(phase);
                moonphaseEl.setAttribute('title', phaseName);
            }
        }

        function getMoonPhaseName(phase) {
            if (phase < 0.03 || phase > 0.97) return 'New Moon';
            if (phase < 0.22) return 'Waxing Crescent';
            if (phase < 0.28) return 'First Quarter';
            if (phase < 0.47) return 'Waxing Gibbous';
            if (phase < 0.53) return 'Full Moon';
            if (phase < 0.72) return 'Waning Gibbous';
            if (phase < 0.78) return 'Last Quarter';
            return 'Waning Crescent';
        }

        // Initialize
        updateDateTime();
        updateMoonPhase(getMoonPhase(new Date()));

        // Update time every minute
        setInterval(updateDateTime, 60000);

        // Update moon phase every hour (it changes slowly)
        setInterval(function() {
            updateMoonPhase(getMoonPhase(new Date()));
        }, 3600000);
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
