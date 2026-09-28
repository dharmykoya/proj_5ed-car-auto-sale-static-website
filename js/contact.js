'use strict';

/**
 * Gets the vehicle_id query parameter from the current URL.
 * @returns {string|null} The vehicle ID string, or null if not present.
 */
function getVehicleIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('vehicle_id');
}

/**
 * Fetches vehicle data from the local vehicles.json file and finds the matching vehicle by ID.
 * @param {string} id - The vehicle ID to look up.
 * @returns {Promise<Object|null>} The matched vehicle object, or null if not found.
 */
async function fetchVehicleData(id) {
  try {
    const response = await fetch('data/vehicles.json');
    if (!response.ok) {
      throw new Error('Failed to load vehicle data');
    }
    const vehicles = await response.json();
    return vehicles.find((v) => v.id === id) || null;
  } catch (err) {
    console.error('Error fetching vehicle data:', err);
    return null;
  }
}

/**
 * Pre-populates the "Vehicle of Interest" and "Subject" form fields
 * when a vehicle is passed from the vehicle detail page.
 * @param {Object} vehicle - The vehicle object from vehicles.json.
 */
function prePopulateForm(vehicle) {
  const vehicleInterestInput = document.getElementById('vehicle-interest');
  const subjectSelect = document.getElementById('subject');

  if (vehicleInterestInput && vehicle) {
    const label = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ');
    vehicleInterestInput.value = label;
  }

  if (subjectSelect) {
    const vehicleOption = Array.from(subjectSelect.options).find(
      (opt) => opt.value === 'Vehicle Inquiry'
    );
    if (vehicleOption) {
      subjectSelect.value = 'Vehicle Inquiry';
    }
  }
}

/**
 * Validates a single form field by ID and shows an error if invalid.
 * @param {string} fieldId - The ID of the field to validate.
 * @returns {boolean} True if the field is valid, false otherwise.
 */
function validateField(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return true;

  const value = field.value.trim();
  let errorMessage = '';

  switch (fieldId) {
    case 'name':
      if (!value) {
        errorMessage = 'Full name is required.';
      }
      break;

    case 'email': {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value) {
        errorMessage = 'Email address is required.';
      } else if (!emailRegex.test(value)) {
        errorMessage = 'Please enter a valid email address.';
      }
      break;
    }

    case 'phone':
      if (value && !/^[\(\)\s\-\d+]{7,20}$/.test(value)) {
        errorMessage = 'Please enter a valid phone number.';
      }
      break;

    case 'subject':
      if (!value) {
        errorMessage = 'Please select a subject.';
      }
      break;

    case 'message':
      if (!value) {
        errorMessage = 'Message is required.';
      } else if (value.length < 10) {
        errorMessage = 'Message must be at least 10 characters.';
      }
      break;

    default:
      break;
  }

  if (errorMessage) {
    showValidationError(fieldId, errorMessage);
    return false;
  }

  clearFieldError(fieldId);
  return true;
}

/**
 * Validates all required form fields.
 * @returns {boolean} True if the entire form is valid.
 */
function validateForm() {
  const fieldsToValidate = ['name', 'email', 'phone', 'subject', 'message'];
  let isValid = true;
  let firstInvalidField = null;

  clearValidationErrors();

  for (const fieldId of fieldsToValidate) {
    const fieldValid = validateField(fieldId);
    if (!fieldValid && !firstInvalidField) {
      firstInvalidField = fieldId;
    }
    isValid = isValid && fieldValid;
  }

  // Move focus to the first invalid field for accessibility
  if (firstInvalidField) {
    const el = document.getElementById(firstInvalidField);
    if (el) el.focus();
  }

  return isValid;
}

/**
 * Displays a validation error message below the specified field.
 * @param {string} fieldId - The ID of the form field.
 * @param {string} message - The error message to display.
 */
function showValidationError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(`${fieldId}-error`);

  if (field) {
    field.setAttribute('aria-invalid', 'true');
    field.classList.add('invalid');
  }

  if (errorEl) {
    errorEl.textContent = message;
  }
}

/**
 * Clears the validation error for a single field.
 * @param {string} fieldId - The ID of the form field.
 */
function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(`${fieldId}-error`);

  if (field) {
    field.setAttribute('aria-invalid', 'false');
    field.classList.remove('invalid');
  }

  if (errorEl) {
    errorEl.textContent = '';
  }
}

/**
 * Clears all validation error messages and resets aria-invalid states.
 */
function clearValidationErrors() {
  const fields = ['name', 'email', 'phone', 'subject', 'message'];
  fields.forEach((fieldId) => clearFieldError(fieldId));
}

/**
 * Sets the loading state on the submit button.
 * @param {boolean} loading - Whether to show or hide the loading state.
 */
