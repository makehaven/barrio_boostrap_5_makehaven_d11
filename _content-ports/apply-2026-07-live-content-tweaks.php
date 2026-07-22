<?php

/**
 * @file
 * Surgical, idempotent content tweaks for the 2026-07 theme batch.
 *
 * Usage (run against EACH environment the theme batch is deployed to — these
 * are node-body edits, i.e. DATABASE content, and do NOT travel with git):
 *
 *   lando drush php:script <path>/apply-2026-07-live-content-tweaks.php
 *   # on Pantheon:
 *   terminus drush <site>.<env> -- php:script <path>/apply-2026-07-live-content-tweaks.php
 *
 * Unlike the *-body.html full-body ports in this folder, these are targeted
 * find-and-replace edits against whatever is CURRENTLY live, so they are safe
 * against content drift and safe to re-run (each guard skips if already done).
 * Every change backs the prior body up next to this script first.
 *
 * Covers:
 *  - node 3890 (/workspace): replace the hand-maintained availability <table>
 *    with the [[WORKSPACE_AVAILABILITY]] token (the theme swaps it for the live
 *    workspace_listing block via hook_preprocess_field).
 *  - node 35973 (/membership-information-members): restyle the "Give the Gift"
 *    card CTAs from two grey btn-secondary to a red primary + red outline.
 */

$dir = __DIR__;
$storage = \Drupal::entityTypeManager()->getStorage('node');

/**
 * Apply one guarded transform to a node body, backing up first.
 */
$apply = function (int $nid, string $label, callable $already, callable $transform) use ($dir, $storage): void {
  $node = $storage->load($nid);
  if (!$node) {
    echo "SKIP node $nid ($label): not found on this environment.\n";
    return;
  }
  $body = (string) ($node->body->value ?? '');
  if ($already($body)) {
    echo "OK   node $nid ($label): already applied, nothing to do.\n";
    return;
  }
  $new = $transform($body);
  if ($new === NULL || $new === $body) {
    echo "WARN node $nid ($label): expected markup not found — left unchanged. Review manually.\n";
    return;
  }
  file_put_contents("$dir/apply-2026-07-$nid.backup.html", $body);
  $node->body->value = $new;
  $node->body->format = 'full_html';
  $node->save();
  echo "DONE node $nid ($label): applied (backup apply-2026-07-$nid.backup.html).\n";
};

// --- /workspace (3890): availability table -> live-listing token. -----------
$apply(
  3890,
  'workspace availability token',
  fn(string $b) => strpos($b, '[[WORKSPACE_AVAILABILITY]]') !== FALSE,
  function (string $b): ?string {
    $out = preg_replace('#<table\b.*?</table>#is', '<p>[[WORKSPACE_AVAILABILITY]]</p>', $b, 1, $count);
    return $count === 1 ? $out : NULL;
  }
);

// --- /membership (35973): grey gift CTAs -> primary + outline. ---------------
$old_buttons = '<div class="mt-auto"><a class="btn btn-secondary mb-2" href="/gift-membership">Gift a Membership</a> <a class="btn btn-secondary" href="/class-gift-card">Purchase an Event Gift Card</a></div>';
$new_buttons = '<div class="mt-auto d-flex flex-column flex-sm-row gap-2"><a class="btn btn-primary" href="/gift-membership">Gift a Membership</a> <a class="btn btn-outline-primary" href="/class-gift-card">Purchase an Event Gift Card</a></div>';
$apply(
  35973,
  'membership gift CTAs',
  fn(string $b) => strpos($b, 'btn btn-outline-primary" href="/class-gift-card') !== FALSE,
  fn(string $b) => strpos($b, $old_buttons) !== FALSE ? str_replace($old_buttons, $new_buttons, $b) : NULL
);

echo "Done.\n";
