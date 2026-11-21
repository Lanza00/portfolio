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

  /* Games (projects.json) */
  getJSON('projects.json').then(function (list) {
    var box = document.getElementById('featured');
    list.forEach(function (p) {
      var demo = safeUrl(p.demo);
      var c = el('article', 'game-card');
      if (p.image) {
        // Cover: clickable screenshot with a play badge (decorative duplicate of the Play button, so hidden from screen readers)
        var cover = el(demo ? 'a' : 'div', 'game-cover');
        if (demo) { cover.href = demo; cover.target = '_blank'; cover.rel = 'noopener'; cover.tabIndex = -1; cover.setAttribute('aria-hidden', 'true'); }
        var img = el('img');
        img.src = p.image; img.alt = ''; img.loading = 'lazy'; img.width = 800; img.height = 500;
        cover.appendChild(img);
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
        var play = link(demo, '▶ Play now');
        play.className = 'btn btn-primary';
        play.setAttribute('aria-label', 'Play ' + p.name + ' (opens in a new tab)');
        links.appendChild(play);
      }
      if (safeUrl(p.github)) {
        var gh = link(p.github, 'View code');
        gh.className = 'btn';
        links.appendChild(gh);
      }
      body.appendChild(links);
      c.appendChild(body);
      box.appendChild(c);
    });
  }).catch(function () {
    document.getElementById('featured').appendChild(el('p', 'empty', 'Games could not be loaded. Open this site through a web server (e.g. Laragon) rather than as a file.'));
  });

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
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
