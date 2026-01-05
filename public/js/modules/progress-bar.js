/**
 * Shared Reading Progress Bar Module
 * Handles reading progress visualization across multiple pages
 */

export function initReadingProgress() {
  const progressBar = document.getElementById('progressBar') || 
                      document.querySelector('.progress-bar');

  if (!progressBar) {
    console.warn('Progress bar element not found');
    return;
  }

  function updateProgressBar() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    progressBar.style.width = Math.min(scrollPercent, 100) + '%';
  }

  // Throttle scroll events for better performance
  let progressTimeout;
  window.addEventListener('scroll', function() {
    if (!progressTimeout) {
      progressTimeout = setTimeout(function() {
        updateProgressBar();
        progressTimeout = null;
      }, 16); // ~60fps
    }
  });

  // Initial call
  updateProgressBar();
}
