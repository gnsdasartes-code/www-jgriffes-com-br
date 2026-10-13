(() => {
  'use strict';
  const modal = document.createElement('dialog');
  modal.className = 'jg-purchase';
  modal.setAttribute('aria-labelledby', 'jg-purchase-title');
  modal.innerHTML = `<div class="jg-purchase-grid">
    <img class="jg-purchase-photo" alt="">
    <div class="jg-purchase-details">
      <button class="jg-purchase-close" type="button" aria-label="Fechar janela de compra">×</button>
      <h2 class="jg-purchase-title" id="jg-purchase-title"></h2>
      <div class="jg-purchase-prices"><strong class="jg-purchase-price"></strong><del class="jg-purchase-compare"></del></div>
      <div class="jg-purchase-options"></div>
      <div class="jg-purchase-actions">
        <div class="jg-purchase-quantity">
          <button type="button" data-step="-1" aria-label="Diminuir quantidade">‹</button>
          <input type="number" value="1" min="1" max="99" aria-label="Quantidade">
          <button type="button" data-step="1" aria-label="Aumentar quantidade">›</button>
        </div>
        <a class="jg-purchase-buy" target="_blank" rel="noopener noreferrer">COMPRAR</a>
      </div>
      <p class="jg-purchase-note">Continue pelo WhatsApp para combinar entrega e pagamento.</p>
    </div>
  </div>`;
  document.body.append(modal);
  const find = selector => modal.querySelector(selector);
  const quantity = find('input');
  let product, selections = [], previousFocus, previousOverflow;
  const normalizeQuantity = () => {
    quantity.value = Math.max(1, Math.min(99, Math.floor(Number(quantity.value) || 1)));
  };
  function updateOrder() {
    normalizeQuantity();
    const message = ['Olá! Gostaria de comprar na J Griffes:', product.name,
      ...selections.map(option => `${option.label}: ${option.value}`),
      `Quantidade: ${quantity.value}`, `Preço unitário: ${product.price}`, product.url].filter(Boolean).join('\n');
    find('.jg-purchase-buy').href = `https://wa.me/5511925476299?text=${encodeURIComponent(message)}`;
  }
  function openProduct(card, trigger) {
    const image = card.querySelector('.product-item-image-featured, .js-product-item-image-link-private img, .item-image img');
    const link = card.querySelector('.item-link');
    product = {
      name: card.querySelector('.js-item-name')?.textContent.trim() || 'Produto J Griffes',
      price: card.querySelector('.js-price-display')?.textContent.trim() || '',
      compare: card.querySelector('.js-compare-price-display')?.textContent.trim() || '',
      url: link?.href || ''
    };
    const photo = find('.jg-purchase-photo');
    const srcset = image?.getAttribute('data-srcset') || image?.getAttribute('srcset') || '';
    const candidates = srcset.split(',').map(part => part.trim().split(/\s+/)[0]).reverse();
    candidates.push(image?.currentSrc, image?.getAttribute('data-src'), image?.getAttribute('src'));
    const localImage = src => {
      if (!src || src.startsWith('data:')) return null;
      const url = new URL(src, document.baseURI);
      const filename = url.pathname.split('/').pop();
      return new URL(`images/${filename}`, new URL('.', document.baseURI)).href;
    };
    const sources = [...new Set(candidates.map(localImage).filter(Boolean))];
    let candidateIndex = 0;
    photo.onerror = () => {
      if (candidateIndex < sources.length) photo.src = sources[candidateIndex++];
      else photo.onerror = null;
    };
    photo.removeAttribute('src');
    if (sources.length) photo.src = sources[candidateIndex++];
    find('.jg-purchase-photo').alt = product.name;
    find('.jg-purchase-title').textContent = product.name;
    find('.jg-purchase-price').textContent = product.price;
    find('.jg-purchase-compare').textContent = product.compare;
    find('.jg-purchase-compare').hidden = !product.compare || product.compare === product.price;
    quantity.value = 1;
    selections = [];
    const options = find('.jg-purchase-options');
    options.replaceChildren();
    card.querySelectorAll('select[name^="variation"]').forEach((select, index) => {
      const group = select.closest('.js-product-variants-group');
      const label = group?.querySelector('label')?.textContent.trim().split(':')[0] || 'Opção';
      const available = [...select.options].filter(option => !option.disabled && option.value);
      if (!available.length) return;
      const selected = available.find(option => option.selected) || available[0];
      const choice = { label, value: selected.value };
      selections.push(choice);
      const fieldset = document.createElement('fieldset');
      const legend = document.createElement('legend');
      const current = document.createElement('strong');
      current.textContent = selected.textContent.trim();
      legend.append(`${label}: `, current);
      const buttons = document.createElement('div');
      buttons.className = 'jg-purchase-choices';
      available.forEach(option => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'jg-purchase-choice';
        button.textContent = option.textContent.trim();
        button.setAttribute('aria-pressed', String(option.value === choice.value));
        button.addEventListener('click', () => {
          choice.value = option.value;
          current.textContent = option.textContent.trim();
          buttons.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
          updateOrder();
        });
        buttons.append(button);
      });
      fieldset.append(legend, buttons);
      options.append(fieldset);
    });
    previousFocus = trigger;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    updateOrder();
    modal.showModal();
    find('.jg-purchase-close').focus();
  }
  document.addEventListener('click', event => {
    const trigger = event.target.closest('.js-quickshop-modal-open, .js-addtocart, .js-product-item-image-link-private, .js-product-item-image-container-private a, .item-image a');
    const card = trigger?.closest('.js-item-product');
    if (!card) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openProduct(card, trigger);
  }, true);
  document.addEventListener('submit', event => {
    const card = event.target.closest('.js-item-product');
    if (!card || !event.target.matches('.js-product-form')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openProduct(card, event.submitter || event.target);
  }, true);
  find('.jg-purchase-close').addEventListener('click', () => modal.close());
  modal.addEventListener('click', event => {
    const rect = modal.getBoundingClientRect();
    if (event.target === modal && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) modal.close();
    const step = event.target.closest('[data-step]');
    if (step) { quantity.value = Number(quantity.value) + Number(step.dataset.step); updateOrder(); }
  });
  quantity.addEventListener('change', updateOrder);
  modal.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    previousFocus?.focus();
  });
})();
