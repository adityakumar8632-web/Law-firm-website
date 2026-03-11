/* ============================================================
   transitions.js
   Conveyor belt page loader + internal link interception.
   Path-aware — works from root and /practice/ subfolder.
   X Law Firm — Production v1.0
   ============================================================ */

(function () {
    'use strict';

    const loader = document.getElementById('page-loader');
    if (!loader) return;

    /* ── SHOW / HIDE ─────────────────────────────────────────── */
    function showLoader() {
        loader.classList.add('is-active');
    }

    function hideLoader() {
        /* Small delay so paint is ready before removing */
        requestAnimationFrame(() => {
            setTimeout(() => loader.classList.remove('is-active'), 80);
        });
    }

    /* Hide on initial load (covers any flash) */
    hideLoader();

    /* ── INTERNAL LINK DETECTION ─────────────────────────────── */
    function isInternal(href) {
        if (!href) return false;

        /* Skip external, anchors, protocols */
        if (href.startsWith('http')       ||
            href.startsWith('//')         ||
            href.startsWith('#')          ||
            href.startsWith('mailto:')    ||
            href.startsWith('tel:')       ||
            href.startsWith('javascript:')) return false;

        return true;
    }

    /* ── CLICK INTERCEPTION ──────────────────────────────────── */
    document.addEventListener('click', function (e) {
        /* Find closest anchor up the DOM tree */
        const anchor = e.target.closest('a[href]');
        if (!anchor) return;

        const href = anchor.getAttribute('href');
        if (!isInternal(href)) return;

        /* Skip modifier key combos (new tab, etc.) */
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        /* Skip if target is blank */
        if (anchor.target === '_blank') return;

        e.preventDefault();
        showLoader();

        /* Navigate after loader has time to appear */
        setTimeout(() => {
            window.location.href = resolveHref(href, anchor);
        }, 400);
    });

    /* ── PATH RESOLVER ───────────────────────────────────────────
       Handles relative links correctly whether the current page
       is at root (/index.html) or in a subfolder (/practice/x.html).
       Browser handles this natively for real servers — this only
       matters when opening files directly (file://).
    ──────────────────────────────────────────────────────────── */
    function resolveHref(href, anchor) {
        /* Let the browser handle absolute-style paths */
        if (href.startsWith('/')) return href;

        /* For relative paths, use the anchor's resolved href */
        return anchor.href || href;
    }

    /* ── BACK / FORWARD (bfcache) ────────────────────────────── */
    window.addEventListener('pageshow', function (e) {
        /* pageshow fires on bfcache restore too */
        hideLoader();
    });

    /* ── POPSTATE (SPA-style navigation) ─────────────────────── */
    window.addEventListener('popstate', function () {
        hideLoader();
    });

})();
