# MakeHaven — Node-Body Content Ports (NON-theme deliverables)

**Audience:** JR (deploying the redesigned MakeHaven D11 pages).
**Last verified:** 2026-06-23 against the live dev DB (all 15 node IDs confirmed).

> 📦 **Setup:** in the repo these files live in `_content-ports/`. The commands below assume they sit in a `temp/` folder at your Drupal **project root** — so before running anything, copy this folder there:
> ```bash
> cp -r web/themes/custom/barrio_boostrap_5_makehaven_d11/_content-ports ~/makehaven/temp
> ```
> (Or leave them where they are and replace `temp/` with the full path in each `drush php:script` command — the script finds the body files next to itself either way.)

---

## 1. The redesign ships in TWO parts

| Part | Where it lives | How it deploys |
|------|----------------|----------------|
| **A. Theme code** (CSS / JS / `.theme` / `libraries.yml` / images) | `web/themes/custom/barrio_boostrap_5_makehaven_d11/` | Normal git → the **D11 theme repo**. Nothing extra to do. |
| **B. Page content** (the `.mh-*` markup for each redesigned page) | **The node `body` field in the DATABASE** — NOT in any repo | Re-applied per environment with the files in **this folder**. **← this README covers Part B.** |

Why the split: each redesigned page = (1) a scoped stylesheet in the theme repo **plus** (2) hand-written HTML stored in that node's body field. The HTML is not theme code, so it does not travel with the theme repo. To stand the pages up on a fresh environment you must load this HTML into the matching nodes.

> Banner-only pages (Rooms, Equipment, Library, Projects, Suppliers, Shop Local Makers, Room Rentals, the blog/businesses/events Views, CiviCRM event pages, etc.) are **100% theme code** — they get their red banner from the theme and have **no** body file here. They need nothing from this folder.

---

## 2. What's in this folder

The files JR needs (everything else here — `*.pdf`, `*.csv`, `dump-node.php`, `update-donate.php` — is unrelated source data, ignore it):

- **`apply-page-body.php`** — the loader script. Writes an HTML file into a node's body (format `full_html`) and backs up the previous body first.
- **`<page>-body.html`** — the 15 ported page bodies (the content to load).
- **`<page>-body.backup.html`** — auto-created backup of whatever was in the node before the last apply (your rollback copy).

### Page → node-ID map (verified)

| Body file | Node ID | Type | URL |
|-----------|---------|------|-----|
| `about-body.html` | 1 | page | /about-us |
| `team-body.html` | 427 | page | /team |
| `work-body.html` | 413 | page | /work |
| `faq-body.html` | 5045 | page | /frequently-asked-questions-faq |
| `programs-body.html` | 4436 | page | /programs |
| `gems-body.html` | 30278 | page | /gems |
| `teambuild-body.html` | 27700 | webform | /teambuild |
| `teachworkshop-body.html` | 29374 | page | /teach-workshop |
| `membership-body.html` | 35973 | page | /membership-information-members |
| `visit-body.html` | 8205 | page | /visit |
| `workspace-body.html` | 3890 | landing_page | /workspace |
| ~~`resources-body.html`~~ | 619 | page | /resources | **← DO NOT APPLY.** /resources is a **banner-only section landing** (theme provides the red "Resources" banner via `.theme` line ~679; the Member Menu block fills the content region). It must have an **empty** body. The earlier supplier-card-list port was a mistake and was reverted 2026-06-25; the dropped markup is archived as `resources-body.DROPPED-supplier-list.html`. `resources-body.html` is intentionally empty. |
| `sponsors-body.html` | 3703 | page | /sponsors |
| `donate-body.html` | 37638 | page | /donate-makehaven |
| `financial-body.html` | 13706 | page | /990-tax-forms-and-financial-information |

> ⚠️ Node IDs are environment-specific. They are correct for the dev DB (which shares the production lineage). **Before applying on any environment, confirm each ID still resolves to the expected page** (the verify command in §5 prints title + alias for all 15).

---

## 3. Prerequisites

- The target site is up and `drush` works. Locally: `cd ~/makehaven && lando start`, then commands are `lando drush …`.
- **This `temp/` folder must exist on the environment you're applying to** (the script reads the HTML files by path). Copy the folder up if it isn't there.
- Take a DB backup first (`lando drush sql-dump > ~/pre-port.sql`, or a Pantheon backup on prod).

---

## 4. Apply

