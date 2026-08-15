/**
 * SutoRekha — Admin Operations & Product Manager Script
 */

let productsData = [];
let ordersData = [];
let enquiriesData = [];

document.addEventListener('DOMContentLoaded', async () => {
  setupAdminAuth();
  setupTabNavigation();
  setupFormListeners();
  setupFormSubtabs();
  setupInventorySearch();
  setupStoreSettings();
  setupDropzones();
  
  // Verify or prompt login
  const isAuthenticated = await checkAdminAuth();
  if (isAuthenticated) {
    loadAdminData();
  }
});

/* --------------------------------------------------------------------------
   0. Admin Authentication & Security Handlers
   -------------------------------------------------------------------------- */
async function checkAdminAuth() {
  const token = sessionStorage.getItem('sg_admin_token');
  const authOverlay = document.getElementById('admin-auth-overlay');

  if (!token) {
    if (authOverlay) authOverlay.classList.remove('hidden');
    return false;
  }

  try {
    const res = await fetch(`${window.API_BASE_URL || ''}/api/v1/auth/verify`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.authenticated) {
        if (authOverlay) authOverlay.classList.add('hidden');
        const userElem = document.getElementById('admin-user-name');
        if (userElem && data.user && data.user.username) {
          userElem.innerText = data.user.username;
        }
        return true;
      }
    }
  } catch (err) {
    console.warn('Auth check failed:', err);
  }

  // Token invalid or expired
  sessionStorage.removeItem('sg_admin_token');
  if (authOverlay) authOverlay.classList.remove('hidden');
  return false;
}

