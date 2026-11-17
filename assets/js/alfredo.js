/* Alfredo – Pizza e Cucina
   Tutto ciò che si muove: barra in alto, comparsa allo scorrimento, categorie
   attive, farina nella testata, ingrandimento delle foto. La pagina funziona
   anche senza: qui c'è solo il di più. */
(function () {
  'use strict';

  var doc = document.documentElement;
  var fermo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nav = document.getElementById('nav');
  var barra = document.getElementById('progress');
  var hero = document.querySelector('.hero');
  var sfondo = document.querySelector('.hero-bg');
  var dock = document.querySelector('.dock');
  var su = document.querySelector('.to-top');
  var fascia = document.querySelector('.chips');

  /* ---------- Scorrimento: barra, navigazione, sfondo che scivola ---------- */
  var inAttesa = false;
  function aggiorna() {
    inAttesa = false;
    var y = window.scrollY || doc.scrollTop;
    var max = doc.scrollHeight - doc.clientHeight;
    var altezzaHero = hero ? hero.offsetHeight : 600;

    if (barra) barra.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    if (nav) {
      nav.classList.toggle('scrolled', y > 24);
      nav.classList.toggle('past', y > altezzaHero * 0.55);
    }
    if (dock) dock.classList.toggle('show', y > altezzaHero * 0.45);
    if (su) su.classList.toggle('show', y > altezzaHero);
    /* Le categorie diventano una fascia piena solo quando si agganciano sotto la barra */
    if (fascia && nav) fascia.classList.toggle('stuck', fascia.getBoundingClientRect().top <= nav.offsetHeight + 1);
    /* Lo sfondo scende a un terzo della velocità: dà profondità alla testata */
    if (sfondo && !fermo && y < altezzaHero) sfondo.style.transform = 'translate3d(0,' + (y * 0.3).toFixed(1) + 'px,0)';
  }
  function suScorrimento() {
    if (!inAttesa) { inAttesa = true; requestAnimationFrame(aggiorna); }
  }
  window.addEventListener('scroll', suScorrimento, { passive: true });
  window.addEventListener('resize', suScorrimento);
  aggiorna();

  /* ---------- Comparsa allo scorrimento ---------- */
  var daMostrare = document.querySelectorAll('[data-r]');
  if (!('IntersectionObserver' in window) || fermo) {
    daMostrare.forEach(function (el) { el.classList.add('in'); });
  } else {
    var oss = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) {
        if (v.isIntersecting) { v.target.classList.add('in'); oss.unobserve(v.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
    daMostrare.forEach(function (el) { oss.observe(el); });
  }

  /* ---------- Categorie del menù: segna quella che si sta leggendo ---------- */
  var chips = document.querySelector('.chips ul');
  var voci = chips ? chips.querySelectorAll('a') : [];
  var categorie = document.querySelectorAll('.cat');
  function accendi(id) {
    voci.forEach(function (a) {
      var attiva = a.getAttribute('href') === '#' + id;
      a.classList.toggle('on', attiva);
      if (attiva) {
        a.setAttribute('aria-current', 'true');
        /* Porta la voce attiva al centro della fila, senza spostare la pagina */
        var centro = a.offsetLeft - (chips.clientWidth - a.offsetWidth) / 2;
        chips.scrollTo({ left: Math.max(0, centro), behavior: fermo ? 'auto' : 'smooth' });
      } else {
        a.removeAttribute('aria-current');
      }
    });
  }
  if (categorie.length && 'IntersectionObserver' in window) {
    var visibili = {};
    var spia = new IntersectionObserver(function (elenco) {
      elenco.forEach(function (v) { visibili[v.target.id] = v.isIntersecting; });
      for (var i = 0; i < categorie.length; i++) {
        if (visibili[categorie[i].id]) { accendi(categorie[i].id); return; }
      }
    }, { rootMargin: '-38% 0px -55% 0px' });
    categorie.forEach(function (c) { spia.observe(c); });
  }

  /* ---------- Farina nella testata ---------- */
  var tela = document.querySelector('.farina');
  if (tela && !fermo && tela.getContext) {
    var ctx = tela.getContext('2d');
    var granelli = [];
    var larg = 0, alt = 0, dpr = 1, attiva = true, ultimo = 0;

    function misura() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      larg = tela.clientWidth; alt = tela.clientHeight;
      tela.width = Math.round(larg * dpr); tela.height = Math.round(alt * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var quanti = Math.round(Math.min(70, Math.max(26, larg * alt / 16000)));
      granelli = [];
      for (var i = 0; i < quanti; i++) granelli.push(nuovo(true));
    }
    function nuovo(ovunque) {
      var grande = Math.random() < 0.16;   /* qualche granello fuori fuoco, in primo piano */
      return {
        x: Math.random() * larg,
        y: ovunque ? Math.random() * alt : alt + 10,
        r: grande ? 3 + Math.random() * 5 : 0.6 + Math.random() * 1.6,
        vx: (Math.random() - 0.5) * 9,
        vy: -(4 + Math.random() * 13),
        a: grande ? 0.10 + Math.random() * 0.12 : 0.25 + Math.random() * 0.5,
        fase: Math.random() * Math.PI * 2,
        passo: 0.4 + Math.random() * 0.9,
        grande: grande
      };
    }
    function disegna(ora) {
      if (!attiva) return;
      var dt = Math.min(0.05, (ora - ultimo) / 1000 || 0.016);
      ultimo = ora;
      ctx.clearRect(0, 0, larg, alt);
      for (var i = 0; i < granelli.length; i++) {
        var g = granelli[i];
        g.fase += g.passo * dt;
        g.x += (g.vx + Math.sin(g.fase) * 6) * dt;
        g.y += g.vy * dt;
        if (g.y < -12 || g.x < -12 || g.x > larg + 12) { granelli[i] = nuovo(false); continue; }
        var luce = g.a * (0.65 + 0.35 * Math.sin(g.fase * 1.7));
        ctx.beginPath();
        if (g.grande) {
          /* I granelli vicini sono fuori fuoco: bordo sfumato invece che netto */
          var raggio = g.r * 2.4;
          var alone = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, raggio);
          alone.addColorStop(0, 'rgba(255,244,226,' + luce.toFixed(3) + ')');
          alone.addColorStop(1, 'rgba(255,244,226,0)');
          ctx.fillStyle = alone;
          ctx.arc(g.x, g.y, raggio, 0, 6.2832);
        } else {
          ctx.fillStyle = 'rgba(255,244,226,' + luce.toFixed(3) + ')';
          ctx.arc(g.x, g.y, g.r, 0, 6.2832);
        }
        ctx.fill();
      }
      requestAnimationFrame(disegna);
    }
    function parti() { if (!attiva) { attiva = true; ultimo = performance.now(); requestAnimationFrame(disegna); } }

    misura();
    requestAnimationFrame(disegna);
    var ridimensiona;
    window.addEventListener('resize', function () { clearTimeout(ridimensiona); ridimensiona = setTimeout(misura, 200); });
    /* Si ferma quando la testata non si vede o la scheda è in secondo piano */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (v) {
        if (v[0].isIntersecting && !document.hidden) parti(); else attiva = false;
      }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) attiva = false; else if (window.scrollY < hero.offsetHeight) parti();
    });
  }

  /* ---------- Ingrandimento delle foto ---------- */
  var lb = document.getElementById('lb');
  var foto = Array.prototype.slice.call(document.querySelectorAll('a.ph'));
  if (lb && lb.showModal && foto.length) {
    var grande = lb.querySelector('img');
    var didascalia = lb.querySelector('figcaption');
    var corrente = 0;

    function mostra(i) {
      corrente = (i + foto.length) % foto.length;
      var a = foto[corrente];
      var piccola = a.querySelector('img');
      grande.src = a.getAttribute('href');
      grande.alt = piccola.alt;
      didascalia.textContent = piccola.alt + '  ·  ' + (corrente + 1) + ' / ' + foto.length;
    }
    foto.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        mostra(i);
        lb.showModal();
      });
    });
    lb.querySelector('.lb-x').addEventListener('click', function () { lb.close(); });
    lb.querySelector('.lb-prev').addEventListener('click', function () { mostra(corrente - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { mostra(corrente + 1); });
    /* Un tocco fuori dalla foto chiude */
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.tagName === 'FIGURE') lb.close();
    });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') mostra(corrente - 1);
      if (e.key === 'ArrowRight') mostra(corrente + 1);
    });
    /* Sul telefono: si sfoglia strisciando */
    var x0 = null;
    lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 50) mostra(corrente + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* ---------- Anno nel piè di pagina ---------- */
  var anno = document.getElementById('anno');
  if (anno) anno.textContent = new Date().getFullYear();
})();
