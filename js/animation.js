/* ============================================================
   animation.js
   All GSAP animations — hero, parallax, reveal, stats,
   header, rails, mobile nav, scroll hint.
   Requires: GSAP 3.x + ScrollTrigger loaded before this file.
   X Law Firm — Production v1.0
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

/* ── UTILITIES ──────────────────────────────────────────────── */
const $  = (sel, ctx) => (ctx || document).querySelector(sel);
const $$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];

/* Respect OS-level reduce motion preference */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* ============================================================
   1. HERO ENTRANCE
   Coordinated timeline fires once on load.
   eyebrow → title lines → subtitle → actions → stats → deco → hint
   ============================================================ */
(function initHeroEntrance() {
    const hero = $('.hero');
    if (!hero) return;

    const eyebrow  = hero.querySelector('.hero-eyebrow');
    const lines    = hero.querySelectorAll('.hero-title .line-inner');
    const title    = hero.querySelector('.hero-title');   /* fallback */
    const subtitle = hero.querySelector('.hero-subtitle');
    const actions  = hero.querySelector('.hero-actions');
    const stats    = hero.querySelectorAll('.hero-stat');
    const deco     = hero.querySelector('.hero-deco');
    const hint     = hero.querySelector('.scroll-hint');

    /* Reduced motion — reveal everything immediately */
    if (prefersReducedMotion) {
        [eyebrow, subtitle, actions, deco, hint, title, ...stats, ...lines]
            .filter(Boolean)
            .forEach(el => gsap.set(el, { opacity: 1, y: 0 }));
        return;
    }

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.1 });

    if (eyebrow) {
        tl.fromTo(eyebrow,
            { opacity: 0, y: 18 },
            { opacity: 1, y: 0, duration: 0.7 }, 0.2);
    }

    if (lines.length) {
        /* Clip-reveal each line from below */
        tl.fromTo(lines,
            { y: '105%' },
            { y: '0%', duration: 1.0, stagger: 0.13, ease: 'power4.out' }, 0.45);
    } else if (title) {
        /* Fallback if line-inner wrappers not present */
        tl.fromTo(title,
            { opacity: 0, y: 36 },
            { opacity: 1, y: 0, duration: 0.9 }, 0.45);
    }

    if (subtitle) {
        tl.fromTo(subtitle,
            { opacity: 0, y: 22 },
            { opacity: 1, y: 0, duration: 0.75 }, 0.82);
    }

    if (actions) {
        tl.fromTo(actions,
            { opacity: 0, y: 18 },
            { opacity: 1, y: 0, duration: 0.7 }, 1.0);
    }

    if (stats.length) {
        tl.fromTo(stats,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.65, stagger: 0.1 }, 1.14);
    }

    if (deco) {
        tl.fromTo(deco,
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.6 }, 1.28);
    }

    if (hint) {
        tl.fromTo(hint,
            { opacity: 0 },
            { opacity: 1, duration: 0.6 }, 1.5);
    }
})();


/* ============================================================
   2. PARALLAX BACKGROUNDS
   Scrub-based. Speed set via data-parallax-speed (0.0–1.0).
   Each [data-parallax] element moves relative to its section.
   ============================================================ */
(function initParallax() {
    if (prefersReducedMotion) return;

    $$('[data-parallax]').forEach(el => {
        const section = el.closest('section, .hero, .page-hero') || el.parentElement;
        const speed   = parseFloat(el.dataset.parallaxSpeed ?? '0.4');

        gsap.fromTo(el,
            { y: 0 },
            {
                y:    () => section.offsetHeight * speed * -1,
                ease: 'none',
                scrollTrigger: {
                    trigger:             section,
                    start:               'top bottom',
                    end:                 'bottom top',
                    scrub:               true,
                    invalidateOnRefresh: true
                }
            }
        );
    });
})();


/* ============================================================
   3. SCROLL REVEAL
   .reveal              → individual element fades + slides up
   .stagger-children    → each child staggers in sequence
   ============================================================ */