function setupAdminAuth() {
  const loginForm = document.getElementById('admin-login-form');
  const errorMsgBox = document.getElementById('auth-error-msg');
  const authSubmitBtn = document.getElementById('auth-submit-btn');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('auth-username').value.trim();
      const password = document.getElementById('auth-password').value.trim();

      if (!username || !password) return;

      if (authSubmitBtn) {
        authSubmitBtn.disabled = true;
        authSubmitBtn.innerText = '⌛ Authenticating...';
      }
      if (errorMsgBox) errorMsgBox.classList.add('hidden');

      try {
        const res = await fetch(`${window.API_BASE_URL || ''}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const result = await res.json();

        if (res.ok && result.success) {
          sessionStorage.setItem('sg_admin_token', result.token);
          const authOverlay = document.getElementById('admin-auth-overlay');
          if (authOverlay) authOverlay.classList.add('hidden');

          const userElem = document.getElementById('admin-user-name');
          if (userElem && result.user) {
            userElem.innerText = result.user.username;
          }

          loginForm.reset();
          showAlert('✅ Welcome Admin! Authenticated successfully.', 'success');
          loadAdminData();
        } else {
          if (errorMsgBox) {
            errorMsgBox.innerText = result.error || 'Invalid credentials. Please check your username and password.';
            errorMsgBox.classList.remove('hidden');
          }
        }
      } catch (err) {
        console.error('Login error:', err);
        if (errorMsgBox) {
          errorMsgBox.innerText = 'Network connection error. Please try again.';
          errorMsgBox.classList.remove('hidden');
        }
      } finally {
        if (authSubmitBtn) {
          authSubmitBtn.disabled = false;
          authSubmitBtn.innerText = '🔐 Log In to Admin Panel';
        }
      }
    });
  }

  // Logout button
  const logoutBtn = document.getElementById('btn-admin-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('sg_admin_token');
      window.location.href = '/index.html';
    });
  }
}

/* --------------------------------------------------------------------------
   1. Data Loading & Initialization
   -------------------------------------------------------------------------- */
async function loadAdminData() {
  try {
    const token = sessionStorage.getItem('sg_admin_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const [prodRes, orderRes, enqRes] = await Promise.all([
      fetch(`${window.API_BASE_URL || ''}/api/v1/products`, { headers }),
      fetch(`${window.API_BASE_URL || ''}/api/v1/orders`, { headers }).catch(() => null),
      fetch(`${window.API_BASE_URL || ''}/api/v1/enquiries`, { headers }).catch(() => null)
    ]);

    if (prodRes && prodRes.ok) {
      const prodJson = await prodRes.json();
      productsData = prodJson.data || [];
    }

    if (orderRes && orderRes.ok) {
      const orderJson = await orderRes.json();
      ordersData = orderJson.data || [];
    }

    if (enqRes && enqRes.ok) {
      const enqJson = await enqRes.json();
      enquiriesData = enqJson.data || [];
    }

    // Update Tab Counts
    const tabProdCount = document.getElementById('tab-prod-count');
    if (tabProdCount) tabProdCount.innerText = productsData.length;

    const tabOrderCount = document.getElementById('tab-order-count');
    if (tabOrderCount) tabOrderCount.innerText = ordersData.length;

    // Render components
    renderAnalytics();
    renderInventoryTable(productsData);
    renderActivityLogs();
    updateLivePreview();
    loadStoreSettings();

  } catch (err) {
    console.error('Error loading admin dashboard data:', err);
    showAlert('Failed to connect to store server. Please refresh.', 'error');
  }
}

/* --------------------------------------------------------------------------
   2. Tab Switcher
   -------------------------------------------------------------------------- */
function setupTabNavigation() {
  const tabs = document.querySelectorAll('.admin-tab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTabId = btn.getAttribute('data-tab');
      
      tabs.forEach(t => t.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.tab-content-panel').forEach(panel => {
        panel.classList.remove('active');
      });

      const activePanel = document.getElementById(targetTabId);
      if (activePanel) activePanel.classList.add('active');
    });
  });
}

/* --------------------------------------------------------------------------
   3. Analytics & KPI Engine
   -------------------------------------------------------------------------- */
function renderAnalytics() {
  if (!productsData || productsData.length === 0) return;

  const totalProds = productsData.length;
  
  // Total & Avg Price
  const sumPrice = productsData.reduce((acc, p) => acc + (p.price || 0), 0);
  const avgPrice = Math.round(sumPrice / totalProds);

  // Categories count
  const categories = [...new Set(productsData.map(p => p.category))];
  
  // In stock count
  const inStockCount = productsData.filter(p => 
    !p.availability || p.availability.toLowerCase().includes('in stock') || p.availability.toLowerCase().includes('limited')
  ).length;
  const inStockRate = Math.round((inStockCount / totalProds) * 100);

  // Average Rating
  const sumRating = productsData.reduce((acc, p) => acc + (p.rating || 4.5), 0);
  const avgRating = (sumRating / totalProds).toFixed(1);

  // Update KPI DOM
  const kpiTotal = document.getElementById('kpi-total-products');
  if (kpiTotal) kpiTotal.innerText = totalProds;

  const kpiAvgPrice = document.getElementById('kpi-avg-price');
  if (kpiAvgPrice) kpiAvgPrice.innerText = `₹${avgPrice.toLocaleString('en-IN')}`;

  const kpiTotalCats = document.getElementById('kpi-total-categories');
  if (kpiTotalCats) kpiTotalCats.innerText = categories.length;

  const kpiInStock = document.getElementById('kpi-instock-rate');
  if (kpiInStock) kpiInStock.innerText = `${inStockRate}%`;

  const kpiRating = document.getElementById('kpi-avg-rating');
  if (kpiRating) kpiRating.innerText = avgRating;

  const kpiOrders = document.getElementById('kpi-orders-count');
  if (kpiOrders) kpiOrders.innerText = ordersData.length;

  // Category Breakdown Progress Bars
  renderCategoryBreakdown(categories, totalProds);

  // Price Tiers Breakdown
  renderPriceTiers(totalProds);

  // Top Rated Apparel
  renderTopRatedApparel();
}

function renderCategoryBreakdown(categories, totalProds) {
  const container = document.getElementById('category-progress-container');
  if (!container) return;

  const counts = {};
  categories.forEach(cat => { counts[cat] = 0; });
  productsData.forEach(p => {
    if (counts[p.category] !== undefined) counts[p.category]++;
  });

  let html = '';
  Object.keys(counts).forEach(cat => {
    const count = counts[cat];
    const pct = Math.round((count / totalProds) * 100);
    html += `
      <div>
        <div class="progress-item-meta">
          <span>${cat}</span>
          <span>${count} items (${pct}%)</span>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" style="width: ${pct}%;"></div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function renderPriceTiers(totalProds) {
  const container = document.getElementById('price-tier-container');
  if (!container) return;

  const budget = productsData.filter(p => p.price < 2000).length;
  const mid = productsData.filter(p => p.price >= 2000 && p.price <= 4500).length;
  const luxury = productsData.filter(p => p.price > 4500).length;

  const tiers = [
    { label: 'Budget Apparel (< ₹2,000)', count: budget },
    { label: 'Mid-Range Premium (₹2,000 – ₹4,500)', count: mid },
    { label: 'Luxury & Designer (> ₹4,500)', count: luxury }
  ];

  let html = '';
  tiers.forEach(t => {
    const pct = totalProds > 0 ? Math.round((t.count / totalProds) * 100) : 0;
    html += `
      <div>
        <div class="progress-item-meta">
          <span>${t.label}</span>
          <span>${t.count} items (${pct}%)</span>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" style="width: ${pct}%;"></div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function renderTopRatedApparel() {
  const container = document.getElementById('top-rated-grid');
  if (!container) return;

  // Exactly top 3 rated products
  const sorted = [...productsData].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3);

  let html = '';
  sorted.forEach(p => {
    const formattedId = String(p.id).padStart(3, '0');
    let discountTag = p.discount;
    if (p.originalPrice && p.originalPrice > p.price) {
      const pct = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
      discountTag = `${pct}% OFF`;
    }

    html += `
      <div class="top-rated-card">
        <div class="top-rated-img-wrap">
          <img src="${p.images[0]}" alt="${p.name}" class="top-rated-img" onerror="this.src='https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80'" />
          <span style="position: absolute; top: 10px; left: 10px; font-size: 0.6875rem; font-weight: 700; background: rgba(15, 14, 12, 0.85); backdrop-filter: blur(4px); color: var(--gold-light); padding: 3px 8px; border-radius: var(--radius-full); border: 1px solid rgba(197, 155, 39, 0.3);">
            #${formattedId}
          </span>
          <span style="position: absolute; top: 10px; right: 10px; font-size: 0.6875rem; font-weight: 600; background: rgba(15, 14, 12, 0.85); backdrop-filter: blur(4px); color: var(--gold-light); padding: 3px 8px; border-radius: var(--radius-full); border: 1px solid rgba(197, 155, 39, 0.3);">
            ${p.category}
          </span>
        </div>
        <div class="top-rated-body">
          <div class="top-rated-cat">${p.category}</div>
          <div class="top-rated-name" title="${p.name}">${p.name}</div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.625rem; font-size: 0.8125rem;">
            <span style="color: var(--gold-accent); font-weight: 700;">⭐ ${p.rating || '4.9'} / 5.0</span>
            <span style="color: var(--text-dim); font-size: 0.75rem;">(${p.reviewsCount || 15} reviews)</span>
          </div>
          <div class="top-rated-pricing">
            ${discountTag ? `<div style="font-size: 0.6875rem; font-weight: 700; background: var(--primary-gold); color: #fff; padding: 2px 8px; border-radius: var(--radius-full); display: inline-block; margin-bottom: 0.375rem; width: max-content;">${discountTag}</div>` : ''}
            <div style="display: flex; align-items: baseline; gap: 0.5rem;">
              <span style="font-weight: 800; color: var(--gold-light); font-size: 1.25rem;">₹${p.price ? p.price.toLocaleString('en-IN') : 0}</span>
              ${p.originalPrice ? `<span style="text-decoration: line-through; color: var(--text-dim); font-size: 0.8125rem;">₹${p.originalPrice.toLocaleString('en-IN')}</span>` : ''}
            </div>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="editProduct(${p.id})" style="margin-top: 0.875rem; width: 100%; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 0.375rem;">
            ✏️ Edit Product Details
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

/* --------------------------------------------------------------------------
   4. Form Management & Live Preview
   -------------------------------------------------------------------------- */
function setupFormListeners() {
  const form = document.getElementById('product-manage-form');
  if (!form) return;

  // Custom Category toggle
  const catSelect = document.getElementById('prod-category');
  const customWrapper = document.getElementById('custom-cat-wrapper');
  if (catSelect && customWrapper) {
    catSelect.addEventListener('change', () => {
      if (catSelect.value === 'Custom Category') {
        customWrapper.classList.remove('hidden');
      } else {
        customWrapper.classList.add('hidden');
      }
      updateLivePreview();
    });
  }

  // Auto-recalculate discount input on price change
  const priceInput = document.getElementById('prod-price');
  const origPriceInput = document.getElementById('prod-orig-price');
  const discountInput = document.getElementById('prod-discount');

  function autoCalculateDiscountField() {
    if (!priceInput || !origPriceInput || !discountInput) return;
    const p = parseFloat(priceInput.value);
    const op = parseFloat(origPriceInput.value);
    const currDisc = discountInput.value.trim();

    if (!isNaN(p) && !isNaN(op) && op > p) {
      if (!currDisc || currDisc.endsWith('% OFF') || currDisc.endsWith('% off') || currDisc === 'SPECIAL') {
        const pct = Math.round(((op - p) / op) * 100);
        discountInput.value = `${pct}% OFF`;
      }
    }
  }

  if (priceInput && origPriceInput) {
    priceInput.addEventListener('input', () => {
      autoCalculateDiscountField();
      updateLivePreview();
    });
    origPriceInput.addEventListener('input', () => {
      autoCalculateDiscountField();
      updateLivePreview();
    });
  }

  // Live preview input events
  const inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach(inp => {
    inp.addEventListener('input', updateLivePreview);
    inp.addEventListener('change', updateLivePreview);
  });

  // Form Reset
  const btnReset = document.getElementById('btn-reset-form');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      resetForm();
    });
  }

  // Form Submit (Create or Edit)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleFormSubmit();
  });
}

