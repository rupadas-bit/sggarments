// Product specifications, variant pickers, and gallery logic.

let selectedQty = 1;
let activeProduct = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('p-name')) return;

  const params = new URLSearchParams(window.location.search);
  let productId = params.get('id') || '1';
  
  try {
    const res = await fetch(`${window.API_BASE_URL || ''}/api/v1/products/${productId}`);
    if (res.ok) {
      const result = await res.json();
      if (result.success && result.data) {
        activeProduct = result.data;
      }
    }
  } catch (err) {
    console.warn('Backend detail API unavailable, using fallback');
  }

  if (!activeProduct) {
    if (window.getProductById) {
      activeProduct = window.getProductById(productId);
    } else if (window.PRODUCTS) {
      activeProduct = window.PRODUCTS[0];
    }
  }

  if (!activeProduct) return;

  document.title = `${activeProduct.name} — SG Fashion`;
  if (document.getElementById('breadcrumb-product-name')) {
    document.getElementById('breadcrumb-product-name').innerText = activeProduct.name;
  }
  document.getElementById('p-name').innerText = activeProduct.name;
  document.getElementById('p-category').innerText = activeProduct.category;
  document.getElementById('p-price').innerText = `₹${activeProduct.price.toLocaleString('en-IN')}`;
  
  if (activeProduct.originalPrice) {
    document.getElementById('p-original-price').innerText = `₹${activeProduct.originalPrice.toLocaleString('en-IN')}`;
  } else {
    document.getElementById('p-original-price').classList.add('hidden');
  }

  if (activeProduct.discount) {
    document.getElementById('p-discount-badge').innerText = activeProduct.discount;
  } else {
    document.getElementById('p-discount-badge').classList.add('hidden');
  }

  document.getElementById('p-short-desc').innerText = activeProduct.shortDescription;
  document.getElementById('p-full-desc').innerText = activeProduct.fullDescription;
  document.getElementById('p-availability').innerText = activeProduct.availability;
  document.getElementById('p-rating-score').innerText = activeProduct.rating;
  document.getElementById('p-reviews-count').innerText = `(${activeProduct.reviewsCount} reviews)`;

  const featContainer = document.getElementById('p-features-list');
  if (featContainer) {
    featContainer.innerHTML = activeProduct.features.map(f => `
      <li style="display: flex; align-items: flex-start; gap: 0.5rem;">
        <span style="color: var(--gold-accent); font-weight: bold; flex-shrink: 0;">✦</span>
        <span>${f}</span>
      </li>
    `).join('');
  }

  const specsContainer = document.getElementById('p-specs-table');
  if (specsContainer) {
    specsContainer.innerHTML = Object.entries(activeProduct.specs).map(([key, val]) => `
      <div style="padding: 0.625rem 0; border-bottom: 1px solid var(--gold-border); display: flex; align-items: center; justify-content: space-between;">
        <span style="font-weight: 600; color: var(--text-dim);">${key}</span>
        <span style="font-weight: 700; color: var(--text-light);">${val}</span>
      </div>
    `).join('');
  }

  const mainImg = document.getElementById('gallery-main-img');
  if (mainImg) mainImg.src = activeProduct.images[0];

  const thumbsContainer = document.getElementById('gallery-thumbs-container');
  if (thumbsContainer) {
    thumbsContainer.innerHTML = activeProduct.images.map((img, idx) => `
      <button type="button" onclick="switchMainImage('${img}', this)" class="thumb-btn ${idx === 0 ? 'active' : ''}">
        <img src="${img}" alt="Thumbnail" />
      </button>
    `).join('');
  }

  const sizeContainer = document.getElementById('size-picker-container');
  if (sizeContainer && activeProduct.variants && activeProduct.variants.sizes) {
    sizeContainer.innerHTML = activeProduct.variants.sizes.map((s, idx) => `
      <span class="chip ${idx === 0 ? 'active' : ''}" data-value="${s}">
        ${s}
      </span>
    `).join('');

    // Click listeners for size chips
    sizeContainer.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        sizeContainer.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      });
    });
  }

  const colorContainer = document.getElementById('color-picker-container');
  if (colorContainer && activeProduct.variants && activeProduct.variants.colors) {
    colorContainer.innerHTML = activeProduct.variants.colors.map((c, idx) => `
      <span class="chip ${idx === 0 ? 'active' : ''}" data-value="${c}">
        ${c}
      </span>
    `).join('');

    // Click listeners for color chips
    colorContainer.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        colorContainer.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      });
    });
  }

  const decBtn = document.getElementById('qty-dec');
  const incBtn = document.getElementById('qty-inc');
  if (decBtn && incBtn) {
    decBtn.addEventListener('click', () => {
      if (selectedQty > 1) {
        selectedQty--;
        document.getElementById('qty-val').innerText = selectedQty;
      }
    });

    incBtn.addEventListener('click', () => {
      selectedQty++;
      document.getElementById('qty-val').innerText = selectedQty;
    });
  }

  const buyBtn = document.getElementById('buy-now-btn');
  if (buyBtn) {
    buyBtn.addEventListener('click', () => {
      // Read the currently selected size & color from the pickers
      const activeSizeChip = document.querySelector('#size-picker-container .chip.active');
      const activeColorChip = document.querySelector('#color-picker-container .chip.active');
      const selectedSize = activeSizeChip ? activeSizeChip.getAttribute('data-value') : null;
      const selectedColor = activeColorChip ? activeColorChip.getAttribute('data-value') : null;

      window.openOrderModal(activeProduct, selectedQty, selectedSize, selectedColor);
    });
  }
});

function switchMainImage(src, btn) {
  const mainImg = document.getElementById('gallery-main-img');
  if (mainImg) mainImg.src = src;
  document.querySelectorAll('.thumb-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

if (typeof window !== 'undefined') {
  window.switchMainImage = switchMainImage;
}
