/* ═══════════════════════════════════════════════════
   HIGH TIDE MARKETING — MAIN JS v3
   Nav · Mobile Menu · Scroll Reveals · Counters
   FAQ Accordion · GSAP Animations
═══════════════════════════════════════════════════ */

/* ── MOBILE VIEWPORT HEIGHT LOCK ──
   Captures the real viewport height once at load and writes it to --vh.
   We deliberately do NOT update on resize — that's what causes the jump
   when iOS Chrome collapses its tab bar. The hero height stays constant. */
(function lockVH() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', vh + 'px');
})();

/* ── MOBILE VIDEO KILL ──
   Prevent the hero video from loading at all on mobile.
   It's a large HD file — loading it over cellular makes the page feel
   very slow. We show solid navy instead and skip the GSAP scrub. */
const IS_MOBILE = window.innerWidth <= 768;
if (IS_MOBILE) {
  const heroVid = document.querySelector('.hero-bg-video');
  if (heroVid) {
    heroVid.removeAttribute('preload');
    heroVid.setAttribute('preload', 'none');
    // Remove <source> so the browser doesn't queue the network request
    heroVid.querySelectorAll('source').forEach(s => s.remove());
    heroVid.load(); // flush any in-progress load
  }
}

document.addEventListener('DOMContentLoaded', () => {

  /* ── NAV SCROLL STATE ── */
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  /* ── MOBILE MENU ── */
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileClose = document.getElementById('mobile-close');

  function closeMenu() {
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
    mobileMenu.setAttribute('aria-hidden', !isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  if (mobileClose) mobileClose.addEventListener('click', closeMenu);

  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeMenu);
  });

  /* Close menu on Escape key */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeMenu();
  });

  /* ── SCROLL REVEAL (CSS-driven via IntersectionObserver) ── */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.10, rootMargin: '0px 0px -32px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

  /* ── COUNTER ANIMATION ── */
  function animateCounter(el) {
    const target   = parseFloat(el.dataset.target);
    const suffix   = el.dataset.suffix || '';
    const prefix   = el.dataset.prefix || '';
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const duration = 2000;
    const start    = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = eased * target;
      el.textContent = prefix + value.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const counterObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.counter').forEach(el => counterObs.observe(el));

  /* ── VIDEO CAROUSELS — Stacked Deck ── */
  document.querySelectorAll('.vid-carousel').forEach(carousel => {
    const slides     = Array.from(carousel.querySelectorAll('.vid-slide'));
    const dots       = carousel.querySelectorAll('.vid-dot');
    const prevBtn    = carousel.querySelector('.vid-arrow--prev');
    const nextBtn    = carousel.querySelector('.vid-arrow--next');
    const n          = slides.length;
    let current      = 0;
    let isAnimating  = false;
    let startX       = 0;
    let isDragging   = false;

    const ALL_CLASSES = ['is-active','is-prev','is-next','is-far-prev','is-far-next','is-hidden','is-exit-left','is-exit-right'];

    function getSlideState(offset, total) {
      if (offset === 0)          return 'is-active';
      if (offset === 1)          return 'is-next';
      if (offset === total - 1)  return 'is-prev';
      if (offset === 2)          return 'is-far-next';
      if (offset === total - 2)  return 'is-far-prev';
      return 'is-hidden';
    }

    function applyStates() {
      slides.forEach((slide, i) => {
        slide.classList.remove(...ALL_CLASSES);
        const offset = (i - current + n) % n;
        slide.classList.add(getSlideState(offset, n));
      });
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }

    function goTo(idx, direction = 'next') {
      if (isAnimating) return;
      idx = ((idx % n) + n) % n;
      if (idx === current) return;
      isAnimating = true;

      const exitingSlide = slides[current];
      const exitClass = direction === 'next' ? 'is-exit-left' : 'is-exit-right';

      // Pause exiting video
      exitingSlide.querySelector('video').pause();

      // Kick off exit animation
      exitingSlide.classList.remove(...ALL_CLASSES);
      exitingSlide.classList.add(exitClass);

      // Update current & move other slides to new positions
      current = idx;
      slides.forEach((slide, i) => {
        if (slide === exitingSlide) return;
        slide.classList.remove(...ALL_CLASSES);
        const offset = (i - current + n) % n;
        slide.classList.add(getSlideState(offset, n));
      });
      dots.forEach((d, i) => d.classList.toggle('active', i === current));

      // Play new active video
      const newVid = slides[current].querySelector('video');
      newVid.currentTime = 0;
      newVid.play().catch(() => {});

      // Clean up exiting slide after transition
      setTimeout(() => {
        exitingSlide.classList.remove(exitClass);
        applyStates();
        isAnimating = false;
      }, 480);
    }

    // Initialise
    applyStates();
    slides[0].querySelector('video').play().catch(() => {});

    prevBtn && prevBtn.addEventListener('click', () => goTo((current - 1 + n) % n, 'prev'));
    nextBtn && nextBtn.addEventListener('click', () => goTo((current + 1) % n, 'next'));
    dots.forEach(dot => dot.addEventListener('click', () => {
      const idx = +dot.dataset.idx;
      goTo(idx, idx > current ? 'next' : 'prev');
    }));

    // Pointer swipe
    carousel.addEventListener('pointerdown', e => { startX = e.clientX; isDragging = true; });
    carousel.addEventListener('pointerup', e => {
      if (!isDragging) return;
      isDragging = false;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 40) goTo(dx < 0 ? (current + 1) % n : (current - 1 + n) % n, dx < 0 ? 'next' : 'prev');
    });
    carousel.addEventListener('pointercancel', () => { isDragging = false; });
  });

  /* ── WEBSITE MOCKUP CAROUSEL — Side Peek ── */
  document.querySelectorAll('.mockup-carousel').forEach(car => {
    const slides      = Array.from(car.querySelectorAll('.mockup-slide'));
    const dots        = car.querySelectorAll('.mockup-dot');
    const prevBtn     = car.querySelector('.mockup-arrow--prev');
    const nextBtn     = car.querySelector('.mockup-arrow--next');
    const n           = slides.length;
    let current       = 0;
    let isAnimating   = false;
    let startX        = 0;

    const ALL_CLS = ['is-active','is-prev','is-next','is-far-prev','is-far-next','is-hidden','is-exit-left','is-exit-right'];

    function getState(offset) {
      if (offset === 0)     return 'is-active';
      if (offset === 1)     return 'is-next';
      if (offset === n - 1) return 'is-prev';
      if (offset === 2)     return 'is-far-next';
      if (offset === n - 2) return 'is-far-prev';
      return 'is-hidden';
    }

    function applyStates() {
      slides.forEach((s, i) => {
        s.classList.remove(...ALL_CLS);
        s.classList.add(getState((i - current + n) % n));
      });
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }

    function goTo(idx) {
      if (isAnimating) return;
      idx = ((idx % n) + n) % n;
      if (idx === current) return;
      isAnimating = true;
      current = idx;
      applyStates();
      setTimeout(() => { isAnimating = false; }, 420);
    }

    applyStates();

    prevBtn && prevBtn.addEventListener('click', () => goTo((current - 1 + n) % n));
    nextBtn && nextBtn.addEventListener('click', () => goTo((current + 1) % n));
    dots.forEach(dot => dot.addEventListener('click', () => goTo(+dot.dataset.idx)));

    car.addEventListener('pointerdown', e => { startX = e.clientX; });
    car.addEventListener('pointerup', e => {
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 40) goTo(dx < 0 ? (current + 1) % n : (current - 1 + n) % n);
    });
  });

  /* ── FAQ ACCORDION ── */
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const answer = btn.nextElementSibling;
      const isOpen = btn.getAttribute('aria-expanded') === 'true';

      // Close all others
      document.querySelectorAll('.faq-q').forEach(other => {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          other.nextElementSibling.classList.remove('open');
        }
      });

      btn.setAttribute('aria-expanded', !isOpen);
      answer.classList.toggle('open', !isOpen);
    });
  });

  /* ── METHOD CARDS — 2-col tap to expand on mobile ── */
  if (IS_MOBILE) {
    const methodGrid = document.querySelector('.method-grid');
    if (methodGrid) {
      const cards = Array.from(methodGrid.querySelectorAll('.method-card'));
      const chevron = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>`;

      cards.forEach(card => {
        // Inject "Learn more" toggle below the title
        const toggle = document.createElement('div');
        toggle.className = 'method-card-toggle';
        toggle.innerHTML = 'Learn more ' + chevron;
        card.appendChild(toggle);

        card.addEventListener('click', () => {
          const opening = !card.classList.contains('is-open');

          // Close any other open card first
          cards.forEach(c => {
            if (c !== card && c.classList.contains('is-open')) {
              c.classList.remove('is-open');
              c.querySelector('.method-card-toggle').innerHTML = 'Learn more ' + chevron;
            }
          });

          card.classList.toggle('is-open', opening);
          toggle.innerHTML = (opening ? 'Close ' : 'Learn more ') + chevron;
        });
      });
    }
  }

  /* ── GSAP + ScrollTrigger animations ── */
  function initGSAP() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    /* ── Hero sparkline draw-on animation ── */
    const sparkline = document.querySelector('.hc-chart polyline:first-child');
    if (sparkline) {
      const length = sparkline.getTotalLength ? sparkline.getTotalLength() : 300;
      gsap.set(sparkline, { strokeDasharray: length, strokeDashoffset: length });
      gsap.to(sparkline, {
        strokeDashoffset: 0,
        duration: 1.6,
        ease: 'power2.out',
        delay: 1.0
      });
    }

    /* Hero cards use CSS animations — no GSAP needed here */

    /* Headings animate via .reveal CSS transitions */

    /* Scroll reveals for cards handled by CSS .reveal system */
    /* GSAP used only for richer effects below */

    /* ── Difference cards: hover spotlight effect ── */
    document.querySelectorAll('.diff-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.background = `radial-gradient(200px circle at ${x}px ${y}px, rgba(91,196,232,0.06) 0%, var(--bg-alt) 60%)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.background = '';
      });
    });

    /* ── Pain section: slide columns in from sides ── */
    gsap.from('.pain-col-before', {
      x: -20,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.pain-cols',
        start: 'top 80%',
        toggleActions: 'play none none none'
      }
    });
    gsap.from('.pain-col-after', {
      x: 20,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.pain-cols',
        start: 'top 80%',
        toggleActions: 'play none none none'
      }
    });

    /* ── Service rows: slide in text + visual on scroll ── */
    document.querySelectorAll('.svc-row').forEach(row => {
      const text = row.querySelector('.svc-animate-text');
      const visual = row.querySelector('.svc-animate-visual');

      if (text) {
        gsap.to(text, {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: row,
            start: 'top 70%',
            toggleActions: 'play none none none'
          }
        });
      }
      if (visual) {
        gsap.to(visual, {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.9,
          ease: 'power3.out',
          delay: 0.15,
          scrollTrigger: {
            trigger: row,
            start: 'top 70%',
            toggleActions: 'play none none none'
          }
        });
      }
    });

    /* ── Process: line draw-in + card stagger ── */
    const processTrack = document.querySelector('.process-track');
    if (processTrack) {
      // Badges scale in with spring
      gsap.from('.process-badge', {
        scale: 0,
        opacity: 0,
        duration: 0.55,
        ease: 'back.out(1.8)',
        stagger: 0.18,
        scrollTrigger: {
          trigger: processTrack,
          start: 'top 72%',
          toggleActions: 'play none none none'
        }
      });

      // Lines draw left-to-right, staggered after badges
      gsap.to('.process-spine-fill', {
        scaleX: 1,
        duration: 0.7,
        ease: 'power2.out',
        stagger: 0.22,
        delay: 0.3,
        scrollTrigger: {
          trigger: processTrack,
          start: 'top 72%',
          toggleActions: 'play none none none'
        }
      });

      // Cards slide up with stagger
      gsap.to('.process-card', {
        opacity: 1,
        y: 0,
        duration: 0.65,
        ease: 'power3.out',
        stagger: 0.14,
        delay: 0.15,
        scrollTrigger: {
          trigger: processTrack,
          start: 'top 72%',
          toggleActions: 'play none none none'
        }
      });
    }

    /* ── Final CTA: subtle scale reveal ── */
    gsap.from('.final-cta h2', {
      y: 40,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.final-cta',
        start: 'top 75%',
        toggleActions: 'play none none none'
      }
    });

    /* ── Hero video: scroll-driven on desktop only ── */
    // Mobile: video is not loaded (preload stripped in the head script above),
    // so there is nothing to scrub. Desktop gets the full cinematic scroll effect.
    if (!IS_MOBILE) {
      const heroVideo = document.querySelector('.hero-bg-video');
      const heroSection = document.querySelector('.hero');

      if (heroVideo && heroSection) {
        const driveVideo = () => {
          const duration = heroVideo.duration;
          if (!duration) return;

          const heroScrollZone = document.querySelector('.hero-scroll-zone');
          ScrollTrigger.create({
            trigger: heroScrollZone || heroSection,
            start: 'top top',
            end: 'bottom top',
            scrub: 2,
            onUpdate: (self) => {
              heroVideo.currentTime = self.progress * duration;
            }
          });
        };

        if (heroVideo.readyState >= 1) {
          driveVideo();
        } else {
          heroVideo.addEventListener('loadedmetadata', driveVideo, { once: true });
        }

        window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
      }
    }

    /* Hero content stays visible while pinned — no fade needed */

    /* ── Work card image parallax on scroll ── */
    document.querySelectorAll('.work-card-img img').forEach(img => {
      gsap.fromTo(img,
        { yPercent: -4 },
        {
          yPercent: 4,
          ease: 'none',
          scrollTrigger: {
            trigger: img,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2
          }
        }
      );
    });

  }

  // GSAP loads deferred — wait for it
  if (typeof gsap !== 'undefined') {
    initGSAP();
  } else {
    window.addEventListener('load', initGSAP);
  }

});
