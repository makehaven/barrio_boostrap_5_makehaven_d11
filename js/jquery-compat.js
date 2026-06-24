/**
 * @file
 * jQuery 3-era compatibility shims (order-proof).
 *
 * The site loads jQuery 4.x, which removed long-deprecated helpers
 * (`$.isFunction`, `$.trim`, `$.type`, …). Legacy plugins still bundled with
 * the site — notably views_slideshow's `jquery.cycle.all.js` — call them and
 * throw `TypeError: $.isFunction is not a function`. That uncaught error
 * aborts Drupal.attachBehaviors, silently breaking every behavior registered
 * afterwards (e.g. the mobile-nav accordion).
 *
 * This file may load before OR after jQuery depending on asset weights, so we
 * don't assume jQuery exists yet: if it's already present we shim immediately;
 * otherwise we intercept the `window.jQuery` assignment and shim the instant
 * jQuery is set. Either way the helpers exist before any behavior runs.
 */
(function () {
  'use strict';

  function applyShims(jq) {
    if (!jq || jq.__mhCompatApplied) {
      return;
    }
    jq.__mhCompatApplied = true;
    if (typeof jq.isFunction !== 'function') {
      jq.isFunction = function (obj) { return typeof obj === 'function'; };
    }
    if (typeof jq.isArray !== 'function') {
      jq.isArray = Array.isArray;
    }
    if (typeof jq.trim !== 'function') {
      jq.trim = function (text) { return text == null ? '' : String(text).trim(); };
    }
    if (typeof jq.isWindow !== 'function') {
      jq.isWindow = function (obj) { return obj != null && obj === obj.window; };
    }
    if (typeof jq.now !== 'function') {
      jq.now = Date.now;
    }
    if (typeof jq.type !== 'function') {
      jq.type = function (obj) { return obj == null ? obj + '' : typeof obj; };
    }
    if (typeof jq.parseJSON !== 'function') {
      jq.parseJSON = function (text) { return JSON.parse(text); };
    }
  }

  if (window.jQuery) {
    applyShims(window.jQuery);
    return;
  }

  // jQuery not loaded yet — shim it the moment it is assigned to window.
  try {
    var stored;
    Object.defineProperty(window, 'jQuery', {
      configurable: true,
      enumerable: true,
      get: function () { return stored; },
      set: function (value) { stored = value; applyShims(value); }
    });
  } catch (e) {
    // Fallback: poll briefly until jQuery appears.
    var tries = 0;
    var timer = setInterval(function () {
      if (window.jQuery) {
        applyShims(window.jQuery);
        clearInterval(timer);
      } else if (++tries > 300) {
        clearInterval(timer);
      }
    }, 10);
  }
})();
