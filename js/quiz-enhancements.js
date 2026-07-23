/**
 * @file
 * Quiz UX enhancements for ALL quizzes (scoped to body.path-quiz). Pairs with
 * css/pages/quiz.css. Purely additive over the contrib Quiz module output:
 *   1. Whole-option-row is clickable + a selected-state class (fallback for
 *      browsers without :has()).
 *   2. The feedback "narrative" paragraph(s) get .mh-quiz-explanation so CSS can
 *      render them as a callout (the module emits them as bare <p> with no hook).
 *   3. A small legend under the results table explaining the two check marks
 *      (green = your answer, grey = the correct answer) — the confusing part.
 */
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.mhQuizEnhance = {
    attach: function (context) {
      if (!document.body.classList.contains('path-quiz')) {
        return;
      }

      // (1) Make each answer option fully clickable + reflect selection.
      // Covers core (.form-item) and Bootstrap (.form-check) renderings.
      once('mh-quiz-option', '.answering-form .form-radios .form-item, .answering-form .form-checkboxes .form-item, .answering-form .form-check', context).forEach(function (item) {
        var input = item.querySelector('input[type="radio"], input[type="checkbox"]');
        if (!input) {
          return;
        }
        item.addEventListener('click', function (e) {
          // Let native clicks on the control or its label behave normally.
          if (e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL' || e.target.closest('label')) {
            return;
          }
          if (input.type === 'radio') {
            input.checked = true;
          }
          else {
            input.checked = !input.checked;
          }
          input.dispatchEvent(new Event('change', { bubbles: true }));
        });
        input.addEventListener('change', function () {
          var group = document.querySelectorAll('input[name="' + (window.CSS && CSS.escape ? CSS.escape(input.name) : input.name) + '"]');
          group.forEach(function (i) {
            var row = i.closest('.form-item, .form-check');
            if (row) { row.classList.toggle('mh-option-selected', i.checked); }
          });
        });
        // Initial sync.
        item.classList.toggle('mh-option-selected', input.checked);
      });

      // (2) + (3) Feedback page: class the narrative + add a check-mark legend.
      once('mh-quiz-feedback', '.quiz-result-table', context).forEach(function (table) {
        // The narrative feedback is a bare <p> that follows the results table
        // (as a sibling of the table's scroll-wrapper, so a simple parent/
        // sibling walk misses it). Tag by DOCUMENT ORDER instead: any real <p>
        // that comes AFTER this table and BEFORE the next table or the answer
        // form ("Next question"), excluding table cells and page chrome. Robust
        // to the wrapper nesting across core / Gin / Bootstrap.
        var tables = Array.prototype.slice.call(document.querySelectorAll('body.path-quiz .quiz-result-table'));
        var nextBoundary = tables[tables.indexOf(table) + 1] ||
          document.querySelector('body.path-quiz form.answering-form, body.path-quiz .form-actions');
        Array.prototype.slice.call(document.querySelectorAll('body.path-quiz p')).forEach(function (p) {
          if (p.closest('table, nav, header, footer, .region-footer, .site-footer, #toolbar-administration')) {
            return;
          }
          if (!p.textContent.trim()) {
            return;
          }
          var afterTable = table.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING;
          var beforeNext = !nextBoundary || (nextBoundary.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_PRECEDING);
          if (afterTable && beforeNext) {
            p.classList.add('mh-quiz-explanation');
          }
        });

        // Legend for the two check marks (only if the table shows both the
        // "Correct?" and "Correct answer" columns, and only once per table).
        var hasCorrect = table.querySelector('.quiz-result-cell-correct');
        var hasSolution = table.querySelector('.quiz-result-cell-solution');
        // Place the legend right after the table's outer wrapper.
        var anchor = table.closest('.layer-wrapper, .gin-table-scroll-wrapper, .tableresponsive') || table;
        var alreadyThere = anchor.nextElementSibling && anchor.nextElementSibling.classList &&
          anchor.nextElementSibling.classList.contains('mh-quiz-legend');
        if (hasCorrect && hasSolution && !alreadyThere) {
          var legend = document.createElement('div');
          legend.className = 'mh-quiz-legend';
          legend.innerHTML =
            '<span><span class="swatch swatch--you"></span> ' + Drupal.t('Green check = your answer') + '</span>' +
            '<span><span class="swatch swatch--answer"></span> ' + Drupal.t('Grey check = the correct answer') + '</span>';
          anchor.parentNode.insertBefore(legend, anchor.nextSibling);
        }
      });
    }
  };

})(Drupal, once);