function updateLivePreview() {
  const container = document.getElementById('live-card-container');
  if (!container) return;

  const name = document.getElementById('prod-name').value || 'Royal Silk Kurta Set';
  
  let category = document.getElementById('prod-category').value;
  if (category === 'Custom Category') {
    category = document.getElementById('prod-custom-cat').value || 'Custom Collection';
  }

  const price = parseFloat(document.getElementById('prod-price').value) || 2999;
  const origPrice = parseFloat(document.getElementById('prod-orig-price').value) || (price * 1.35);
  let discount = document.getElementById('prod-discount').value.trim();
  
  if (origPrice > price) {
    const computedPct = Math.round(((origPrice - price) / origPrice) * 100);
    if (!discount || discount.endsWith('% OFF') || discount.endsWith('% off')) {
      discount = `${computedPct}% OFF`;
    }
  } else if (!discount) {
    discount = 'SPECIAL';
  }

  const mainImg = document.getElementById('prod-main-img').value || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80';
  const shortDesc = document.getElementById('prod-short-desc').value || 'Handcrafted silk apparel featuring intricate embroidery and royal styling.';
  const rating = parseFloat(document.getElementById('prod-rating').value) || 4.9;

  container.innerHTML = `
    <div class="product-card live-single-card">
      <div class="product-card-img-wrap">
        <img src="${mainImg}" alt="${name}" class="product-card-img" onerror="this.src='https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80'" />
        <span class="badge-category">${category}</span>
        ${discount ? `<span class="badge-discount">${discount}</span>` : ''}
      </div>
      <div class="product-card-body">
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; font-weight: 700; margin-bottom: 0.35rem;">
          <div style="display: flex; align-items: center; gap: 0.25rem; color: #f59e0b;">
            <span>★</span>
            <span>${rating}</span>
            <span style="color: var(--text-dim); font-weight: 400;">(15 reviews)</span>
          </div>
          <span style="color: #34d399; font-weight: 600;">In Stock</span>
        </div>
        <h3 class="font-serif product-card-title">${name}</h3>
        <p class="product-card-desc">${shortDesc}</p>
        <div style="margin-top: auto; padding-top: 0.5rem;">
          <div style="display: flex; align-items: baseline; gap: 0.5rem;">
            <span style="font-size: 1.25rem; font-weight: 800; color: var(--gold-light);">₹${price.toLocaleString('en-IN')}</span>
            ${origPrice > price ? `<span style="font-size: 0.75rem; color: var(--text-dim); text-decoration: line-through;">₹${Math.round(origPrice).toLocaleString('en-IN')}</span>` : ''}
          </div>
        </div>
        <button type="button" class="btn btn-primary btn-sm btn-full" style="margin-top: 0.5rem; pointer-events: none;">
          🛒 Order on WhatsApp
        </button>
      </div>
    </div>
  `;
}

