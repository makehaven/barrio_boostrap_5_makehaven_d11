/**
 * @file
 * Formats and enforces the area-of-interest parent/child hierarchy.
 */
(function (Drupal, once) {
  'use strict';

  const wrapperSelectors = [
    '.field--name-field-member-areas-interest',
    '.field--name-field-item-area-interest',
    '.field--name-field-civi-event-area-interest',
    '.field--name-field-resource-area-interest',
    '.field--name-field-material-categories',
    '.field--name-field-bundle-areas-of-interest',
    '.field--name-field-project-area-of-interest',
    '.js-form-item-interest',
    '.form-item--area',
    '.form-item-field-area-interest-target-id',
    '.form-item-field-member-areas-interest-target-id',
    '.form-item-field-item-area-interest-target-id',
    '.form-item-field-civi-event-area-interest-target-id',
    '.form-item-field-resource-area-interest-target-id'
  ];

  function textStartsWithDash(text) {
    return text.trim().charAt(0) === '-';
  }

  /**
   * Remove the leading '-' depth markers from a checkbox label.
   *
   * The dashes are Drupal's taxonomy depth convention and are only used above to
   * classify parents vs subcategories — showing them to members ("-Woodworking")
   * is just noise, and the CSS already indents subcategories. Checkbox widgets
   * only; <option> depth is left alone because browsers ignore option padding,
   * so there the dash is the only depth cue.
   */
  function stripDepthPrefix(label) {
    const node = Array.from(label.childNodes).find(
      (child) => child.nodeType === Node.TEXT_NODE && /^\s*-/.test(child.nodeValue)
    );

    if (node) {
      node.nodeValue = node.nodeValue.replace(/^\s*-+\s*/, '');
    }
  }

  function classifySelect(wrapper) {
    wrapper.querySelectorAll('select option').forEach((option) => {
      const text = option.textContent.trim();
      option.classList.remove('interest-parent-category', 'interest-subcategory');

      if (!text || text === '- Any -' || option.value === 'All') {
        return;
      }

      option.classList.add(textStartsWithDash(text) ? 'interest-subcategory' : 'interest-parent-category');
    });
  }

  function syncChosenClasses(select) {
    const chosen = select.nextElementSibling;
    if (!chosen || !chosen.classList.contains('chosen-container')) {
      return;
    }

    const results = chosen.querySelectorAll('.chosen-results li');
    select.querySelectorAll('option').forEach((option, index) => {
      const result = results[index];
      if (!result) {
        return;
      }

      result.classList.toggle('interest-parent-category', option.classList.contains('interest-parent-category'));
      result.classList.toggle('interest-subcategory', option.classList.contains('interest-subcategory'));
    });
  }

  function updateParentState(wrapper, parentCheckbox) {
    const parentId = parentCheckbox.id;
    if (!parentId) {
      return;
    }

    const children = wrapper.querySelectorAll(`.interest-subcategory input.form-checkbox[data-parent="${CSS.escape(parentId)}"]`);
    if (!children.length) {
      return;
    }

    const anyChecked = Array.from(children).some((child) => child.checked);
    parentCheckbox.checked = anyChecked;
    parentCheckbox.closest('.js-form-item')?.classList.toggle('interest-parent-checked', anyChecked);
  }

  function wireCheckboxHierarchy(wrapper) {
    // Tight selector: '.js-form-item' alone matches the outer fieldset wrapper,
    // which causes the entire field to be classified as a parent-only category
    // (all labels bold, every checkbox click preventDefault'd). See memory:
    // project_interest_hierarchy_widget.md.
    const items = Array.from(wrapper.querySelectorAll('.js-form-type-checkbox, .form-type--checkbox'));
    let currentParentCheckbox = null;
    const parentChildren = new Map();

    items.forEach((item) => {
      const checkbox = item.querySelector('input.form-checkbox');
      const label = item.querySelector('label');

      if (!checkbox || !label) {
        return;
      }

      const text = label.textContent.trim();
      item.classList.remove('interest-parent-category', 'interest-subcategory', 'interest-parent-only');

      // Record the depth before stripping the dashes, so a re-attach (AJAX
      // rebuilds) still classifies this item correctly once they are gone.
      const isSubcategory = item.dataset.interestSubcategory === '1' || textStartsWithDash(text);

      if (isSubcategory) {
        item.dataset.interestSubcategory = '1';
        item.classList.add('interest-subcategory');
        stripDepthPrefix(label);
        if (currentParentCheckbox?.id) {
          checkbox.dataset.parent = currentParentCheckbox.id;
          parentChildren.set(
            currentParentCheckbox.id,
            (parentChildren.get(currentParentCheckbox.id) || 0) + 1
          );
        }
      }
      else {
        currentParentCheckbox = checkbox;
        item.classList.add('interest-parent-category');
      }
    });

    items.forEach((item) => {
      const checkbox = item.querySelector('input.form-checkbox');
      if (!checkbox || !parentChildren.has(checkbox.id)) {
        return;
      }

      item.classList.add('interest-parent-only');
      checkbox.setAttribute('aria-disabled', 'true');
      checkbox.tabIndex = -1;
      item.title = 'Choose a specific subcategory below.';
      updateParentState(wrapper, checkbox);
    });

    wrapper.addEventListener('click', (event) => {
      const parentInput = event.target.closest('.interest-parent-only input.form-checkbox, .interest-parent-only label');
      if (!parentInput) {
        return;
      }

      event.preventDefault();
    });

    wrapper.addEventListener('change', (event) => {
      const checkbox = event.target.closest('input.form-checkbox');
      if (!checkbox) {
        return;
      }

      if (checkbox.closest('.interest-parent-only')) {
        updateParentState(wrapper, checkbox);
        return;
      }

      const parentId = checkbox.dataset.parent;
      if (!parentId) {
        return;
      }

      const parentCheckbox = wrapper.querySelector(`#${CSS.escape(parentId)}`);
      if (parentCheckbox) {
        updateParentState(wrapper, parentCheckbox);
      }
    });
  }

  Drupal.behaviors.makehavenInterestHierarchy = {
    attach(context) {
      once('makehaven-interest-hierarchy', wrapperSelectors.join(','), context).forEach((wrapper) => {
        // Classify options synchronously so Chosen can inherit them if it runs after us.
        classifySelect(wrapper);
        wireCheckboxHierarchy(wrapper);

        // Defer Chosen sync: our bundle (delta 3) loads before Chosen (delta 5), so
        // the chosen-container does not exist yet during attach. setTimeout(fn, 0)
        // runs after all behaviors in the current attachBehaviors() call have finished.
        setTimeout(() => {
          wrapper.querySelectorAll('select').forEach((select) => {
            syncChosenClasses(select);
            const chosen = select.nextElementSibling;
            if (chosen?.classList.contains('chosen-container')) {
              ['mousedown', 'focusin', 'mouseenter'].forEach((eventName) => {
                chosen.addEventListener(eventName, () => syncChosenClasses(select));
              });
            }
          });
        }, 0);
      });
    }
  };
})(Drupal, once);
