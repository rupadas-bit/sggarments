// Product search, category filters, and grid rendering.

async function initialiseProducts() {
  if (document.getElementById('product-catalog-grid')) {
    await renderProductCatalog();
    setupCatalogFiltering();
  }
  if (document.getElementById('featured-products-grid')) {
    await renderFeaturedProducts();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialiseProducts, { once: true });
} else {
  initialiseProducts();
}

async function loadProducts() {
  try {
    const res = await fetch(`${window.API_BASE_URL || ''}/api/v1/products`);
    const contentType = res.headers.get('content-type') || '';

    if (!res.ok || !contentType.includes('application/json')) {
      throw new Error(`Product API returned ${res.status}`);
    }

    const result = await res.json();
    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
      window.PRODUCTS = result.data;
      return result.data;
    }
  } catch (error) {
    console.warn('Backend API unavailable, using fallback dataset', error);
  }

  return Array.isArray(window.PRODUCTS) ? window.PRODUCTS : [];
}

function createProductCardHTML(product) {
  return `
    <div class="product-card">
      
      <div class="product-image-container">
        <img 
          src="${product.images[0]}" 
          alt="${product.name}" 
          loading="lazy"
          referrerpolicy="no-referrer"
          class="product-image"
        />
        ${product.discount ? `
          <span class="badge-discount">
            ${product.discount}
          </span>
        ` : ''}
        <span class="badge-category">
          ${product.category}
        </span>
      </div>

      <div class="product-card-body">
        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; font-weight: 700; margin-bottom: 0.375rem;">
            <div style="display: flex; align-items: center; gap: 0.25rem; color: #f59e0b;">
              <span>★</span>
              <span>${product.rating}</span>
              <span style="color: var(--text-dim); font-weight: 400;">(${product.reviewsCount})</span>
            </div>
            <span style="color: #34d399; font-weight: 500; font-size: 0.7rem;">${product.availability}</span>
          </div>

          <h3 class="font-serif" style="font-size: 1.125rem; font-weight: 700; line-height: 1.3; margin-bottom: 0.375rem;">
            ${product.name}
          </h3>

          <p style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${product.shortDescription}
          </p>
        </div>

        <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--gold-border);">
          <div style="display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 0.75rem;">
            <span style="font-size: 1.25rem; font-weight: 800; color: var(--text-light);">₹${product.price.toLocaleString('en-IN')}</span>
            ${product.originalPrice ? `<span style="font-size: 0.75rem; color: var(--text-dim); text-decoration: line-through;">₹${product.originalPrice.toLocaleString('en-IN')}</span>` : ''}
          </div>

          <div class="card-actions-grid">
            <a href="/product-details.html?id=${product.id}" class="btn btn-secondary btn-sm" style="text-align: center;">
              View Specs
            </a>
            <button onclick="window.openOrderModal(${product.id})" type="button" class="btn btn-primary btn-sm">
              Order Now
            </button>
          </div>
        </div>

      </div>

    </div>
  `;
}

async function renderProductCatalog() {
  const container = document.getElementById('product-catalog-grid');
  if (!container) return;

  const products = await loadProducts();
  container.innerHTML = products.map(createProductCardHTML).join('');
}

async function renderFeaturedProducts() {
  const container = document.getElementById('featured-products-grid');
  if (!container) return;

  const products = await loadProducts();
  if (products.length > 0) {
    const featured = products.slice(0, 4);
    container.innerHTML = featured.map(createProductCardHTML).join('');
    container.querySelectorAll('.product-card').forEach((card, index) => {
      card.classList.add('home-fade-up');
      card.style.setProperty('--fade-delay', `${index * 100}ms`);
    });
    if (window.observeHomeAnimations) window.observeHomeAnimations(container);
  }
}

/**
 * Enhanced Search & Filtering Engine
 */
