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

  /* Featured projects (projects.json) */
  var featuredNames = [];
  getJSON('projects.json').then(function (list) {
    var box = document.getElementById('featured');
    list.forEach(function (p) {
      var c = el('article', 'card');
      c.appendChild(el('h3', null, p.name));
      c.appendChild(el('p', null, p.description));
      c.appendChild(tagList(p.tech));
      var links = el('div', 'card-links');
      if (safeUrl(p.demo)) links.appendChild(link(p.demo, 'Live demo'));
      if (safeUrl(p.github)) {
        links.appendChild(link(p.github, 'GitHub'));
        featuredNames.push(p.github.split('/').pop().toLowerCase());
      }
      c.appendChild(links);
      box.appendChild(c);
    });
  }).catch(function () {
    document.getElementById('featured').appendChild(el('p', 'empty', 'Projects could not be loaded. Open this site through a web server (e.g. Laragon) rather than as a file.'));
  }).then(loadRepos);

  /* GitHub repos (auto) */
  function loadRepos() {
    var box = document.getElementById('github-repos');
    fetch('https://api.github.com/users/' + GITHUB_USER + '/repos?per_page=100&sort=pushed')
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (repos) {
        box.textContent = '';
        var shown = repos.filter(function (r) {
          return !r.fork && r.name.toLowerCase() !== GITHUB_USER.toLowerCase() &&
            featuredNames.indexOf(r.name.toLowerCase()) === -1;
        });
        if (!shown.length) { box.appendChild(el('p', 'empty', 'No additional repositories to show.')); return; }
        shown.forEach(function (r) {
          var c = el('article', 'card');
          c.appendChild(el('h3', null, r.name));
          c.appendChild(el('p', null, r.description || 'No description yet.'));
          var meta = [r.language, 'Updated ' + fmtDate(r.pushed_at)].filter(Boolean).join(' · ');
          c.appendChild(el('span', 'meta', meta));
          var links = el('div', 'card-links');
          links.appendChild(link(r.html_url, 'GitHub'));
          c.appendChild(links);
          box.appendChild(c);
        });
      })
      .catch(function () {
        box.textContent = '';
        var p = el('p', 'empty', 'Could not load repositories right now. ');
        p.appendChild(link('https://github.com/' + GITHUB_USER, 'Browse them on GitHub'));
        box.appendChild(p);
      });
  }

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
})();
