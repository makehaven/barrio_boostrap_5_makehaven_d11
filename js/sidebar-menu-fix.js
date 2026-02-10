(function (Drupal, $) {

  'use strict';

  Drupal.behaviors.sidebarMenuFix = {
    attach: function (context, settings) {
      // Ensure this only runs once and only on the document (not on partial AJAX loads).
      if (context !== document) {
        return;
      }

      const sidebarMenuContainers = document.querySelectorAll('.region-sidebar-first .sidebar-menu-flat');

      sidebarMenuContainers.forEach(container => {
        // Find all li.dropdown within this sidebar menu container
        const dropdownLis = container.querySelectorAll('li.dropdown');

        dropdownLis.forEach(dropdownLi => {
          // Remove Bootstrap dropdown classes from parent LI
          dropdownLi.classList.remove('dropdown');
          dropdownLi.classList.remove('show');
          dropdownLi.classList.remove('menu-item--expanded'); // Also remove this if it's related to dropdown state

          const toggleLink = dropdownLi.querySelector('a.dropdown-toggle');
          if (toggleLink) {
            // Remove attributes and classes that enable Bootstrap dropdown JS.
            toggleLink.removeAttribute('data-bs-toggle');
            toggleLink.removeAttribute('aria-expanded');
            toggleLink.removeAttribute('aria-haspopup');
            toggleLink.classList.remove('dropdown-toggle');
            toggleLink.classList.remove('show'); // Remove 'show' class from the link
          }

          const subMenu = dropdownLi.querySelector('ul.dropdown-menu');
          if (subMenu) {
            // Remove Bootstrap dropdown classes and inline styles from sub-menu UL
            subMenu.classList.remove('dropdown-menu');
            subMenu.classList.remove('show');
            subMenu.removeAttribute('data-popper-placement');
            subMenu.removeAttribute('style'); // Remove any inline styles from Popper.js or Bootstrap

            // Force display and positioning with inline styles as a last resort
            subMenu.style.display = 'block';
            subMenu.style.position = 'static';
            subMenu.style.visibility = 'visible';
            subMenu.style.opacity = '1';
            subMenu.style.transform = 'none';
          }
        });
      });
    }
  };

})(Drupal, jQuery);