async function handleFormSubmit() {
  const submitBtn = document.getElementById('btn-submit-product');
  const editId = document.getElementById('edit-product-id').value;

  const name = document.getElementById('prod-name').value.trim();
  let category = document.getElementById('prod-category').value;
  if (category === 'Custom Category') {
    category = document.getElementById('prod-custom-cat').value.trim() || 'General';
  }

  const price = parseFloat(document.getElementById('prod-price').value);
  const originalPrice = parseFloat(document.getElementById('prod-orig-price').value) || price;
  const discount = document.getElementById('prod-discount').value.trim();
  const mainImg = document.getElementById('prod-main-img').value.trim();
  const extraImgsStr = document.getElementById('prod-extra-imgs').value.trim();

  if (!mainImg) {
    showAlert('Please upload a primary image first.', 'error');
    switchFormSubtab('subtab-images');
    return;
  }
  
  const images = [mainImg];
  if (extraImgsStr) {
    extraImgsStr.split(',').forEach(url => {
      const u = url.trim();
      if (u) images.push(u);
    });
  }

  const shortDescription = document.getElementById('prod-short-desc').value.trim();
  const fullDescription = document.getElementById('prod-full-desc').value.trim();
  const featuresStr = document.getElementById('prod-features').value.trim();
  const features = featuresStr ? featuresStr.split('\n').map(f => f.trim()).filter(Boolean) : [];

  const fabric = document.getElementById('prod-fabric').value.trim() || 'Silk & Cotton Blend';
  const fit = document.getElementById('prod-fit').value.trim() || 'Regular Fit';
  const colorsStr = document.getElementById('prod-colors').value.trim();
  const sizesStr = document.getElementById('prod-sizes').value.trim();

  const colors = colorsStr ? colorsStr.split(',').map(c => c.trim()).filter(Boolean) : ['Standard Color'];
  const sizes = sizesStr ? sizesStr.split(',').map(s => s.trim()).filter(Boolean) : ['38 (S)', '40 (M)', '42 (L)', '44 (XL)'];

  const availability = document.getElementById('prod-availability').value;
  const rating = parseFloat(document.getElementById('prod-rating').value) || 4.9;

  const payload = {
    name,
    price,
    originalPrice,
    discount,
    category,
    images,
    shortDescription,
    fullDescription,
    features,
    specs: {
      "Brand": "SutoRekha",
      "Fabric": fabric,
      "Fit": fit,
      "Wash Care": "Dry Clean Recommended"
    },
    variants: {
      colors,
      sizes
    },
    availability,
    rating,
    reviewsCount: 15
  };

  submitBtn.disabled = true;
  submitBtn.innerText = '⌛ Saving Product...';

  try {
    let url = `${window.API_BASE_URL || ''}/api/v1/products`;
    let method = 'POST';

    if (editId) {
      url = `${window.API_BASE_URL || ''}/api/v1/products/${editId}`;
      method = 'PUT';
    }

    const token = sessionStorage.getItem('sg_admin_token');

    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (res.ok && result.success) {
      showAlert(`Success: Product "${name}" was ${editId ? 'updated' : 'added'} successfully!`, 'success');
      resetForm();
      await loadAdminData();

      // Auto switch to inventory table
      const tabInvBtn = document.querySelector('[data-tab="tab-inventory"]');
      if (tabInvBtn) tabInvBtn.click();
    } else {
      showAlert(`Error: ${result.error || 'Failed to save product'}`, 'error');
    }
  } catch (err) {
    console.error('Error submitting product form:', err);
    showAlert('Server connection error while saving product.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = editId ? '💾 Update Product' : '🚀 Save & Publish Product';
  }
}

function resetForm() {
  document.getElementById('edit-product-id').value = '';
  document.getElementById('product-manage-form').reset();
  
  const customWrapper = document.getElementById('custom-cat-wrapper');
  if (customWrapper) customWrapper.classList.add('hidden');

  const formTitle = document.getElementById('form-header-title');
  if (formTitle) formTitle.innerText = 'Add New Apparel Product';

  const submitBtn = document.getElementById('btn-submit-product');
  if (submitBtn) submitBtn.innerText = '🚀 Save & Publish Product';

  // Clear drag & drop image previews
  setDropzoneUrls('dz-main-img', []);
  setDropzoneUrls('dz-extra-imgs', []);

  // Switch to first subtab
  switchFormSubtab('subtab-basic');

  updateLivePreview();
}

function setupFormSubtabs() {
  const subtabBtns = document.querySelectorAll('.form-subtab-btn');
  subtabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-subtab');
      subtabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.form-subtab-content').forEach(content => {
        content.classList.remove('active');
        content.classList.add('hidden');
      });

      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.classList.remove('hidden');
        targetContent.classList.add('active');
      }
    });
  });
}

function switchFormSubtab(subtabId) {
  const btn = document.querySelector(`.form-subtab-btn[data-subtab="${subtabId}"]`);
  if (btn) btn.click();
}

/* --------------------------------------------------------------------------
   5. Inventory Table & Operations (Overflow Fixed)
   -------------------------------------------------------------------------- */
