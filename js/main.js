(function () {
  'use strict';
  var GITHUB_USER = 'Lanza00';
  // Repos to keep out of "More on GitHub" (lowercase). Forks and featured repos are hidden automatically.
  var HIDDEN_REPOS = ['lanza00', 'portfolio', 'crud', 'laravel-10-registration-form'];
  var REPOS_VISIBLE = 6; // cards shown before "Show all"
  var REPO_CACHE_KEY = 'gh-repos-' + GITHUB_USER;
  var REPO_CACHE_MS = 60 * 60 * 1000; // 1 hour
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
  // Cached for an hour so repeat visits are instant and stay under GitHub's 60 requests/hour limit.
  function readRepoCache(allowStale) {
    try {
      var c = JSON.parse(localStorage.getItem(REPO_CACHE_KEY));
      if (c && Array.isArray(c.repos) && (allowStale || Date.now() - c.time < REPO_CACHE_MS)) return c.repos;
    } catch (e) {}
    return null;
  }
  function fetchRepos() {
    var fresh = readRepoCache(false);
    if (fresh) return Promise.resolve(fresh);
    return fetch('https://api.github.com/users/' + GITHUB_USER + '/repos?per_page=100&sort=pushed')
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) {
        // Keep only the fields we render, so the cache stays small.
        var repos = data.map(function (r) {
          return { name: r.name, description: r.description, language: r.language, fork: r.fork,
            stars: r.stargazers_count, topics: r.topics || [], url: r.html_url, homepage: r.homepage, pushed: r.pushed_at };
        });
        try { localStorage.setItem(REPO_CACHE_KEY, JSON.stringify({ time: Date.now(), repos: repos })); } catch (e) {}
        return repos;
      })
      .catch(function (err) {
        var stale = readRepoCache(true); // rate-limited or offline: an older copy beats an error
        if (stale) return stale;
        throw err;
      });
  }
  function repoCard(r) {
    var c = el('article', 'card');
    var head = el('div', 'card-head');
    head.appendChild(el('h3', null, r.name));
    if (r.stars) {
      var s = el('span', 'stars', '★ ' + r.stars);
      s.setAttribute('aria-label', r.stars + (r.stars === 1 ? ' star' : ' stars'));
      head.appendChild(s);
    }
    c.appendChild(head);
    c.appendChild(el('p', null, r.description || 'No description yet.'));
    if (r.topics.length) c.appendChild(tagList(r.topics.slice(0, 4)));
    var meta = [r.language, 'Updated ' + fmtDate(r.pushed)].filter(Boolean).join(' · ');
    c.appendChild(el('span', 'meta', meta));
    var links = el('div', 'card-links');
    if (safeUrl(r.homepage)) links.appendChild(link(r.homepage, 'Live demo'));
    links.appendChild(link(r.url, 'GitHub'));
    c.appendChild(links);
    return c;
  }
  function loadRepos() {
    var box = document.getElementById('github-repos');
    fetchRepos()
      .then(function (repos) {
        box.textContent = '';
        var shown = repos.filter(function (r) {
          var n = r.name.toLowerCase();
          return !r.fork && HIDDEN_REPOS.indexOf(n) === -1 && featuredNames.indexOf(n) === -1;
        });
        if (!shown.length) { box.appendChild(el('p', 'empty', 'No additional repositories to show.')); return; }
        shown.forEach(function (r, i) {
          var c = repoCard(r);
          if (i >= REPOS_VISIBLE) c.hidden = true;
          box.appendChild(c);
        });
        if (shown.length > REPOS_VISIBLE) {
          var btn = el('button', 'chip more-toggle', 'Show all ' + shown.length);
          btn.type = 'button';
          btn.setAttribute('aria-expanded', 'false');
          btn.addEventListener('click', function () {
            var open = btn.getAttribute('aria-expanded') !== 'true';
            Array.prototype.forEach.call(box.children, function (c, i) { if (i >= REPOS_VISIBLE) c.hidden = !open; });
            btn.setAttribute('aria-expanded', String(open));
            btn.textContent = open ? 'Show less' : 'Show all ' + shown.length;
          });
          box.insertAdjacentElement('afterend', btn);
        }
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
