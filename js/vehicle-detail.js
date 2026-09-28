'use strict';

// Module-level state for gallery and lightbox
let currentImages = [];
let currentLightboxIndex = 0;

/**
 * Extract vehicle ID from URL query parameters (?id=vehicleId).
 * @returns {string|null} Vehicle ID or null if not present.
 */
function getVehicleIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

/**
 * Validate vehicle ID format: alphanumeric with hyphens, max 20 chars.
 * @param {string} id - The vehicle ID to validate.
 * @returns {boolean} True if valid.
 */
function isValidVehicleId(id) {
  if (!id || typeof id !== 'string') return false;
  return /^[a-zA-Z0-9-]{1,20}$/.test(id);
}

/**
 * Fetch vehicles.json and find the vehicle matching the given ID.
 * @param {string} id - Vehicle ID to look up.
 * @returns {Promise<Object|null>} Vehicle object or null if not found.
 */
async function fetchVehicleData(id) {
  const response = await fetch('data/vehicles.json');
  if (!response.ok) {
    throw new Error(`Failed to load vehicle data: ${response.status} ${response.statusText}`);
  }
  const vehicles = await response.json();
  return vehicles.find(v => v.id === id) || null;
}

/**
 * Escape HTML special characters to prevent XSS when inserting user-sourced data.
 * @param {string} str - String to escape.
 * @returns {string} HTML-safe string.
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

/**
 * Announce a message to screen readers via the ARIA live region.
 * @param {string} message - Message to announce.
 */
function announce(message) {
  const region = document.getElementById('sr-announce');
  if (!region) return;
  // Clear first so repeated identical messages trigger the live region
  region.textContent = '';
  setTimeout(() => {
    region.textContent = message;
  }, 50);
}

/**
 * Update document title and Open Graph meta tags based on vehicle data.
 * @param {Object} vehicle - Vehicle data object.
 * @param {string} title - Formatted vehicle title (e.g. "2022 Toyota Camry").
 */
function updateMetaTags(vehicle, title) {
  document.title = `${title} | Premium Auto Sales`;

  const raw = vehicle.description || `${title} for sale at Premium Auto Sales.`;
  const description = raw.length > 155 ? raw.slice(0, 152) + '...' : raw;

  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', description);

  const ogTitle = document.getElementById('og-title');
  if (ogTitle) ogTitle.setAttribute('content', `${title} | Premium Auto Sales`);

  const ogDesc = document.getElementById('og-description');
  if (ogDesc) ogDesc.setAttribute('content', description);

  const ogImage = document.getElementById('og-image');
  if (ogImage && vehicle.images && vehicle.images.length > 0) {
    ogImage.setAttribute('content', vehicle.images[0]);
  }

  const ogUrl = document.getElementById('og-url');
  if (ogUrl) ogUrl.setAttribute('content', window.location.href);
}

/**
 * Populate all page elements with vehicle data.
 * @param {Object} vehicle - Vehicle data object.
 */
function renderVehicleDetails(vehicle) {
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  // Breadcrumb and page title
  const breadcrumbEl = document.getElementById('breadcrumb-vehicle');
  if (breadcrumbEl) breadcrumbEl.textContent = title;

  const titleEl = document.getElementById('vehicle-title');
  if (titleEl) titleEl.textContent = title;

  // Main image (first in array)
  if (vehicle.images && vehicle.images.length > 0) {
    const mainImg = document.getElementById('main-image');
    if (mainImg) {
      mainImg.src = vehicle.images[0];
      mainImg.alt = `${title} — main photo`;
    }
  }

  // Specification cells
  const specMap = {
    'spec-make': vehicle.make,
    'spec-model': vehicle.model,
    'spec-year': String(vehicle.year),
    'spec-price': `$${vehicle.price.toLocaleString()}`,
    'spec-mileage': `${vehicle.mileage.toLocaleString()} mi`,
    'spec-color': vehicle.color,
    'spec-transmission': vehicle.transmission,
    'spec-fuel-type': vehicle.fuelType,
    'spec-vin': vehicle.vin,
    'spec-condition': vehicle.condition,
  };
  for (const [id, value] of Object.entries(specMap)) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || '—';
  }

  // Price display
  const priceEl = document.getElementById('vehicle-price');
  if (priceEl) priceEl.textContent = `$${vehicle.price.toLocaleString()}`;

  // Contact CTA with vehicle_id query param
  const ctaEl = document.getElementById('contact-cta');
  if (ctaEl) ctaEl.href = `contact.html?vehicle_id=${encodeURIComponent(vehicle.id)}`;

  // Features list
  const featuresList = document.getElementById('features-list');
  if (featuresList && vehicle.features && vehicle.features.length > 0) {
    featuresList.innerHTML = vehicle.features
      .map(f => `<li>${escapeHtml(f)}</li>`)
      .join('');
  }

  // Description
  const descEl = document.getElementById('vehicle-description');
  if (descEl) descEl.textContent = vehicle.description || '';

  // Meta tags
  updateMetaTags(vehicle, title);
}

