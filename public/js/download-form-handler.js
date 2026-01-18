(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('downloadForm');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const messageDiv = document.getElementById('downloadMessage');
      const button = form.querySelector('.download-button');
      const originalText = button.innerHTML;

      try {
        button.disabled = true;
        button.innerHTML = '<span>Sending...</span>';
        if (messageDiv) messageDiv.style.display = 'none';

        const formData = new FormData(form);
        const response = await fetch(form.action, {
          method: 'POST',
          body: formData,
          credentials: 'same-origin'
        });

        if (response.ok) {
          if (messageDiv) {
            messageDiv.className = 'download-message success';
            messageDiv.innerHTML = '✅ <strong>Check your email!</strong> Your download link will arrive in 1-5 minutes. Valid for 24 hours.';
            messageDiv.style.display = 'block';
          }
        } else {
          if (messageDiv) {
            messageDiv.className = 'download-message error';
            messageDiv.innerHTML = '❌ Something went wrong. Please try again later.';
            messageDiv.style.display = 'block';
          }
        }
      } catch (err) {
        if (messageDiv) {
          messageDiv.className = 'download-message error';
          messageDiv.innerHTML = '❌ Network error. Please try again.';
          messageDiv.style.display = 'block';
        }
      } finally {
        if (button) { button.disabled = false; button.innerHTML = originalText; }
      }
    });
  });
})();