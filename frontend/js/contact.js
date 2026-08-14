// Contact form handling and validation.

document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('c-name').value.trim();
    const phone = document.getElementById('c-phone').value.trim();
    const email = document.getElementById('c-email').value.trim();
    const message = document.getElementById('c-message').value.trim();

    let valid = true;

    ['c-err-name', 'c-err-phone', 'c-err-email', 'c-err-message'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.innerText = '';
        el.classList.add('hidden');
      }
    });

    if (!name) {
      showError('c-err-name', 'Please enter your full name');
      valid = false;
    }

    if (!phone || !/^\d{10}$/.test(phone)) {
      showError('c-err-phone', 'Please enter valid 10-digit mobile number');
      valid = false;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('c-err-email', 'Please enter valid email address');
      valid = false;
    }

    if (!message) {
      showError('c-err-message', 'Please enter your message/query');
      valid = false;
    }

    if (valid) {
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      fetch(`${window.API_BASE_URL || ''}/api/v1/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, message })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.whatsappUrl) {
          window.open(data.whatsappUrl, '_blank');
          contactForm.reset();
        } else {
          alert(data.error || 'Submission failed. Please try again.');
        }
      })
      .catch(err => {
        console.error('Enquiry submission error:', err);
        const targetNumber = (window.STORE_CONFIG && window.STORE_CONFIG.whatsappNumber) ? window.STORE_CONFIG.whatsappNumber : '919876543210';
        const waMsg = `*SG FASHION STORE ENQUIRY*\n\nName: ${name}\nPhone: ${phone}\nEmail: ${email}\n\n*Query:*\n${message}`;
        window.open(`https://wa.me/${targetNumber}?text=${encodeURIComponent(waMsg)}`, '_blank');
        contactForm.reset();
      })
      .finally(() => {
        if (submitBtn) submitBtn.disabled = false;
      });
    }
  });
});

function showError(elemId, msg) {
  const elem = document.getElementById(elemId);
  if (elem) {
    elem.innerText = msg;
    elem.classList.remove('hidden');
  }
}