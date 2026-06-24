<?php
/**
 * Apply a ported mockup body to a node.
 * Usage: lando drush php:script temp/apply-page-body.php -- <nid> <body-file-basename>
 * Example: lando drush php:script temp/apply-page-body.php -- 1 about-body.html
 * Backs up the existing body to temp/<name>.backup.html before writing.
 *
 * Drush exposes args after `--` in the $extra array.
 */
$nid  = $extra[0] ?? null;
$file = $extra[1] ?? null;

if (!$nid || !$file) {
  echo "ERROR: need <nid> and <body-file-basename>\n";
  return;
}

$path = __DIR__ . '/' . $file;
if (!is_file($path)) {
  echo "ERROR: file not found: $path\n";
  return;
}

$node = \Drupal::entityTypeManager()->getStorage('node')->load($nid);
if (!$node) {
  echo "ERROR: node $nid not found\n";
  return;
}

$backup = __DIR__ . '/' . pathinfo($file, PATHINFO_FILENAME) . '.backup.html';
file_put_contents($backup, $node->body->value ?? '');

$new = file_get_contents($path);
$node->body->value = $new;
$node->body->format = 'full_html';
$node->save();

echo "Updated node $nid from $file (" . strlen($new) . " chars).\n";
echo "Backup: temp/" . basename($backup) . "\n";
