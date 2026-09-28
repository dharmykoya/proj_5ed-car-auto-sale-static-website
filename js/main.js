/**
 * Premium Auto Sales - Main JavaScript
 * Handles mobile menu toggle, smooth scrolling, lazy loading fallback,
 * active nav link highlighting, and accessibility features.
 *
 * Pattern: IIFE to avoid polluting global scope.
 */

(function () {
  'use strict';

  /* ============================================
     Utility: debounce
     ============================================ */

  /**
   * Returns a debounced version of fn that delays execution by `delay` ms.
   * Used to limit rapid-fire scroll events.
   *
   * @param {Function} fn    - The function to debounce.
   * @param {number}   delay - Milliseconds to wait before calling fn.
   * @returns {Function}
   */
  function debounce(fn, delay) {
    var timer;
    return function () {
      var ctx = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(ctx, args);
      }, delay);
    };
  }

  /* ============================================
     Mobile Menu Toggle
     ============================================ */

  /**
   * Initialises the hamburger button and nav menu.
   * - Toggles the `nav-open` class on the nav element.
   * - Toggles `aria-expanded` on the button.
   * - Traps focus within the nav when the menu is open.
   * - Closes on Escape key or outside click.
   */
  function initMobileMenu() {
    try {
      var hamburger = document.getElementById('hamburger');
      var nav = document.getElementById('main-nav');

      if (!hamburger || !nav) return;

      /** Returns all keyboard-focusable elements inside the nav. */
      function getFocusable() {
        return Array.prototype.slice.call(
          nav.querySelectorAll(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
      }

      /** Opens the mobile menu and moves focus to the first nav link. */
      function openMenu() {
        nav.classList.add('nav-open');
        hamburger.setAttribute('aria-expanded', 'true');
        var focusable = getFocusable();
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }

      /** Closes the mobile menu and returns focus to the hamburger button. */
      function closeMenu() {
        nav.classList.remove('nav-open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.focus();
      }

      /* Toggle on hamburger click */
      hamburger.addEventListener('click', function () {
        var isOpen = hamburger.getAttribute('aria-expanded') === 'true';
        if (isOpen) {
          closeMenu();
        } else {
          openMenu();
        }
      });

      /* Close when a nav link is activated */
      nav.addEventListener('click', function (e) {
        if (e.target && e.target.classList.contains('nav-link')) {
          closeMenu();
        }
      });

      /* Escape key closes the menu */
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && nav.classList.contains('nav-open')) {
          closeMenu();
        }
      });

      /* Focus trap: keep Tab navigation inside nav while menu is open */
      nav.addEventListener('keydown', function (e) {
        if (!nav.classList.contains('nav-open')) return;
        if (e.key !== 'Tab') return;

        var focusable = getFocusable();
        if (focusable.length === 0) return;

        var first = focusable[0];
        var last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          /* Shift+Tab: wrap from first to last */
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          /* Tab: wrap from last to first */
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      });

      /* Close when clicking outside the nav or hamburger */
      document.addEventListener('click', function (e) {
        if (
          nav.classList.contains('nav-open') &&
          !nav.contains(e.target) &&
          !hamburger.contains(e.target)
        ) {
          closeMenu();
        }
      });
    } catch (err) {
      console.error('[MobileMenu] Initialization failed:', err);
    }
  }

  /* ============================================
     Smooth Scroll
     ============================================ */

  /**
   * Intercepts clicks on anchor links whose href starts with '#' and
   * scrolls smoothly to the target element using scrollIntoView.
   * Also moves keyboard focus to the target for accessibility.
   */
  function initSmoothScroll() {
    try {
      var anchorLinks = document.querySelectorAll('a[href^="#"]');

      Array.prototype.forEach.call(anchorLinks, function (link) {
        link.addEventListener('click', function (e) {
          var href = link.getAttribute('href');

          /* Ignore bare '#' links */
          if (!href || href === '#') return;

          var target = document.querySelector(href);
          if (!target) return;

          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });

          /* Make target focusable if it isn't already */
          if (!target.hasAttribute('tabindex')) {
            target.setAttribute('tabindex', '-1');
          }
          target.focus({ preventScroll: true });
        });
      });
    } catch (err) {
      console.error('[SmoothScroll] Initialization failed:', err);
    }
  }

  /* ============================================
     Lazy Loading Fallback
     ============================================ */

  /**
   * Polyfill for browsers without native `loading="lazy"` support.
   * Uses IntersectionObserver to load images with a `data-src` attribute
   * when they enter the viewport. Falls back to eager loading if
   * IntersectionObserver is also unavailable.
   */
  function initLazyLoadingFallback() {
    try {
      /* Native lazy loading is supported — nothing to do */
      if ('loading' in HTMLImageElement.prototype) return;

      var lazyImages = document.querySelectorAll('img[data-src]');
      if (lazyImages.length === 0) return;

      /* IntersectionObserver not available — load all immediately */
      if (!('IntersectionObserver' in window)) {
        Array.prototype.forEach.call(lazyImages, function (img) {
          if (img.dataset.src) {
            img.src = img.dataset.src;
          }
        });
        return;
      }

      var observer = new IntersectionObserver(
        function (entries, obs) {
          Array.prototype.forEach.call(entries, function (entry) {
            if (!entry.isIntersecting) return;
            var img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            obs.unobserve(img);
          });
        },
        { rootMargin: '200px 0px' }
      );

      Array.prototype.forEach.call(lazyImages, function (img) {
        observer.observe(img);
      });
    } catch (err) {
      console.error('[LazyLoad] Initialization failed:', err);
    }
  }

  /* ============================================
     Active Nav Link Highlighting
     ============================================ */

  /**
   * Uses IntersectionObserver to watch page sections and adds the
   * `active` CSS class to the nav link that corresponds to the
   * currently visible section.
   */
  function initActiveNavHighlighting() {
    try {
      var sections = document.querySelectorAll('section[id]');
      var navLinks = document.querySelectorAll('.nav-link');

      if (sections.length === 0 || navLinks.length === 0) return;

      /** Sets the active class on the link matching the given section id. */
      function setActiveLink(id) {
        Array.prototype.forEach.call(navLinks, function (link) {
          var href = link.getAttribute('href');
          if (href === '#' + id) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }

      var observer = new IntersectionObserver(
        function (entries) {
          Array.prototype.forEach.call(entries, function (entry) {
            if (entry.isIntersecting) {
              setActiveLink(entry.target.id);
            }
          });
        },
        {
          /* Trigger when the section occupies the middle 10% of the viewport */
          rootMargin: '-20% 0px -70% 0px',
          threshold: 0,
        }
      );

      Array.prototype.forEach.call(sections, function (section) {
        observer.observe(section);
      });
    } catch (err) {
      console.error('[ActiveNav] Initialization failed:', err);
    }
  }

  /* ============================================
     Sticky Header Enhancement
     ============================================ */

  /**
   * Adds a `scrolled` class to the site header once the user scrolls
   * past 10px, enabling a stronger shadow via CSS. Scroll handler is
   * debounced for performance.
   */
  function initStickyHeader() {
    try {
      var header = document.querySelector('.site-header');
      if (!header) return;

      var handleScroll = debounce(function () {
        if (window.scrollY > 10) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      }, 50);

      window.addEventListener('scroll', handleScroll, { passive: true });
    } catch (err) {
      console.error('[StickyHeader] Initialization failed:', err);
    }
  }

  /* ============================================
     Initialise all modules
     ============================================ */

  /**
   * Entry point — runs after the DOM is ready.
   */
  function init() {
    initMobileMenu();
    initSmoothScroll();
    initLazyLoadingFallback();
    initActiveNavHighlighting();
    initStickyHeader();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    /* DOM already parsed (script loaded with defer) */
    init();
  }
})();