function setLoadingState(loading) {
  const submitBtn = document.getElementById('submit-btn');
  const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
  const btnSpinner = submitBtn ? submitBtn.querySelector('.btn-spinner') : null;
  const form = document.getElementById('contact-form');

  if (!submitBtn) return;

  if (loading) {
    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-busy', 'true');
    if (btnText) btnText.textContent = 'Sending\u2026';
    if (btnSpinner) btnSpinner.hidden = false;

    // Disable all form fields during submission
    if (form) {
      Array.from(form.elements).forEach((el) => {
        if (el !== submitBtn) el.disabled = true;
      });
    }
  } else {
    submitBtn.disabled = false;
    submitBtn.setAttribute('aria-busy', 'false');
    if (btnText) btnText.textContent = 'Send Message';
    if (btnSpinner) btnSpinner.hidden = true;

    // Re-enable all form fields
    if (form) {
      Array.from(form.elements).forEach((el) => {
        el.disabled = false;
      });
    }
  }
}

/**
 * Handles the contact form submission event.
 * Validates the form, checks for honeypot spam, submits to FormSpree,
 * and shows success or error feedback.
 * @param {SubmitEvent} event - The form submission event.
 */
async function handleFormSubmit(event) {
  event.preventDefault();

  const form = event.target;

  // Honeypot check — silently reject if bot filled the hidden field
  const honeypot = form.querySelector('input[name="_gotcha"]');
  if (honeypot && honeypot.value) {
    return;
  }

  // Validate form fields
  if (!validateForm()) {
    return;
  }

  // Hide any existing status messages
  hideStatusMessages();
  setLoadingState(true);

  try {
    const formData = new FormData(form);
    const response = await fetch(form.action, {
      method: 'POST',
      body: formData,
      headers: { Accept: 'application/json' },
    });

    if (response.ok) {
      showSuccess();
    } else {
      const data = await response.json().catch(() => ({}));
      console.error('FormSpree error:', data);
      showError();
    }
  } catch (err) {
    console.error('Submission network error:', err);
    showError();
  } finally {
    setLoadingState(false);
  }
}

/**
 * Displays the success message, hides the form, and schedules a form reset.
 */
function showSuccess() {
  const successEl = document.getElementById('form-success');
  const form = document.getElementById('contact-form');

  if (successEl) {
    successEl.hidden = false;
    successEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  if (form) {
    form.hidden = true;
  }

  // Reset after 5 seconds and re-show form
  setTimeout(() => {
    if (successEl) successEl.hidden = true;
    if (form) {
      form.hidden = false;
      resetForm();
    }
  }, 5000);
}

/**
 * Displays the error message and re-enables the form for another attempt.
 */
function showError() {
  const errorEl = document.getElementById('form-error');

  if (errorEl) {
    errorEl.hidden = false;
    errorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/**
 * Hides both the success and error status messages.
 */
function hideStatusMessages() {
  const successEl = document.getElementById('form-success');
  const errorEl = document.getElementById('form-error');

  if (successEl) successEl.hidden = true;
  if (errorEl) errorEl.hidden = true;
}

/**
 * Resets all form fields to their default (empty) state and clears validation errors.
 */
function resetForm() {
  const form = document.getElementById('contact-form');
  if (form) {
    form.reset();
  }
  clearValidationErrors();
}

/**
 * Auto-formats a phone input field value as (555) 123-4567 while the user types.
 * @param {HTMLInputElement} input - The phone input element.
 */
function formatPhoneNumber(input) {
  // Strip everything except digits
  const digits = input.value.replace(/\D/g, '').slice(0, 10);
  let formatted = '';

  if (digits.length > 0) {
    formatted = '(' + digits.slice(0, 3);
  }
  if (digits.length >= 4) {
    formatted += ') ' + digits.slice(3, 6);
  }
  if (digits.length >= 7) {
    formatted += '-' + digits.slice(6, 10);
  }

  input.value = formatted;
}

/**
 * Initializes the contact page:
 * - Checks URL for vehicle_id and pre-populates form if present.
 * - Attaches form submit handler.
 * - Attaches phone formatter.
 * - Attaches blur validation to individual fields.
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Vehicle pre-population from vehicle detail page
  const vehicleId = getVehicleIdFromURL();
  if (vehicleId) {
    const vehicle = await fetchVehicleData(vehicleId);
    if (vehicle) {
      prePopulateForm(vehicle);
    }
  }

  // Form submit handler
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }

  // Phone number auto-formatter
  const phoneInput = document.getElementById('phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', () => formatPhoneNumber(phoneInput));
  }

  // Blur validation for individual fields
  const fieldsToValidate = ['name', 'email', 'phone', 'subject', 'message'];
  fieldsToValidate.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('blur', () => validateField(id));
    }
  });
});
