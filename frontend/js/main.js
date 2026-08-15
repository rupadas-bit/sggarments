// Main App Logic (Navigation Header & Footer Renderer)

window.STORE_CONFIG = window.STORE_CONFIG || {
  storeName: 'SutoRekha',
  whatsappNumber: '919876543210',
  phone: '+91 98765 43210',
  email: 'support@sutorekha.com',
  address: 'Desh Bandhu Nagar, Baguiati, Kolkata, West Bengal - 700059',
  hours: 'Mon – Sat: 10:00 AM – 8:30 PM | Sun: 11:00 AM – 6:00 PM'
};

async function fetchStoreConfig() {
  try {
    const res = await fetch(`${window.API_BASE_URL || ''}/api/v1/config`);
    if (res.ok) {
      const result = await res.json();
      const configData = result.data || result;
      window.STORE_CONFIG = { ...window.STORE_CONFIG, ...configData };
      updateConfigElements();
    }
  } catch (err) {
    console.warn('Using default store configuration');
  }
}

// Export to window so admin.js can call it after saving settings
window.fetchStoreConfig = fetchStoreConfig;

function updateConfigElements() {
  const config = window.STORE_CONFIG;

  const navLogo = document.querySelector('.nav-brand-logo');
  if (navLogo && config.logo) {
    navLogo.src = config.logo;
    navLogo.removeAttribute('hidden');
  }

  const heroImg = document.getElementById('hero-image');
  if (heroImg && config.heroImage) {
    heroImg.src = config.heroImage;
  }

  const footerWaBtn = document.querySelector('.footer-wa-btn');
  if (footerWaBtn && config.whatsappNumber) {
    footerWaBtn.href = `https://wa.me/${config.whatsappNumber}?text=Hello%20SutoRekha,%20I%20have%20an%20inquiry%20about%20your%20clothing%20collection.`;
  }

  const brandName = document.querySelector('.footer-brand-name');
  if (brandName && config.storeName) brandName.innerText = config.storeName;

  const hoursVal = document.querySelector('.hours-val');
  if (hoursVal && config.hours) hoursVal.innerText = config.hours;

  const contactPhone = document.querySelector('.contact-phone-val');
  if (contactPhone && config.phone) contactPhone.innerText = config.phone;

  const contactEmail = document.querySelector('.contact-email-val');
  if (contactEmail && config.email) contactEmail.innerText = config.email;

  const contactAddr = document.querySelector('.contact-address-val');
  if (contactAddr && config.address) contactAddr.innerText = config.address;

  const contactHours = document.querySelector('.contact-hours-val');
  if (contactHours && config.hours) contactHours.innerText = config.hours;
}

document.addEventListener('DOMContentLoaded', () => {
  const loader = document.getElementById('loading-screen');
  if (loader) loader.remove();
  renderNavbar();
  renderFooter();
  initHomeScrollAnimations();
  if (window.initOrderModal) window.initOrderModal();
  setupMobileNav();
  fetchStoreConfig();
});

function initHomeScrollAnimations() {
  if (!document.body.classList.contains('home-page')) return;

  document.body.classList.add('home-animations-enabled');

  const revealSelector = '.home-fade-up, .home-fade-scale';
  if (!('IntersectionObserver' in window)) {
    window.observeHomeAnimations = (root = document) => {
      const elements = root.matches?.(revealSelector)
        ? [root]
        : root.querySelectorAll(revealSelector);
      elements.forEach((element) => element.classList.add('is-visible'));
    };
    window.observeHomeAnimations();
    return;
  }

  const observedElements = new WeakSet();
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  });

  window.observeHomeAnimations = (root = document) => {
    const elements = root.matches?.(revealSelector)
      ? [root]
      : root.querySelectorAll(revealSelector);

    elements.forEach((element) => {
      if (observedElements.has(element)) return;
      observedElements.add(element);
      revealObserver.observe(element);
    });
  };

  window.observeHomeAnimations();
}


function renderNavbar() {
  const navContainer = document.getElementById('navbar-container');
  if (!navContainer) return;

  const currentPath = window.location.pathname;

  navContainer.innerHTML = `
    <header class="site-header">
      <div class="container nav-wrapper">
        
        <!-- Brand Logo & Title -->
        <a href="/index.html" class="brand-link">
          <img 
            src="/src/assets/images/luxecraft_brand_logo_1785767720602.jpg" 
            alt="SutoRekha Logo" 
            class="nav-brand-logo"
            hidden
            style="width: 44px; height: 44px; border-radius: var(--radius-full); border: 1.5px solid var(--primary-gold); object-fit: cover;" 
          />
          <div style="display: flex; flex-direction: column;">
            <span class="brand-title font-bengali">
              সুতোরেখা <span class="brand-title-sub">SutoRekha</span>
            </span>
            <span class="brand-tagline">
              Quality • Style • Trust
            </span>
          </div>
        </a>

        <!-- Desktop Nav Links -->
        <nav class="nav-links">
          <a href="/index.html" class="nav-link ${currentPath.endsWith('index.html') || currentPath === '/' ? 'active' : ''}">Home</a>
          <a href="/catalog.html" class="nav-link ${currentPath.includes('catalog.html') ? 'active' : ''}">Apparel Collection</a>
          <a href="/about.html" class="nav-link ${currentPath.includes('about.html') ? 'active' : ''}">About Us</a>
          <a href="/contact.html" class="nav-link ${currentPath.includes('contact.html') ? 'active' : ''}">Contact</a>
        </nav>

        <!-- Desktop Action CTA -->
        <div class="nav-cta-desktop">
          <a href="/catalog.html" class="btn btn-primary btn-sm">
            Shop Collection
          </a>
        </div>

        <!-- Mobile Toggle Button -->
        <button id="mobile-menu-toggle" type="button" aria-label="Toggle navigation menu" aria-expanded="false" class="mobile-nav-toggle">
          <svg id="hamburger-icon" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
          <svg id="close-icon" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" class="hidden">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

      </div>

      <!-- Mobile Dropdown Menu -->
      <div id="mobile-menu" class="mobile-menu">
        <nav style="display: flex; flex-direction: column; gap: 0.5rem;">
          <a href="/index.html" class="mobile-menu-link ${currentPath.endsWith('index.html') || currentPath === '/' ? 'active' : ''}">Home</a>
          <a href="/catalog.html" class="mobile-menu-link ${currentPath.includes('catalog.html') ? 'active' : ''}">Apparel Collection</a>
          <a href="/about.html" class="mobile-menu-link ${currentPath.includes('about.html') ? 'active' : ''}">About Us</a>
          <a href="/contact.html" class="mobile-menu-link ${currentPath.includes('contact.html') ? 'active' : ''}">Contact</a>
          <a href="/catalog.html" class="mobile-menu-link mobile-menu-cta">
            Explore Apparel Collection
          </a>
        </nav>
      </div>
    </header>
  `;
}