function setupCatalogFiltering() {
  const searchInput = document.getElementById('catalog-search');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const sortSelect = document.getElementById('catalog-sort');
  const catButtons = document.querySelectorAll('.cat-pill');
  const resultsNumber = document.getElementById('results-number');
  const activeFilterTags = document.getElementById('active-filter-pills');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');
  const emptyResetBtn = document.getElementById('empty-reset-btn');
  const grid = document.getElementById('product-catalog-grid');
  const noMsg = document.getElementById('no-products-msg');

  let selectedCategory = 'all';

  if (!window.PRODUCTS || !grid) return;

  // Update Category Badge Counts
  function updateCategoryCounts() {
    const products = window.PRODUCTS;
    const counts = {
      all: products.length,
      'Ethnic Wear': products.filter(p => p.category === 'Ethnic Wear').length,
      'Sarees & Lehengas': products.filter(p => p.category === 'Sarees & Lehengas').length,
      'Formal & Suits': products.filter(p => p.category === 'Formal & Suits').length,
      'Casual & Shirts': products.filter(p => p.category === 'Casual & Shirts').length
    };

    const countAllEl = document.getElementById('count-all');
    if (countAllEl) countAllEl.textContent = counts.all;

    const countEthnicEl = document.getElementById('count-ethnic');
    if (countEthnicEl) countEthnicEl.textContent = counts['Ethnic Wear'] || 0;

    const countSareesEl = document.getElementById('count-sarees');
    if (countSareesEl) countSareesEl.textContent = counts['Sarees & Lehengas'] || 0;

    const countFormalEl = document.getElementById('count-formal');
    if (countFormalEl) countFormalEl.textContent = counts['Formal & Suits'] || 0;

    const countCasualEl = document.getElementById('count-casual');
    if (countCasualEl) countCasualEl.textContent = counts['Casual & Shirts'] || 0;
  }

  updateCategoryCounts();

  function matchesQuery(product, query) {
    if (!query) return true;
    const q = query.toLowerCase();

    if (product.name.toLowerCase().includes(q)) return true;
    if (product.category.toLowerCase().includes(q)) return true;
    if (product.shortDescription && product.shortDescription.toLowerCase().includes(q)) return true;

    if (product.specs) {
      for (const val of Object.values(product.specs)) {
        if (typeof val === 'string' && val.toLowerCase().includes(q)) return true;
      }
    }

    if (product.variants && product.variants.colors) {
      if (product.variants.colors.some(c => c.toLowerCase().includes(q))) return true;
    }

    return false;
  }

  function filterAndSortProducts() {
    const query = searchInput ? searchInput.value.trim() : '';
    const sortVal = sortSelect ? sortSelect.value : 'featured';

    // Show/hide Clear Search button
    if (clearSearchBtn) {
      if (query.length > 0) {
        clearSearchBtn.classList.remove('hidden');
      } else {
        clearSearchBtn.classList.add('hidden');
      }
    }

    // Filter Products
    let filtered = window.PRODUCTS.filter(p => {
      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesSearch = matchesQuery(p, query);
      return matchesCat && matchesSearch;
    });

    // Sort Products
    if (sortVal === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortVal === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortVal === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    // Update Results Count
    if (resultsNumber) {
      resultsNumber.textContent = filtered.length;
    }

    // Render Filter Tags & Reset Link Visibility
    const isFiltered = selectedCategory !== 'all' || query.length > 0 || sortVal !== 'featured';

    if (resetFiltersBtn) {
      if (isFiltered) {
        resetFiltersBtn.classList.remove('hidden');
      } else {
        resetFiltersBtn.classList.add('hidden');
      }
    }

    if (activeFilterTags) {
      let tagsHTML = '';
      if (selectedCategory !== 'all') {
        tagsHTML += `<span class="filter-tag">${selectedCategory}</span>`;
      }
      if (query.length > 0) {
        tagsHTML += `<span class="filter-tag">"${query}"</span>`;
      }
      activeFilterTags.innerHTML = tagsHTML;
    }

    // Render Grid or Empty State
    if (filtered.length === 0) {
      grid.innerHTML = '';
      if (noMsg) noMsg.classList.remove('hidden');
    } else {
      if (noMsg) noMsg.classList.add('hidden');
      grid.innerHTML = filtered.map(createProductCardHTML).join('');
    }
  }

  function resetAllFilters() {
    if (searchInput) searchInput.value = '';
    selectedCategory = 'all';

    catButtons.forEach(b => {
      if (b.getAttribute('data-category') === 'all') {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    if (sortSelect) sortSelect.value = 'featured';
    filterAndSortProducts();
  }

  // Event Listeners
  if (searchInput) {
    searchInput.addEventListener('input', filterAndSortProducts);
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      filterAndSortProducts();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', filterAndSortProducts);
  }

  catButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      catButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      selectedCategory = btn.getAttribute('data-category');
      filterAndSortProducts();
    });
  });

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', resetAllFilters);
  }

  if (emptyResetBtn) {
    emptyResetBtn.addEventListener('click', resetAllFilters);
  }

  // Initial Run
  filterAndSortProducts();
}

if (typeof window !== 'undefined') {
  window.createProductCardHTML = createProductCardHTML;
  window.loadProducts = loadProducts;
  window.renderProductCatalog = renderProductCatalog;
  window.renderFeaturedProducts = renderFeaturedProducts;
}
