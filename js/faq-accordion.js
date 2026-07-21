(function (Drupal, drupalSettings, once) {
  'use strict';

  /**
   * FAQ page: turn plain editorial markup into a Bootstrap accordion.
   *
   * The FAQ body is ordinary content — an <h5> per question followed by its
   * answer (paragraphs, lists, the occasional table). Rather than freezing a
   * redesigned copy of that content into the node body (which goes stale the
   * moment an editor adds a question), this wraps whatever is present into the
   * accordion markup css/pages/faq.css already styles.
   *
   * Consequence: questions added or reworded later inherit the design for free,
   * and editors keep working in plain rich text.
   */
  Drupal.behaviors.mhFaqAccordion = {
    attach: function (context, settings) {
      once('mh-faq-accordion', '.page-node-5045 .field--name-body', context).forEach(function (field) {
        var heads = Array.prototype.slice.call(field.querySelectorAll('h5'));
        if (!heads.length) {
          return;
        }

        // Questions are expected to be siblings. Anything nested elsewhere is
        // left alone rather than yanked out of its container.
        var parent = heads[0].parentNode;
        heads = heads.filter(function (h) {
          return h.parentNode === parent;
        });
        if (!heads.length) {
          return;
        }

        field.classList.add('mh-faq');

        var accordion = document.createElement('div');
        accordion.className = 'accordion shadow-sm rounded overflow-hidden mh-faq__accordion';
        parent.insertBefore(accordion, heads[0]);

        heads.forEach(function (head, i) {
          // The answer is everything up to the next question.
          var answer = [];
          var node = head.nextElementSibling;
          while (node && node.tagName !== 'H5') {
            var next = node.nextElementSibling;
            answer.push(node);
            node = next;
          }

          var id = 'mh-faq-q' + i;
          var item = document.createElement('div');
          item.className = 'accordion-item border-0 border-bottom';
          item.innerHTML =
            '<h2 class="accordion-header">' +
              '<button class="accordion-button collapsed fw-semibold" type="button" ' +
                'data-bs-toggle="collapse" data-bs-target="#' + id + '" ' +
                'aria-expanded="false" aria-controls="' + id + '"></button>' +
            '</h2>' +
            '<div id="' + id + '" class="accordion-collapse collapse">' +
              '<div class="accordion-body text-muted"></div>' +
            '</div>';

          // textContent, not innerHTML — the question is untrusted editor input.
          item.querySelector('.accordion-button').textContent = head.textContent.trim();

          var body = item.querySelector('.accordion-body');
          answer.forEach(function (el) {
            body.appendChild(el);
          });

          accordion.appendChild(item);
          head.remove();
        });

        // Deep link support: /faq#mh-faq-q3 opens that question.
        if (window.location.hash) {
          var target = field.querySelector(window.location.hash);
          if (target && target.classList.contains('accordion-collapse')) {
            target.classList.add('show');
            var btn = field.querySelector('[data-bs-target="' + window.location.hash + '"]');
            if (btn) {
              btn.classList.remove('collapsed');
              btn.setAttribute('aria-expanded', 'true');
            }
          }
        }
      });
    }
  };
})(Drupal, drupalSettings, once);