### One page
```bash
cd ~/makehaven
lando drush php:script temp/apply-page-body.php -- 1 about-body.html
lando drush cr
```
Args after `--` are `<node-id> <body-file-basename>` (basename only — the script looks in `temp/`). It prints the node it updated and the backup path.

### All 15 at once
```bash
cd ~/makehaven
declare -A PAGES=(
  [1]=about-body.html          [427]=team-body.html        [413]=work-body.html
  [5045]=faq-body.html         [4436]=programs-body.html   [30278]=gems-body.html
  [27700]=teambuild-body.html  [29374]=teachworkshop-body.html
  [35973]=membership-body.html [8205]=visit-body.html      [3890]=workspace-body.html
  [619]=resources-body.html    [3703]=sponsors-body.html   [37638]=donate-body.html
  [13706]=financial-body.html
)
for nid in "${!PAGES[@]}"; do
  lando drush php:script temp/apply-page-body.php -- "$nid" "${PAGES[$nid]}"
done
lando drush cr
```

### On production (Pantheon)
Same `drush php:script` command, run against the prod environment, with this folder present in the codebase there. Coordinate with whoever owns the Pantheon deploy — the files need to reach the server (committed to the deploy branch or pushed via SFTP/`terminus`) before `drush php:script` can read them. Always take a Pantheon backup first and apply to **test/dev** before **live**.

---

## 5. Verify & roll back

**Verify** — confirm IDs resolve and bodies rendered:
```bash
# IDs → title/alias (run before applying):
lando drush php:eval 'foreach([1,427,413,5045,4436,30278,27700,29374,35973,8205,3890,619,3703,37638,13706] as $n){$x=\Drupal\node\Entity\Node::load($n);print "$n: ".($x?$x->label():"MISSING")."\n";}'

# After applying — page should contain the redesigned markup:
curl -sk https://makehaven-website.lndo.site/about-us | grep -o 'mh-page mh-about'
```
Then eyeball with Edge headless (see the theme team's screenshot workflow).

**Roll back** one page — re-apply its backup:
```bash
cd ~/makehaven
lando drush php:script temp/apply-page-body.php -- 1 about-body.backup.html
lando drush cr
```

---

## 6. Known open item — `/workspace` (node 3890)

This page's body **is** ported (its own dark banner is in `workspace-body.html`), but the `workspace_rental` module's **availability block** ("N spaces currently available" + Inquire cards) is weighted **above** the node body in the content region, so the banner currently lands mid-page and the page shows no header at the top.

Fixing it is a **block-placement / weight change** (config, via Block Layout admin or the module) — **not** a theme or body-content change. It's intentionally left for a decision. Until then `/workspace` renders the listing first, then the banner.

---

## 7. Part A — the theme code (what you upload to the D11 repo)

`web/themes/custom/barrio_boostrap_5_makehaven_d11/` — goes to the D11 theme repo. Remember there:
- After any CSS/JS change, **bump `global-styling` `version:`** in `…libraries.yml` (currently **`1.2.5`**) so browsers fetch fresh assets, then `lando drush cr` (and a `drush cr` on each environment after deploy).
- New file this redesign: `js/jquery-compat.js` (jQuery-4 shim — keep it). Deleted: `js/mobile-nav.js`.

### ⚠️ The Resources tab + Library tool detail pages need NO content port
Everything for the **Resources** top-nav tab (Equipment, Lending Library, Suppliers, Projects, Shop Local Makers, Room Rentals, the `/resources` landing) **and the per-tool Library detail pages** is **100% theme code** — banner + breadcrumb pill come from `_..._mh_banner_crumb()` in the `.theme` file, and the styling lives in CSS. There are **no `*-body.html` files and no database edits** for these. Deploying the theme files below + `drush cr` is all that's required; do **not** look for a content port for them.

Theme files changed for this Resources/Library work (all under the theme folder):
- `barrio_boostrap_5_makehaven_d11.theme` — added the Resources View routes, the `/business/products` controller route, node 619 (section landing) + 3143 (room-rentals) to the banner map, and a `library_item` bundle rule for tool detail pages.
- `css/pages/library.css` — library tool **detail** page styling (`.node--type-library-item.node--view-mode-full`): status badge (green/red), info rows, framed photo, Report Issue pill, dark mode.
- `barrio_boostrap_5_makehaven_d11.libraries.yml` — `global-styling` version → `1.2.5`.
- (`css/pages/rooms.css` already carried the generic `.mh-banner-page` banner styling these pages reuse — unchanged this round.)
