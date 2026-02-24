/**
 * @file
 * Global utilities.
 *
 */
(function (Drupal, once) {

  'use strict';

  Drupal.behaviors.barrio_boostrap_5_makerspace = {
    attach: function (context, settings) {
      once('mh-dashboard-sparkline', '.kpi-sparkline-wrapper svg', context).forEach(function (svg) {
        const width = parseFloat(svg.getAttribute('width')) || 120;
        const height = parseFloat(svg.getAttribute('height')) || 40;
        if (!svg.getAttribute('viewBox')) {
          svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        }
        svg.setAttribute('preserveAspectRatio', 'none');
      });
    }
  };

})(Drupal, once);
