/**
 * MakeHaven live search-as-you-type.
 * Debounced fetch to /api/quicksearch; renders a results dropdown under the
 * header search field. Falls back to the normal /search page on Enter.
 */
(function (Drupal, once) {
  'use strict';

  var ENDPOINT = '/api/quicksearch';

  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
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

          function render(data) {
            var items = (data && data.results) || [];
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
            var q = input.value.trim();
            if (q.length < 2) { hide(); return; }
            fetch(ENDPOINT + '?q=' + encodeURIComponent(q), { headers: { Accept: 'application/json' } })
              .then(function (r) { return r.json(); })
              .then(render)
              .catch(hide);
          }, 180);

          input.addEventListener('input', run);
          input.addEventListener('focus', function () { if (input.value.trim().length >= 2) run(); });
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
