// ============================================
// TEDUH — Main JS
// ============================================

document.addEventListener('DOMContentLoaded', () => {

  // --- SPA Navigation ---
  const pages = document.querySelectorAll('.page');
  const navLinks = document.querySelectorAll('[data-page]');

  function showPage(pageId) {
    pages.forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId);
    if (target) {
      target.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // Update active nav link
    navLinks.forEach(l => {
      l.classList.toggle('nav-active', l.dataset.page === pageId);
    });
    // Close mobile menu
    document.querySelector('.nav-links').classList.remove('open');
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showPage(link.dataset.page);
    });
  });

  // Show home by default
  showPage('home');

  // --- Mobile Nav Toggle ---
  const toggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-links');
  toggle?.addEventListener('click', () => {
    navMenu.classList.toggle('open');
  });

  // --- Scroll: Nav shadow ---
  window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    nav.style.boxShadow = window.scrollY > 20
      ? '0 2px 32px rgba(0,0,0,0.06)'
      : 'none';
  });

  // --- Fade-in on scroll ---
  const fadeEls = document.querySelectorAll('.fade-in');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  fadeEls.forEach(el => observer.observe(el));

  // --- Contact Form ---
  const form = document.getElementById('contactForm');
form?.addEventListener('submit', () => {
  const btn = form.querySelector('.btn-primary');
  btn.textContent = 'Sending…';
  btn.style.background = '#6B8C6B';
});

});
