/* ═══════════════════════════════════════════════════
   HIGH TIDE MARKETING — MAIN JS
   Nav · Scroll reveals · Counters · FAQ · Hero canvas
═══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── NAV SCROLL STATE ── */
  const nav = document.getElementById('nav');
  const scrollThreshold = 40;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > scrollThreshold);
  }, { passive: true });

  /* ── MOBILE MENU ── */
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
    mobileMenu.setAttribute('aria-hidden', !isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    });
  });

  /* ── SCROLL REVEAL (IntersectionObserver, no GSAP dep) ── */
  const revealEls = document.querySelectorAll('.reveal');
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => revealObs.observe(el));

  /* ── COUNTER ANIMATION ── */
  function animateCounter(el) {
    const target    = parseFloat(el.dataset.target);
    const suffix    = el.dataset.suffix || '';
    const prefix    = el.dataset.prefix || '';
    const decimals  = parseInt(el.dataset.decimals || '0', 10);
    const duration  = 1800;
    const start     = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      const value    = eased * target;
      el.textContent = prefix + value.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const counterEls = document.querySelectorAll('.counter');
  const counterObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counterEls.forEach(el => counterObs.observe(el));

  /* ── FAQ ACCORDION ── */
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const answer   = btn.nextElementSibling;
      const isOpen   = btn.getAttribute('aria-expanded') === 'true';
      const faqItems = document.querySelectorAll('.faq-q');

      faqItems.forEach(other => {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          other.nextElementSibling.classList.remove('open');
        }
      });

      btn.setAttribute('aria-expanded', !isOpen);
      answer.classList.toggle('open', !isOpen);
    });
  });

  /* ── HERO CANVAS — ANIMATED MESH GRADIENT ── */
  const canvas = document.getElementById('hero-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let w, h, animId;

    const orbs = [
      { x: 0.2, y: 0.3, r: 0.55, color: [13, 59, 82],    speed: 0.00018 },
      { x: 0.8, y: 0.6, r: 0.45, color: [8, 9, 26],      speed: 0.00013 },
      { x: 0.5, y: 0.1, r: 0.5,  color: [26, 32, 56],    speed: 0.00020 },
      { x: 0.1, y: 0.8, r: 0.4,  color: [240, 192, 64],  speed: 0.00015, alpha: 0.06 },
    ];

    function resize() {
      w = canvas.width  = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#08091a';
      ctx.fillRect(0, 0, w, h);

      orbs.forEach((orb, i) => {
        const ox = (orb.x + Math.sin(t * orb.speed + i * 1.3) * 0.15) * w;
        const oy = (orb.y + Math.cos(t * orb.speed + i * 0.9) * 0.12) * h;
        const radius = orb.r * Math.min(w, h);
        const alpha  = orb.alpha ?? 0.25;
        const [r, g, b] = orb.color;
        const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, radius);
        grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      });

      animId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    animId = requestAnimationFrame(draw);

    /* Pause when tab hidden to save resources */
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
        animId = requestAnimationFrame(draw);
      }
    });
  }

  /* ── GSAP ScrollTrigger (loaded deferred) ── */
  function initGSAP() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    /* Spotlight hover on diff cards */
    document.querySelectorAll('.diff-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        card.style.setProperty('--my', `${e.clientY - rect.top}px`);
      });
    });

    /* Parallax on service images */
    document.querySelectorAll('.svc-media img').forEach(img => {
      gsap.fromTo(img,
        { yPercent: -5 },
        {
          yPercent: 5,
          ease: 'none',
          scrollTrigger: {
            trigger: img,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          }
        }
      );
    });
  }

  /* GSAP may load after DOMContentLoaded since it's deferred */
  if (typeof gsap !== 'undefined') {
    initGSAP();
  } else {
    window.addEventListener('load', initGSAP);
  }

});