(function initReveal() {
    if (prefersReducedMotion) {
        $$('.reveal').forEach(el => gsap.set(el, { opacity: 1, y: 0 }));
        $$('.stagger-children > *').forEach(el => gsap.set(el, { opacity: 1, y: 0 }));
        return;
    }

    /* Individual reveals — skip elements that are inside a stagger group */
    $$('.reveal').forEach(el => {
        if (el.closest('.stagger-children') && !el.classList.contains('stagger-children')) return;

        gsap.fromTo(el,
            { opacity: 0, y: 32 },
            {
                opacity:  1,
                y:        0,
                duration: 0.85,
                ease:     'power3.out',
                scrollTrigger: {
                    trigger:       el,
                    start:         'top 89%',
                    toggleActions: 'play none none none'
                }
            }
        );
    });

    /* Stagger groups */
    $$('.stagger-children').forEach(group => {
        const children = [...group.children];
        if (!children.length) return;

        gsap.fromTo(children,
            { opacity: 0, y: 36 },
            {
                opacity:  1,
                y:        0,
                duration: 0.8,
                ease:     'power3.out',
                stagger:  0.12,
                scrollTrigger: {
                    trigger:       group,
                    start:         'top 89%',
                    toggleActions: 'play none none none'
                }
            }
        );
    });
})();


/* ============================================================
   4. STAT COUNTERS
   .hero-stat[data-count]  → hero stats (index page)
   [data-stat]             → any inline stat (about, story)
   ============================================================ */
(function initStats() {

    function animateStat(el, target, suffix, prefix) {
        const obj = { val: 0 };
        gsap.to(obj, {
            val:      target,
            duration: 1.8,
            ease:     'power2.out',
            onUpdate()  { el.textContent = prefix + Math.floor(obj.val) + suffix; },
            onComplete(){ el.textContent = prefix + target + suffix; }
        });
    }

    /* Hero stat blocks */
    $$('.hero-stat[data-count]').forEach(stat => {
        const numEl  = stat.querySelector('.hero-stat-number');
        if (!numEl) return;

        const target = parseInt(stat.dataset.count, 10);
        const suffix = stat.dataset.suffix || '';
        const prefix = stat.dataset.prefix || '';
        let done     = false;

        if (prefersReducedMotion) {
            numEl.textContent = prefix + target + suffix;
            gsap.set(stat, { opacity: 1 });
            return;
        }

        ScrollTrigger.create({
            trigger: stat,
            start:   'top 88%',
            onEnter() {
                if (done) return;
                done = true;
                gsap.to(stat, { opacity: 1, duration: 0.4 });
                animateStat(numEl, target, suffix, prefix);
            }
        });
    });

    /* Inline [data-stat] elements */
    $$('[data-stat]').forEach(el => {
        const target = parseInt(el.dataset.stat, 10);
        const suffix = el.dataset.suffix || '';
        let   done   = false;

        if (prefersReducedMotion) { el.textContent = target + suffix; return; }

        ScrollTrigger.create({
            trigger: el,
            start:   'top 90%',
            onEnter() {
                if (done) return;
                done = true;
                animateStat(el, target, suffix, '');
            }
        });
    });
})();


/* ============================================================
   5. HEADER — SHRINK ON SCROLL
   Adds/removes .scrolled at 80px scroll depth.
   CSS (interactions.css) handles visual changes.
   ============================================================ */
(function initHeader() {
    const header = $('.site-header');
    if (!header) return;

    ScrollTrigger.create({
        start:    'top -80px',
        onUpdate: self => header.classList.toggle('scrolled', self.progress > 0)
    });
})();


/* ============================================================
   6. SCROLL HINT FADE
   Adds .has-scrolled to .hero after 60px scroll.
   CSS transitions opacity out via the class.
   ============================================================ */
(function initScrollHint() {
    const hero = $('.hero');
    if (!hero || prefersReducedMotion) return;

    let done = false;

    window.addEventListener('scroll', function onScroll() {
        if (done) return;
        if (window.scrollY > 60) {
            done = true;
            hero.classList.add('has-scrolled');
            window.removeEventListener('scroll', onScroll);
        }
    }, { passive: true });
})();


/* ============================================================
   7. HORIZONTAL RAILS — DRAG + MOMENTUM
   Handles .case-rail and .insights-rail.
   Mouse drag + velocity momentum + touch + arrow buttons.
   ============================================================ */