/**
 * Swap the main gallery image to the image at the given index.
 * Updates active thumbnail state and announces the change to screen readers.
 * @param {number} index - Image index to display.
 */
function swapMainImage(index) {
  if (index < 0 || index >= currentImages.length) return;

  const mainImg = document.getElementById('main-image');
  if (mainImg) {
    mainImg.src = currentImages[index];
    mainImg.alt = `Vehicle photo ${index + 1} of ${currentImages.length}`;
  }

  // Update thumbnail active states
  const thumbnails = document.querySelectorAll('.gallery-thumbnail');
  thumbnails.forEach((thumb, i) => {
    const active = i === index;
    thumb.classList.toggle('active', active);
    thumb.setAttribute('aria-pressed', String(active));
  });

  announce(`Image ${index + 1} of ${currentImages.length}`);
}

/**
 * Set up the image gallery: render thumbnails and attach all click/keyboard handlers.
 * @param {string[]} images - Array of image URLs.
 */
function initializeGallery(images) {
  currentImages = images;

  const thumbnailStrip = document.getElementById('thumbnail-strip');
  if (!thumbnailStrip) return;

  // Render thumbnails
  thumbnailStrip.innerHTML = images.map((src, index) => {
    const activeClass = index === 0 ? ' active' : '';
    const lazyAttr = index < 4 ? 'eager' : 'lazy';
    return `<img
      src="${src}"
      alt="Vehicle photo ${index + 1}"
      class="gallery-thumbnail${activeClass}"
      data-index="${index}"
      data-src="${src}"
      width="100"
      height="75"
      loading="${lazyAttr}"
      decoding="async"
      role="button"
      tabindex="0"
      aria-label="View photo ${index + 1}"
      aria-pressed="${index === 0}"
    >`;
  }).join('');

  // Thumbnail click handler (delegated)
  thumbnailStrip.addEventListener('click', (e) => {
    const thumb = e.target.closest('.gallery-thumbnail');
    if (!thumb) return;
    swapMainImage(parseInt(thumb.dataset.index, 10));
  });

  // Thumbnail keyboard handler (Enter/Space)
  thumbnailStrip.addEventListener('keydown', (e) => {
    const thumb = e.target.closest('.gallery-thumbnail');
    if (!thumb) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      swapMainImage(parseInt(thumb.dataset.index, 10));
    }
  });

  // Click main image to open lightbox
  const mainImg = document.getElementById('main-image');
  if (mainImg) {
    mainImg.addEventListener('click', () => {
      const activeThumb = thumbnailStrip.querySelector('.gallery-thumbnail.active');
      const activeIndex = activeThumb ? parseInt(activeThumb.dataset.index, 10) : 0;
      openLightbox(activeIndex);
    });
  }

  // Arrow key navigation for gallery (only when lightbox is closed)
  document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('lightbox');
    if (lightbox && !lightbox.hidden) return; // Lightbox has its own handler
    if (e.key === 'ArrowLeft') {
      const activeThumb = thumbnailStrip.querySelector('.gallery-thumbnail.active');
      const idx = activeThumb ? parseInt(activeThumb.dataset.index, 10) : 0;
      if (idx > 0) swapMainImage(idx - 1);
    } else if (e.key === 'ArrowRight') {
      const activeThumb = thumbnailStrip.querySelector('.gallery-thumbnail.active');
      const idx = activeThumb ? parseInt(activeThumb.dataset.index, 10) : 0;
      if (idx < images.length - 1) swapMainImage(idx + 1);
    }
  });
}

