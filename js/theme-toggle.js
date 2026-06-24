/**
 * MakeHaven light/dark theme toggle.
 *
 * Light is the default. The chosen mode is stored in localStorage so it
 * persists across page loads. Sets <html data-bs-theme="light|dark">.
 *
 * Follow-up (per J.R.): for signed-in members, read/write the preference
 * from a user-profile field and render the attribute server-side so it
 * applies before first paint and follows the member across devices.
 */
(function (Drupal, once) {
  'use strict';

  var KEY = 'mh-theme';
  var root = document.documentElement;

  function currentMode() {
    return root.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light';
  }

  function apply(mode) {
    root.setAttribute('data-bs-theme', mode === 'dark' ? 'dark' : 'light');
  }

  // Apply the saved preference as early as this script runs (default: light).
  try {
    apply(localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light');
  } catch (e) {
    apply('light');
  }

  Drupal.behaviors.mhThemeToggle = {
    attach: function (context) {
      // Inject the toggle as the last item of the primary nav menu. On
      // desktop it sits inline next to the menu tabs; on mobile it falls
      // inside the hamburger collapse automatically.
      once('mh-theme-toggle', '#navbar-main .navbar-nav', context).forEach(function (nav) {
        var li = document.createElement('li');
        li.className = 'nav-item mh-theme-toggle-item';

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mh-theme-toggle';
        btn.setAttribute('aria-label', 'Toggle dark mode');
        btn.setAttribute('title', 'Toggle light / dark mode');

        function paint() {
          btn.textContent = currentMode() === 'dark' ? '☀' : '☾'; // sun / moon
        }
        paint();

        btn.addEventListener('click', function () {
          var next = currentMode() === 'dark' ? 'light' : 'dark';
          apply(next);
          try { localStorage.setItem(KEY, next); } catch (e) {}
          paint();
        });

        li.appendChild(btn);
        nav.appendChild(li);
      });
    }
  };
})(Drupal, once);