function renderInventoryTable(items) {
  const tbody = document.getElementById('inventory-tbody');
  if (!tbody) return;

  if (!items || items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          No products found matching your criteria.
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  items.forEach(p => {
    const isOut = p.availability && p.availability.toLowerCase().includes('out of stock');
    const formattedId = String(p.id).padStart(3, '0');
    
    // Auto calculate discount if missing or percentage tag
    let discountStr = p.discount || '';
    if (p.originalPrice && p.originalPrice > p.price) {
      const pct = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
      discountStr = `${pct}% OFF`;
    }
    
    html += `
      <tr>
        <td style="width: 60px;">
          <img src="${p.images[0]}" alt="${p.name}" class="table-img" onerror="this.src='https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80'" />
        </td>
        <td style="width: 220px;">
          <div class="cell-truncate" style="color: var(--text-light); font-weight: 700;" title="${p.name}">${p.name}</div>
          <span style="font-size: 0.75rem; color: var(--text-dim); font-weight: 600;">ID: #${formattedId}</span>
        </td>
        <td style="width: 120px;">
          <span class="cell-truncate" style="background: rgba(197, 155, 39, 0.1); border: 1px solid var(--gold-border); padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;">
            ${p.category}
          </span>
        </td>
        <td style="width: 100px;">
          <strong style="color: var(--gold-accent);">₹${p.price ? p.price.toLocaleString('en-IN') : 0}</strong>
        </td>
        <td style="width: 110px;">
          ${p.originalPrice ? `<span style="text-decoration: line-through; color: var(--text-dim); font-size: 0.75rem; margin-right: 4px;">₹${p.originalPrice.toLocaleString('en-IN')}</span>` : ''}
          <span style="font-size: 0.75rem; color: var(--gold-light); font-weight: 700;">${discountStr}</span>
        </td>
        <td style="width: 80px;">
          ⭐ ${p.rating || '4.8'}
        </td>
        <td style="width: 120px;">
          <span class="status-pill ${isOut ? 'out-stock' : 'in-stock'}">
            ${isOut ? 'Out of Stock' : 'In Stock'}
          </span>
        </td>
        <td style="width: 80px;">
          <div class="table-actions" style="justify-content: center;">
            <button type="button" class="btn-icon-action" onclick="editProduct(${p.id})" title="Edit Product">
              ✏️
            </button>
            <button type="button" class="btn-icon-action btn-icon-delete" onclick="deleteProduct(${p.id})" title="Delete Product">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function setupInventorySearch() {
  const searchInput = document.getElementById('inventory-search');
  const catFilter = document.getElementById('inventory-cat-filter');
  if (!searchInput) return;

  function doFilter() {
    const rawQuery = searchInput.value.toLowerCase().trim();
    const selectedCat = catFilter ? catFilter.value : 'ALL';
    const cleanQuery = rawQuery.startsWith('#') ? rawQuery.slice(1).trim() : rawQuery;

    const filtered = productsData.filter(p => {
      // 1. Category dropdown check
      if (selectedCat !== 'ALL' && p.category.toLowerCase() !== selectedCat.toLowerCase()) {
        return false;
      }

      // 2. Search query check
      if (!cleanQuery) return true;

      const formattedId = String(p.id).padStart(3, '0');
      return (
        p.name.toLowerCase().includes(cleanQuery) ||
        p.category.toLowerCase().includes(cleanQuery) ||
        String(p.id).includes(cleanQuery) ||
        formattedId.includes(cleanQuery)
      );
    });

    renderInventoryTable(filtered);
  }

  searchInput.addEventListener('input', doFilter);
  if (catFilter) {
    catFilter.addEventListener('change', doFilter);
  }
}

/* --------------------------------------------------------------------------
   5b. Store Settings (Editable Business Contact Configuration)
   -------------------------------------------------------------------------- */
function setupStoreSettings() {
  const form = document.getElementById('store-settings-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = sessionStorage.getItem('sg_admin_token');
    const submitBtn = document.getElementById('btn-save-settings');

    const payload = {
      storeName: document.getElementById('set-store-name').value.trim(),
      whatsappNumber: document.getElementById('set-whatsapp').value.trim(),
      phone: document.getElementById('set-phone').value.trim(),
      email: document.getElementById('set-email').value.trim(),
      address: document.getElementById('set-address').value.trim(),
      hours: document.getElementById('set-hours').value.trim(),
      logo: document.getElementById('set-logo').value.trim(),
      heroImage: document.getElementById('set-hero-image').value.trim(),
      promoHeading: document.getElementById('set-promo-heading') ? document.getElementById('set-promo-heading').value.trim() : '',
      promoSubtext: document.getElementById('set-promo-subtext') ? document.getElementById('set-promo-subtext').value.trim() : '',
      promoBtnText: document.getElementById('set-promo-btn-text') ? document.getElementById('set-promo-btn-text').value.trim() : '',
      promoBtnLink: document.getElementById('set-promo-btn-link') ? document.getElementById('set-promo-btn-link').value.trim() : ''
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = '⌛ Saving Settings...';
    }

    try {
      const res = await fetch(`${window.API_BASE_URL || ''}/api/v1/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (res.ok && result.success) {
        showAlert('Store settings saved successfully!', 'success');
        if (window.fetchStoreConfig) window.fetchStoreConfig();
      } else {
        showAlert(`Error: ${result.error || 'Failed to save settings'}`, 'error');
      }
    } catch (err) {
      console.error('Error saving store settings:', err);
      showAlert('Server connection error while saving settings.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = '💾 Save Store Settings';
      }
    }
  });
}