function setupMobileNav() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#mobile-menu-toggle');
    const menu = document.getElementById('mobile-menu');
    
    if (btn && menu) {
      const isOpen = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen);
      
      const hamburgerIcon = document.getElementById('hamburger-icon');
      const closeIcon = document.getElementById('close-icon');
      if (hamburgerIcon && closeIcon) {
        if (isOpen) {
          hamburgerIcon.classList.add('hidden');
          closeIcon.classList.remove('hidden');
        } else {
          hamburgerIcon.classList.remove('hidden');
          closeIcon.classList.add('hidden');
        }
      }
      return;
    }

    // Close menu when clicking outside header or clicking a mobile link
    const header = document.querySelector('.site-header');
    if (menu && menu.classList.contains('open')) {
      const isMobileLink = e.target.closest('.mobile-menu-link');
      const isOutside = header && !header.contains(e.target);
      
      if (isMobileLink || isOutside) {
        menu.classList.remove('open');
        const toggleBtn = document.getElementById('mobile-menu-toggle');
        if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
        
        const hamburgerIcon = document.getElementById('hamburger-icon');
        const closeIcon = document.getElementById('close-icon');
        if (hamburgerIcon && closeIcon) {
          hamburgerIcon.classList.remove('hidden');
          closeIcon.classList.add('hidden');
        }
      }
    }
  });
}

function renderFooter() {
  const footerContainer = document.getElementById('footer-container');
  if (!footerContainer) return;

  footerContainer.innerHTML = `
    <footer class="site-footer ${document.body.classList.contains('home-page') ? 'home-fade-up' : ''}">
      <div class="container">
        <div class="footer-grid">
          
          <!-- Column 1: Brand Info, About & Copyright -->
          <div class="footer-col footer-brand-col">
            <div class="footer-brand-wrap">
              <span class="footer-brand-name">SutoRekha</span>
              <span class="footer-brand-tagline">Quality • Style • Trust</span>
            </div>
            <p class="footer-about-text">
              Your trusted destination for premium retail ethnic wear, designer sarees, ready-to-wear formal suits, and modern apparel. Personalized WhatsApp ordering with door delivery.
            </p>
            <div class="footer-copyright-about">
              © 2026 SutoRekha. All rights reserved.
            </div>
          </div>

          <!-- Column 2: Quick Links -->
          <div class="footer-col">
            <h4 class="footer-title">Quick Links</h4>
            <ul class="footer-links">
              <li><a href="/index.html"><span class="link-arrow">›</span> Home </a></li>
              <li><a href="/catalog.html"><span class="link-arrow">›</span> Apparel Catalog</a></li>
              <li><a href="/about.html"><span class="link-arrow">›</span> About Us</a></li>
              <li><a href="/contact.html"><span class="link-arrow">›</span> Contact </a></li>
              <li><a href="/admin.html"><span class="link-arrow">›</span> Admin Portal</a></li>
            </ul>
          </div>

          <!-- Column 3: Garment Collections -->
          <div class="footer-col">
            <h4 class="footer-title">Garment Collections</h4>
            <ul class="footer-links">
              <li><a href="/catalog.html"><span class="link-arrow">›</span> Ethnic Wear</a></li>
              <li><a href="/catalog.html"><span class="link-arrow">›</span> Sarees & Lehengas</a></li>
              <li><a href="/catalog.html"><span class="link-arrow">›</span> Formal & Suits</a></li>
              <li><a href="/catalog.html"><span class="link-arrow">›</span> Casual & Shirts</a></li>
            </ul>
          </div>

          <!-- Column 4: WhatsApp & Store Support -->
          <div class="footer-col footer-support-col">
            <h4 class="footer-title">Store Assistance</h4>
            <div class="store-hours-badge">
              <span class="hours-label">Boutique Hours:</span>
              <span class="hours-val">Mon – Sat: 10:00 AM – 9:00 PM</span>
            </div>
            
            <a 
              href="https://wa.me/919876543210?text=Hello%20SutoRekha,%20I%20have%20an%20inquiry%20about%20your%20clothing%20collection." 
              target="_blank" 
              rel="noopener noreferrer" 
              class="btn btn-whatsapp btn-md btn-full footer-wa-btn"
              aria-label="Chat with SutoRekha on WhatsApp"
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.804-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l.157.251-1.002 3.659 3.738-.981.25.147z"/>
              </svg>
              <span>Chat on WhatsApp</span>
            </a>
          </div>

        </div>
      </div>
    </footer>
  `;
}

