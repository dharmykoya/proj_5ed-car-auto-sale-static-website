/**
 * Premium Auto Sales - Inventory Page
 * Handles vehicle data fetching, rendering, filtering, sorting, and view toggling.
 * Persists filter state via URL query parameters and uses IntersectionObserver
 * for lazy image loading.
 */

(function () {
  'use strict';

  /* ============================================
     Module State
     ============================================ */

  /** @type {Array} All vehicles loaded from the data source. */
  var allVehicles = [];

  /** @type {Array} Currently filtered set of vehicles. */
  var filteredVehicles = [];

  /** @type {string} Active sort key. */
  var currentSort = 'price-asc';

  /** @type {string} Active view mode: 'grid' or 'list'. */
  var currentView = 'grid';

  /** @type {IntersectionObserver|null} Observer for lazy-loading images. */
  var imageObserver = null;

  /* ============================================
     DOM References
     ============================================ */

  var vehicleGrid      = document.getElementById('vehicle-grid');
  var loadingSpinner   = document.getElementById('loading-spinner');
  var emptyState       = document.getElementById('empty-state');
  var resultsCounter   = document.getElementById('results-counter');
  var sortSelect       = document.getElementById('sort-select');
  var btnGridView      = document.getElementById('btn-grid-view');
  var btnListView      = document.getElementById('btn-list-view');
  var applyFiltersBtn  = document.getElementById('apply-filters');
  var clearFiltersBtn  = document.getElementById('clear-filters');
  var emptyClearBtn    = document.getElementById('empty-clear-filters');
  var priceMinInput    = document.getElementById('price-min');
  var priceMaxInput    = document.getElementById('price-max');
  var yearSelect       = document.getElementById('filter-year');
  var filterToggleBtn  = document.getElementById('filter-toggle');
  var filterSidebar    = document.getElementById('filter-sidebar');

  /* ============================================
     Utility: debounce
     ============================================ */

  /**
   * Returns a debounced version of `fn` that delays invocation by `delay` ms.
   * Used to avoid excessive re-renders on rapid price-input changes.
   *
   * @param {Function} fn    - Function to debounce.
   * @param {number}   delay - Delay in milliseconds.
   * @returns {Function}
   */
  function debounce(fn, delay) {
    var timer;
    return function () {
      var ctx  = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(ctx, args);
      }, delay);
    };
  }

  /* ============================================
     Loading State
     ============================================ */

  /**
   * Shows the loading spinner inside the vehicle grid
   * and marks the grid as busy for assistive technologies.
   */
  function showLoading() {
    if (loadingSpinner) {
      loadingSpinner.style.display = 'flex';
    }
    if (vehicleGrid) {
      vehicleGrid.setAttribute('aria-busy', 'true');
    }
  }

  /**
   * Hides the loading spinner and clears the aria-busy state.
   */
  function hideLoading() {
    if (loadingSpinner) {
      loadingSpinner.style.display = 'none';
    }
    if (vehicleGrid) {
      vehicleGrid.setAttribute('aria-busy', 'false');
    }
  }

  /* ============================================
     Empty State
     ============================================ */

  /**
   * Reveals the empty-state message panel.
   */
  function showEmptyState() {
    if (emptyState) {
      emptyState.hidden = false;
    }
  }

  /**
   * Hides the empty-state message panel.
   */
  function hideEmptyState() {
    if (emptyState) {
      emptyState.hidden = true;
    }
  }

  /* ============================================
     Lazy Loading
     ============================================ */

  /**
   * Initialises an IntersectionObserver that swaps `data-src` to `src`
   * when an image enters the viewport (with a 200 px root margin).
   * Falls back to eager loading when IntersectionObserver is unavailable.
   */
  function initLazyLoading() {
    if (!('IntersectionObserver' in window)) {
      /* Fallback: load all lazy images immediately */
      var imgs = document.querySelectorAll('img[data-src]');
      Array.prototype.forEach.call(imgs, function (img) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
      return;
    }

    imageObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          imageObserver.unobserve(img);
        });
      },
      { rootMargin: '200px 0px' }
    );
  }

  /**
   * Starts observing a single lazy image element.
   * If the observer is unavailable (e.g. no IntersectionObserver support),
   * falls back to setting `src` immediately.
   *
   * @param {HTMLImageElement} img - Image element with a `data-src` attribute.
   */
  function observeLazyImage(img) {
    if (imageObserver) {
      imageObserver.observe(img);
    } else if (img.dataset.src) {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    }
  }

  /* ============================================
     Data Fetching
     ============================================ */

  /**
   * Fetches vehicle data from `data/vehicles.json`.
   *
   * @returns {Promise<Array>} Resolves with an array of vehicle objects.
   * @throws {Error} When the HTTP response is not OK.
   */
  function fetchVehicles() {
    return fetch('data/vehicles.json')
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Network response was not OK (' + response.status + ')');
        }
        return response.json();
      });
  }

  /* ============================================
     Sorting
     ============================================ */

  /**
   * Returns a sorted copy of the provided vehicles array.
   *
   * @param {Array}  vehicles - Source array of vehicle objects.
   * @param {string} sortBy   - One of: 'price-asc', 'price-desc',
   *                            'year-desc', 'year-asc', 'mileage-asc'.
   * @returns {Array} New sorted array (original is not mutated).
   */
  function sortVehicles(vehicles, sortBy) {
    var sorted = vehicles.slice();
    switch (sortBy) {
      case 'price-asc':
        sorted.sort(function (a, b) { return (a.price || 0) - (b.price || 0); });
        break;
      case 'price-desc':
        sorted.sort(function (a, b) { return (b.price || 0) - (a.price || 0); });
        break;
      case 'year-desc':
        sorted.sort(function (a, b) { return (b.year || 0) - (a.year || 0); });
        break;
      case 'year-asc':
        sorted.sort(function (a, b) { return (a.year || 0) - (b.year || 0); });
        break;
      case 'mileage-asc':
        sorted.sort(function (a, b) { return (a.mileage || 0) - (b.mileage || 0); });
        break;
      default:
        break;
    }
    return sorted;
  }

  /* ============================================
     Filtering
     ============================================ */

  /**
   * Reads the current values of all filter controls, filters `allVehicles`,
   * sorts the result, renders it, and updates the URL + counter.
   *
   * @returns {Array} The filtered (unsorted) array stored in `filteredVehicles`.
   */
  function applyFilters() {
    var minPrice = priceMinInput && priceMinInput.value !== ''
      ? parseFloat(priceMinInput.value)
      : null;
    var maxPrice = priceMaxInput && priceMaxInput.value !== ''
      ? parseFloat(priceMaxInput.value)
      : null;
    var selectedYear = yearSelect ? yearSelect.value : '';

    var selectedTypes = [];
    var checkedBoxes = document.querySelectorAll('.filter-checkbox:checked');
    Array.prototype.forEach.call(checkedBoxes, function (cb) {
      selectedTypes.push(cb.value);
    });

    filteredVehicles = allVehicles.filter(function (vehicle) {
      if (minPrice !== null && (vehicle.price || 0) < minPrice) return false;
      if (maxPrice !== null && (vehicle.price || 0) > maxPrice) return false;
      if (selectedYear && String(vehicle.year) !== selectedYear) return false;
      if (selectedTypes.length > 0 && selectedTypes.indexOf(vehicle.type) === -1) return false;
      return true;
    });

    var sorted = sortVehicles(filteredVehicles, currentSort);
    renderVehicles(sorted);
    updateResultsCounter(sorted.length, allVehicles.length);
    updateURL();

    return filteredVehicles;
  }

  /* ============================================
     Results Counter
     ============================================ */

  /**
   * Updates the visible results counter and announces the count
   * to screen readers via the aria-live region.
   *
   * @param {number} shown - Number of vehicles currently displayed.
   * @param {number} total - Total vehicles in the full data set.
   */
  function updateResultsCounter(shown, total) {
    if (!resultsCounter) return;
    resultsCounter.textContent = 'Showing ' + shown + ' of ' + total + ' vehicles';
  }

  /* ============================================
     Rendering
     ============================================ */

  /**
   * Builds the HTML markup for a single vehicle inventory card.
   * Images use `data-src` for lazy loading; a tiny transparent SVG
   * placeholder is used as the initial `src` to avoid broken-image icons.
   *
   * @param {Object} vehicle - Vehicle data object.
   * @returns {string} HTML string representing the card.
   */
  function createVehicleCardHTML(vehicle) {
    var price = typeof vehicle.price === 'number'
      ? '$' + vehicle.price.toLocaleString()
      : 'Contact for price';

    var mileage = typeof vehicle.mileage === 'number'
      ? vehicle.mileage.toLocaleString() + ' mi'
      : '';

    var make  = vehicle.make  || '';
    var model = vehicle.model || '';
    var year  = vehicle.year  || '';
    var type  = vehicle.type  || '';
    var color = vehicle.color || '';
    var id    = vehicle.id    || '';
    var imgSrc = vehicle.image || '';
    var imgAlt = [year, make, model].filter(Boolean).join(' ');

    /* Transparent 1x1 SVG placeholder prevents broken-image icon while lazy-loading */
    var placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";

    var infoItems = [type, mileage, color].filter(Boolean);
    var infoHTML = infoItems.map(function (item) {
      return '<span>' + item + '</span>';
    }).join('');

    return [
      '<article class="inventory-card"',
      '  data-id="' + id + '"',
      '  tabindex="0"',
      '  role="link"',
      '  aria-label="View details for ' + imgAlt + '"',
      '>',
      '  <div class="inventory-card-image">',
      '    <img',
      '      data-src="' + imgSrc + '"',
      '      src="' + placeholder + '"',
      '      alt="' + imgAlt + '"',
      '      width="600"',
      '      height="400"',
      '      decoding="async"',
      '    >',
      '  </div>',
      '  <div class="inventory-card-content">',
      '    <h3 class="inventory-card-title">' + [year, make, model].filter(Boolean).join(' ') + '</h3>',
      '    <div class="inventory-card-info">' + infoHTML + '</div>',
      '    <p class="inventory-card-price">' + price + '</p>',
      '    <span class="inventory-card-cta">View Details</span>',
      '  </div>',
      '</article>'
    ].join('\n');
  }

  /**
   * Renders an array of vehicle objects into the `#vehicle-grid` container.
   * Clears existing cards (preserving the loading spinner node),
   * handles the empty state, and wires up lazy image loading.
   *
   * @param {Array} vehicles - Sorted array of vehicle objects to render.
   */
  function renderVehicles(vehicles) {
    if (!vehicleGrid) return;

    /* Remove existing inventory cards without touching the spinner node */
    var existingCards = vehicleGrid.querySelectorAll('.inventory-card');
    Array.prototype.forEach.call(existingCards, function (card) {
      vehicleGrid.removeChild(card);
    });

    hideLoading();

    if (vehicles.length === 0) {
      showEmptyState();
      return;
    }

    hideEmptyState();

    var fragment = document.createDocumentFragment();

    vehicles.forEach(function (vehicle) {
      var wrapper = document.createElement('div');
      wrapper.innerHTML = createVehicleCardHTML(vehicle);
      var card = wrapper.firstElementChild;

      /* Wire up lazy loading for the card image */
      var img = card ? card.querySelector('img[data-src]') : null;
      if (img) {
        observeLazyImage(img);
      }

      if (card) {
        fragment.appendChild(card);
      }
    });

    vehicleGrid.appendChild(fragment);
  }

  /* ============================================
     View Toggle
     ============================================ */

  /**
   * Switches the vehicle grid between grid and list view layouts.
   * Updates button aria-pressed states accordingly.
   *
   * @param {string} viewType - 'grid' or 'list'.
   */
  function toggleView(viewType) {
    if (!vehicleGrid) return;
    currentView = viewType;

    var isListView = viewType === 'list';
    vehicleGrid.classList.toggle('list-view', isListView);

    if (btnGridView) {
      btnGridView.classList.toggle('active', !isListView);
      btnGridView.setAttribute('aria-pressed', String(!isListView));
    }
    if (btnListView) {
      btnListView.classList.toggle('active', isListView);
      btnListView.setAttribute('aria-pressed', String(isListView));
    }
  }

  /* ============================================
     Clear Filters
     ============================================ */

  /**
   * Resets all filter inputs to their default (empty) state and
   * re-renders the full vehicle list.
   */
  function clearFilters() {
    if (priceMinInput) priceMinInput.value = '';
    if (priceMaxInput) priceMaxInput.value = '';
    if (yearSelect)    yearSelect.value    = '';

    var checkboxes = document.querySelectorAll('.filter-checkbox');
    Array.prototype.forEach.call(checkboxes, function (cb) {
      cb.checked = false;
    });

    filteredVehicles = allVehicles.slice();
    var sorted = sortVehicles(filteredVehicles, currentSort);
    renderVehicles(sorted);
    updateResultsCounter(sorted.length, allVehicles.length);
    updateURL();
    hideEmptyState();
  }

  /* ============================================
     URL Parameter Persistence
     ============================================ */

  /**
   * Serialises the active filter state into URL query parameters and
   * updates the browser URL without adding a history entry.
   */
  function updateURL() {
    var params = new URLSearchParams();

    if (priceMinInput && priceMinInput.value !== '') {
      params.set('price_min', priceMinInput.value);
    }
    if (priceMaxInput && priceMaxInput.value !== '') {
      params.set('price_max', priceMaxInput.value);
    }
    if (yearSelect && yearSelect.value !== '') {
      params.set('year', yearSelect.value);
    }

    var checked = document.querySelectorAll('.filter-checkbox:checked');
    Array.prototype.forEach.call(checked, function (cb) {
      params.append('types', cb.value);
    });

    if (sortSelect && sortSelect.value !== 'price-asc') {
      params.set('sort', sortSelect.value);
    }

    var qs = params.toString();
    var newURL = window.location.pathname + (qs ? '?' + qs : '');
    window.history.replaceState(null, '', newURL);
  }

  /**
   * Reads URL query parameters on page load and restores all filter
   * inputs to their previously saved values.
   */
  function loadFiltersFromURL() {
    var params = new URLSearchParams(window.location.search);

    if (params.has('price_min') && priceMinInput) {
      priceMinInput.value = params.get('price_min');
    }
    if (params.has('price_max') && priceMaxInput) {
      priceMaxInput.value = params.get('price_max');
    }
    if (params.has('year') && yearSelect) {
      yearSelect.value = params.get('year');
    }
    if (params.has('sort') && sortSelect) {
      sortSelect.value = params.get('sort');
      currentSort = sortSelect.value;
    }

    var savedTypes = params.getAll('types');
    if (savedTypes.length > 0) {
      var checkboxes = document.querySelectorAll('.filter-checkbox');
      Array.prototype.forEach.call(checkboxes, function (cb) {
        cb.checked = savedTypes.indexOf(cb.value) !== -1;
      });
    }
  }

  /* ============================================
     Mobile Filter Sidebar Toggle
     ============================================ */

  /**
   * Initialises the mobile filter toggle button, which expands and
   * collapses the filter sidebar via the `sidebar-open` CSS class.
   */
  function initFilterToggle() {
    if (!filterToggleBtn || !filterSidebar) return;

    filterToggleBtn.addEventListener('click', function () {
      var isOpen = filterToggleBtn.getAttribute('aria-expanded') === 'true';
      filterSidebar.classList.toggle('sidebar-open', !isOpen);
      filterToggleBtn.setAttribute('aria-expanded', String(!isOpen));
    });
  }

  /* ============================================
     Error Display
     ============================================ */

  /**
   * Displays an inline error message inside the vehicle grid
   * when the data fetch fails.
   *
   * @param {string} message - Human-readable error description.
   */
  function showError(message) {
    if (!vehicleGrid) return;
    hideLoading();

    var errorDiv = document.createElement('div');
    errorDiv.className = 'empty-state';
    errorDiv.style.gridColumn = '1 / -1';
    errorDiv.innerHTML =
      '<p class="empty-state-icon" aria-hidden="true">&#x26A0;&#xFE0F;</p>' +
      '<p class="empty-state-message">' + message + '</p>';

    vehicleGrid.appendChild(errorDiv);
  }

  /* ============================================
     Event Listeners
     ============================================ */

  /**
   * Attaches all interactive event listeners:
   * filter controls, sort dropdown, view toggle buttons,
   * card navigation, and the mobile sidebar toggle.
   */
  function initEventListeners() {
    /* Apply Filters button */
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', applyFilters);
    }

    /* Clear Filters buttons (toolbar + empty state) */
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', clearFilters);
    }
    if (emptyClearBtn) {
      emptyClearBtn.addEventListener('click', clearFilters);
    }

    /* Debounced price input changes (300 ms) */
    var debouncedFilter = debounce(applyFilters, 300);
    if (priceMinInput) priceMinInput.addEventListener('input', debouncedFilter);
    if (priceMaxInput) priceMaxInput.addEventListener('input', debouncedFilter);

    /* Year select change */
    if (yearSelect) {
      yearSelect.addEventListener('change', applyFilters);
    }

    /* Vehicle type checkbox changes */
    var typeCheckboxes = document.querySelectorAll('.filter-checkbox');
    Array.prototype.forEach.call(typeCheckboxes, function (cb) {
      cb.addEventListener('change', applyFilters);
    });

    /* Sort dropdown change */
    if (sortSelect) {
      sortSelect.addEventListener('change', function () {
        currentSort = sortSelect.value;
        var sorted = sortVehicles(filteredVehicles, currentSort);
        renderVehicles(sorted);
        updateURL();
      });
    }

    /* View toggle buttons */
    if (btnGridView) {
      btnGridView.addEventListener('click', function () { toggleView('grid'); });
    }
    if (btnListView) {
      btnListView.addEventListener('click', function () { toggleView('list'); });
    }

    /* Card click: navigate to vehicle detail page */
    if (vehicleGrid) {
      vehicleGrid.addEventListener('click', function (e) {
        var card = e.target.closest('.inventory-card');
        if (!card) return;
        var id = card.getAttribute('data-id');
        if (id) {
          window.location.href = 'vehicle-detail.html?id=' + encodeURIComponent(id);
        }
      });

      /* Keyboard activation (Enter / Space) on cards */
      vehicleGrid.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var card = e.target.closest('.inventory-card');
        if (!card) return;
        e.preventDefault();
        var id = card.getAttribute('data-id');
        if (id) {
          window.location.href = 'vehicle-detail.html?id=' + encodeURIComponent(id);
        }
      });
    }

    /* Mobile filter sidebar toggle */
    initFilterToggle();
  }

  /* ============================================
     Initialisation
     ============================================ */

  /**
   * Entry point: fetches vehicle data, restores filters from URL,
   * and renders the initial vehicle list.
   */
  function init() {
    initLazyLoading();
    initEventListeners();
    showLoading();

    fetchVehicles()
      .then(function (data) {
        /* Support both a plain array and { vehicles: [...] } shaped responses */
        allVehicles = Array.isArray(data) ? data : (Array.isArray(data.vehicles) ? data.vehicles : []);

        /* Restore filter state from URL before first render */
        loadFiltersFromURL();

        filteredVehicles = allVehicles.slice();
        applyFilters();
        hideLoading();
      })
      .catch(function (err) {
        console.error('[Inventory] Failed to load vehicle data:', err);
        showError('Unable to load vehicles at this time. Please try again later.');
        updateResultsCounter(0, 0);
      });
  }

  /* Run after DOM is fully parsed */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
