/* ============================================================
   pages.js
   All page-specific DOM logic. No GSAP dependency.
   Self-initialising — each module checks for its elements first.
   Covers: attorneys · insights · contact · article · practice
   X Law Firm — Production v1.0
   ============================================================ */

(function () {
    'use strict';

    /* ── TINY DOM UTILS ──────────────────────────────────────── */
    const $  = (sel, ctx) => (ctx || document).querySelector(sel);
    const $$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];


    /* ============================================================
       1. ATTORNEYS PAGE
       • Filter buttons (All / Partners / Associates / by practice)
       • Modal open / close / ESC / data population
       ============================================================ */
    (function initAttorneys() {
        const filterBtns = $$('.filter-btn[data-filter]');
        const cards      = $$('.attorney-card[data-category]');
        if (!filterBtns.length || !cards.length) return;

        /* ── FILTER ── */
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('is-active'));
                btn.classList.add('is-active');

                const filter = btn.dataset.filter;

                cards.forEach(card => {
                    const cats = (card.dataset.category || '').toLowerCase();
                    const show = filter === 'all' || cats.includes(filter.toLowerCase());

                    /* Use GSAP if available, else fallback to inline style */
                    if (typeof gsap !== 'undefined') {
                        gsap.to(card, {
                            opacity:  show ? 1 : 0,
                            scale:    show ? 1 : 0.96,
                            duration: 0.26,
                            ease:     'power2.out',
                            onComplete() {
                                card.style.display        = show ? '' : 'none';
                                card.style.pointerEvents  = show ? '' : 'none';
                            }
                        });
                    } else {
                        card.style.display       = show ? '' : 'none';
                        card.style.pointerEvents = show ? '' : 'none';
                        card.style.opacity       = show ? '1' : '0';
                    }
                });
            });
        });

        /* ── MODAL ── */
        const backdrop = document.getElementById('attorneyModal');
        if (!backdrop) return;

        const modal     = backdrop.querySelector('.attorney-modal');
        const closeBtn  = backdrop.querySelector('.attorney-modal-close');

        /* Fields to populate */
        const fields = {
            name:       backdrop.querySelector('.attorney-modal-name'),
            role:       backdrop.querySelector('.attorney-modal-role'),
            avatar:     backdrop.querySelector('.attorney-modal-avatar'),
            bio:        backdrop.querySelector('.attorney-modal-bio'),
            tags:       backdrop.querySelector('.attorney-modal-tags'),
            education:  backdrop.querySelector('#modalEducation'),
            email:      backdrop.querySelector('#modalEmail'),
            phone:      backdrop.querySelector('#modalPhone'),
        };

        function openModal(card) {
            const d = card.dataset;

            if (fields.name)      fields.name.textContent      = d.name      || '';
            if (fields.role)      fields.role.textContent      = d.role      || '';
            if (fields.avatar)    fields.avatar.textContent    = d.initials  || d.name?.charAt(0) || '';
            if (fields.bio)       fields.bio.textContent       = d.bio       || '';
            if (fields.email)     fields.email.textContent     = d.email     || '';
            if (fields.email)     fields.email.href            = 'mailto:' + (d.email || '');
            if (fields.phone)     fields.phone.textContent     = d.phone     || '';

            /* Tags */
            if (fields.tags) {
                fields.tags.innerHTML = '';
                const tags = (d.tags || '').split(',').map(t => t.trim()).filter(Boolean);
                tags.forEach(tag => {
                    const span = document.createElement('span');
                    span.className   = 'specialty-tag';
                    span.textContent = tag;
                    fields.tags.appendChild(span);
                });
            }

            /* Education list */
            if (fields.education) {
                fields.education.innerHTML = '';
                const edu = (d.education || '').split('|').map(e => e.trim()).filter(Boolean);
                edu.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = item;
                    fields.education.appendChild(li);
                });
            }

            backdrop.classList.add('is-open');
            document.body.classList.add('modal-open');

            /* Re-init lucide icons inside modal */
            if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [backdrop] });
        }

        function closeModal() {
            backdrop.classList.remove('is-open');
            document.body.classList.remove('modal-open');
        }

        /* Open on card click */
        cards.forEach(card => card.addEventListener('click', () => openModal(card)));

        /* Close triggers */
        closeBtn?.addEventListener('click', closeModal);
        backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
    })();


    /* ============================================================
       2. INSIGHTS PAGE
       • Category filter (All / Corporate / Litigation / etc.)
       • Load more cards
       • Newsletter form with success state
       ============================================================ */
    (function initInsights() {

        /* ── ARTICLE FILTER ── */
        const tabs    = $$('.filter-tab[data-filter]');
        const cards   = $$('.article-card[data-category]');
        const counter = document.getElementById('articleCount');

        if (tabs.length && cards.length) {

            function updateCount() {
                const visible = cards.filter(c => c.style.display !== 'none').length;
                if (counter) counter.textContent = `Showing ${visible} article${visible !== 1 ? 's' : ''}`;
            }

            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('is-active'));
                    tab.classList.add('is-active');

                    const filter = tab.dataset.filter;

                    cards.forEach(card => {
                        const cats = (card.dataset.category || '').toLowerCase();
                        const show = filter === 'all' || cats.includes(filter.toLowerCase());

                        if (typeof gsap !== 'undefined') {
                            if (show) {
                                card.style.display = 'flex';
                                gsap.fromTo(card, { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.28, ease: 'power2.out' });
                            } else {
                                gsap.to(card, { opacity: 0, scale: 0.96, duration: 0.2, ease: 'power2.in',
                                    onComplete: () => { card.style.display = 'none'; updateCount(); }
                                });
                            }
                        } else {
                            card.style.display = show ? 'flex' : 'none';
                        }
                    });

                    updateCount();
                });
            });

            updateCount();
        }

        /* ── LOAD MORE ── */
        const loadMoreBtn  = document.getElementById('loadMoreBtn');
        const loadMoreWrap = document.getElementById('loadMoreWrap');
        const grid         = document.getElementById('articlesGrid');

        if (loadMoreBtn && grid) {
            let loaded = false;

            const extraArticles = [
                {
                    cat:     'commercial',
                    img:     'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
                    title:   'Negotiating Long-Term Supply Agreements: A Practical Guide',
                    excerpt: 'Structuring supply and offtake agreements that protect commercial interests across market cycles.',
                    date:    'July 2025',
                    id:      'supply-agreements'
                },
                {
                    cat:     'corporate',
                    img:     'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=600&auto=format&fit=crop&q=80',
                    title:   'Private Equity in India: Deal Structures and Exit Options',
                    excerpt: 'An overview of common deal structures used by PE funds investing in Indian companies and the exit routes available.',
                    date:    'June 2025',
                    id:      'pe-india'
                },
                {
                    cat:     'regulatory',
                    img:     'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80',
                    title:   "Competition Law Compliance: The CCI's Evolving Approach",
                    excerpt: "How the Competition Commission of India's enforcement posture has shifted and what businesses should do to stay compliant.",
                    date:    'May 2025',
                    id:      'cci-compliance'
                }
            ];

            loadMoreBtn.addEventListener('click', () => {
                if (loaded) return;
                loaded = true;

                const newCards = [];

                extraArticles.forEach((a, i) => {
                    const el = document.createElement('article');
                    el.className       = 'article-card';
                    el.dataset.category = a.cat;
                    el.style.opacity   = '0';
                    el.innerHTML = `
                        <div class="article-card-image">
                            <img src="${a.img}" alt="${a.title}" loading="lazy">
                        </div>
                        <div class="article-card-body">
                            <span class="article-category">${a.cat.charAt(0).toUpperCase() + a.cat.slice(1)}</span>
                            <h3 class="article-card-title">${a.title}</h3>
                            <p class="article-card-excerpt">${a.excerpt}</p>
                            <div class="article-card-footer">
                                <span class="article-card-date">
                                    <i data-lucide="calendar"></i> ${a.date}
                                </span>
                                <a href="article.html?id=${a.id}" class="article-read-link">
                                    Read <i data-lucide="arrow-right"></i>
                                </a>
                            </div>
                        </div>`;
                    grid.appendChild(el);
                    newCards.push(el);

                    if (typeof gsap !== 'undefined') {
                        gsap.to(el, { opacity: 1, y: [20, 0], duration: 0.55, delay: i * 0.12, ease: 'power3.out' });
                    } else {
                        setTimeout(() => { el.style.opacity = '1'; }, i * 120);
                    }
                });

                if (typeof lucide !== 'undefined') {
                    lucide.createIcons({ nodes: newCards });
                }

                if (loadMoreWrap) loadMoreWrap.style.display = 'none';
            });
        }

        /* ── NEWSLETTER FORM ── */
        const nlForm    = document.getElementById('newsletterForm');
        const nlSuccess = document.getElementById('newsletterSuccess');

        if (nlForm) {
            nlForm.addEventListener('submit', e => {
                e.preventDefault();
                const name  = nlForm.querySelector('#newsletterName')?.value.trim();
                const email = nlForm.querySelector('#newsletterEmail')?.value.trim();
                if (!name || !email || !email.includes('@')) return;

                if (typeof gsap !== 'undefined') {
                    gsap.to(nlForm, {
                        opacity: 0, y: -8, duration: 0.28, ease: 'power2.in',
                        onComplete() {
                            nlForm.style.display = 'none';
                            if (nlSuccess) {
                                nlSuccess.style.display = 'flex';
                                gsap.from(nlSuccess, { opacity: 0, y: 8, duration: 0.38, ease: 'power2.out' });
                                if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [nlSuccess] });
                            }
                        }
                    });
                } else {
                    nlForm.style.display = 'none';
                    if (nlSuccess) nlSuccess.style.display = 'flex';
                }
            });
        }
    })();


    /* ============================================================
       3. CONTACT PAGE
       • Form validation + submission + success state
       • Office tab switcher
       • FAQ accordion
       ============================================================ */
    (function initContact() {

        /* ── OFFICE TABS ── */
        const officeTabs   = $$('.office-tab[data-office]');
        const officePanels = $$('.office-panel[id^="panel-"]');

        if (officeTabs.length) {
            officeTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    officeTabs.forEach(t => t.classList.remove('is-active'));
                    officePanels.forEach(p => p.classList.remove('is-active'));
                    tab.classList.add('is-active');
                    const panel = document.getElementById('panel-' + tab.dataset.office);
                    if (panel) {
                        panel.classList.add('is-active');
                        if (typeof gsap !== 'undefined') {
                            gsap.from(panel, { opacity: 0, y: 6, duration: 0.28, ease: 'power2.out' });
                        }
                    }
                });
            });
        }

        /* ── FORM VALIDATION ── */
        const form       = document.getElementById('contactForm');
        const successEl  = document.getElementById('formSuccess');
        const submitBtn  = document.getElementById('submitBtn');

        if (!form) return;

        /* Show/hide field error state */
        function setError(fieldId, show) {
            const input = document.getElementById(fieldId);
            const err   = document.getElementById('err-' + fieldId);
            input?.classList.toggle('has-error', show);
            err?.classList.toggle('is-visible', show);
        }

        /* Clear error on input */
        ['firstName', 'lastName', 'email', 'practiceArea', 'message'].forEach(id => {
            document.getElementById(id)?.addEventListener('input',  () => setError(id, false));
            document.getElementById(id)?.addEventListener('change', () => setError(id, false));
        });
        document.getElementById('privacyCheck')?.addEventListener('change', () => setError('privacy', false));

        function validate() {
            let valid = true;

            const checks = [
                { id: 'firstName',    ok: v => v.length > 0 },
                { id: 'lastName',     ok: v => v.length > 0 },
                { id: 'email',        ok: v => v.includes('@') && v.includes('.') },
                { id: 'practiceArea', ok: v => v.length > 0 },
                { id: 'message',      ok: v => v.trim().length > 0 },
            ];

            checks.forEach(({ id, ok }) => {
                const el    = document.getElementById(id);
                const value = el?.value?.trim() || '';
                const pass  = ok(value);
                setError(id, !pass);
                if (!pass) valid = false;
            });

            const privacy = document.getElementById('privacyCheck')?.checked;
            setError('privacy', !privacy);
            if (!privacy) valid = false;

            return valid;
        }

        form.addEventListener('submit', e => {
            e.preventDefault();
            if (!validate()) {
                /* Shake the first errored field */
                const firstErr = form.querySelector('.has-error');
                firstErr?.focus();
                return;
            }

            if (submitBtn) {
                submitBtn.textContent = 'Sending…';
                submitBtn.disabled   = true;
            }

            /* Simulate submission — replace with real endpoint */
            setTimeout(() => {
                if (typeof gsap !== 'undefined') {
                    gsap.to(form, {
                        opacity: 0, y: -10, duration: 0.28, ease: 'power2.in',
                        onComplete() {
                            form.style.display = 'none';
                            if (successEl) {
                                successEl.style.display = 'flex';
                                gsap.from(successEl, { opacity: 0, y: 12, duration: 0.42, ease: 'power2.out' });
                                if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [successEl] });
                            }
                        }
                    });
                } else {
                    form.style.display = 'none';
                    if (successEl) successEl.style.display = 'flex';
                }
            }, 900);
        });

        /* ── FAQ ACCORDION ── */
        const faqItems = $$('.faq-item');

        faqItems.forEach(item => {
            const btn    = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');
            const inner  = item.querySelector('.faq-answer-inner');
            if (!btn || !answer) return;

            btn.addEventListener('click', () => {
                const isOpen = item.classList.contains('is-open');

                /* Close all */
                faqItems.forEach(i => {
                    i.classList.remove('is-open');
                    const a = i.querySelector('.faq-answer');
                    if (a) a.style.maxHeight = '0';
                });

                /* Open clicked if it was closed */
                if (!isOpen) {
                    item.classList.add('is-open');
                    answer.style.maxHeight = (inner?.scrollHeight ?? 200) + 'px';
                }
            });
        });
    })();


    /* ============================================================
       4. ARTICLE PAGE
       • Reading progress bar
       • TOC active section highlighting (IntersectionObserver)
       • Share buttons (copy link, email, print)
       ============================================================ */
    (function initArticle() {
        const progressBar = document.getElementById('readingProgress');
        const articleBody = document.getElementById('articleBody');
        if (!progressBar && !articleBody) return;

        /* ── READING PROGRESS ── */
        if (progressBar) {
            window.addEventListener('scroll', () => {
                const doc     = document.documentElement;
                const scrolled = doc.scrollTop;
                const total   = doc.scrollHeight - doc.clientHeight;
                progressBar.style.width = total > 0
                    ? (scrolled / total * 100) + '%'
                    : '0%';
            }, { passive: true });
        }

        /* ── TOC ACTIVE STATE ── */
        const tocLinks = $$('.toc-link');
        if (tocLinks.length) {
            const headings = $$('h2[id]', articleBody);

            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    const idx = headings.indexOf(entry.target);
                    tocLinks.forEach((link, i) => link.classList.toggle('is-active', i === idx));
                });
            }, { rootMargin: '-20% 0px -68% 0px' });

            headings.forEach(h => observer.observe(h));
        }

        /* ── SHARE BUTTONS ── */
        const copyBtn  = document.getElementById('shareCopy');
        const emailBtn = document.getElementById('shareEmail');
        const printBtn = document.getElementById('sharePrint');

        copyBtn?.addEventListener('click', () => {
            navigator.clipboard.writeText(window.location.href).then(() => {
                const orig = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i data-lucide="check"></i>';
                if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [copyBtn] });
                setTimeout(() => {
                    copyBtn.innerHTML = orig;
                    if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [copyBtn] });
                }, 1800);
            });
        });

        emailBtn?.addEventListener('click', () => {
            window.open(
                'mailto:?subject=' + encodeURIComponent(document.title) +
                '&body=' + encodeURIComponent(window.location.href)
            );
        });

        printBtn?.addEventListener('click', () => window.print());
    })();


    /* ============================================================
       5. PRACTICE AREAS PAGE
       • Smooth scroll for in-page anchor nav if used
       ============================================================ */
    (function initPracticeAreas() {
        /* Any in-page links like [href="#corporate-law"] */
        $$('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', e => {
                const target = document.querySelector(anchor.getAttribute('href'));
                if (!target) return;
                e.preventDefault();
                const offset = 90; /* header height */
                const top    = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            });
        });
    })();


    /* ============================================================
       6. GLOBAL — EXTERNAL LINK TARGET BLANK
       Any link to an external domain gets target="_blank" + rel.
       ============================================================ */
    (function initExternalLinks() {
        const origin = window.location.origin;
        $$('a[href]').forEach(a => {
            const href = a.getAttribute('href') || '';
            if (href.startsWith('http') && !href.startsWith(origin)) {
                a.setAttribute('target', '_blank');
                a.setAttribute('rel', 'noopener noreferrer');
            }
        });
    })();

})();
