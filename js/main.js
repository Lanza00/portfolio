(function () {
  'use strict';
  var GITHUB_USER = 'Lanza00';
  var STATUS = {
    ongoing: 'Ongoing',
    planned: 'Planned',
    completed: 'Completed',
    onhold: 'On hold',
    abandoned: 'Abandoned'
  };


  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function fmtDate(iso) {
    var d = new Date(iso);
    return isNaN(d) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function getJSON(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(url + ' ' + r.status);
      return r.json();
    });
  }
  function tagList(items) {
    var ul = el('ul', 'tags');
    (items || []).forEach(function (t) { ul.appendChild(el('li', null, t)); });
    return ul;
  }
  function safeUrl(u) { return /^https?:\/\//i.test(u || '') ? u : ''; }
  function link(href, text) {
    var a = el('a', null, text);
    a.href = href; a.target = '_blank'; a.rel = 'noopener';
    return a;
  }

  /* Mobile nav */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('site-nav');
  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
  });
  document.getElementById('year').textContent = new Date().getFullYear();

  /* Showcase cards: games (projects.json) and web apps (apps.json) share one card layout.
     Fields: name, label, description, tech[], image (one cover) or shots[] (phone screenshots),
     demo (live link), demoText (button text, default "Play now"), github, note (small print). */
  function showcaseCard(p) {
    var demo = safeUrl(p.demo);
    var c = el('article', 'game-card');
    var shots = p.shots || [];
    if (p.image || shots.length) {
      // Cover duplicates the main button, so it is hidden from screen readers and the tab order
      var cover = el(demo ? 'a' : 'div', 'game-cover' + (shots.length ? ' phones' : ''));
      if (demo) { cover.href = demo; cover.target = '_blank'; cover.rel = 'noopener'; cover.tabIndex = -1; cover.setAttribute('aria-hidden', 'true'); }
      if (p.coverColor) cover.style.setProperty('--cover', p.coverColor);
      (shots.length ? shots : [p.image]).forEach(function (src) {
        var img = el('img');
        img.src = src; img.alt = ''; img.loading = 'lazy';
        if (shots.length) { img.width = 469; img.height = 1015; } else { img.width = 800; img.height = 500; }
        cover.appendChild(img);
      });
      if (demo) cover.appendChild(el('span', 'play-badge', '▶'));
      c.appendChild(cover);
    }
    var body = el('div', 'game-body');
    if (p.label) body.appendChild(el('span', 'game-label', p.label));
    body.appendChild(el('h3', null, p.name));
    body.appendChild(el('p', null, p.description));
    body.appendChild(tagList(p.tech));
    var links = el('div', 'game-actions');
    if (demo) {
      var text = p.demoText || 'Play now';
      var main = link(demo, '▶ ' + text);
      main.className = 'btn btn-primary';
      main.setAttribute('aria-label', text + ': ' + p.name + ' (opens in a new tab)');
      links.appendChild(main);
    }
    if (safeUrl(p.github)) {
      var gh = link(p.github, 'View code');
      gh.className = 'btn' + (demo ? '' : ' btn-primary');
      links.appendChild(gh);
    }
    body.appendChild(links);
    if (p.note) body.appendChild(el('span', 'game-note', p.note));
    c.appendChild(body);
    return c;
  }
  function loadShowcase(url, boxId, what, done) {
    var box = document.getElementById(boxId);
    getJSON(url).then(function (list) {
      list.forEach(function (p) { box.appendChild(showcaseCard(p)); });
      if (done) done(box);
    }).catch(function () {
      box.appendChild(el('p', 'empty', what + ' could not be loaded. Open this site through a web server (e.g. Laragon) rather than as a file.'));
    });
  }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Cards rise in one after another when the section scrolls into view */
  function revealOnScroll(box) {
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    var cards = Array.prototype.slice.call(box.children);
    cards.forEach(function (c, i) { c.classList.add('reveal'); c.style.setProperty('--i', i); });
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      cards.forEach(function (c) { c.classList.add('in'); });
      io.disconnect();
    }, { threshold: 0.15 });
    io.observe(box);
  }

  /* Slider: one swipeable row with arrows and dots. Without JS the cards stay a grid. */
  function makeSlider(box, label) {
    var cards = box.children;
    if (cards.length < 2) return;
    box.classList.add('slider');
    box.tabIndex = 0; // arrow keys scroll it
    box.setAttribute('role', 'region');
    box.setAttribute('aria-label', label + ' (swipe or use the arrows)');

    var nav = el('div', 'slider-nav');
    var prev = el('button', 'slider-btn', '\u2039');
    var next = el('button', 'slider-btn', '\u203A');
    prev.type = next.type = 'button';
    prev.setAttribute('aria-label', 'Previous');
    next.setAttribute('aria-label', 'Next');
    var dots = el('div', 'slider-dots');
    Array.prototype.forEach.call(cards, function (c, i) {
      var d = el('button', 'dot');
      d.type = 'button';
      d.setAttribute('aria-label', 'Show ' + c.querySelector('h3').textContent);
      d.addEventListener('click', function () { go(i); });
      dots.appendChild(d);
    });
    nav.appendChild(prev); nav.appendChild(dots); nav.appendChild(next);
    box.parentNode.insertBefore(nav, box.nextSibling);

    function step() { return cards[1].offsetLeft - cards[0].offsetLeft; }
    function go(i) { box.scrollTo({ left: cards[i].offsetLeft - cards[0].offsetLeft }); }
    prev.addEventListener('click', function () { box.scrollBy({ left: -step() }); });
    next.addEventListener('click', function () { box.scrollBy({ left: step() }); });

    function update() {
      var max = box.scrollWidth - box.clientWidth;
      nav.hidden = max < 4; // everything fits, no need for controls
      prev.disabled = box.scrollLeft < 4;
      next.disabled = box.scrollLeft > max - 4;
      // Light up the dot of every card that is mostly on screen
      var left = box.scrollLeft, right = left + box.clientWidth;
      Array.prototype.forEach.call(cards, function (c, i) {
        var x = c.offsetLeft - cards[0].offsetLeft + 4, mid = x + c.offsetWidth / 2;
        dots.children[i].classList.toggle('on', mid > left && mid < right);
      });
    }
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; update(); });
    }
    box.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  loadShowcase('projects.json', 'featured', 'Games', function (box) {
    makeSlider(box, 'Games');
    revealOnScroll(box);
  });
  loadShowcase('apps.json', 'apps-list', 'Projects');

  /* Posts (posts.json) */
  var posts = [], active = 'all';
  function renderPosts() {
    var box = document.getElementById('post-list');
    box.textContent = '';
    var list = posts.filter(function (p) { return active === 'all' || p.status === active; });
    if (!list.length) { box.appendChild(el('p', 'empty', 'Nothing here yet.')); return; }
    list.forEach(function (p) {
      var c = el('article', 'post');
      var top = el('div', 'post-top');
      top.appendChild(el('span', 'badge s-' + (STATUS[p.status] ? p.status : 'completed'), STATUS[p.status] || p.status));
      top.appendChild(el('span', 'meta', fmtDate(p.date)));
      c.appendChild(top);
      c.appendChild(el('h3', null, p.title));
      c.appendChild(el('p', null, p.body));
      if (safeUrl(p.link)) c.appendChild(link(p.link, p.linkText || 'Read more'));
      box.appendChild(c);
    });
  }
  function renderFilters() {
    var bar = document.getElementById('post-filters');
    bar.textContent = '';
    var keys = ['all'].concat(Object.keys(STATUS).filter(function (k) {
      return posts.some(function (p) { return p.status === k; });
    }));
    keys.forEach(function (k) {
      var b = el('button', 'chip' + (k === active ? ' on' : ''), k === 'all' ? 'All' : STATUS[k]);
      b.type = 'button';
      b.addEventListener('click', function () { active = k; renderFilters(); renderPosts(); });
      bar.appendChild(b);
    });
  }
  getJSON('posts.json').then(function (data) {
    posts = data.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    renderFilters(); renderPosts();
  }).catch(function () {
    document.getElementById('post-list').textContent = '';
    document.getElementById('post-list').appendChild(el('p', 'empty', 'Posts could not be loaded. Open this site through a web server (e.g. Laragon) rather than as a file.'));
  });

  // Experience: smooth open/close for <details class="job">. Without JS, native toggle still works.
  document.querySelectorAll('details.job').forEach(function (d) {
    var body = d.querySelector('.job-body');
    var anim = null;
    d.querySelector('summary').addEventListener('click', function (e) {
      if (reduceMotion || !body.animate) return;
      e.preventDefault();
      var start = d.open ? body.getBoundingClientRect().height : 0; // read before cancel so a mid-animation click doesn't jump
      if (anim) anim.cancel();
      var closing = d.open && !d.classList.contains('closing');
      if (closing) {
        d.classList.add('closing');
      } else {
        d.classList.remove('closing');
        d.open = true;
      }
      var end = closing ? 0 : body.scrollHeight;
      anim = body.animate({ height: [start + 'px', end + 'px'] }, { duration: 200, easing: 'ease' });
      anim.onfinish = function () {
        anim = null;
        if (closing) { d.open = false; d.classList.remove('closing'); }
      };
    });
  });
})();
