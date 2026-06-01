/**
 * @file
 * Mobile primary navigation.
 *
 * On narrow viewports the primary-menu parent items (About, Programming,
 * Resources, Membership) navigate straight to their own landing page instead
 * of expanding a Bootstrap dropdown. Each parent has a real URL and its
 * children are reachable from that landing page (and the section sidebar), so
 * the extra tap-to-expand step is unnecessary on phones. On wider viewports
 * the normal dropdown behaviour is restored.
 *
 * Implemented by toggling Bootstrap's `data-bs-toggle="dropdown"` attribute:
 * Bootstrap 5 delegates dropdown clicks off that attribute, so removing it
 * lets the parent <a href> follow its link; restoring it re-enables the
 * dropdown. Mirrors the attribute-stripping approach in sidebar-menu-fix.js.
 */
(function (Drupal, once) {

  'use strict';

  var MOBILE = '(max-width: 991.98px)';

  function setMode(toggles, isMobile) {
    toggles.forEach(function (link) {
      if (isMobile) {
        if (link.hasAttribute('data-bs-toggle')) {
          link.setAttribute('data-mh-bs-toggle', link.getAttribute('data-bs-toggle'));
          link.removeAttribute('data-bs-toggle');
        }
        link.setAttribute('aria-expanded', 'false');
        // Collapse anything Bootstrap may have left open before the switch.
        var item = link.closest('.nav-item');
        if (item) {
          item.classList.remove('show');
          var menu = item.querySelector('.dropdown-menu');
          if (menu) {
            menu.classList.remove('show');
          }
        }
      } else if (link.hasAttribute('data-mh-bs-toggle')) {
        link.setAttribute('data-bs-toggle', link.getAttribute('data-mh-bs-toggle'));
        link.removeAttribute('data-mh-bs-toggle');
      }
    });
  }

  Drupal.behaviors.mhMobilePrimaryNav = {
    attach: function (context) {
      var toggles = once(
        'mh-mobile-primary-nav',
        '#navbar-main .navbar-nav > li.nav-item.dropdown > a.dropdown-toggle',
        context
      );
      if (!toggles.length) {
        return;
      }
      var mql = window.matchMedia(MOBILE);
      setMode(toggles, mql.matches);
      mql.addEventListener('change', function (event) {
        setMode(toggles, event.matches);
      });
    }
  };

})(Drupal, once);
