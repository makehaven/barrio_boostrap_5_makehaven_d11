/**
 * @file
 * Orientation-video page: surface the "take the quiz" action without scrolling.
 *
 * Members reported missing the quiz button because it sits BELOW the video and
 * some never scroll down (feedback 2026-07-22). This adds, on the
 * orientation-video page only:
 *   1. A prominent quiz button ABOVE the video.
 *   2. A persistent overlay button pinned to the video's bottom-right corner.
 * Both reuse the href of the existing below-the-video button, so there is one
 * source of truth for where the quiz lives. Lives in the theme (not the node
 * body) so it is version-controlled and can't silently vanish the way the old
 * node-body "above" button did.
 */
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.mhOrientationVideoQuiz = {
    attach: function (context) {
      // Scope strictly to the orientation-video page (/orientation-video or its
      // /video redirect target). No-op everywhere else.
      if (!/\/orientation-video(\/|$)|\/video(\/|$)/.test(window.location.pathname)) {
        return;
      }

      once('mh-ov-quiz', 'iframe[src*="youtube"]', context).forEach(function (iframe) {
        // Mirror the existing quiz button's destination (falls back to /quiz/1/).
        var existing = document.querySelector('a[href*="/quiz/1"]');
        var href = (existing && existing.getAttribute('href')) || '/quiz/1/';

        // The body wraps the iframe as <p><span><iframe></span></p>; operate on
        // the outermost <p> (or the direct parent if the markup differs).
        var block = iframe.closest('p') || iframe.parentElement;
        if (!block || !block.parentNode) {
          return;
        }

        // (1) Button ABOVE the video.
        var above = document.createElement('div');
        above.className = 'mh-ov-quiz-top';
        var topBtn = document.createElement('a');
        topBtn.className = 'btn btn-primary btn-lg mh-ov-quiz-btn';
        topBtn.href = href;
        topBtn.textContent = Drupal.t('Take the New Member Quiz →');
        above.appendChild(topBtn);
        var hint = document.createElement('p');
        hint.className = 'mh-ov-quiz-hint';
        hint.textContent = Drupal.t('Watch the safety video first, then take the quiz.');
        above.appendChild(hint);
        block.parentNode.insertBefore(above, block);

        // (2) Overlay button pinned to the video's bottom-right corner. Wrap the
        // video block in a positioned holder so the button can sit over it.
        var holder = document.createElement('div');
        holder.className = 'mh-ov-video-holder';
        block.parentNode.insertBefore(holder, block);
        holder.appendChild(block);
        var overlay = document.createElement('a');
        overlay.className = 'btn btn-primary btn-sm mh-ov-quiz-overlay';
        overlay.href = href;
        overlay.textContent = Drupal.t('Take the Quiz →');
        holder.appendChild(overlay);
      });
    }
  };

})(Drupal, once);