(function initRails() {

    $$('.case-rail, .insights-rail').forEach(rail => {
        let isDown     = false;
        let startX     = 0;
        let scrollLeft = 0;
        let velocity   = 0;
        let lastX      = 0;
        let lastTime   = 0;
        let rafId      = null;

        /* ── Mouse ── */
        rail.addEventListener('mousedown', e => {
            isDown     = true;
            startX     = e.pageX - rail.offsetLeft;
            scrollLeft = rail.scrollLeft;
            lastX      = e.pageX;
            lastTime   = Date.now();
            velocity   = 0;
            rail.classList.add('is-dragging');
            cancelAnimationFrame(rafId);
        });

        const endDrag = () => {
            if (!isDown) return;
            isDown = false;
            rail.classList.remove('is-dragging');
            applyMomentum();
        };

        rail.addEventListener('mouseleave', endDrag);
        rail.addEventListener('mouseup',    endDrag);

        rail.addEventListener('mousemove', e => {
            if (!isDown) return;
            e.preventDefault();
            const x   = e.pageX - rail.offsetLeft;
            const now = Date.now();
            const dt  = Math.max(now - lastTime, 1);

            velocity         = ((e.pageX - lastX) / dt) * 14;
            lastX            = e.pageX;
            lastTime         = now;
            rail.scrollLeft  = scrollLeft - (x - startX) * 1.25;
        });

        /* ── Touch ── */
        let touchX = 0, touchScroll = 0;

        rail.addEventListener('touchstart', e => {
            touchX      = e.touches[0].pageX;
            touchScroll = rail.scrollLeft;
            velocity    = 0;
            cancelAnimationFrame(rafId);
        }, { passive: true });

        rail.addEventListener('touchmove', e => {
            rail.scrollLeft = touchScroll + (touchX - e.touches[0].pageX);
        }, { passive: true });

        /* ── Momentum ── */
        function applyMomentum() {
            cancelAnimationFrame(rafId);
            function step() {
                velocity      *= 0.88;
                rail.scrollLeft -= velocity;
                if (Math.abs(velocity) > 0.5) rafId = requestAnimationFrame(step);
            }
            step();
        }
    });

    /* Generic arrow buttons via data-rail-target + data-dir */
    $$('[data-rail-btn]').forEach(btn => {
        btn.addEventListener('click', () => {
            const rail = $(`.${btn.dataset.railTarget}`);
            if (!rail) return;
            const card = rail.querySelector('[class$="-card"]');
            const dist = (card?.offsetWidth ?? 340) * 1.5;
            rail.scrollBy({ left: btn.dataset.dir === 'right' ? dist : -dist, behavior: 'smooth' });
        });
    });

    /* Legacy selectors */
    $$('.case-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const rail = $('.case-rail');
            if (rail) rail.scrollBy({ left: btn.dataset.dir === 'right' ? 420 : -420, behavior: 'smooth' });
        });
    });

    $$('.insight-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const rail = $('.insights-rail');
            if (rail) rail.scrollBy({ left: btn.dataset.dir === 'right' ? 360 : -360, behavior: 'smooth' });
        });
    });
})();


/* ============================================================
   8. MOBILE NAV DRAWER
   GSAP slide-down from above. Backdrop fade.
   ESC key + backdrop click + nav link click all close it.
   ============================================================ */
(function initMobileNav() {
    const menuBtn  = document.getElementById('mobileMenuBtn');
    const drawer   = document.getElementById('mobileNav');
    const backdrop = document.getElementById('navBackdrop');
    if (!menuBtn || !drawer) return;

    let open = false;

    gsap.set(drawer,   { y: '-100%', visibility: 'hidden' });
    gsap.set(backdrop, { opacity: 0, display: 'none' });

    function swapIcon(name) {
        const icon = menuBtn.querySelector('[data-lucide]');
        if (!icon || typeof lucide === 'undefined') return;
        icon.setAttribute('data-lucide', name);
        lucide.createIcons({ nodes: [menuBtn] });
    }

    function openNav() {
        open = true;
        document.body.classList.add('nav-open');
        gsap.set(backdrop, { display: 'block' });
        gsap.to(backdrop,  { opacity: 1, duration: 0.28, ease: 'power2.out' });
        gsap.set(drawer,   { visibility: 'visible' });
        gsap.to(drawer,    { y: '0%',   duration: 0.42, ease: 'power3.out' });
        swapIcon('x');
    }

    function closeNav() {
        open = false;
        document.body.classList.remove('nav-open');
        gsap.to(drawer,   { y: '-100%', duration: 0.36, ease: 'power3.in',
            onComplete: () => gsap.set(drawer, { visibility: 'hidden' }) });
        gsap.to(backdrop, { opacity: 0, duration: 0.26, ease: 'power2.in',
            onComplete: () => gsap.set(backdrop, { display: 'none' }) });
        swapIcon('menu');
    }

    menuBtn.addEventListener('click',   () => open ? closeNav() : openNav());
    backdrop?.addEventListener('click', closeNav);
    drawer.querySelectorAll('a, .btn').forEach(el => el.addEventListener('click', closeNav));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) closeNav(); });
})();


/* ============================================================
   9. LUCIDE ICONS INIT
   Runs after all dynamic content is in the DOM.
   Pages that inject HTML call lucide.createIcons() again locally.
   ============================================================ */
if (typeof lucide !== 'undefined') lucide.createIcons();