async function loadStoreSettings() {
  try {
    const res = await fetch(`${window.API_BASE_URL || ''}/api/v1/config`);
    if (!res.ok) return;
    const result = await res.json();
    const cfg = result.data || {};

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    set('set-store-name', cfg.storeName);
    set('set-whatsapp', cfg.whatsappNumber);
    set('set-phone', cfg.phone);
    set('set-email', cfg.email);
    set('set-address', cfg.address);
    set('set-hours', cfg.hours);
    set('set-logo', cfg.logo);
    set('set-hero-image', cfg.heroImage);
    set('set-promo-heading', cfg.promoHeading);
    set('set-promo-subtext', cfg.promoSubtext);
    set('set-promo-btn-text', cfg.promoBtnText);
    set('set-promo-btn-link', cfg.promoBtnLink);

    setHint('set-logo-url', cfg.logo, 'No logo uploaded yet.');
    setHint('set-hero-url', cfg.heroImage, 'No hero image uploaded yet.');
    setDropzoneInitial('dz-set-logo', cfg.logo);
    setDropzoneInitial('dz-set-hero', cfg.heroImage);
  } catch (err) {
    console.warn('Failed to load store settings:', err);
  }
}

function setHint(textId, url, emptyText) {
  const el = document.getElementById(textId);
  if (!el) return;
  el.innerText = url || emptyText || '';
}

async function uploadImageToCloudinary(file, folder) {
  if (!file) throw new Error('No file selected.');
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });

  const token = sessionStorage.getItem('sg_admin_token');
  const res = await fetch(`${window.API_BASE_URL || ''}/api/v1/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ image: dataUrl, folder: folder || 'sg-fashion' })
  });

  const result = await res.json();
  if (!res.ok || !result.success) {
    throw new Error(result.error || 'Image upload failed.');
  }
  return result.url;
}

/* --------------------------------------------------------------------------
   Drag & Drop Upload Widgets
   -------------------------------------------------------------------------- */
function setupDropzones() {
  document.querySelectorAll('.dropzone').forEach(initDropzone);
}

function initDropzone(dzEl) {
  if (!dzEl || dzEl.__dzInitialized) return;
  dzEl.__dzInitialized = true;

  const input = dzEl.querySelector('input[type="file"]');
  const previews = dzEl.querySelector('.dropzone-previews');
  const status = dzEl.querySelector('.dropzone-status');
  const multiple = dzEl.hasAttribute('data-multiple');
  const folder = dzEl.getAttribute('data-folder') || 'sg-fashion';
  const role = dzEl.getAttribute('data-role') || '';
  dzEl.__urls = [];

  function applyRole() {
    const urls = dzEl.__urls;
    if (role === 'logo') {
      document.getElementById('set-logo').value = urls[0] || '';
      setHint('set-logo-url', urls[0] || '', 'No logo uploaded yet.');
    } else if (role === 'hero') {
      document.getElementById('set-hero-image').value = urls[0] || '';
      setHint('set-hero-url', urls[0] || '', 'No hero image uploaded yet.');
    } else if (role === 'main-img') {
      document.getElementById('prod-main-img').value = urls[0] || '';
      setHint('prod-main-img-hint', urls[0] || '', 'No primary image uploaded yet.');
      updateLivePreview();
    } else if (role === 'extra-imgs') {
      document.getElementById('prod-extra-imgs').value = urls.join(', ');
      setHint('prod-extra-imgs-hint', urls.length ? `${urls.length} gallery image(s) uploaded.` : '', 'No gallery images uploaded yet.');
      updateLivePreview();
    }
  }

  function renderPreviews() {
    if (!previews) return;
    previews.innerHTML = '';
    dzEl.__urls.forEach(url => {
      const wrap = document.createElement('div');
      wrap.className = 'dz-thumb';

      const img = document.createElement('img');
      img.src = url;
      img.alt = 'Uploaded image';
      img.onerror = () => { wrap.style.display = 'none'; };
      wrap.appendChild(img);

      if (multiple) {
        const rm = document.createElement('button');
        rm.type = 'button';
        rm.className = 'dz-thumb-remove';
        rm.title = 'Remove from gallery';
        rm.innerHTML = '&times;';
        rm.addEventListener('click', (e) => {
          e.stopPropagation();
          dzEl.__urls = dzEl.__urls.filter(u => u !== url);
          applyRole();
          renderPreviews();
        });
        wrap.appendChild(rm);
      }

      previews.appendChild(wrap);
    });
  }

  function setStatus(msg) {
    if (!status) return;
    status.textContent = msg || '';
    status.hidden = !msg;
  }

  async function handleFiles(files) {
    const list = multiple ? Array.from(files) : [files[0]];
    if (!list.length) return;

    setStatus('Uploading to Cloudinary...');
    try {
      const urls = [];
      for (const file of list) {
        urls.push(await uploadImageToCloudinary(file, folder));
      }

      if (multiple) {
        dzEl.__urls = dzEl.__urls.concat(urls);
      } else {
        dzEl.__urls = urls;
      }

      applyRole();
      renderPreviews();
      setStatus('');
      showAlert(`Uploaded ${urls.length} image(s) to Cloudinary.`, 'success');
    } catch (err) {
      console.error('Upload error:', err);
      setStatus(err.message || 'Upload failed.');
      showAlert(`Upload failed: ${err.message}`, 'error');
    }
  }

  // Click to browse
  dzEl.addEventListener('click', (e) => {
    if (e.target.closest('.dz-thumb-remove')) return;
    if (input) input.click();
  });

  if (input) {
    input.addEventListener('change', () => {
      if (input.files && input.files.length) {
        handleFiles(Array.from(input.files));
        input.value = '';
      }
    });
  }

  // Drag & drop
  ['dragenter', 'dragover'].forEach(evt => {
    dzEl.addEventListener(evt, (e) => {
      e.preventDefault();
      dzEl.classList.add('dz-drag');
    });
  });
  ['dragleave', 'drop'].forEach(evt => {
    dzEl.addEventListener(evt, (e) => {
      e.preventDefault();
      dzEl.classList.remove('dz-drag');
    });
  });
  dzEl.addEventListener('drop', (e) => {
    const dropped = e.dataTransfer && e.dataTransfer.files;
    if (dropped && dropped.length) {
      handleFiles(Array.from(dropped));
    }
  });

  dzEl.applyRole = applyRole;
  dzEl.renderPreviews = renderPreviews;
}

function setDropzoneInitial(dzId, url) {
  const dz = document.getElementById(dzId);
  if (!dz || !dz.__dzInitialized) return;
  dz.__urls = [url];
  if (dz.applyRole) dz.applyRole();
  if (dz.renderPreviews) dz.renderPreviews();
}

function setDropzoneUrls(dzId, urls) {
  const dz = document.getElementById(dzId);
  if (!dz || !dz.__dzInitialized) return;
  dz.__urls = Array.isArray(urls) ? urls.filter(Boolean) : [];
  if (dz.applyRole) dz.applyRole();
  if (dz.renderPreviews) dz.renderPreviews();
}

window.editProduct = function(id) {
  const product = productsData.find(p => p.id === id);
  if (!product) return;

  const formattedId = String(product.id).padStart(3, '0');

  document.getElementById('edit-product-id').value = product.id;
  document.getElementById('prod-name').value = product.name || '';
  
  const catSelect = document.getElementById('prod-category');
  const customWrapper = document.getElementById('custom-cat-wrapper');
  
  if (['Ethnic Wear', 'Sarees & Lehengas', 'Formal & Suits', 'Casual & Shirts', 'Kids & Festive'].includes(product.category)) {
    catSelect.value = product.category;
    if (customWrapper) customWrapper.classList.add('hidden');
  } else {
    catSelect.value = 'Custom Category';
    if (customWrapper) customWrapper.classList.remove('hidden');
    document.getElementById('prod-custom-cat').value = product.category;
  }

  document.getElementById('prod-price').value = product.price || '';
  document.getElementById('prod-orig-price').value = product.originalPrice || '';
  
  // Calculate or populate discount
  let discVal = product.discount || '';
  if (product.originalPrice && product.originalPrice > product.price) {
    const pct = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    discVal = `${pct}% OFF`;
  }
  document.getElementById('prod-discount').value = discVal;

  document.getElementById('prod-main-img').value = product.images ? product.images[0] : '';
  document.getElementById('prod-extra-imgs').value = product.images && product.images.length > 1 ? product.images.slice(1).join(', ') : '';

  // Populate drag & drop previews from existing product images
  setDropzoneUrls('dz-main-img', product.images ? [product.images[0]] : []);
  setDropzoneUrls('dz-extra-imgs', product.images ? product.images.slice(1) : []);

  document.getElementById('prod-short-desc').value = product.shortDescription || '';
  document.getElementById('prod-full-desc').value = product.fullDescription || '';
  document.getElementById('prod-features').value = product.features ? product.features.join('\n') : '';

  if (product.specs) {
    document.getElementById('prod-fabric').value = product.specs.Fabric || '';
    document.getElementById('prod-fit').value = product.specs.Fit || '';
  }

  if (product.variants) {
    document.getElementById('prod-colors').value = product.variants.colors ? product.variants.colors.join(', ') : '';
    document.getElementById('prod-sizes').value = product.variants.sizes ? product.variants.sizes.join(', ') : '';
  }

  document.getElementById('prod-availability').value = product.availability || 'In Stock (Fast Shipping)';
  document.getElementById('prod-rating').value = product.rating || 4.9;

  document.getElementById('form-header-title').innerText = `Edit Product #${formattedId}: ${product.name}`;
  document.getElementById('btn-submit-product').innerText = '💾 Update Product';

  updateLivePreview();

  // Switch to Add/Edit Tab
  const addTabBtn = document.querySelector('[data-tab="tab-add-product"]');
  if (addTabBtn) addTabBtn.click();
};

