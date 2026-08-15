// WhatsApp order modal and message generator.

let currentSelectedProduct = null;
let currentQuantity = 1;

function initOrderModal() {
  if (document.getElementById('order-modal')) return;

  const modalHTML = `
    <div id="order-modal" class="modal-overlay hidden">
      <div class="modal-container">
        
        <!-- Modal Header -->
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="width: 32px; height: 32px; border-radius: var(--radius-sm); background-color: var(--primary-gold); display: flex; align-items: center; justify-content: center; color: var(--text-white); font-weight: 700;">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <h3 class="font-serif" style="font-size: 1.125rem; color: var(--gold-light);">Complete Your Garment Order</h3>
              <p style="font-size: 0.75rem; color: var(--text-muted);">Instant checkout via WhatsApp confirmation</p>
            </div>
          </div>
          <button id="close-order-modal-btn" type="button" style="background: none; border: none; color: var(--text-dim); cursor: pointer; padding: 0.5rem;">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Selected Product Summary Banner -->
        <div id="modal-product-summary" class="modal-product-summary">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <img id="modal-product-img" src="" alt="Product" style="width: 56px; height: 56px; object-fit: cover; border-radius: var(--radius-md); border: 1px solid var(--gold-border);" />
            <div>
              <h4 id="modal-product-title" style="font-weight: 700; color: var(--text-light); font-size: 0.875rem;">Product Name</h4>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem;">
                <span id="modal-product-price" style="color: var(--primary-gold); font-weight: 800; font-size: 1rem;">₹0</span>
                <span id="modal-product-orig-price" style="font-size: 0.75rem; color: var(--text-dim); text-decoration: line-through;">₹0</span>
              </div>
            </div>
          </div>

          <div class="quantity-control">
            <button id="modal-qty-minus" type="button" class="quantity-btn">-</button>
            <span id="modal-qty-val" class="quantity-val">1</span>
            <button id="modal-qty-plus" type="button" class="quantity-btn">+</button>
          </div>
        </div>

        <!-- Form Scroll Area -->
        <div class="modal-body">
          <form id="order-form" style="display: flex; flex-direction: column; gap: 1rem;" novalidate>
            
            <div class="form-grid-2">
              <div>
                <label class="form-label">Select Size *</label>
                <select id="order-size" name="size" class="form-control">
                </select>
              </div>
              <div>
                <label class="form-label">Select Color / Pattern *</label>
                <select id="order-color" name="color" class="form-control">
                </select>
              </div>
            </div>

            <div class="form-grid-2">
              <div>
                <label class="form-label">Customer Name *</label>
                <input type="text" id="order-name" name="name" placeholder="e.g. Rahul Sharma" required class="form-control" />
                <p id="err-name" class="error-text hidden"></p>
              </div>

              <div>
                <label class="form-label">Phone Number *</label>
                <input type="tel" id="order-phone" name="phone" placeholder="10-digit Mobile Number" required maxlength="10" class="form-control" />
                <p id="err-phone" class="error-text hidden"></p>
              </div>
            </div>

            <div class="form-grid-2">
              <div>
                <label class="form-label">WhatsApp Number *</label>
                <input type="tel" id="order-whatsapp" name="whatsapp" placeholder="WhatsApp Mobile Number" required maxlength="10" class="form-control" />
                <p id="err-whatsapp" class="error-text hidden"></p>
              </div>

              <div>
                <label class="form-label">Email Address *</label>
                <input type="email" id="order-email" name="email" placeholder="rahul@example.com" required class="form-control" />
                <p id="err-email" class="error-text hidden"></p>
              </div>
            </div>

            <div>
              <label class="form-label">Delivery Address *</label>
              <textarea id="order-address" name="address" rows="2" placeholder="House No., Street Name, Area, Landmark" required class="form-control"></textarea>
              <p id="err-address" class="error-text hidden"></p>
            </div>

            <div class="form-grid-3">
              <div>
                <label class="form-label">City *</label>
                <input type="text" id="order-city" name="city" placeholder="e.g. Kolkata" required class="form-control" />
                <p id="err-city" class="error-text hidden"></p>
              </div>

              <div>
                <label class="form-label">State *</label>
                <input type="text" id="order-state" name="state" placeholder="e.g. West Bengal" required class="form-control" />
                <p id="err-state" class="error-text hidden"></p>
              </div>

              <div>
                <label class="form-label">PIN Code *</label>
                <input type="text" id="order-pincode" name="pincode" placeholder="6-digit PIN" required maxlength="6" class="form-control" />
                <p id="err-pincode" class="error-text hidden"></p>
              </div>
            </div>

            <div>
              <label class="form-label">Additional Instructions (Optional)</label>
              <input type="text" id="order-message" name="message" placeholder="e.g. Please deliver during evening hours." class="form-control" />
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 0.5rem; border-top: 1px solid var(--gold-border);">
              <span style="font-size: 0.875rem; font-weight: 600; color: var(--text-muted);">Total Payable Amount:</span>
              <span id="modal-total-price" style="font-size: 1.25rem; font-weight: 800; color: var(--primary-gold);">₹0</span>
            </div>

            <button type="submit" id="place-order-btn" class="btn btn-whatsapp btn-full btn-lg">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l.157.251-1.002 3.659 3.738-.981.25.147z"/>
              </svg>
              <span>PLACE ORDER VIA WHATSAPP</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  document.getElementById('close-order-modal-btn').addEventListener('click', closeOrderModal);

  document.getElementById('order-modal').addEventListener('click', (e) => {
    if (e.target.id === 'order-modal') {
      closeOrderModal();
    }
  });

  document.getElementById('modal-qty-minus').addEventListener('click', () => {
    if (currentQuantity > 1) {
      currentQuantity--;
      updateModalTotals();
    }
  });

  document.getElementById('modal-qty-plus').addEventListener('click', () => {
    currentQuantity++;
    updateModalTotals();
  });

  document.getElementById('order-form').addEventListener('submit', handleOrderSubmit);
}

function openOrderModal(product, initialQty = 1, preferredSize = null, preferredColor = null) {
  initOrderModal();

  if (typeof product === 'number' || typeof product === 'string') {
    if (window.getProductById) {
      currentSelectedProduct = window.getProductById(product);
    }
  } else {
    currentSelectedProduct = product;
  }

  if (!currentSelectedProduct && window.PRODUCTS) {
    currentSelectedProduct = window.PRODUCTS[0];
  }

  currentQuantity = initialQty;

  document.getElementById('modal-product-img').src = currentSelectedProduct.images[0];
  document.getElementById('modal-product-title').innerText = currentSelectedProduct.name;
  document.getElementById('modal-product-price').innerText = `₹${currentSelectedProduct.price.toLocaleString('en-IN')}`;
  
  const origElem = document.getElementById('modal-product-orig-price');
  if (currentSelectedProduct.originalPrice) {
    origElem.innerText = `₹${currentSelectedProduct.originalPrice.toLocaleString('en-IN')}`;
    origElem.classList.remove('hidden');
  } else {
    origElem.classList.add('hidden');
  }

  const sizeSelect = document.getElementById('order-size');
  const colorSelect = document.getElementById('order-color');

  if (sizeSelect && currentSelectedProduct.variants && currentSelectedProduct.variants.sizes) {
    sizeSelect.innerHTML = currentSelectedProduct.variants.sizes
      .map(s => `<option value="${s}">${s}</option>`).join('');
    // Pre-select size if passed from detail page picker
    if (preferredSize && currentSelectedProduct.variants.sizes.includes(preferredSize)) {
      sizeSelect.value = preferredSize;
    }
  } else if (sizeSelect) {
    sizeSelect.innerHTML = `<option value="Standard Size">Standard Size</option>`;
  }

  if (colorSelect && currentSelectedProduct.variants && currentSelectedProduct.variants.colors) {
    colorSelect.innerHTML = currentSelectedProduct.variants.colors
      .map(c => `<option value="${c}">${c}</option>`).join('');
    // Pre-select color if passed from detail page picker
    if (preferredColor && currentSelectedProduct.variants.colors.includes(preferredColor)) {
      colorSelect.value = preferredColor;
    }
  } else if (colorSelect) {
    colorSelect.innerHTML = `<option value="Standard Color">Standard Color</option>`;
  }

  updateModalTotals();

  const modal = document.getElementById('order-modal');
  modal.classList.remove('hidden');
  document.documentElement.classList.add('overflow-hidden');
  document.body.classList.add('overflow-hidden');
}

function closeOrderModal() {
  const modal = document.getElementById('order-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.documentElement.classList.remove('overflow-hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

function updateModalTotals() {
  document.getElementById('modal-qty-val').innerText = currentQuantity;
  if (currentSelectedProduct) {
    const total = currentSelectedProduct.price * currentQuantity;
    document.getElementById('modal-total-price').innerText = `₹${total.toLocaleString('en-IN')}`;
  }
}

function validateOrderForm() {
  clearFormErrors();
  let isValid = true;

  const name = document.getElementById('order-name').value.trim();
  const phone = document.getElementById('order-phone').value.trim();
  const whatsapp = document.getElementById('order-whatsapp').value.trim();
  const email = document.getElementById('order-email').value.trim();
  const address = document.getElementById('order-address').value.trim();
  const city = document.getElementById('order-city').value.trim();
  const state = document.getElementById('order-state').value.trim();
  const pincode = document.getElementById('order-pincode').value.trim();

  if (!name) {
    showError('err-name', 'Please enter your name');
    isValid = false;
  }

  if (!phone || !/^\d{10}$/.test(phone)) {
    showError('err-phone', 'Please enter a valid 10-digit mobile number');
    isValid = false;
  }

  if (!whatsapp || !/^\d{10}$/.test(whatsapp)) {
    showError('err-whatsapp', 'Please enter a valid 10-digit WhatsApp number');
    isValid = false;
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError('err-email', 'Please enter a valid email address');
    isValid = false;
  }

  if (!address) {
    showError('err-address', 'Please enter delivery address');
    isValid = false;
  }

  if (!city) {
    showError('err-city', 'City is required');
    isValid = false;
  }

  if (!state) {
    showError('err-state', 'State is required');
    isValid = false;
  }

  if (!pincode || !/^\d{6}$/.test(pincode)) {
    showError('err-pincode', 'Enter valid 6-digit PIN code');
    isValid = false;
  }

  return isValid;
}

function showError(elemId, msg) {
  const elem = document.getElementById(elemId);
  if (elem) {
    elem.innerText = msg;
    elem.classList.remove('hidden');
  }
}

function clearFormErrors() {
  const errs = ['err-name', 'err-phone', 'err-whatsapp', 'err-email', 'err-address', 'err-city', 'err-state', 'err-pincode'];
  errs.forEach(id => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.innerText = '';
      elem.classList.add('hidden');
    }
  });
}

async function handleOrderSubmit(e) {
  e.preventDefault();

  if (!validateOrderForm()) return;

  const fullName = document.getElementById('order-name').value.trim();
  const phone = document.getElementById('order-phone').value.trim();
  const whatsapp = document.getElementById('order-whatsapp').value.trim();
  const email = document.getElementById('order-email').value.trim();
  const address = document.getElementById('order-address').value.trim();
  const city = document.getElementById('order-city').value.trim();
  const state = document.getElementById('order-state').value.trim();
  const pincode = document.getElementById('order-pincode').value.trim();
  const notes = document.getElementById('order-message').value.trim();

  const selectedSize = document.getElementById('order-size') ? document.getElementById('order-size').value : 'N/A';
  const selectedColor = document.getElementById('order-color') ? document.getElementById('order-color').value : 'N/A';

  const submitBtn = document.getElementById('place-order-btn') || document.getElementById('order-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>PROCESSING ORDER...</span>';
  }

  const payload = {
    fullName,
    phone,
    email,
    pincode,
    address,
    city: city + (state ? `, ${state}` : ''),
    productName: currentSelectedProduct ? currentSelectedProduct.name : 'Garment Apparel Item',
    productId: currentSelectedProduct ? currentSelectedProduct.id : null,
    price: currentSelectedProduct ? currentSelectedProduct.price : 0,
    selectedColor,
    selectedSize,
    quantity: currentQuantity,
    notes
  };

  try {
    const res = await fetch(`${window.API_BASE_URL || ''}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok && data.success && data.whatsappUrl) {
      window.open(data.whatsappUrl, '_blank');
      closeOrderModal();
    } else {
      alert(data.error || 'Failed to submit order. Please check details.');
    }
  } catch (err) {
    console.error('Order submission error:', err);
    // Fallback to client-side direct redirect if server request fails
    const targetNumber = (window.STORE_CONFIG && window.STORE_CONFIG.whatsappNumber) ? window.STORE_CONFIG.whatsappNumber : "919876543210";
    const waMsg = `*NEW ORDER - SUTOREKHA (সূত্ররেখা)*\nName: ${fullName}\nPhone: ${phone}\nProduct: ${payload.productName}\nSize: ${selectedSize}\nColor: ${selectedColor}\nQty: ${currentQuantity}`;
    window.open(`https://wa.me/${targetNumber}?text=${encodeURIComponent(waMsg)}`, '_blank');
    closeOrderModal();
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l.157.251-1.002 3.659 3.738-.981.25.147z"/>
        </svg>
        <span>PLACE ORDER VIA WHATSAPP</span>
      `;
    }
  }
}

if (typeof window !== 'undefined') {
  window.openOrderModal = openOrderModal;
  window.closeOrderModal = closeOrderModal;
  window.initOrderModal = initOrderModal;
}
