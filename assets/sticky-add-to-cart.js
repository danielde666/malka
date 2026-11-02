/**
 * A copy of the inline add to cart button that appears once the inline button has been scrolled past.
 * It mirrors the inline button's label and state, and forwards clicks to it so the product form
 * (and the phone case bundle logic) handle the submission.
 *
 * Rendered as a manual popover so it sits in the top layer, above any stacking context or
 * transformed ancestor in the product details column.
 */
class StickyAddToCart extends HTMLElement {
  /** @type {IntersectionObserver | undefined} */
  #intersectionObserver;

  /** @type {MutationObserver | undefined} */
  #mutationObserver;

  connectedCallback() {
    this.button = /** @type {HTMLButtonElement | null} */ (this.querySelector('.sticky-add-to-cart__button'));
    const inlineButton = this.inlineButton;
    if (!this.button || !inlineButton) return;

    this.button.addEventListener('click', this.#onClick);

    this.#mutationObserver = new MutationObserver(this.#sync);
    this.#mutationObserver.observe(inlineButton, {
      attributes: true,
      attributeFilter: ['class', 'disabled'],
      childList: true,
      subtree: true,
      characterData: true,
    });
    this.#sync();

    this.#intersectionObserver = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      const scrolledPast = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      this.#setVisible(scrolledPast);
    });
    this.#intersectionObserver.observe(inlineButton);
    this.#setVisible(false);

    try {
      this.showPopover?.();
    } catch {
      // Already open, or popovers unsupported; the bar still works as a fixed element.
    }
  }

  disconnectedCallback() {
    this.#intersectionObserver?.disconnect();
    this.#mutationObserver?.disconnect();
    this.button?.removeEventListener('click', this.#onClick);
  }

  /** @returns {HTMLButtonElement | null} */
  get inlineButton() {
    return this.closest('.buy-buttons-block')?.querySelector('product-form-component button[name="add"]') ?? null;
  }

  /** @param {boolean} visible */
  #setVisible(visible) {
    this.toggleAttribute('data-visible', visible);
    this.inert = !visible;
  }

  #sync = () => {
    const { button, inlineButton } = this;
    if (!button || !inlineButton) return;

    button.className = `${inlineButton.className} sticky-add-to-cart__button`;
    button.innerHTML = inlineButton.innerHTML;

    const disabled = inlineButton.disabled || inlineButton.classList.contains('is-disabled');
    button.setAttribute('aria-disabled', String(disabled));
  };

  #onClick = () => {
    const inlineButton = this.inlineButton;
    if (!inlineButton) return;

    if (!inlineButton.disabled) {
      inlineButton.click();
      return;
    }

    const section = this.closest('.shopify-section') ?? document;
    const phoneCaseSelect = /** @type {HTMLSelectElement | null} */ (section.querySelector('.phone-case select'));
    const unselectedPhoneCase = phoneCaseSelect?.value === '' ? phoneCaseSelect : null;
    const target = unselectedPhoneCase ?? inlineButton;

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    unselectedPhoneCase?.focus({ preventScroll: true });
  };
}

if (!customElements.get('sticky-add-to-cart')) {
  customElements.define('sticky-add-to-cart', StickyAddToCart);
}
