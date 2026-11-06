(function (Drupal, once) {
  "use strict";

  if (!Drupal || !once) {
    return;
  }

  function textFrom(root, selector) {
    const el = root.querySelector(selector);
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }

  function chip(text, cls) {
    const el = document.createElement("span");
    el.className = `mh-chip ${cls}`;
    el.textContent = text;
    return el;
  }

  Drupal.behaviors.makehavenEventInfoHero = {
    attach(context) {
      const sections = once(
        "mh-event-info-bar-enhance",
        "body.page-civicrm-event-info .view-event-information-bar.view-display-id-event_info .views-row",
        context
      );

      sections.forEach((section) => {
        const dateText = textFrom(section, ".views-field-start-date .field-content");
        const levelText = textFrom(
          section,
          ".views-field-field-event-skill-level .field-content"
        );
        const ageText = textFrom(
          section,
          ".views-field-field-civi-event-age-requirement .field-content"
        );
        const typeText = textFrom(section, ".views-field-event-type-id .field-content");
        const remainingText = textFrom(
          section,
          '[class*="views-field-field-civi-event-remaining"] .field-content'
        );
        const capacityPctText = textFrom(
          section,
          '[class*="views-field-field-civi-event-full-pct"] .field-content'
        );

        if (
          !dateText &&
          !levelText &&
          !ageText &&
          !typeText &&
          !remainingText &&
          !capacityPctText
        ) {
          return;
        }

        const meta = document.createElement("div");
        meta.className = "mh-event-meta";

        if (dateText) {
          meta.appendChild(chip(dateText, "mh-chip-date"));
        }

        if (levelText) {
          const level = levelText.toLowerCase();
          let levelCls = "mh-chip-level";
          if (level.includes("introductory") || level.includes("beginner")) {
            levelCls += " mh-chip-level-intro";
          } else if (level.includes("intermediate")) {
            levelCls += " mh-chip-level-mid";
          } else if (level.includes("advanced") || level.includes("expert")) {
            levelCls += " mh-chip-level-advanced";
          }
          meta.appendChild(chip(levelText, levelCls));
        }

        if (ageText) {
          meta.appendChild(chip(`Age ${ageText}`, "mh-chip-age"));
        }

        if (typeText) {
          meta.appendChild(chip(typeText, "mh-chip-type"));
        }

        const cap = document.createElement("div");
        cap.className = "mh-capacity-panel";
        let spots = null;
        const remainingHasPercent = /%/.test(remainingText);
        const remainingLooksLikeSpots = /spot/i.test(remainingText);
        if (remainingText && !remainingHasPercent && remainingLooksLikeSpots) {
          const m = remainingText.match(/(\d+)/);
          spots = m ? parseInt(m[1], 10) : null;
        }

        let used = null;
        const pctMatch = capacityPctText.match(/(\d+(?:\.\d+)?)\s*%?/);
        if (pctMatch) {
          used = Math.round(parseFloat(pctMatch[1]));
        } else {
          const remainingPctMatch = remainingText.match(/(\d+(?:\.\d+)?)\s*%/);
          if (remainingPctMatch) {
            used = Math.round(parseFloat(remainingPctMatch[1]));
          }
        }
        if (used === null) {
          const usedMatch = section.textContent.match(/Capacity Used:\s*(\d+)%/i);
          used = usedMatch ? parseInt(usedMatch[1], 10) : null;
        }

        // The view rewrites a sold-out event's count to the words
        // "Capacity Status: Full", with no number for the checks below.
        const saysFull = /\bfull\b/i.test(remainingText);

        let statusText = "Open Seats";
        let statusCls = "is-open";
        if (saysFull) {
          statusText = "Full";
          statusCls = "is-full";
        } else if (spots !== null) {
          if (spots <= 0) {
            statusText = "Full";
            statusCls = "is-full";
          } else if (spots <= 2) {
            statusText = "Almost Full";
            statusCls = "is-high";
          } else if (spots <= 5) {
            statusText = "Filling Fast";
            statusCls = "is-medium";
          }
        } else if (used !== null) {
          if (used >= 100) {
            statusText = "Full";
            statusCls = "is-full";
          } else if (used >= 90) {
            statusText = "Almost Full";
            statusCls = "is-high";
          } else if (used >= 70) {
            statusText = "Filling Fast";
            statusCls = "is-medium";
          }
        }

        const capTop = document.createElement("div");
        capTop.className = "mh-capacity-top";
        const capLabel = document.createElement("span");
        capLabel.className = "mh-capacity-label";
        capLabel.textContent = "Capacity";
        capTop.appendChild(capLabel);

        if (spots !== null) {
          const capSpots = document.createElement("span");
          capSpots.className = `mh-capacity-spots ${statusCls}`;
          capSpots.textContent = `${spots} spots left`;
          capTop.appendChild(capSpots);
        } else if (statusText) {
          const capSpots = document.createElement("span");
          capSpots.className = `mh-capacity-spots ${statusCls}`;
          capSpots.textContent = statusText;
          capTop.appendChild(capSpots);
        }

        if (used !== null) {
          const capPct = document.createElement("span");
          capPct.className = "mh-capacity-pct";
          capPct.textContent = `${used}% used`;
          capTop.appendChild(capPct);
        }

        cap.appendChild(capTop);

        if (used !== null) {
          const bar = document.createElement("div");
          bar.className = "mh-capacity-bar";
          const fill = document.createElement("span");
          fill.className = `mh-capacity-fill ${statusCls}`;
          fill.style.width = `${Math.max(4, Math.min(100, used))}%`;
          bar.appendChild(fill);
          cap.appendChild(bar);
        }

        const img = section.querySelector("img");
        if (img) {
          img.insertAdjacentElement("afterend", meta);
          meta.insertAdjacentElement("afterend", cap);
        } else {
          section.prepend(meta);
          meta.insertAdjacentElement("afterend", cap);
        }

        section.classList.add("mh-enhanced-info-bar");

        // Deferred so it reads the page after any other DOM-ready script that
        // swaps the Register button (the event_information_bar view has one).
        setTimeout(() => {
          const panel = buildActionPanel();
          if (panel) {
            cap.insertAdjacentElement("afterend", panel);
          }
        }, 0);
      });
    },
  };

  /**
   * Price, Register and the reduced-price offer, near the top of the page.
   *
   * CiviCRM's own button, fee table and the need-based card stay where they
   * are, below the description, so this only repeats what is already true on
   * the page and shows nothing it cannot find there. A members-only notice
   * from makehaven_event_capacity takes the button's place.
   */
  function buildActionPanel() {
    const bottom = document.querySelector(".crm-actionlinks-bottom");
    if (!bottom) {
      return null;
    }
    const panel = document.createElement("div");
    panel.className = "mh-event-actions";

    const prices = [
      ...document.querySelectorAll(".event_fees-section table tr"),
    ]
      .map((row) => [...row.cells].map((c) => c.textContent.trim()))
      .filter((cells) => cells.length >= 2 && cells[0]);
    const hasCharge = prices.some((cells) => /[1-9]/.test(cells[1]));
    if (hasCharge && prices.length <= 3) {
      const list = document.createElement("p");
      list.className = "mh-event-actions__prices";
      prices.forEach((cells) => {
        const item = document.createElement("span");
        item.textContent = `${cells[0]}: ${cells[1].replace(/\.00$/, "")}`;
        list.appendChild(item);
      });
      panel.appendChild(list);
      // The panel now says this, so the table further down need not. Only when
      // the panel shows every price, and only once this script has run.
      document.body.classList.add("mh-event-prices-shown");
    }

    const notice = bottom.querySelector(".mh-members-only");
    const register = [...bottom.querySelectorAll("a.crm-register-button")].find(
      (link) => link.offsetParent !== null
    );
    if (notice && !register) {
      panel.appendChild(notice.cloneNode(true));
    } else if (register) {
      panel.appendChild(register.cloneNode(true));
    } else {
      return null;
    }

    const reduced = document.querySelector(
      '.view-event-sliding-scale-info a[href*="price-adjustment"]'
    );
    if (reduced && register) {
      const offer = document.createElement("a");
      offer.className = "mh-event-actions__reduced";
      offer.href = reduced.getAttribute("href");
      offer.textContent = "Need a reduced price? Apply before you register";
      panel.appendChild(offer);
    }
    return panel;
  }
})(Drupal, window.once);
