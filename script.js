  // ---- Settings: the restaurant's WhatsApp number (country code + number, digits only) ----
  const WA_NUMBER = "919632663233";
  const WA_MESSAGES = {
    order: "Hi Govardhan Cafe! I'd like to place an order.\n\nItems:\nPickup / drive-thru time:",
    hello: "Hi Govardhan Cafe! I have a question."
  };
  const waLink = text => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
  document.querySelectorAll('[data-wa]').forEach(a => a.href = waLink(WA_MESSAGES[a.dataset.wa]));

  // In-page links: smooth scroll without adding #section to the address bar
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    if (id === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
    else target.scrollIntoView({ behavior: 'smooth' });
  }));
  if (location.hash) {
    // arriving from the menu page with e.g. /#gallery: jump there, then tidy the address
    const t = document.getElementById(location.hash.slice(1));
    history.replaceState(null, '', location.pathname);
    if (t) setTimeout(() => t.scrollIntoView(), 60);
  }

  // Nav turns solid after the hero; phone action bar stays away while the hero's own buttons are on screen
  const nav = document.getElementById('topnav');
  const mbar = document.querySelector('.mbar');
  const heroCta = document.querySelector('.hero .cta');
  const onScroll = () => {
    nav.classList.toggle('scrolled', scrollY > 40);
    if (heroCta) {
      const r = heroCta.getBoundingClientRect();
      mbar.classList.toggle('away', r.bottom > 0 && r.top < innerHeight);
    }
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  // Menu tabs
  const tabs = document.querySelectorAll('.tab');
  const dishes = document.querySelectorAll('.dish');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.setAttribute('aria-selected', x === t));
    const cat = t.dataset.cat;
    dishes.forEach(d => d.classList.toggle('hidden', cat !== 'all' && d.dataset.cat !== cat));
  }));

  // Gallery slideshow: swipe, arrows, dots, autoplay while visible
  const track = document.getElementById('slides');
  if (track) {
  const slides = [...track.children];
  const dotsBox = document.getElementById('dots');
  slides.forEach((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `Show photo ${i + 1}`);
    b.addEventListener('click', () => { go(i); restart(); });
    dotsBox.appendChild(b);
  });
  const dots = [...dotsBox.children];
  let current = 0, timer = null, inView = false;
  const setActive = i => {
    current = i;
    slides.forEach((s, k) => s.classList.toggle('active', k === i));
    dots.forEach((d, k) => d.classList.toggle('on', k === i));
  };
  const go = i => {
    i = (i + slides.length) % slides.length;
    const s = slides[i];
    track.scrollTo({ left: s.offsetLeft - (track.clientWidth - s.clientWidth) / 2, behavior: 'smooth' });
    setActive(i);
  };
  let scrollT;
  track.addEventListener('scroll', () => {
    clearTimeout(scrollT);
    scrollT = setTimeout(() => {
      const mid = track.scrollLeft + track.clientWidth / 2;
      let best = 0, dist = Infinity;
      slides.forEach((s, k) => { const d = Math.abs(s.offsetLeft + s.clientWidth / 2 - mid); if (d < dist) { dist = d; best = k; } });
      setActive(best);
    }, 80);
  }, { passive: true });
  const restart = () => { clearInterval(timer); if (inView) timer = setInterval(() => go(current + 1), 4200); };
  document.getElementById('prev').addEventListener('click', () => { go(current - 1); restart(); });
  document.getElementById('next').addEventListener('click', () => { go(current + 1); restart(); });
  track.addEventListener('pointerdown', () => clearInterval(timer), { passive: true });
  track.addEventListener('touchend', () => setTimeout(restart, 1500), { passive: true });
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; restart(); }, { threshold: .35 }).observe(track);
  setActive(0);
  }

  // Policy dialogs
  document.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => document.getElementById(b.dataset.open).showModal()));
  document.querySelectorAll('dialog').forEach(d => {
    d.querySelector('.dlg-close').addEventListener('click', () => d.close());
    d.addEventListener('click', e => { if (e.target === d) d.close(); });
  });

  // Year
  const yr = new Date().getFullYear();
  document.querySelectorAll('#yr, .yr').forEach(el => el.textContent = yr);

  // Scroll reveal with a small stagger inside each group
  document.querySelectorAll('.dish').forEach(el => el.classList.add('reveal'));
  const groups = new Map();
  document.querySelectorAll('.reveal').forEach(el => {
    const n = groups.get(el.parentElement) || 0;
    el.style.transitionDelay = (n % 4) * 90 + 'ms';
    groups.set(el.parentElement, n + 1);
  });
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Full menu: search box and section chips that follow your scroll
  const menuSearch = document.getElementById('menuSearch');
  if (menuSearch) {
    const cats = [...document.querySelectorAll('.mcat')];
    const none = document.getElementById('mnone');
    menuSearch.addEventListener('input', () => {
      const t = menuSearch.value.trim().toLowerCase();
      let any = false;
      cats.forEach(c => {
        const catMatch = t && c.querySelector('h3').textContent.toLowerCase().includes(t);
        let shown = 0;
        c.querySelectorAll('.mi').forEach(li => {
          const ok = !t || catMatch || li.querySelector('.n').textContent.toLowerCase().includes(t);
          li.classList.toggle('hide', !ok);
          if (ok) shown++;
        });
        c.classList.toggle('hide', !shown);
        if (shown) any = true;
      });
      none.hidden = any;
    });

    const chipBox = document.querySelector('.mchips');
    const chips = [...chipBox.querySelectorAll('a')];
    let ticking = false;
    const markChip = () => {
      ticking = false;
      let cur = null;
      cats.forEach(c => { if (!c.classList.contains('hide') && c.getBoundingClientRect().top < 240) cur = c.id; });
      chips.forEach(a => {
        const on = a.getAttribute('href') === '#' + cur;
        if (on && !a.classList.contains('on')) chipBox.scrollTo({ left: a.offsetLeft - chipBox.clientWidth / 2 + a.clientWidth / 2, behavior: 'smooth' });
        a.classList.toggle('on', on);
      });
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(markChip); } }, { passive: true });
  }
