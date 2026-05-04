// Reservation form: validation, honeypot, submission with AbortController timeout

import { trackEvent } from '../../shared/analytics.js';
import { getEmail } from '../../shared/utils.js';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxQIpIuHUHHwA0xiK3lJ21B-wiHdwqTkiaDmBQv-I8W9c9W5D3Cp4Pxl_y7YvF1QIFrpg/exec';

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function setupReservationForm({ t, getLang, artwork, entrySource }) {
    const form = document.getElementById('reservation-form');
    if (!form) return;

    // Set timestamp for spam check
    form.querySelector('[name="_timestamp"]').value = Date.now();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Prevent double-submit
        const submitBtn = document.getElementById('form-submit-btn');
        if (submitBtn.disabled) return;
        submitBtn.disabled = true;

        const currentLang = getLang();

        // Clear previous errors
        form.querySelectorAll('.form-field-error').forEach(el => el.classList.remove('form-field-error'));
        form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
        const consentWrapper = document.getElementById('form-consent-wrapper');
        if (consentWrapper) consentWrapper.classList.remove('form-consent-error');
        const consentError = document.getElementById('rf-consent-error');
        if (consentError) consentError.style.display = 'none';

        // Validate
        const nameField = form.querySelector('[name="name"]');
        const emailField = form.querySelector('[name="email"]');
        const consentField = form.querySelector('[name="consent"]');
        let valid = true;

        if (!nameField.value.trim()) {
            nameField.closest('.form-field').classList.add('form-field-error');
            nameField.setAttribute('aria-invalid', 'true');
            valid = false;
        }
        if (!emailField.value.trim() || !EMAIL_REGEX.test(emailField.value)) {
            emailField.closest('.form-field').classList.add('form-field-error');
            emailField.setAttribute('aria-invalid', 'true');
            valid = false;
        }
        if (!consentField.checked) {
            if (consentWrapper) consentWrapper.classList.add('form-consent-error');
            consentField.setAttribute('aria-invalid', 'true');
            if (consentError) consentError.style.display = 'block';
            consentField.focus();
            valid = false;
        }

        if (!valid) {
            const failedFields = [
                !nameField.value.trim() ? 'name' : '',
                (!emailField.value.trim() || !EMAIL_REGEX.test(emailField.value)) ? 'email' : '',
                !consentField.checked ? 'consent' : ''
            ].filter(Boolean).join(',');
            trackEvent('form_validation_failure', {
                artwork_title: artwork.title,
                artwork_slug: artwork.slug || '',
                failed_fields: failedFields,
                language: currentLang,
                entry_source: entrySource
            });
            submitBtn.disabled = false;
            return;
        }

        // Honeypot check
        if (form.querySelector('[name="website"]').value) return;

        const statusEl = document.getElementById('form-status');

        // Show loading
        submitBtn.textContent = t('form.sending');
        statusEl.className = 'form-status loading';
        statusEl.textContent = t('form.sending');

        trackEvent('form_submit_attempt', {
            artwork_title: artwork.title,
            artwork_slug: artwork.slug || '',
            language: currentLang,
            entry_source: entrySource
        });

        const payload = {
            name: nameField.value.trim(),
            email: emailField.value.trim(),
            phone: form.querySelector('[name="phone"]').value.trim(),
            message: form.querySelector('[name="message"]').value.trim(),
            artworkTitle: form.querySelector('[name="artworkTitle"]').value,
            artworkSlug: form.querySelector('[name="artworkSlug"]').value,
            language: currentLang,
            _timestamp: form.querySelector('[name="_timestamp"]').value,
            consent: consentField.checked,
            consentTimestamp: new Date().toISOString()
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const resp = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            let result;
            try {
                result = await resp.json();
            } catch (_) {
                result = null;
            }

            if ((result && result.status === 'success') || resp.ok) {
                statusEl.className = 'form-status success';
                statusEl.textContent = '';
                const successTitle = document.createElement('strong');
                successTitle.textContent = t('form.successTitle');
                statusEl.appendChild(successTitle);
                statusEl.appendChild(document.createElement('br'));
                statusEl.appendChild(document.createTextNode(t('form.successText')));
                Array.from(form.children).forEach(child => {
                    if (child.id !== 'form-status') child.style.display = 'none';
                });
                trackEvent('form_submit_success', {
                    artwork_title: artwork.title,
                    artwork_slug: artwork.slug || '',
                    language: currentLang,
                    entry_source: entrySource
                });
            } else {
                const serverMsg = (result && result.message) ? 'server_error' : 'non_ok_response';
                throw new Error(serverMsg);
            }
        } catch (err) {
            statusEl.className = 'form-status error';
            statusEl.textContent = '';
            const errorTitle = document.createElement('strong');
            errorTitle.textContent = t('form.errorTitle');
            statusEl.appendChild(errorTitle);
            statusEl.appendChild(document.createElement('br'));
            statusEl.appendChild(document.createTextNode(t('form.errorText') + ' '));
            const emailLink = document.createElement('a');
            emailLink.href = 'mailto:' + getEmail();
            emailLink.textContent = getEmail();
            statusEl.appendChild(emailLink);
            submitBtn.disabled = false;
            submitBtn.textContent = t('form.submit');
            const errorCategory = err.name === 'AbortError' ? 'timeout'
                : err.message === 'server_error' || err.message === 'non_ok_response'
                    ? err.message
                    : err.name === 'TypeError' ? 'network_error' : 'unknown';
            trackEvent('form_submit_error', {
                artwork_title: artwork.title,
                error: errorCategory,
                language: currentLang,
                entry_source: entrySource
            });
        }
    });
}
