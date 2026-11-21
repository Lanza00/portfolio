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
  loadShowcase('apps.json', 'apps-list', 'Projects', function (box) {
    makeSlider(box, 'Projects');
    revealOnScroll(box);
  });

  /* Posts (posts.json): a "Now building" strip on top, then post cards in a slider.
     now[]: title, note, status (ongoing/planned/onhold...), progress (0-100, optional)
     posts[]: date, tag, title, excerpt, image or shots[] (+coverColor), gallery[] {src, caption},
              body[] (paragraphs; a line starting with "- " is a bullet), links[] {url, text} */
  function renderNow(items) {
    var box = document.getElementById('now-list');
    if (!items || !items.length) { box.remove(); return; }
    var head = el('div', 'now-head');
    head.appendChild(el('span', 'now-pulse'));
    head.appendChild(el('span', null, 'Now building'));
    box.appendChild(head);
    var ul = el('ul', 'now-items');
    items.forEach(function (n) {
      var li = el('li', 'now-item');
      var top = el('div', 'now-top');
      top.appendChild(el('strong', null, n.title));
      var st = STATUS[n.status] ? n.status : 'ongoing';
      top.appendChild(el('span', 'badge s-' + st, STATUS[st]));
      li.appendChild(top);
      if (n.note) li.appendChild(el('p', null, n.note));
      if (typeof n.progress === 'number') {
        var pct = Math.max(0, Math.min(100, n.progress));
        var bar = el('div', 'now-bar');
        bar.setAttribute('role', 'progressbar');
        bar.setAttribute('aria-valuenow', pct); bar.setAttribute('aria-valuemin', 0); bar.setAttribute('aria-valuemax', 100);
        bar.setAttribute('aria-label', n.title + ' progress');
        var fill = el('span');
        fill.style.setProperty('--pct', pct + '%');
        bar.appendChild(fill);
        li.appendChild(bar);
        li.appendChild(el('span', 'now-pct', pct + '%'));
      }
      ul.appendChild(li);
    });
    box.appendChild(ul);
  }

  function readTime(p) {
    var words = [p.excerpt].concat(p.body || []).join(' ').split(/\s+/).length;
    return Math.max(1, Math.round(words / 200)) + ' min read';
  }
  function postCover(p) {
    var shots = p.shots || [];
    if (!p.image && !shots.length) return null;
    var cover = el('div', 'game-cover' + (shots.length ? ' phones' : ''));
    if (p.coverColor) cover.style.setProperty('--cover', p.coverColor);
    (shots.length ? shots : [p.image]).forEach(function (src) {
      var img = el('img');
      img.src = src; img.alt = ''; img.loading = 'lazy';
      if (shots.length) { img.width = 469; img.height = 1015; } else { img.width = 800; img.height = 500; }
      cover.appendChild(img);
    });
    return cover;
  }
  function postCard(p, i) {
    var c = el('article', 'game-card post-card');
    var open = function () { openPost(p); };
    var cover = postCover(p);
    if (cover) {
      cover.addEventListener('click', open);
      if (i === 0) cover.appendChild(el('span', 'post-new', 'Latest'));
      c.appendChild(cover);
    }
    var body = el('div', 'game-body');
    body.appendChild(el('span', 'game-label', p.tag || 'Post'));
    body.appendChild(el('h3', null, p.title));
    body.appendChild(el('span', 'post-meta', fmtDate(p.date) + ' · ' + readTime(p)));
    body.appendChild(el('p', 'post-excerpt', p.excerpt));
    var actions = el('div', 'game-actions');
    var btn = el('button', 'btn btn-primary', 'Read post');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Read post: ' + p.title);
    btn.addEventListener('click', open);
    actions.appendChild(btn);
    var first = (p.links || []).filter(function (l) { return safeUrl(l.url); })[0];
    if (first) { var a = link(first.url, first.text || 'Open'); a.className = 'btn'; actions.appendChild(a); }
    body.appendChild(actions);
    c.appendChild(body);
    return c;
  }

  var dialog = document.getElementById('post-dialog');
  function openPost(p) {
    var box = dialog.querySelector('.post-dialog-body');
    box.textContent = '';
    box.appendChild(el('span', 'game-label', (p.tag || 'Post')));
    var h = el('h3', null, p.title); h.id = 'post-dialog-title';
    box.appendChild(h);
    box.appendChild(el('span', 'post-meta', fmtDate(p.date) + ' · ' + readTime(p)));
    if (p.gallery && p.gallery.length) {
      var g = el('div', 'post-gallery');
      p.gallery.forEach(function (f) {
        var fig = el('figure');
        var img = el('img'); img.src = f.src; img.alt = f.caption || ''; img.loading = 'lazy';
        var zoom = el('a', 'post-zoom'); zoom.href = f.src; zoom.target = '_blank'; zoom.rel = 'noopener';
        zoom.title = 'Open full size'; zoom.appendChild(img);
        fig.appendChild(zoom);
        if (f.caption) fig.appendChild(el('figcaption', null, f.caption));
        g.appendChild(fig);
      });
      box.appendChild(g);
    } else {
      var cover = postCover(p);
      if (cover) { cover.classList.add('post-dialog-cover'); box.appendChild(cover); }
    }
    var list = null;
    (p.body || [p.excerpt]).forEach(function (line) {
      if (/^- /.test(line)) {
        if (!list) { list = el('ul', 'post-points'); box.appendChild(list); }
        list.appendChild(el('li', null, line.slice(2)));
      } else {
        list = null;
        box.appendChild(el('p', null, line));
      }
    });
    var links = (p.links || []).filter(function (l) { return safeUrl(l.url); });
    if (links.length) {
      var row = el('div', 'game-actions');
      links.forEach(function (l, i) { var a = link(l.url, l.text || 'Open'); a.className = 'btn' + (i ? '' : ' btn-primary'); row.appendChild(a); });
      box.appendChild(row);
    }
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
    dialog.scrollTop = 0;
  }
  if (dialog) {
    dialog.querySelector('.post-dialog-close').addEventListener('click', function () { dialog.close(); });
    // Click on the dark backdrop closes it
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
  }

  getJSON('posts.json').then(function (data) {
    var box = document.getElementById('post-list');
    box.textContent = '';
    renderNow(data.now);
    var list = (data.posts || []).slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    if (!list.length) { box.appendChild(el('p', 'empty', 'Nothing here yet.')); return; }
    list.forEach(function (p, i) { box.appendChild(postCard(p, i)); });
    makeSlider(box, 'Posts');
    revealOnScroll(box);
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
