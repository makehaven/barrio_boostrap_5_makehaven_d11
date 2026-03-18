(function (Drupal, drupalSettings, once) {
  'use strict';

  /**
   * On badge term detail pages:
   * Inject a "View all badge holders" link pointing to /badges/[TID]/earned
   */
  Drupal.behaviors.makerspaceBadgeDetailD11 = {
    attach: function (context, settings) {
      const currentPath = (settings.path && settings.path.currentPath) || '';
      const tidMatch = currentPath.match(/^taxonomy\/term\/(\d+)$/);
      if (!tidMatch) return;

      const tid = tidMatch[1];
      const badgesPath = `/badges/${tid}/earned`;

      once('badge-holders-link', '.group-contact-badger', context).forEach(function (el) {
        const link = document.createElement('p');
        link.className = 'badge-holders-link';
        link.innerHTML = `<a href="${badgesPath}">View all active &amp; pending badge holders &rarr;</a>`;
        el.appendChild(link);
      });
    }
  };

})(Drupal, drupalSettings, once);