/**
 * Update the lightbox image and counter display.
 * @param {number} index - Image index to show.
 */
function updateLightboxImage(index) {
  const img = document.getElementById('lightbox-image');
  const counter = document.getElementById('lightbox-counter');

  if (img) {
    img.src = currentImages[index];
    img.alt = `Vehicle photo ${index + 1} of ${currentImages.length}`;
  }
  if (counter) {
    counter.textContent = `${index + 1} / ${currentImages.length}`;
  }
  announce(`Image ${index + 1} of ${currentImages.length}`);
}

/**
 * Open the lightbox modal at the specified image index.
 * Traps focus inside the lightbox while open.
 * @param {number} imageIndex - Index of the image to display.
 */
function openLightbox(imageIndex) {
  currentLightboxIndex = imageIndex;
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  updateLightboxImage(imageIndex);
  lightbox.hidden = false;

  // Make background content inert to prevent interaction while lightbox is open
  const mainEl = document.getElementById('main');
  if (mainEl) mainEl.setAttribute('inert', '');

  // Move focus to close button
  const closeBtn = document.getElementById('lightbox-close');
  if (closeBtn) closeBtn.focus();
}

/**
 * Close the lightbox modal and return focus to the main image.
 */
function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  lightbox.hidden = true;

  // Restore background interactivity
  const mainEl = document.getElementById('main');
  if (mainEl) mainEl.removeAttribute('inert');

  // Return focus to main gallery image
  const mainImg = document.getElementById('main-image');
  if (mainImg) mainImg.focus();
}

/**
 * Navigate the lightbox to the previous or next image.
 * @param {number} direction - 1 for next, -1 for previous.
 */
function navigateLightbox(direction) {
  const newIndex = currentLightboxIndex + direction;
  if (newIndex < 0 || newIndex >= currentImages.length) return;
  currentLightboxIndex = newIndex;
  updateLightboxImage(newIndex);
}

/**
 * Fetch vehicles matching the current vehicle by type or price (±$5000), limited to 4.
 * @param {Object} currentVehicle - The vehicle currently being viewed.
 * @returns {Promise<Object[]>} Array of related vehicle objects.
 */
async function fetchRelatedVehicles(currentVehicle) {
  try {
    const response = await fetch('data/vehicles.json');
    if (!response.ok) return [];
    const vehicles = await response.json();

    return vehicles
      .filter(v => {
        if (v.id === currentVehicle.id) return false;
        const sameType = v.type === currentVehicle.type;
        const nearPrice = Math.abs(v.price - currentVehicle.price) <= 5000;
        return sameType || nearPrice;
      })
      .slice(0, 4);
  } catch {
    return [];
  }
}

/**
 * Render related vehicles into the #related-vehicles grid.
 * Hides the section if no related vehicles are found.
 * @param {Object[]} vehicles - Array of related vehicle objects.
 */
function renderRelatedVehicles(vehicles) {
  const grid = document.getElementById('related-vehicles');
  if (!grid) return;

  if (!vehicles || vehicles.length === 0) {
    const section = document.querySelector('.related-vehicles-section');
    if (section) section.hidden = true;
    return;
  }

  grid.innerHTML = vehicles.map(vehicle => {
    const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
    const image = vehicle.images && vehicle.images.length > 0 ? vehicle.images[0] : '';
    return `
      <article class="inventory-card">
        <div class="inventory-card-image">
          <img
            src="${image}"
            alt="${escapeHtml(title)}"
            width="600"
            height="400"
            loading="lazy"
            decoding="async"
          >
        </div>
        <div class="inventory-card-content">
          <h3 class="inventory-card-title">${escapeHtml(title)}</h3>
          <div class="inventory-card-info">
            <span>${escapeHtml(vehicle.type)}</span>
            <span>${vehicle.mileage.toLocaleString()} mi</span>
            <span>${escapeHtml(vehicle.color)}</span>
          </div>
          <p class="inventory-card-price">$${vehicle.price.toLocaleString()}</p>
          <a href="vehicle-detail.html?id=${encodeURIComponent(vehicle.id)}" class="inventory-card-cta">View Details</a>
        </div>
      </article>
    `;
  }).join('');
}

