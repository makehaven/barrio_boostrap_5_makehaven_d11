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

        // Search box (feedback #44234): filters questions by their question and
        // answer text, and opens the matches once only a few are left.
        var search = document.createElement('div');
        search.className = 'mh-faq__search mb-3';
        search.innerHTML =
          '<label class="visually-hidden" for="mh-faq-search"></label>' +
          '<input type="search" id="mh-faq-search" class="form-control form-control-lg" autocomplete="off">' +
          '<p class="mh-faq__no-match text-muted mt-3" hidden></p>';
        search.querySelector('label').textContent = Drupal.t('Search the FAQ');
        var input = search.querySelector('input');
        input.placeholder = Drupal.t('Search the FAQ, e.g. guests, storage, cancel');
        var noMatch = search.querySelector('.mh-faq__no-match');
        noMatch.innerHTML = Drupal.t('No question matches that. Ask us at <a href="mailto:info@makehaven.org">info@makehaven.org</a>.');
        parent.insertBefore(search, accordion);

        var items = Array.prototype.slice.call(accordion.querySelectorAll('.accordion-item'));
        var haystacks = items.map(function (item) {
          return item.textContent.toLowerCase();
        });
        input.addEventListener('input', function () {
          var terms = input.value.toLowerCase().split(/\s+/).filter(Boolean);
          var shown = [];
          items.forEach(function (item, i) {
            var match = terms.every(function (t) {
              return haystacks[i].indexOf(t) !== -1;
            });
            item.hidden = !match;
            if (match) {
              shown.push(item);
            }
          });
          noMatch.hidden = shown.length > 0;
          var open = terms.length > 0 && shown.length <= 3;
          items.forEach(function (item) {
            var panel = item.querySelector('.accordion-collapse');
            var btn = item.querySelector('.accordion-button');
            var expand = open && !item.hidden;
            panel.classList.toggle('show', expand);
            btn.classList.toggle('collapsed', !expand);
            btn.setAttribute('aria-expanded', expand ? 'true' : 'false');
          });
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