window.deleteProduct = async function(id) {
  const product = productsData.find(p => p.id === id);
  if (!product) return;

  const confirmDelete = confirm(`Are you sure you want to delete "${product.name}" from store inventory?`);
  if (!confirmDelete) return;

  try {
    const token = sessionStorage.getItem('sg_admin_token');
    const res = await fetch(`${window.API_BASE_URL || ''}/api/v1/products/${id}`, { 
      method: 'DELETE',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    const result = await res.json();

    if (res.ok && result.success) {
      showAlert(`Product "${product.name}" removed successfully.`, 'success');
      await loadAdminData();
    } else {
      showAlert(`Error: ${result.error || 'Failed to delete product'}`, 'error');
    }
  } catch (err) {
    console.error('Error deleting product:', err);
    showAlert('Server connection error while deleting product.', 'error');
  }
};

/* --------------------------------------------------------------------------
   6. Activity Logs (Orders & Enquiries UX Improvements)
   -------------------------------------------------------------------------- */
function renderActivityLogs() {
  const ordersContainer = document.getElementById('orders-log-list');
  const enqContainer = document.getElementById('enquiries-log-list');

  const orderCountBadge = document.getElementById('activity-order-count');
  if (orderCountBadge) orderCountBadge.innerText = `${ordersData.length} Orders`;

  const enqCountBadge = document.getElementById('activity-enquiry-count');
  if (enqCountBadge) enqCountBadge.innerText = `${enquiriesData.length} Enquiries`;

  // Render Orders
  if (ordersContainer) {
    if (ordersData.length === 0) {
      ordersContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted); background: var(--bg-card-dark); border-radius: var(--radius-lg); border: 1px dashed var(--gold-border);">
          🛒 No customer orders logged yet.
        </div>
      `;
    } else {
      let html = '';
      [...ordersData].reverse().forEach(o => {
        const dateStr = o.timestamp ? new Date(o.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent';
        const rawPhone = o.customer && o.customer.phone ? o.customer.phone.replace(/[^0-9]/g, '') : '';
        const waNumber = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;

        html += `
          <div class="log-item-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <span class="log-meta-badge">#${o.orderId || 'ORDER'}</span>
              <span style="font-size: 0.75rem; color: var(--text-dim);">🕒 ${dateStr}</span>
            </div>
            
            <div style="font-size: 0.9375rem; color: var(--text-light); font-weight: 700; margin-bottom: 0.375rem;">
              ${o.item ? o.item.productName : 'Apparel Garment'}
            </div>

            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
              ${o.item && o.item.selectedColor ? `<span style="font-size: 0.75rem; background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 4px; color: var(--text-muted);">Color: <strong>${o.item.selectedColor}</strong></span>` : ''}
              ${o.item && o.item.selectedSize ? `<span style="font-size: 0.75rem; background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 4px; color: var(--text-muted);">Size: <strong>${o.item.selectedSize}</strong></span>` : ''}
              ${o.item && o.item.quantity ? `<span style="font-size: 0.75rem; background: rgba(255,255,255,0.06); padding: 2px 8px; border-radius: 4px; color: var(--text-muted);">Qty: <strong>${o.item.quantity}</strong></span>` : ''}
            </div>

            <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0.5rem; pt: 0.5rem; border-top: 1px solid rgba(197, 155, 39, 0.15); margin-top: 0.5rem; padding-top: 0.5rem;">
              <div>
                <div style="font-size: 0.8125rem; color: var(--text-light);">👤 <strong>${o.customer ? o.customer.fullName : 'Valued Customer'}</strong></div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">📞 ${o.customer ? o.customer.phone : 'N/A'}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-weight: 800; color: #34d399; font-size: 1rem;">₹${o.item && o.item.totalPrice ? o.item.totalPrice.toLocaleString('en-IN') : 0}</div>
                ${waNumber ? `<a href="https://wa.me/${waNumber}?text=Hello%20${encodeURIComponent(o.customer ? o.customer.fullName : '')},%20thank%20you%20for%20your%20SG%20Garments%20order%20(${o.orderId})!" target="_blank" class="btn btn-secondary btn-sm" style="font-size: 0.6875rem; padding: 2px 8px; margin-top: 4px; color: #34d399; border-color: rgba(52, 211, 153, 0.4);">💬 Reply on WA</a>` : ''}
              </div>
            </div>
          </div>
        `;
      });
      ordersContainer.innerHTML = html;
    }
  }

  // Render Enquiries
  if (enqContainer) {
    if (enquiriesData.length === 0) {
      enqContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted); background: var(--bg-card-dark); border-radius: var(--radius-lg); border: 1px dashed var(--gold-border);">
          📩 No customer store enquiries logged yet.
        </div>
      `;
    } else {
      let html = '';
      [...enquiriesData].reverse().forEach(e => {
        const dateStr = e.timestamp ? new Date(e.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent';
        const rawPhone = e.phone ? e.phone.replace(/[^0-9]/g, '') : '';
        const waNumber = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;

        html += `
          <div class="log-item-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <strong style="color: var(--gold-light); font-size: 0.9375rem;">👤 ${e.name}</strong>
              <span style="font-size: 0.75rem; color: var(--text-dim);">🕒 ${dateStr}</span>
            </div>
            
            <p style="font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 0.5rem;">
              📞 <strong>${e.phone}</strong> ${e.email ? `• 📧 ${e.email}` : ''}
            </p>

            <div style="background: rgba(0,0,0,0.2); border-left: 3px solid var(--primary-gold); padding: 0.625rem 0.875rem; border-radius: 0 6px 6px 0; font-size: 0.84375rem; color: var(--text-light); font-style: italic; margin-bottom: 0.75rem;">
              "${e.message || 'Customer enquiry regarding store collection.'}"
            </div>

            ${waNumber ? `
              <div style="text-align: right;">
                <a href="https://wa.me/${waNumber}?text=Hello%20${encodeURIComponent(e.name)},%20thank%20you%20for%20contacting%20SG%20Garments!" target="_blank" class="btn btn-secondary btn-sm" style="font-size: 0.6875rem; padding: 2px 8px; color: var(--gold-accent);">
                  💬 Respond on WhatsApp
                </a>
              </div>
            ` : ''}
          </div>
        `;
      });
      enqContainer.innerHTML = html;
    }
  }
}

/* --------------------------------------------------------------------------
   7. Helper Utilities
   -------------------------------------------------------------------------- */
function showAlert(message, type = 'success') {
  const alertBox = document.getElementById('admin-alert-box');
  if (!alertBox) return;

  alertBox.className = `admin-alert admin-alert-${type}`;
  alertBox.innerHTML = `
    <span>${message}</span>
    <button type="button" style="background:none; border:none; color:currentColor; cursor:pointer;" onclick="this.parentElement.classList.add('hidden')">✖</button>
  `;

  alertBox.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  setTimeout(() => {
    alertBox.classList.add('hidden');
  }, 6000);
}