/**
 * Initialize share buttons using Web Share API with social URL fallbacks.
 * @param {Object} vehicle - Vehicle data object.
 */
function initializeShareButtons(vehicle) {
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const url = window.location.href;
  const shareText = `Check out this ${title} at Premium Auto Sales!`;

  const fbBtn = document.getElementById('share-facebook');
  if (fbBtn) {
    fbBtn.addEventListener('click', () => {
      const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      window.open(fbUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
    });
  }

  const twBtn = document.getElementById('share-twitter');
  if (twBtn) {
    twBtn.addEventListener('click', () => {
      const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
      window.open(twUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
    });
  }

  const emailBtn = document.getElementById('share-email');
  if (emailBtn) {
    emailBtn.addEventListener('click', async () => {
      // Use Web Share API when available
      if (navigator.share) {
        try {
          await navigator.share({ title, text: shareText, url });
          return;
        } catch (err) {
          if (err.name === 'AbortError') return; // User dismissed the share sheet
        }
      }
      // Fallback to mailto
      const subject = encodeURIComponent(`Check out this ${title}`);
      const body = encodeURIComponent(`${shareText}\n${url}`);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    });
  }
}

/**
 * Show the error state (vehicle not found) and hide loading/content.
 */
function showError() {
  const loading = document.getElementById('vehicle-loading');
  const content = document.getElementById('vehicle-detail-content');
  const error = document.getElementById('vehicle-error');

  if (loading) loading.hidden = true;
  if (content) content.hidden = true;
  if (error) error.hidden = false;

  document.title = 'Vehicle Not Found | Premium Auto Sales';
}

/**
 * Main initialization: parse ID, fetch data, render details, and attach interactions.
 */
async function init() {
  const vehicleId = getVehicleIdFromURL();

  // Validate ID format before making any network request
  if (!vehicleId || !isValidVehicleId(vehicleId)) {
    showError();
    return;
  }

  try {
    const vehicle = await fetchVehicleData(vehicleId);

    if (!vehicle) {
      showError();
      return;
    }

    // Render vehicle content
    renderVehicleDetails(vehicle);

    // Set up gallery if images are available
    if (vehicle.images && vehicle.images.length > 0) {
      initializeGallery(vehicle.images);
    }

    // Wire up share buttons
    initializeShareButtons(vehicle);

    // Reveal content, hide loading spinner
    const loading = document.getElementById('vehicle-loading');
    const content = document.getElementById('vehicle-detail-content');
    if (loading) loading.hidden = true;
    if (content) content.hidden = false;

    // Load related vehicles after main content is shown
    const related = await fetchRelatedVehicles(vehicle);
    renderRelatedVehicles(related);

  } catch (err) {
    console.error('Error loading vehicle details:', err);
    showError();
  }
}

// ============================================
// Event Listeners — set up on DOMContentLoaded
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Start page initialization
  init();

  // Lightbox close button
  const closeBtn = document.getElementById('lightbox-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeLightbox);
  }

  // Lightbox previous button
  const prevBtn = document.getElementById('lightbox-prev');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => navigateLightbox(-1));
  }

  // Lightbox next button
  const nextBtn = document.getElementById('lightbox-next');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => navigateLightbox(1));
  }

  // Keyboard navigation: Escape to close lightbox, arrow keys to navigate
  document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox || lightbox.hidden) return;

    switch (e.key) {
      case 'Escape':
        closeLightbox();
        break;
      case 'ArrowLeft':
        navigateLightbox(-1);
        break;
      case 'ArrowRight':
        navigateLightbox(1);
        break;
    }
  });

  // Click on lightbox overlay background (outside modal content) to close
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
  }
});
