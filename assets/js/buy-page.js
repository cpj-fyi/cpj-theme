/**
 * Buy Page — constellation canvas, scroll reveal, parallax, ticker, rail scroll
 * All selectors namespaced with bp- prefix
 * Early-return guard for non-buy pages
 */
;(function () {
  // Early-return guard: only run on buy page
  var buyPage = document.querySelector('.buy-page');
  if (!buyPage) return;

  // ============================================
  // CONSTELLATION CANVAS
  // ============================================
  ;(function () {
    var canvas = document.getElementById('bp-hero-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w, h, nodes = [], mouse = { x: -1000, y: -1000 };
    var NODE_COUNT = 65;
    var CONNECT_DIST = 180;
    var MOUSE_RADIUS = 220;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rafId = null;
    var isVisible = true;

    function resize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function init() {
      resize();
      nodes = [];
      for (var i = 0; i < NODE_COUNT; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 2.5 + 1,
          hue: Math.random() < 0.2 ? 1 : 0
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      // Draw connections
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var dx = nodes[i].x - nodes[j].x;
          var dy = nodes[i].y - nodes[j].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            var alpha = (1 - dist / CONNECT_DIST) * 0.12;
            ctx.strokeStyle = 'rgba(255, 255, 255, ' + alpha + ')';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (var k = 0; k < nodes.length; k++) {
        var node = nodes[k];
        var mdx = node.x - mouse.x;
        var mdy = node.y - mouse.y;
        var mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        var glow = mdist < MOUSE_RADIUS ? (1 - mdist / MOUSE_RADIUS) : 0;

        var baseAlpha = 0.3 + glow * 0.5;
        if (node.hue) {
          ctx.fillStyle = 'rgba(214, 51, 108, ' + (baseAlpha + 0.15) + ')';
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, ' + baseAlpha + ')';
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r + glow * 2, 0, Math.PI * 2);
        ctx.fill();

        // Extra glow ring on proximity
        if (glow > 0.3) {
          ctx.strokeStyle = node.hue
            ? 'rgba(214, 51, 108, ' + (glow * 0.25) + ')'
            : 'rgba(255, 255, 255, ' + (glow * 0.15) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.r + glow * 6, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    function update() {
      for (var k = 0; k < nodes.length; k++) {
        var node = nodes[k];
        node.x += node.vx;
        node.y += node.vy;

        // Soft repel from mouse
        var mdx = node.x - mouse.x;
        var mdy = node.y - mouse.y;
        var mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < MOUSE_RADIUS && mdist > 0) {
          var force = (1 - mdist / MOUSE_RADIUS) * 0.4;
          node.vx += (mdx / mdist) * force;
          node.vy += (mdy / mdist) * force;
        }

        // Damping
        node.vx *= 0.995;
        node.vy *= 0.995;

        // Wrap edges
        if (node.x < -20) node.x = w + 20;
        if (node.x > w + 20) node.x = -20;
        if (node.y < -20) node.y = h + 20;
        if (node.y > h + 20) node.y = -20;
      }
    }

    function loop() {
      if (!isVisible) {
        rafId = null;
        return;
      }
      update();
      draw();
      rafId = requestAnimationFrame(loop);
    }

    // Track mouse
    var hero = document.getElementById('bp-hero');
    if (hero) {
      hero.addEventListener('mousemove', function (e) {
        var rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      });
      hero.addEventListener('mouseleave', function () {
        mouse.x = -1000;
        mouse.y = -1000;
      });
    }

    window.addEventListener('resize', function () {
      resize();
    });

    // IntersectionObserver to pause when hero is out of view
    if ('IntersectionObserver' in window && hero) {
      var heroObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (!isVisible) {
              isVisible = true;
              loop();
            }
          } else {
            isVisible = false;
          }
        });
      }, { threshold: 0 });
      heroObserver.observe(hero);
    }

    init();
    loop();
  })();

  // ============================================
  // SCROLL REVEAL
  // ============================================
  ;(function () {
    if (!('IntersectionObserver' in window)) return;

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });

    var els = buyPage.querySelectorAll('.bp-reveal, .bp-reveal-stagger');
    for (var i = 0; i < els.length; i++) {
      revealObserver.observe(els[i]);
    }
  })();

  // ============================================
  // PARALLAX (subtle, on scroll)
  // ============================================
  ;(function () {
    var cover = buyPage.querySelector('.bp-hero-cover-wrap');
    var text = buyPage.querySelector('.bp-hero-text');

    function parallax() {
      var scrolled = window.scrollY;
      var vh = window.innerHeight;
      if (scrolled < vh * 1.2) {
        var ratio = scrolled / vh;
        if (cover) cover.style.transform = 'translateY(' + (ratio * 40) + 'px)';
        if (text) text.style.transform = 'translateY(' + (ratio * 20) + 'px)';
      }
    }

    window.addEventListener('scroll', parallax, { passive: true });
  })();

  // ============================================
  // SECTIONS RAIL — pass vertical scroll through
  // ============================================
  ;(function () {
    var rail = buyPage.querySelector('.bp-sections-rail');
    if (!rail) return;
    rail.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        window.scrollBy(0, e.deltaY);
      }
    }, { passive: false });
  })();

  // ============================================
  // SMOOTH ANCHOR SCROLL (for in-page #bp- links)
  // ============================================
  ;(function () {
    var links = buyPage.querySelectorAll('a[href^="#bp-"]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function (e) {
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  })();
})();
