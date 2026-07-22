/**
 * MakeHaven live search-as-you-type.
 *
 * Debounced fetch to a Views REST export; renders a results dropdown under the
 * header search field. Enter still submits the normal /search page, so the
 * dropdown is purely additive — if the endpoint is missing or errors, the
 * header search keeps working exactly as it does today.
 *
 * Backend contract (see the view described in the PR):
 *   GET /api/v0/quicksearch?q=<term>&_format=json
 *   -> [ { title, path, type }, ... ]
 *
 * Field keys are read leniently (title|label, path|url|view_node,
 * type|node_type|bundle) and values are accepted either raw or as rendered
 * markup, so the view's exact field configuration does not have to match a
 * spec precisely for this to work.
 */
(function (Drupal, once) {
  'use strict';

  var ENDPOINT = '/api/v0/quicksearch';
  var MIN_CHARS = 2;

  // Set false the first time the endpoint is unreachable, so an environment
  // without the view configured yet does not fire a request per keystroke.
  var endpointAvailable = true;

  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }

  /** First present, non-empty value among several possible field keys. */
  function pick(row, keys) {
    for (var i = 0; i < keys.length; i++) {
      var v = row[keys[i]];
      if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
    }
    return '';
  }

  /** Views may return a raw string or rendered markup — take the text. */
  function toText(value) {
    if (value.indexOf('<') === -1) return value.trim();
    var d = document.createElement('div');
    d.innerHTML = value;
    return (d.textContent || '').trim();
  }

  /** Likewise for links: accept a plain path or an <a href="…">. */
  function toHref(value) {
    if (value.indexOf('<') === -1) return value.trim();
    var d = document.createElement('div');
    d.innerHTML = value;
    var a = d.querySelector('a');
    return a ? a.getAttribute('href') : '';
  }

  /** Accept either a bare array of rows or a { results: [...] } envelope. */
  function normalise(data) {
    var rows = Array.isArray(data) ? data : (data && data.results) || [];
    return rows.map(function (row) {
      return {
        title: toText(pick(row, ['title', 'label', 'node_title', 'name'])),
        url: toHref(pick(row, ['path', 'url', 'view_node'])),
        type: toText(pick(row, ['type', 'node_type', 'bundle']))
      };
    }).filter(function (r) { return r.title && r.url; });
  }

  Drupal.behaviors.mhQuickSearch = {
    attach: function (context) {
      once('mh-quicksearch', '#views-exposed-form-site-search-page-1 input[name="keys"]', context)
        .forEach(function (input) {
          // Suppress the browser's native autocomplete so it doesn't overlap
          // our live results dropdown.
          input.setAttribute('autocomplete', 'off');
          input.setAttribute('autocorrect', 'off');
          input.setAttribute('autocapitalize', 'off');
          input.setAttribute('spellcheck', 'false');

          var box = document.createElement('div');
          box.className = 'mh-qs-dropdown';
          box.style.display = 'none';
          document.body.appendChild(box);

          function position() {
            var r = input.getBoundingClientRect();
            box.style.left = r.left + 'px';
            box.style.top = (r.bottom + 6) + 'px';
            box.style.width = Math.max(r.width, 300) + 'px';
          }
          function hide() { box.style.display = 'none'; }
          function show() { position(); box.style.display = 'block'; }

          function render(items) {
            if (!items.length) {
              box.innerHTML = '<div class="mh-qs-empty">No quick matches — press Enter to search everything.</div>';
              show();
              return;
            }
            box.innerHTML = '';
            items.forEach(function (it) {
              var a = document.createElement('a');
              a.className = 'mh-qs-item';
              a.href = it.url;
              var title = document.createElement('span');
              title.className = 'mh-qs-title';
              title.textContent = it.title;            // textContent = XSS-safe
              var type = document.createElement('span');
              type.className = 'mh-qs-type';
              type.textContent = (it.type || '').replace(/_/g, ' ');
              a.appendChild(title);
              a.appendChild(type);
              box.appendChild(a);
            });
            show();
          }

          var run = debounce(function () {
            if (!endpointAvailable) return;
            var q = input.value.trim();
            if (q.length < MIN_CHARS) { hide(); return; }
            var url = ENDPOINT + '?q=' + encodeURIComponent(q) + '&_format=json';
            fetch(url, { headers: { Accept: 'application/json' } })
              .then(function (r) {
                // 404 = view not configured on this environment. Stand down
                // quietly rather than erroring on every keystroke.
                if (!r.ok) { endpointAvailable = false; throw new Error('quicksearch unavailable'); }
                return r.json();
              })
              .then(function (data) { render(normalise(data)); })
              .catch(hide);
          }, 180);

          input.addEventListener('input', run);
          input.addEventListener('focus', function () { if (input.value.trim().length >= MIN_CHARS) run(); });
          window.addEventListener('scroll', function () { if (box.style.display === 'block') position(); }, true);
          window.addEventListener('resize', function () { if (box.style.display === 'block') position(); });
          document.addEventListener('click', function (e) {
            if (e.target !== input && !box.contains(e.target)) hide();
          });
          input.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
        });
    }
  };
})(Drupal, once);
