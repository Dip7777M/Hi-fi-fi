/* The Rose: page interactions. Plain JavaScript, no libraries. */
(function () {
  'use strict';

  var reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  function reducedMotion() { return reduceMotionQuery.matches; }
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function store(key, value) {
    try {
      if (value === undefined) return window.localStorage.getItem('rose:' + key);
      window.localStorage.setItem('rose:' + key, String(value));
    } catch (e) { return null; }
    return null;
  }

  /* ---------------------------------------------------------------
     Header: solid background after scrolling, mobile menu, active link
     --------------------------------------------------------------- */
  var header = $('#site-header');
  var toTop = $('#to-top');
  var navToggle = $('#nav-toggle');
  var navLinks = $('#nav-links');

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    header.classList.toggle('is-solid', y > 40);
    toTop.classList.toggle('is-visible', y > window.innerHeight * 0.8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    navLinks.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    navToggle.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
    if (open) header.classList.add('is-solid'); else onScroll();
  }
  navToggle.addEventListener('click', function () {
    setMenu(navToggle.getAttribute('aria-expanded') !== 'true');
  });
  $$('a', navLinks).forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });

  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
    $('.brand').focus({ preventScroll: true });
  });

  // Highlight the nav link for the section in view
  var navMap = {};
  $$('a', navLinks).forEach(function (a) { navMap[a.getAttribute('href').slice(1)] = a; });
  var sectionGroups = { about: 'about', history: 'about', anatomy: 'about', colours: 'about', nature: 'about',
    varieties: 'varieties', gallery: 'gallery', care: 'care', uses: 'care', facts: 'care', faq: 'care', poem: 'poem' };
  if ('IntersectionObserver' in window) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var group = sectionGroups[entry.target.id];
        Object.keys(navMap).forEach(function (id) {
          if (id === group) navMap[id].setAttribute('aria-current', 'true');
          else navMap[id].removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(sectionGroups).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) navObserver.observe(el);
    });
  }

  /* ---------------------------------------------------------------
     Reveal on scroll
     --------------------------------------------------------------- */
  var revealEls = $$('.reveal, .reveal-img');
  if ('IntersectionObserver' in window && !reducedMotion()) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------------------------------------------------------------
     Gentle hero parallax
     --------------------------------------------------------------- */
  var heroMedia = $('#hero-media');
  var ticking = false;
  function parallax() {
    ticking = false;
    if (reducedMotion()) { heroMedia.style.transform = ''; return; }
    var y = window.scrollY || window.pageYOffset;
    if (y > window.innerHeight * 1.2) return;
    heroMedia.style.transform = 'translate3d(0,' + (y * 0.18).toFixed(1) + 'px,0)';
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(parallax); }
  }, { passive: true });

  /* ---------------------------------------------------------------
     Floating petals (lightweight, paused when hidden or reduced motion)
     --------------------------------------------------------------- */
  var petalBox = $('#petals');
  var petalTimer = null;
  var MAX_PETALS = 12;
  function spawnPetal() {
    if (document.hidden || reducedMotion() || petalBox.childElementCount >= MAX_PETALS) return;
    var p = document.createElement('span');
    p.className = 'petal';
    var size = 10 + Math.random() * 10;
    var duration = 11 + Math.random() * 9;
    p.style.left = (Math.random() * 100) + 'vw';
    p.style.width = size + 'px';
    p.style.height = (size * 0.8) + 'px';
    p.style.setProperty('--drift', (Math.random() * 120 - 60).toFixed(0) + 'px');
    p.style.animationDuration = duration + 's';
    p.style.opacity = (0.45 + Math.random() * 0.35).toFixed(2);
    p.addEventListener('animationend', function () { p.remove(); });
    petalBox.appendChild(p);
  }
  function startPetals() {
    if (petalTimer || reducedMotion()) return;
    petalTimer = window.setInterval(spawnPetal, 1800);
    spawnPetal();
  }
  function stopPetals() {
    window.clearInterval(petalTimer);
    petalTimer = null;
    petalBox.textContent = '';
  }
  startPetals();
  var onMotionChange = function () { if (reducedMotion()) { stopPetals(); parallax(); } else startPetals(); };
  if (reduceMotionQuery.addEventListener) reduceMotionQuery.addEventListener('change', onMotionChange);
  else if (reduceMotionQuery.addListener) reduceMotionQuery.addListener(onMotionChange);

  /* ---------------------------------------------------------------
     Bud to bloom illustration
     --------------------------------------------------------------- */
  var bloomSvg = $('#bloom-svg');
  var bloomRange = $('#bloom-range');
  var bloomStage = $('#bloom-stage');
  var SVGNS = 'http://www.w3.org/2000/svg';
  var PETAL = 'M0 0 C -46 -14 -56 -78 -20 -98 C -8 -104 8 -104 20 -98 C 56 -78 46 -14 0 0 Z';
  var SEPAL = 'M0 0 C -12 -40 -8 -90 0 -128 C 8 -90 12 -40 0 0 Z';
  // rings from outside (0) to inside (3)
  var rings = [
    { n: 5, size: 1.55, offset: 0, color: 'url(#bl-outer)' },
    { n: 5, size: 1.2, offset: 36, color: 'url(#bl-mid)' },
    { n: 5, size: 0.86, offset: 12, color: 'url(#bl-mid)' },
    { n: 4, size: 0.55, offset: 50, color: 'url(#bl-inner)' }
  ];
  var ringGroups = [];
  var sepalGroups = [];

  function el(name, attrs) {
    var e = document.createElementNS(SVGNS, name);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  if (bloomSvg && bloomRange) {
    var defs = el('defs');
    [['bl-outer', '#f6b9c4', '#c8375a'], ['bl-mid', '#e5677f', '#9b1f40'], ['bl-inner', '#b3123a', '#5a1024']].forEach(function (g) {
      var grad = el('radialGradient', { id: g[0], cx: '50%', cy: '100%', r: '110%' });
      grad.appendChild(el('stop', { offset: '0%', 'stop-color': g[2] }));
      grad.appendChild(el('stop', { offset: '100%', 'stop-color': g[1] }));
      defs.appendChild(grad);
    });
    bloomSvg.appendChild(defs);

    // soft shadow disc
    bloomSvg.appendChild(el('circle', { cx: 0, cy: 8, r: 150, fill: 'rgba(90,16,36,0.08)', id: 'bl-shadow' }));

    var sepals = el('g');
    for (var s = 0; s < 5; s++) {
      var sg = el('g');
      sg.appendChild(el('path', { d: SEPAL, fill: '#3c6e55', stroke: '#1f3d2f', 'stroke-width': 1.5 }));
      sepals.appendChild(sg);
      sepalGroups.push({ g: sg, angle: s * 72 + 18 });
    }
    bloomSvg.appendChild(sepals);

    rings.forEach(function (ring, r) {
      var rg = el('g');
      var petals = [];
      for (var i = 0; i < ring.n; i++) {
        var pg = el('g');
        pg.appendChild(el('path', { d: PETAL, fill: ring.color, stroke: '#5a1024', 'stroke-width': 1.2, 'stroke-opacity': 0.5 }));
        pg.appendChild(el('path', { d: 'M0 -12 C -3 -40 -2 -62 0 -82', fill: 'none', stroke: '#fff', 'stroke-opacity': 0.25, 'stroke-width': 1.2 }));
        rg.appendChild(pg);
        petals.push({ g: pg, angle: ring.offset + i * (360 / ring.n) });
      }
      bloomSvg.appendChild(rg);
      ringGroups.push({ ring: ring, index: r, petals: petals });
    });

    // centre swirl (visible when closed / tight)
    var centre = el('path', { d: 'M0 -14 C 12 -14 16 -2 8 6 C 0 14 -14 8 -12 -4 C -10 -12 0 -10 2 -4', fill: 'none', stroke: '#3a0b17', 'stroke-width': 2, 'stroke-linecap': 'round' });
    bloomSvg.appendChild(centre);

    var stageNames = [
      [15, 'Tight bud'],
      [35, 'Sepals parting'],
      [60, 'Petals unfurling'],
      [88, 'Half to fully open'],
      [101, 'Full bloom']
    ];
    var ease = function (x) { return x < 0 ? 0 : x > 1 ? 1 : 1 - Math.pow(1 - x, 3); };

    var renderBloom = function () {
      var v = Number(bloomRange.value);
      var t = v / 100;
      // Sepals: start wrapped (short, pointing in), fold out and back
      var st = ease(t / 0.45);
      sepalGroups.forEach(function (sp) {
        var scale = 0.42 + st * 0.5;
        sp.g.setAttribute('transform', 'rotate(' + (sp.angle + (1 - st) * 40) + ') scale(' + scale.toFixed(3) + ')');
      });
      // Petal rings open from outside in
      ringGroups.forEach(function (rg) {
        var start = 0.08 + rg.index * 0.16;
        var local = ease((t - start) / (1 - start));
        var closed = 0.16 + rg.index * 0.02;
        var scale = (closed + (rg.ring.size - closed) * local);
        var twist = (1 - local) * (70 + rg.index * 25);
        rg.petals.forEach(function (p) {
          p.g.setAttribute('transform', 'rotate(' + (p.angle + twist).toFixed(1) + ') scale(' + scale.toFixed(3) + ')');
        });
      });
      centre.setAttribute('opacity', (1 - ease(t / 0.7)).toFixed(2));
      centre.setAttribute('transform', 'scale(' + (0.9 + t * 0.4).toFixed(2) + ')');
      var name = stageNames.filter(function (s) { return v < s[0]; })[0][1];
      bloomStage.textContent = name;
      bloomRange.setAttribute('aria-valuetext', v + '% open, ' + name.toLowerCase());
    };
    bloomRange.addEventListener('input', renderBloom);
    renderBloom();
  }

  /* ---------------------------------------------------------------
     Gallery filters
     --------------------------------------------------------------- */
  var filterBtns = $$('.filter');
  var galleryItems = $$('#gallery-list li');
  var countEl = $('#gallery-count');
  var labelFor = { all: '', red: 'red', pink: 'pink', white: 'white', yellow: 'yellow', orange: 'orange', garden: 'garden' };

  function applyFilter(filter) {
    var shown = 0;
    galleryItems.forEach(function (li) {
      var tags = li.getAttribute('data-tags').split(' ');
      var visible = filter === 'all' || tags.indexOf(filter) !== -1;
      li.hidden = !visible;
      if (visible) shown++;
    });
    filterBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === filter)); });
    countEl.textContent = filter === 'all'
      ? 'Showing all ' + galleryItems.length + ' photos'
      : 'Showing ' + shown + ' of ' + galleryItems.length + ' photos: ' + labelFor[filter] + (filter === 'garden' ? 's' : ' roses');
  }
  filterBtns.forEach(function (b) {
    b.addEventListener('click', function () { applyFilter(b.getAttribute('data-filter')); });
  });

  /* ---------------------------------------------------------------
     Lightbox (native <dialog>: focus is kept inside, Escape closes)
     --------------------------------------------------------------- */
  var lightbox = $('#lightbox');
  var lbImg = $('#lb-img');
  var lbSource = $('#lb-source');
  var lbTitle = $('#lb-title');
  var lbCredit = $('#lb-credit');
  var lbCounter = $('#lb-counter');
  var lbList = [];
  var lbIndex = 0;
  var lbTrigger = null;

  function visibleButtons() {
    return galleryItems.filter(function (li) { return !li.hidden; }).map(function (li) { return li.querySelector('button'); });
  }

  function showLightbox(i) {
    lbIndex = (i + lbList.length) % lbList.length;
    var b = lbList[lbIndex];
    var img = b.querySelector('img');
    lbSource.setAttribute('srcset', b.getAttribute('data-full'));
    lbImg.src = b.getAttribute('data-fallback');
    lbImg.alt = img.alt;
    lbImg.width = img.width; lbImg.height = img.height;
    lbTitle.textContent = b.getAttribute('data-caption');
    lbCredit.innerHTML = '';
    var credit = document.createTextNode(b.getAttribute('data-credit') + ' · ');
    var src = document.createElement('a');
    src.href = b.getAttribute('data-page'); src.textContent = 'Source';
    var sep = document.createTextNode(' · ');
    var lic = document.createElement('a');
    lic.href = b.getAttribute('data-license'); lic.textContent = 'Licence';
    lbCredit.appendChild(credit); lbCredit.appendChild(src); lbCredit.appendChild(sep); lbCredit.appendChild(lic);
    lbCounter.textContent = 'Photo ' + (lbIndex + 1) + ' of ' + lbList.length;
    var single = lbList.length < 2;
    $('#lb-prev').hidden = single; $('#lb-next').hidden = single;
  }

  function openLightbox(button) {
    lbList = visibleButtons();
    lbTrigger = button;
    showLightbox(lbList.indexOf(button));
    if (typeof lightbox.showModal === 'function') lightbox.showModal();
    else lightbox.setAttribute('open', '');
    document.body.style.overflow = 'hidden';
    $('#lb-close').focus();
  }
  function closeLightbox() {
    if (lightbox.open && typeof lightbox.close === 'function') lightbox.close();
    else lightbox.removeAttribute('open');
  }
  lightbox.addEventListener('close', function () {
    document.body.style.overflow = '';
    if (lbTrigger) lbTrigger.focus();
  });

  galleryItems.forEach(function (li) {
    var b = li.querySelector('button');
    b.addEventListener('click', function () { openLightbox(b); });
  });
  $('#lb-close').addEventListener('click', closeLightbox);
  $('#lb-prev').addEventListener('click', function () { showLightbox(lbIndex - 1); });
  $('#lb-next').addEventListener('click', function () { showLightbox(lbIndex + 1); });
  lightbox.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); showLightbox(lbIndex - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); showLightbox(lbIndex + 1); }
    else if (e.key === 'Escape' && typeof lightbox.showModal !== 'function') closeLightbox();
  });
  // Click on the dark area (not the photo or controls) closes it
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox || e.target.id === 'lb-stage') closeLightbox();
  });

  // Simple swipe on touch screens
  var touchX = null;
  lightbox.addEventListener('touchstart', function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50 && lbList.length > 1) showLightbox(lbIndex + (dx < 0 ? 1 : -1));
    touchX = null;
  }, { passive: true });

  /* ---------------------------------------------------------------
     Seasonal care tabs (ARIA tabs with arrow-key support)
     --------------------------------------------------------------- */
  var tabs = $$('[role="tab"]');
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab); });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); selectTab(next, true); }
    });
  });

  /* ---------------------------------------------------------------
     Garden sounds: OFF by default, starts only after a Play press.
     Volumes and mute are remembered; playback is never resumed by itself.
     --------------------------------------------------------------- */
  var soundToggle = $('#sound-toggle');
  var soundPanel = $('#sound-panel');
  var statusEl = $('#sound-status');
  var birds = $('#birds-audio');
  var music = $('#music-audio');
  var ambBtn = $('#amb-play');
  var musicBtn = $('#music-play');
  var muteBtn = $('#mute-all');
  var ambVol = $('#amb-vol');
  var musicVol = $('#music-vol');

  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  var ctx = null, masterGain, ambGain, musicGain, breezeGain, breezeSrc = null, breezeLfo = null;
  var birdsRouted = false, musicRouted = false;
  var state = { amb: false, music: false, muted: store('muted') === 'true' };

  var savedAmb = store('ambVol'); if (savedAmb !== null) ambVol.value = savedAmb;
  var savedMusic = store('musicVol'); if (savedMusic !== null) musicVol.value = savedMusic;

  function setStatus(msg) { statusEl.textContent = msg; }

  function openPanel(open) {
    soundPanel.hidden = !open;
    soundToggle.setAttribute('aria-expanded', String(open));
    if (open) ambBtn.focus();
  }
  soundToggle.addEventListener('click', function () { openPanel(soundPanel.hidden); });
  $('#sound-close').addEventListener('click', function () { openPanel(false); soundToggle.focus(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !soundPanel.hidden && !lightbox.open) { openPanel(false); soundToggle.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (!soundPanel.hidden && !soundPanel.contains(e.target) && !soundToggle.contains(e.target)) openPanel(false);
  });

  function ensureContext() {
    if (ctx || !AudioCtx) return ctx;
    try {
      ctx = new AudioCtx();
      masterGain = ctx.createGain();
      ambGain = ctx.createGain();
      musicGain = ctx.createGain();
      breezeGain = ctx.createGain();
      breezeGain.gain.value = 0.5;
      ambGain.connect(masterGain);
      musicGain.connect(masterGain);
      breezeGain.connect(ambGain);
      masterGain.connect(ctx.destination);
      applyVolumes();
    } catch (e) { ctx = null; }
    return ctx;
  }

  function route(media, gainNode) {
    try {
      var src = ctx.createMediaElementSource(media);
      src.connect(gainNode);
      return true;
    } catch (e) { return false; }
  }

  function startBreeze() {
    if (!ctx || breezeSrc) return;
    // Brown noise, low-pass filtered, with a slow swell: a soft breeze
    var len = ctx.sampleRate * 4;
    var buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    var last = 0;
    for (var i = 0; i < len; i++) {
      var white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    breezeSrc = ctx.createBufferSource();
    breezeSrc.buffer = buffer;
    breezeSrc.loop = true;
    var filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 520;
    var swell = ctx.createGain();
    swell.gain.value = 0.6;
    breezeLfo = ctx.createOscillator();
    breezeLfo.frequency.value = 0.07;
    var lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 0.35;
    breezeLfo.connect(lfoDepth);
    lfoDepth.connect(swell.gain);
    breezeSrc.connect(filter);
    filter.connect(swell);
    swell.connect(breezeGain);
    breezeSrc.start();
    breezeLfo.start();
  }
  function stopBreeze() {
    if (!breezeSrc) return;
    try { breezeSrc.stop(); breezeLfo.stop(); } catch (e) { /* already stopped */ }
    breezeSrc = null; breezeLfo = null;
  }

  function applyVolumes() {
    var a = Number(ambVol.value) / 100;
    var m = Number(musicVol.value) / 100;
    var master = state.muted ? 0 : 1;
    if (ctx) {
      var now = ctx.currentTime;
      masterGain.gain.setTargetAtTime(master, now, 0.05);
      ambGain.gain.setTargetAtTime(a, now, 0.05);
      musicGain.gain.setTargetAtTime(m * 0.8, now, 0.05);
    }
    // Element volume is used when Web Audio routing is not available
    if (!birdsRouted) birds.volume = a * master;
    if (!musicRouted) music.volume = m * 0.8 * master;
  }

  function setButton(btn, playing, label) {
    btn.setAttribute('aria-pressed', String(playing));
    btn.querySelector('use').setAttribute('href', playing ? '#i-pause' : '#i-play');
    btn.querySelector('span').textContent = playing ? 'Pause' : 'Play';
    btn.setAttribute('aria-label', (playing ? 'Pause ' : 'Play ') + label);
  }
  setButton(ambBtn, false, 'garden ambience');
  setButton(musicBtn, false, 'quiet piano music');

  function updateIndicator() {
    var playing = state.amb || state.music;
    soundToggle.classList.toggle('is-playing', playing);
    $('.sound-label-sr').textContent = playing ? 'Garden sounds (playing)' : 'Garden sounds';
  }

  function hasFailed(media) {
    return media.getAttribute('data-failed') === 'true' || media.networkState === 3; // 3 = NETWORK_NO_SOURCE
  }
  [birds, music].forEach(function (media) {
    media.addEventListener('error', function () { media.setAttribute('data-failed', 'true'); }, true);
    media.addEventListener('loadstart', function () { media.removeAttribute('data-failed'); });
  });

  function playMedia(media, onFail) {
    if (hasFailed(media)) { onFail(); return; }
    var p;
    try { p = media.play(); } catch (e) { onFail(); return; }
    if (p && typeof p.catch === 'function') p.catch(onFail);
  }

  ambBtn.addEventListener('click', function () {
    if (state.amb) {
      birds.pause();
      stopBreeze();
      state.amb = false;
      setButton(ambBtn, false, 'garden ambience');
      setStatus('Garden ambience paused.');
    } else {
      ensureContext();
      if (ctx && ctx.state === 'suspended') ctx.resume();
      if (ctx && !birdsRouted) birdsRouted = route(birds, ambGain);
      applyVolumes();
      startBreeze();
      state.amb = true;
      setButton(ambBtn, true, 'garden ambience');
      setStatus(state.muted ? 'Ambience is playing, but sound is muted.' : 'Garden ambience playing.');
      playMedia(birds, function () {
        setStatus(ctx ? 'Birdsong could not be played. The breeze is still playing.' : 'Sorry, garden ambience could not be played in this browser.');
        if (!ctx) { state.amb = false; setButton(ambBtn, false, 'garden ambience'); }
        updateIndicator();
      });
    }
    updateIndicator();
  });

  musicBtn.addEventListener('click', function () {
    if (state.music) {
      music.pause();
      state.music = false;
      setButton(musicBtn, false, 'quiet piano music');
      setStatus('Music paused.');
    } else {
      ensureContext();
      if (ctx && ctx.state === 'suspended') ctx.resume();
      if (ctx && !musicRouted) musicRouted = route(music, musicGain);
      applyVolumes();
      state.music = true;
      setButton(musicBtn, true, 'quiet piano music');
      setStatus(state.muted ? 'Music is playing, but sound is muted.' : 'Loading music…');
      playMedia(music, function () {
        music.pause();
        state.music = false;
        setButton(musicBtn, false, 'quiet piano music');
        setStatus('Sorry, the music file could not be played.');
        updateIndicator();
      });
    }
    updateIndicator();
  });

  music.addEventListener('playing', function () { if (state.music && !state.muted) setStatus('Quiet piano playing.'); });
  birds.addEventListener('error', function () { if (state.amb) setStatus('Birdsong could not be loaded. The breeze is still playing.'); }, true);
  music.addEventListener('error', function () {
    if (state.music) { state.music = false; setButton(musicBtn, false, 'quiet piano music'); updateIndicator(); }
    setStatus('Sorry, the music file could not be loaded.');
  }, true);

  function setMuted(m) {
    state.muted = m;
    store('muted', m);
    muteBtn.setAttribute('aria-pressed', String(m));
    muteBtn.textContent = m ? 'Unmute' : 'Mute all';
    applyVolumes();
  }
  muteBtn.addEventListener('click', function () {
    setMuted(!state.muted);
    setStatus(state.muted ? 'All sound muted.' : 'Sound unmuted.');
  });
  setMuted(state.muted);

  ambVol.addEventListener('input', function () { store('ambVol', ambVol.value); applyVolumes(); });
  musicVol.addEventListener('input', function () { store('musicVol', musicVol.value); applyVolumes(); });
  ambVol.setAttribute('aria-valuetext', ambVol.value + '%');
  musicVol.setAttribute('aria-valuetext', musicVol.value + '%');
  [ambVol, musicVol].forEach(function (r) {
    r.addEventListener('input', function () { r.setAttribute('aria-valuetext', r.value + '%'); });
  });
})();
